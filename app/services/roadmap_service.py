from collections import Counter

from app.db.database import SessionLocal
from app.db import models
from app.services.db_prereq_service import check_student_course_eligibility


def get_track_by_name(db, track_name):
    return (
        db.query(models.Track)
        .filter(models.Track.track_name == track_name)
        .first()
    )


def get_student_record(db, student_id):
    return (
        db.query(models.Student)
        .filter(models.Student.student_id == student_id)
        .first()
    )


def get_track_courses(db, track_id):
    return (
        db.query(models.Course)
        .filter(models.Course.default_track_id == track_id)
        .order_by(models.Course.level, models.Course.course_code)
        .all()
    )


def get_student_course_status_map(db, student_id):
    records = (
        db.query(models.Course.course_code, models.StudentCompletedCourse.status)
        .join(models.StudentCompletedCourse, models.StudentCompletedCourse.course_id == models.Course.course_id)
        .filter(models.StudentCompletedCourse.student_id == student_id)
        .all()
    )

    status_map = {}
    for course_code, status in records:
        status_map[course_code] = status

    return status_map


def get_preferred_track_name(db, student):
    if student is None or student.preferred_track_id is None:
        return None

    track = (
        db.query(models.Track)
        .filter(models.Track.track_id == student.preferred_track_id)
        .first()
    )

    if track is None:
        return None

    return track.track_name


def build_next_step_suggestions(blocked_courses, unlocked_now_codes):
    missing_counter = Counter()

    for item in blocked_courses:
        for missing_course in item["missing_requirements"]:
            missing_counter[missing_course] += 1

    suggestions = []

    for course_code, count in missing_counter.items():
        suggestions.append({
            "course_code": course_code,
            "helps_unlock_count": count,
            "available_now": course_code in unlocked_now_codes
        })

    suggestions.sort(
        key=lambda item: (
            item["helps_unlock_count"],
            item["available_now"]
        ),
        reverse=True
    )

    return suggestions


def generate_track_roadmap(student_id, track_name=None, mode="planning"):
    db = SessionLocal()

    try:
        student = get_student_record(db, student_id)

        if student is None:
            return {
                "student_id": student_id,
                "mode": mode,
                "track_name": track_name,
                "message": "Student not found."
            }

        if track_name is None:
            track_name = get_preferred_track_name(db, student)

        if track_name is None:
            return {
                "student_id": student_id,
                "mode": mode,
                "track_name": None,
                "message": "No track was provided and the student has no preferred track."
            }

        track = get_track_by_name(db, track_name)

        if track is None:
            return {
                "student_id": student_id,
                "mode": mode,
                "track_name": track_name,
                "message": "Track not found."
            }

        track_courses = get_track_courses(db, track.track_id)
        student_status_map = get_student_course_status_map(db, student_id)

        completed_or_in_progress = []
        unlocked_now = []
        blocked = []

        for course in track_courses:
            if course.course_code in student_status_map:
                completed_or_in_progress.append({
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "level": course.level,
                    "status": student_status_map[course.course_code]
                })
                continue

            prereq_result = check_student_course_eligibility(student_id, course.course_code, mode)

            if prereq_result["eligible"]:
                unlocked_now.append({
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "level": course.level,
                    "explanation": prereq_result["explanation"]
                })
            else:
                blocked.append({
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "level": course.level,
                    "missing_requirements": prereq_result["missing_requirements"],
                    "explanation": prereq_result["explanation"]
                })

        unlocked_now_codes = {item["course_code"] for item in unlocked_now}
        next_step_suggestions = build_next_step_suggestions(blocked, unlocked_now_codes)

        return {
            "student_id": student_id,
            "mode": mode,
            "track_name": track_name,
            "completed_or_in_progress": completed_or_in_progress,
            "unlocked_now": unlocked_now,
            "blocked": blocked,
            "next_step_suggestions": next_step_suggestions
        }

    finally:
        db.close()