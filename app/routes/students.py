from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Query
from sqlalchemy import func

from app.db.database import SessionLocal
from app.db import models
from app.schemas.schemas import StudentSubmitPlanRequest
from app.services.plan_validation_service import validate_plan
from app.services.recommendation_service import recommend_courses_for_student
from app.services.roadmap_service import generate_track_roadmap


router = APIRouter(prefix="/student", tags=["Student"])


def split_term_name(term_name):
    parts = term_name.split()
    semester = parts[0] if parts else term_name
    year = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    return semester, year


def get_demo_term_status(term_name):
    if term_name == "Spring 2026":
        return {
            "status": "past",
            "planning_mode": "read-only",
            "submission_window": "closed"
        }
    if term_name == "Fall 2026":
        return {
            "status": "open",
            "planning_mode": "editable",
            "submission_window": "open"
        }
    if term_name == "Spring 2027":
        return {
            "status": "future",
            "planning_mode": "not_open_yet",
            "submission_window": "not_open_yet"
        }
    return {
        "status": "not_configured",
        "planning_mode": "read-only",
        "submission_window": "closed"
    }


def format_time(value):
    return value.strftime("%H:%M") if value is not None else None


def format_location(meeting):
    if meeting is None:
        return None
    if meeting.building and meeting.room:
        return f"{meeting.building} {meeting.room}"
    return meeting.building or meeting.room


def get_section_meeting_summary(db, section_id):
    meetings = (
        db.query(models.SectionMeeting)
        .filter(models.SectionMeeting.section_id == section_id)
        .order_by(models.SectionMeeting.meeting_id)
        .all()
    )

    if not meetings:
        return {
            "days": None,
            "start_time": None,
            "end_time": None,
            "location": None
        }

    first_meeting = meetings[0]
    same_time = all(
        meeting.start_time == first_meeting.start_time and meeting.end_time == first_meeting.end_time
        for meeting in meetings
    )

    return {
        "days": "".join(meeting.day_of_week for meeting in meetings),
        "start_time": format_time(first_meeting.start_time) if same_time else None,
        "end_time": format_time(first_meeting.end_time) if same_time else None,
        "location": format_location(first_meeting)
    }


def get_seat_status(available_seats):
    if available_seats <= 0:
        return "full"
    if available_seats <= 3:
        return "low_seats"
    return "open"


def get_track_name(db, track_id):
    if track_id is None:
        return None
    track = db.query(models.Track).filter(models.Track.track_id == track_id).first()
    return track.track_name if track else None


def get_term_by_name(db, term_name):
    return db.query(models.Term).filter(models.Term.term_name == term_name).first()


def get_student_with_user(db, student_id):
    return (
        db.query(models.Student, models.User)
        .join(models.User, models.Student.user_id == models.User.user_id)
        .filter(models.Student.student_id == student_id)
        .first()
    )


def build_section_response(db, course, section):
    meeting_summary = get_section_meeting_summary(db, section.section_id)
    available_seats = max(section.capacity - section.enrolled_count, 0)

    return {
        "section_id": section.section_id,
        "section_number": section.section_number,
        "instructor": section.instructor_name,
        "days": meeting_summary["days"],
        "start_time": meeting_summary["start_time"],
        "end_time": meeting_summary["end_time"],
        "location": meeting_summary["location"],
        "capacity": section.capacity,
        "enrolled_count": section.enrolled_count,
        "available_seats": available_seats,
        "seat_status": get_seat_status(available_seats)
    }


def get_submitted_plan_record(db, student_id, term_name):
    return (
        db.query(models.StudentPlan, models.Term)
        .join(models.Term, models.StudentPlan.term_id == models.Term.term_id)
        .filter(models.StudentPlan.student_id == student_id)
        .filter(models.Term.term_name == term_name)
        .filter(models.StudentPlan.status == "submitted")
        .order_by(models.StudentPlan.submitted_at.desc().nullslast(), models.StudentPlan.updated_at.desc())
        .first()
    )


