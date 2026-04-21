from app.db.database import SessionLocal
from app.db import models
from app.services.prereq_service import check_course_eligibility


def get_courses_for_student(db, student_id, mode="planning"):
    if mode == "planning":
        allowed_status = ["completed", "in_progress"]
    else:  # registration mode
        allowed_status = ["completed"]

    records = (
        db.query(models.StudentCompletedCourse, models.Course.course_code)
        .join(models.Course, models.StudentCompletedCourse.course_id == models.Course.course_id)
        .filter(models.StudentCompletedCourse.student_id == student_id)
        .filter(models.StudentCompletedCourse.status.in_(allowed_status))
        .all()
    )

    courses = [course_code for _, course_code in records]
    return courses


def get_prereq_rule_for_course(db, course_code):
    record = (
        db.query(models.PrerequisiteRule.rule_expression)
        .join(models.Course, models.PrerequisiteRule.course_id == models.Course.course_id)
        .filter(models.Course.course_code == course_code)
        .first()
    )

    if record is None:
        return None

    return record[0]


def check_student_course_eligibility(student_id, course_code, mode="planning"):
    db = SessionLocal()

    try:
        completed_courses = get_courses_for_student(db, student_id, mode)
        rule_expression = get_prereq_rule_for_course(db, course_code)

        result = check_course_eligibility(course_code, rule_expression, completed_courses)

        result["student_id"] = student_id
        result["completed_courses"] = completed_courses
        result["mode"] = mode

        return result

    finally:
        db.close()