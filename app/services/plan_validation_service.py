from app.db.database import SessionLocal
from app.db import models
from app.services.db_prereq_service import check_student_course_eligibility
from app.services.schedule_service import check_two_sections_conflict
from app.services.quota_service import get_section_capacity_info


def get_section_record(db, course_code, term_name, section_number="001"):
    record = (
        db.query(models.CourseSection, models.Course, models.Term)
        .join(models.Course, models.CourseSection.course_id == models.Course.course_id)
        .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
        .filter(models.Course.course_code == course_code)
        .filter(models.Term.term_name == term_name)
        .filter(models.CourseSection.section_number == section_number)
        .first()
    )

    return record


def get_student_credit_limits(db, student_id):
    student = (
        db.query(models.Student)
        .filter(models.Student.student_id == student_id)
        .first()
    )

    if student is None:
        return None

    return {
        "preferred_credit_load": student.preferred_credit_load,
        "max_credit_load": student.max_credit_load
    }


def get_completed_course_record(db, student_id, course_id):
    return (
        db.query(models.StudentCompletedCourse)
        .filter(models.StudentCompletedCourse.student_id == student_id)
        .filter(models.StudentCompletedCourse.course_id == course_id)
        .filter(models.StudentCompletedCourse.status == "completed")
        .first()
    )


def validate_plan(student_id, selections, mode="planning"):
    db = SessionLocal()

    try:
        validation_result = {
            "student_id": student_id,
            "mode": mode,
            "selected_courses": selections,
            "total_credits": 0,
            "credit_status": {},
            "completed_course_results": [],
            "prerequisite_results": [],
            "schedule_conflicts": [],
            "capacity_results": [],
            "is_valid": True
        }

        section_ids = []
        section_labels = []

        for selection in selections:
            course_code = selection["course_code"]
            term_name = selection["term_name"]
            section_number = selection.get("section_number", "001")

            section_record = get_section_record(db, course_code, term_name, section_number)

            if section_record is None:
                validation_result["is_valid"] = False
                validation_result["prerequisite_results"].append({
                    "course_code": course_code,
                    "eligible": False,
                    "missing_requirements": [],
                    "explanation": f"Section {section_number} for {course_code} in {term_name} was not found."
                })
                continue

            course_section, course, term = section_record
            validation_result["total_credits"] += course.credits
            section_ids.append(course_section.section_id)
            section_labels.append({
                "section_id": course_section.section_id,
                "course_code": course.course_code,
                "section_number": course_section.section_number
            })

            completed_record = get_completed_course_record(db, student_id, course.course_id)
            if completed_record is not None:
                validation_result["is_valid"] = False
                validation_result["completed_course_results"].append({
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "already_completed": True,
                    "message": "Student has already completed this course."
                })

            prereq_result = check_student_course_eligibility(student_id, course_code, mode)
            validation_result["prerequisite_results"].append(prereq_result)

            if not prereq_result["eligible"]:
                validation_result["is_valid"] = False

            capacity_info = get_section_capacity_info(db, course_code, term_name, section_number)

            if capacity_info is None:
                capacity_result = {
                    "course_code": course_code,
                    "term_name": term_name,
                    "section_number": section_number,
                    "has_capacity": False,
                    "available_seats": 0,
                    "message": "Section was not found."
                }
                validation_result["is_valid"] = False
            else:
                capacity_result = {
                    "course_code": course_code,
                    "term_name": term_name,
                    "section_number": section_number,
                    "capacity": capacity_info["capacity"],
                    "enrolled_count": capacity_info["enrolled_count"],
                    "waitlist_count": capacity_info["waitlist_count"],
                    "available_seats": capacity_info["available_seats"],
                    "has_capacity": not capacity_info["is_full"],
                    "message": (
                        f"{course_code} section {section_number} is currently full."
                        if capacity_info["is_full"]
                        else f"{course_code} section {section_number} has {capacity_info['available_seats']} seat(s) available."
                    )
                }

                if capacity_info["is_full"]:
                    validation_result["is_valid"] = False

            validation_result["capacity_results"].append(capacity_result)

        credit_limits = get_student_credit_limits(db, student_id)

        if credit_limits is not None:
            preferred = credit_limits["preferred_credit_load"]
            maximum = credit_limits["max_credit_load"]

            if validation_result["total_credits"] > maximum:
                validation_result["credit_status"] = {
                    "within_limit": False,
                    "preferred_credit_load": preferred,
                    "max_credit_load": maximum,
                    "message": f"Selected credits exceed the maximum allowed load of {maximum}."
                }
                validation_result["is_valid"] = False
            else:
                validation_result["credit_status"] = {
                    "within_limit": True,
                    "preferred_credit_load": preferred,
                    "max_credit_load": maximum,
                    "message": f"Selected credits are within the allowed maximum of {maximum}."
                }

        for i in range(len(section_ids)):
            for j in range(i + 1, len(section_ids)):
                section_id_1 = section_ids[i]
                section_id_2 = section_ids[j]

                conflict_result = check_two_sections_conflict(db, section_id_1, section_id_2)

                if conflict_result["has_conflict"]:
                    validation_result["is_valid"] = False

                    label_1 = next(item for item in section_labels if item["section_id"] == section_id_1)
                    label_2 = next(item for item in section_labels if item["section_id"] == section_id_2)

                    validation_result["schedule_conflicts"].append({
                        "course_1": label_1["course_code"],
                        "section_1": label_1["section_number"],
                        "course_2": label_2["course_code"],
                        "section_2": label_2["section_number"],
                        "details": conflict_result["conflicts"]
                    })

        return validation_result

    finally:
        db.close()
