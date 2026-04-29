from app.db.database import SessionLocal
from app.db import models
from app.services.db_prereq_service import check_student_course_eligibility
from app.services.quota_service import get_section_capacity_info


def get_student_record(db, student_id):
    return (
        db.query(models.Student)
        .filter(models.Student.student_id == student_id)
        .first()
    )


def get_student_completed_or_in_progress_course_codes(db, student_id):
    completed_records = (
        db.query(models.Course.course_code)
        .join(models.StudentCompletedCourse, models.StudentCompletedCourse.course_id == models.Course.course_id)
        .filter(models.StudentCompletedCourse.student_id == student_id)
        .filter(models.StudentCompletedCourse.status.in_(["completed", "in_progress"]))
        .all()
    )

    submitted_plan_records = (
        db.query(models.Course.course_code)
        .join(models.CourseSection, models.CourseSection.course_id == models.Course.course_id)
        .join(models.StudentPlanCourse, models.StudentPlanCourse.section_id == models.CourseSection.section_id)
        .join(models.StudentPlan, models.StudentPlan.plan_id == models.StudentPlanCourse.plan_id)
        .filter(models.StudentPlan.student_id == student_id)
        .filter(models.StudentPlan.status == "submitted")
        .all()
    )

    completed_or_in_progress = {record[0] for record in completed_records}
    completed_or_in_progress.update(record[0] for record in submitted_plan_records)

    return completed_or_in_progress


def get_term_courses(db, term_name):
    records = (
        db.query(models.Course, models.CourseSection, models.Term)
        .join(models.CourseSection, models.Course.course_id == models.CourseSection.course_id)
        .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
        .filter(models.Term.term_name == term_name)
        .all()
    )

    return records


def get_track_name_by_id(db, track_id):
    if track_id is None:
        return None

    track = (
        db.query(models.Track)
        .filter(models.Track.track_id == track_id)
        .first()
    )

    if track is None:
        return None

    return track.track_name


def get_status_label(prereq_result, has_capacity):
    prereq_blocked = not prereq_result["eligible"]
    capacity_blocked = not has_capacity

    if prereq_blocked and capacity_blocked:
        return "blocked by both prerequisites and capacity"
    if prereq_blocked:
        return "blocked by prerequisites"
    if capacity_blocked:
        return "blocked by capacity"
    return "available now"


def build_recommendation_item(course, section, term_name, prereq_result, capacity_result, preferred_track_name, course_track_name):
    score = 0
    reasons = []

    if prereq_result["eligible"]:
        score += 5
        reasons.append("eligible now")
    else:
        reasons.append("prerequisites not yet satisfied")

    has_capacity = capacity_result is not None and capacity_result["available_seats"] > 0
    if has_capacity:
        score += 3
        reasons.append("has open seat")
    else:
        reasons.append("section is full")

    if preferred_track_name is not None and course_track_name == preferred_track_name:
        score += 2
        reasons.append("matches preferred track")

    is_recommended_now = prereq_result["eligible"] and has_capacity
    status_label = get_status_label(prereq_result, has_capacity)

    return {
        "course_code": course.course_code,
        "course_title": course.course_title,
        "term_name": term_name,
        "section_number": section.section_number,
        "credits": course.credits,
        "track": course_track_name,
        "score": score,
        "eligible": prereq_result["eligible"],
        "available_seats": capacity_result["available_seats"] if capacity_result else 0,
        "has_capacity": has_capacity,
        "reasons": reasons,
        "prerequisite_explanation": prereq_result["explanation"],
        "group": "recommended_now" if is_recommended_now else "recommended_later",
        "status_label": status_label
    }


def recommend_courses_for_student(student_id, term_name, mode="planning"):
    db = SessionLocal()

    try:
        student = get_student_record(db, student_id)

        if student is None:
            return {
                "student_id": student_id,
                "term_name": term_name,
                "mode": mode,
                "preferred_track": None,
                "recommended_now": [],
                "recommended_later": [],
                "message": "Student not found."
            }

        preferred_track_name = get_track_name_by_id(db, student.preferred_track_id)
        already_taken = get_student_completed_or_in_progress_course_codes(db, student_id)
        term_course_records = get_term_courses(db, term_name)

        recommended_now = []
        recommended_later = []

        for course, section, term in term_course_records:
            if course.course_code in already_taken:
                continue

            prereq_result = check_student_course_eligibility(student_id, course.course_code, mode)
            capacity_result = get_section_capacity_info(db, course.course_code, term_name, section.section_number)
            course_track_name = get_track_name_by_id(db, course.default_track_id)

            item = build_recommendation_item(
                course=course,
                section=section,
                term_name=term_name,
                prereq_result=prereq_result,
                capacity_result=capacity_result,
                preferred_track_name=preferred_track_name,
                course_track_name=course_track_name
            )

            if item["group"] == "recommended_now":
                recommended_now.append(item)
            else:
                recommended_later.append(item)

        recommended_now.sort(
            key=lambda item: (
                item["score"],
                item["available_seats"],
                -item["credits"]
            ),
            reverse=True
        )

        recommended_later.sort(
            key=lambda item: (
                item["score"],
                item["available_seats"],
                -item["credits"]
            ),
            reverse=True
        )

        return {
            "student_id": student_id,
            "term_name": term_name,
            "mode": mode,
            "preferred_track": preferred_track_name,
            "recommended_now": recommended_now,
            "recommended_later": recommended_later
        }

    finally:
        db.close()
