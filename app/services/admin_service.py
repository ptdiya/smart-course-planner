from app.db.database import SessionLocal
from app.db import models


def get_admin_record(db, admin_id):
    return (
        db.query(models.Admin)
        .filter(models.Admin.admin_id == admin_id)
        .first()
    )


def list_courses_with_sections(term_name=None):
    db = SessionLocal()

    try:
        query = (
            db.query(models.Course, models.CourseSection, models.Term)
            .join(models.CourseSection, models.Course.course_id == models.CourseSection.course_id)
            .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
        )

        if term_name is not None:
            query = query.filter(models.Term.term_name == term_name)

        records = query.order_by(models.Course.course_code, models.CourseSection.section_number).all()

        results = []
        for course, section, term in records:
            results.append({
                "course_code": course.course_code,
                "course_title": course.course_title,
                "credits": course.credits,
                "term_name": term.term_name,
                "section_number": section.section_number,
                "capacity": section.capacity,
                "enrolled_count": section.enrolled_count,
                "waitlist_count": section.waitlist_count,
                "delivery_mode": section.delivery_mode,
                "available_seats": max(section.capacity - section.enrolled_count, 0)
            })

        return results

    finally:
        db.close()


def update_section_capacity(admin_id, course_code, term_name, section_number, new_capacity):
    db = SessionLocal()

    try:
        admin = get_admin_record(db, admin_id)
        if admin is None:
            return {
                "success": False,
                "message": "Admin not found."
            }

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
            return {
                "success": False,
                "message": "Target section was not found."
            }

        section, course, term = record

        if new_capacity < section.enrolled_count:
            return {
                "success": False,
                "message": (
                    f"New capacity cannot be smaller than current enrollment "
                    f"({section.enrolled_count})."
                )
            }

        old_capacity = section.capacity
        section.capacity = new_capacity
        db.commit()

        return {
            "success": True,
            "message": (
                f"Updated {course_code} section {section_number} in {term_name} "
                f"from capacity {old_capacity} to {new_capacity}."
            ),
            "course_code": course_code,
            "term_name": term_name,
            "section_number": section_number,
            "old_capacity": old_capacity,
            "new_capacity": new_capacity,
            "enrolled_count": section.enrolled_count,
            "available_seats": max(section.capacity - section.enrolled_count, 0)
        }

    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating capacity: {str(e)}"
        }

    finally:
        db.close()


def update_prerequisite_rule(admin_id, course_code, new_rule_expression, notes=None):
    db = SessionLocal()

    try:
        admin = get_admin_record(db, admin_id)
        if admin is None:
            return {
                "success": False,
                "message": "Admin not found."
            }

        course = (
            db.query(models.Course)
            .filter(models.Course.course_code == course_code)
            .first()
        )

        if course is None:
            return {
                "success": False,
                "message": "Course not found."
            }

        existing_rule = (
            db.query(models.PrerequisiteRule)
            .filter(models.PrerequisiteRule.course_id == course.course_id)
            .first()
        )

        if existing_rule is None:
            old_rule = None
            new_rule = models.PrerequisiteRule(
                course_id=course.course_id,
                rule_expression=new_rule_expression,
                notes=notes
            )
            db.add(new_rule)
        else:
            old_rule = existing_rule.rule_expression
            existing_rule.rule_expression = new_rule_expression
            existing_rule.notes = notes

        db.commit()

        return {
            "success": True,
            "message": f"Updated prerequisite rule for {course_code}.",
            "course_code": course_code,
            "old_rule_expression": old_rule,
            "new_rule_expression": new_rule_expression,
            "notes": notes
        }

    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating prerequisite rule: {str(e)}"
        }

    finally:
        db.close()