def build_submitted_plan_response(db, student_id, term_name):
    record = get_submitted_plan_record(db, student_id, term_name)

    if record is None:
        return {
            "student_id": student_id,
            "term_name": term_name,
            "status": "none",
            "sections": [],
            "total_credits": 0
        }

    plan, term = record
    plan_courses = (
        db.query(models.StudentPlanCourse, models.CourseSection, models.Course)
        .join(models.CourseSection, models.StudentPlanCourse.section_id == models.CourseSection.section_id)
        .join(models.Course, models.CourseSection.course_id == models.Course.course_id)
        .filter(models.StudentPlanCourse.plan_id == plan.plan_id)
        .order_by(models.Course.course_code, models.CourseSection.section_number)
        .all()
    )

    sections = []
    for _, section, course in plan_courses:
        section_payload = build_section_response(db, course, section)
        sections.append({
            "course_code": course.course_code,
            "course_title": course.course_title,
            "credits": course.credits,
            "section_id": section.section_id,
            "section_number": section.section_number,
            "days": section_payload["days"],
            "start_time": section_payload["start_time"],
            "end_time": section_payload["end_time"],
            "location": section_payload["location"],
            "seat_status": section_payload["seat_status"]
        })

    return {
        "student_id": student_id,
        "term_name": term.term_name,
        "status": plan.status,
        "submitted_at": plan.submitted_at.isoformat() if plan.submitted_at else None,
        "sections": sections,
        "total_credits": plan.total_credits
    }


@router.get("/terms")
def get_student_terms():
    db = SessionLocal()

    try:
        terms = db.query(models.Term).order_by(models.Term.start_date).all()
        results = []

        for term in terms:
            semester, year = split_term_name(term.term_name)
            status = get_demo_term_status(term.term_name)
            results.append({
                "term_id": term.term_id,
                "term_name": term.term_name,
                "semester": semester,
                "year": year,
                **status
            })

        return results

    finally:
        db.close()


@router.get("/courses")
def get_student_courses(term_name: str = Query(...)):
    db = SessionLocal()

    try:
        records = (
            db.query(models.Course, models.CourseSection, models.Term)
            .join(models.CourseSection, models.Course.course_id == models.CourseSection.course_id)
            .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
            .filter(models.Term.term_name == term_name)
            .filter(models.Course.is_active == True)
            .order_by(models.Course.course_code, models.CourseSection.section_number)
            .all()
        )

        grouped_courses = {}

        for course, section, term in records:
            if course.course_id not in grouped_courses:
                prereq_rule = (
                    db.query(models.PrerequisiteRule)
                    .filter(models.PrerequisiteRule.course_id == course.course_id)
                    .first()
                )
                grouped_courses[course.course_id] = {
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "credits": course.credits,
                    "category": get_track_name(db, course.default_track_id) or "General",
                    "description": course.description,
                    "prerequisite": prereq_rule.rule_expression if prereq_rule else None,
                    "sections": []
                }

            grouped_courses[course.course_id]["sections"].append(
                build_section_response(db, course, section)
            )

        return {
            "term_name": term_name,
            "courses": list(grouped_courses.values())
        }

    finally:
        db.close()


@router.get("/progress/{student_id}")
def get_student_progress(student_id: int):
    db = SessionLocal()

    try:
        student_record = get_student_with_user(db, student_id)
        if student_record is None:
            return {
                "student": None,
                "completed_courses": [],
                "in_progress_courses": [],
                "requirement_groups": [],
                "flexible_requirements": [],
                "recommendations": {},
                "path_guidance": {}
            }

        student, user = student_record
        track_name = get_track_name(db, student.preferred_track_id)

        completed_records = (
            db.query(models.StudentCompletedCourse, models.Course, models.Term)
            .join(models.Course, models.StudentCompletedCourse.course_id == models.Course.course_id)
            .outerjoin(models.Term, models.StudentCompletedCourse.term_id == models.Term.term_id)
            .filter(models.StudentCompletedCourse.student_id == student_id)
            .filter(models.StudentCompletedCourse.status == "completed")
            .all()
        )

        completed_courses = [
            {
                "course_code": course.course_code,
                "course_title": course.course_title,
                "credits": course.credits,
                "term_name": term.term_name if term else None,
                "grade": completion.grade,
                "status": completion.status
            }
            for completion, course, term in completed_records
        ]

        submitted_plan_records = (
            db.query(models.StudentPlan, models.Term)
            .join(models.Term, models.StudentPlan.term_id == models.Term.term_id)
            .filter(models.StudentPlan.student_id == student_id)
            .filter(models.StudentPlan.status == "submitted")
            .all()
        )

        in_progress_courses = []
        for plan, term in submitted_plan_records:
            plan_courses = (
                db.query(models.Course, models.CourseSection)
                .join(models.CourseSection, models.Course.course_id == models.CourseSection.course_id)
                .join(models.StudentPlanCourse, models.StudentPlanCourse.section_id == models.CourseSection.section_id)
                .filter(models.StudentPlanCourse.plan_id == plan.plan_id)
                .all()
            )
            for course, section in plan_courses:
                in_progress_courses.append({
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "credits": course.credits,
                    "term_name": term.term_name,
                    "section_number": section.section_number,
                    "status": "in_progress"
                })

        completed_credits = sum(course["credits"] for course in completed_courses)
        total_credits = 120

        try:
            recommendations = recommend_courses_for_student(student_id, "Fall 2026", mode="registration")
        except Exception:
            recommendations = {}

        try:
            path_guidance = generate_track_roadmap(student_id, track_name, mode="registration")
        except Exception:
            path_guidance = {}

        return {
            "student": {
                "student_id": student.student_id,
                "name": user.full_name,
                "major": student.major or "Computer Science",
                "track": track_name,
                "gpa": 3.62,
                "completed_credits": completed_credits,
                "total_credits": total_credits,
                "degree_progress_percent": round((completed_credits / total_credits) * 100) if total_credits else 0,
                "academic_standing": "Good Standing"
            },
            "completed_courses": completed_courses,
            "in_progress_courses": in_progress_courses,
            "requirement_groups": [],
            "flexible_requirements": [],
            "recommendations": recommendations,
            "path_guidance": path_guidance
        }

    finally:
        db.close()


