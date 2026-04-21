from app.db.database import SessionLocal
from app.db import models


def get_section_capacity_info(db, course_code, term_name, section_number="001"):
    record = (
        db.query(models.CourseSection, models.Course, models.Term)
        .join(models.Course, models.CourseSection.course_id == models.Course.course_id)
        .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
        .filter(models.Course.course_code == course_code)
        .filter(models.Term.term_name == term_name)
        .filter(models.CourseSection.section_number == section_number)
        .first()
    )

    if record is None:
        return None

    course_section, course, term = record

    available_seats = course_section.capacity - course_section.enrolled_count
    is_full = available_seats <= 0

    return {
        "course_code": course.course_code,
        "term_name": term.term_name,
        "section_number": course_section.section_number,
        "capacity": course_section.capacity,
        "enrolled_count": course_section.enrolled_count,
        "waitlist_count": course_section.waitlist_count,
        "available_seats": max(available_seats, 0),
        "is_full": is_full
    }


def check_section_capacity(course_code, term_name, section_number="001"):
    db = SessionLocal()

    try:
        result = get_section_capacity_info(db, course_code, term_name, section_number)

        if result is None:
            return {
                "course_code": course_code,
                "term_name": term_name,
                "section_number": section_number,
                "has_capacity": False,
                "message": "Section was not found."
            }

        if result["is_full"]:
            return {
                **result,
                "has_capacity": False,
                "message": f"{course_code} section {section_number} is currently full."
            }

        return {
            **result,
            "has_capacity": True,
            "message": f"{course_code} section {section_number} has {result['available_seats']} seat(s) available."
        }

    finally:
        db.close()