@router.get("/submitted-plan")
def get_student_submitted_plan(student_id: int = Query(...), term_name: str = Query(...)):
    db = SessionLocal()

    try:
        return build_submitted_plan_response(db, student_id, term_name)

    finally:
        db.close()


@router.post("/submit-plan")
def submit_student_plan(request: StudentSubmitPlanRequest):
    db = SessionLocal()

    try:
        term = get_term_by_name(db, request.term_name)
        if term is None:
            return {
                "success": False,
                "message": "Term not found.",
                "student_id": request.student_id,
                "term_name": request.term_name,
                "status": "not_submitted",
                "submitted_sections": 0,
                "submitted_credits": 0
            }

        term_status = get_demo_term_status(request.term_name)
        if term_status["submission_window"] != "open":
            return {
                "success": False,
                "message": "Submission window is closed for this term.",
                "student_id": request.student_id,
                "term_name": request.term_name,
                "status": "not_submitted",
                "submitted_sections": 0,
                "submitted_credits": 0
            }

        selections = [
            {
                "course_code": section.course_code,
                "term_name": request.term_name,
                "section_number": section.section_number
            }
            for section in request.sections
        ]

        validation_result = validate_plan(
            student_id=request.student_id,
            selections=selections,
            mode="planning"
        )

        if not validation_result["is_valid"]:
            return {
                "success": False,
                "message": "Plan validation failed. Resolve validation issues before submitting.",
                "student_id": request.student_id,
                "term_name": request.term_name,
                "status": "not_submitted",
                "validation": validation_result,
                "submitted_sections": 0,
                "submitted_credits": 0
            }

        if validation_result["total_credits"] < 12:
            return {
                "success": False,
                "message": "Plan has credit warnings. Add enough credits before submitting.",
                "student_id": request.student_id,
                "term_name": request.term_name,
                "status": "not_submitted",
                "validation": validation_result,
                "submitted_sections": 0,
                "submitted_credits": 0
            }

        existing_plans = (
            db.query(models.StudentPlan)
            .filter(models.StudentPlan.student_id == request.student_id)
            .filter(models.StudentPlan.term_id == term.term_id)
            .filter(models.StudentPlan.status == "submitted")
            .all()
        )

        for plan in existing_plans:
            plan.status = "archived"

        submitted_plan = models.StudentPlan(
            student_id=request.student_id,
            term_id=term.term_id,
            plan_name=f"Submitted schedule for {request.term_name}",
            status="submitted",
            total_credits=validation_result["total_credits"],
            submitted_at=datetime.utcnow()
        )
        db.add(submitted_plan)
        db.flush()

        for section_request in request.sections:
            section_record = (
                db.query(models.CourseSection)
                .join(models.Course, models.CourseSection.course_id == models.Course.course_id)
                .filter(models.Course.course_code == section_request.course_code)
                .filter(models.CourseSection.term_id == term.term_id)
                .filter(models.CourseSection.section_number == section_request.section_number)
                .first()
            )

            if section_record is not None:
                db.add(models.StudentPlanCourse(
                    plan_id=submitted_plan.plan_id,
                    section_id=section_record.section_id
                ))

        db.commit()

        return {
            "success": True,
            "message": "Schedule submitted successfully.",
            "student_id": request.student_id,
            "term_name": request.term_name,
            "status": "submitted",
            "submitted_sections": len(request.sections),
            "submitted_credits": validation_result["total_credits"]
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error submitting schedule: {str(error)}",
            "student_id": request.student_id,
            "term_name": request.term_name,
            "status": "not_submitted",
            "submitted_sections": 0,
            "submitted_credits": 0
        }

    finally:
        db.close()
