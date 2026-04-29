from datetime import datetime

from app.db.database import SessionLocal
from app.db import models


DEFAULT_TERM_SETTINGS = {
    "Spring 2026": {
        "status": "closed",
        "planning_mode": "read-only",
        "submission_window": "closed"
    },
    "Fall 2026": {
        "status": "open",
        "planning_mode": "editable",
        "submission_window": "open"
    },
    "Spring 2027": {
        "status": "draft",
        "planning_mode": "not_open_yet",
        "submission_window": "not_open_yet"
    },
}


def get_admin_record(db, admin_id):
    return (
        db.query(models.Admin)
        .filter(models.Admin.admin_id == admin_id)
        .first()
    )


def split_term_name(term_name):
    parts = term_name.split()
    semester = parts[0] if parts else term_name
    year = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    return semester, year


def get_default_term_setting(term_name):
    return DEFAULT_TERM_SETTINGS.get(term_name, {
        "status": "draft",
        "planning_mode": "read-only",
        "submission_window": "closed"
    })


def get_or_create_term_setting(db, term):
    setting = (
        db.query(models.TermSetting)
        .filter(models.TermSetting.term_id == term.term_id)
        .first()
    )

    if setting is not None:
        return setting

    defaults = get_default_term_setting(term.term_name)
    setting = models.TermSetting(
        term_id=term.term_id,
        status=defaults["status"],
        planning_mode=defaults["planning_mode"],
        submission_window=defaults["submission_window"],
    )
    db.add(setting)
    db.flush()
    return setting


def build_term_payload(db, term):
    setting = get_or_create_term_setting(db, term)
    semester, year = split_term_name(term.term_name)
    submitted_plans = (
        db.query(models.StudentPlan)
        .filter(models.StudentPlan.term_id == term.term_id)
        .filter(models.StudentPlan.status.in_(["submitted", "finalized"]))
        .count()
    )

    return {
        "term_id": term.term_id,
        "term_name": term.term_name,
        "semester": semester,
        "year": year,
        "start_date": term.start_date.isoformat() if term.start_date else None,
        "end_date": term.end_date.isoformat() if term.end_date else None,
        "status": setting.status,
        "planning_mode": setting.planning_mode,
        "submission_window": setting.submission_window,
        "submitted_plans": submitted_plans,
    }


def parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def validate_term_window(db, semester, year, start_date, end_date, excluded_term_id=None):
    term_name = f"{semester} {year}"
    parsed_start = parse_date(start_date)
    parsed_end = parse_date(end_date)

    if parsed_end < parsed_start:
        return {
            "success": False,
            "message": "Term end date must be after the start date."
        }

    duplicate_query = db.query(models.Term).filter(models.Term.term_name == term_name)
    if excluded_term_id is not None:
        duplicate_query = duplicate_query.filter(models.Term.term_id != excluded_term_id)

    if duplicate_query.first() is not None:
        return {
            "success": False,
            "message": f"A term for {term_name} already exists."
        }

    overlap_query = (
        db.query(models.Term)
        .filter(models.Term.start_date <= parsed_end)
        .filter(models.Term.end_date >= parsed_start)
    )
    if excluded_term_id is not None:
        overlap_query = overlap_query.filter(models.Term.term_id != excluded_term_id)

    if overlap_query.first() is not None:
        return {
            "success": False,
            "message": "This date range overlaps with an existing term."
        }

    return {
        "success": True,
        "term_name": term_name,
        "start_date": parsed_start,
        "end_date": parsed_end
    }


def get_admin_terms():
    db = SessionLocal()

    try:
        terms = db.query(models.Term).order_by(models.Term.start_date).all()
        payload = [build_term_payload(db, term) for term in terms]
        db.commit()
        return payload

    finally:
        db.close()


def get_admin_system_stats(term_id=None):
    db = SessionLocal()

    try:
        submitted_query = db.query(models.StudentPlan).filter(models.StudentPlan.status == "submitted")
        if term_id is not None:
            submitted_query = submitted_query.filter(models.StudentPlan.term_id == term_id)

        return {
            "total_students": db.query(models.Student).count(),
            "total_courses": db.query(models.Course).filter(models.Course.is_active == True).count(),
            "total_sections": db.query(models.CourseSection).count(),
            "submitted_plans": submitted_query.count(),
        }

    finally:
        db.close()


def create_admin_term(semester, year, start_date, end_date, status="draft", planning_mode="read-only", submission_window="closed"):
    db = SessionLocal()

    try:
        validation = validate_term_window(db, semester, year, start_date, end_date)
        if not validation["success"]:
            return validation

        term = models.Term(
            term_name=validation["term_name"],
            start_date=validation["start_date"],
            end_date=validation["end_date"],
        )
        db.add(term)
        db.flush()
        db.add(models.TermSetting(
            term_id=term.term_id,
            status=status,
            planning_mode=planning_mode,
            submission_window=submission_window,
        ))
        db.commit()

        return {
            "success": True,
            "message": f"Created {term.term_name}.",
            "term": build_term_payload(db, term)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error creating term: {str(error)}"
        }

    finally:
        db.close()


def update_admin_term(term_id, semester, year, start_date, end_date):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found."
            }

        validation = validate_term_window(db, semester, year, start_date, end_date, excluded_term_id=term_id)
        if not validation["success"]:
            return validation

        term.term_name = validation["term_name"]
        term.start_date = validation["start_date"]
        term.end_date = validation["end_date"]
        db.commit()

        return {
            "success": True,
            "message": f"Updated {term.term_name}.",
            "term": build_term_payload(db, term)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating term: {str(error)}"
        }

    finally:
        db.close()


def delete_admin_term(term_id):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found."
            }

        plan_count = (
            db.query(models.StudentPlan)
            .filter(models.StudentPlan.term_id == term_id)
            .count()
        )
        if plan_count:
            return {
                "success": False,
                "message": "This term has submitted schedules and cannot be deleted."
            }

        term_name = term.term_name
        db.delete(term)
        db.commit()

        return {
            "success": True,
            "message": f"Deleted {term_name}."
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error deleting term: {str(error)}"
        }

    finally:
        db.close()


def update_submission_window(term_id, submission_window):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found."
            }

        setting = get_or_create_term_setting(db, term)
        if setting.status == "finalized":
            return {
                "success": False,
                "message": "Finalized terms cannot be reopened until finalization is undone."
            }

        normalized = submission_window.lower()

        if normalized == "open":
            setting.status = "open"
            setting.planning_mode = "editable"
            setting.submission_window = "open"
        elif normalized == "closed":
            setting.status = "closed"
            setting.planning_mode = "read-only"
            setting.submission_window = "closed"
        else:
            return {
                "success": False,
                "message": "submission_window must be 'open' or 'closed'."
            }

        db.commit()

        return {
            "success": True,
            "message": f"{term.term_name} submissions are now {setting.submission_window}.",
            "term": build_term_payload(db, term)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating submission window: {str(error)}"
        }

    finally:
        db.close()


def finalize_term(term_id):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found."
            }

        submitted_plans = (
            db.query(models.StudentPlan)
            .filter(models.StudentPlan.term_id == term_id)
            .filter(models.StudentPlan.status == "submitted")
            .all()
        )

        completed_count = 0
        for plan in submitted_plans:
            plan_courses = (
                db.query(models.StudentPlanCourse, models.CourseSection)
                .join(models.CourseSection, models.StudentPlanCourse.section_id == models.CourseSection.section_id)
                .filter(models.StudentPlanCourse.plan_id == plan.plan_id)
                .all()
            )

            for _, section in plan_courses:
                existing_completion = (
                    db.query(models.StudentCompletedCourse)
                    .filter(models.StudentCompletedCourse.student_id == plan.student_id)
                    .filter(models.StudentCompletedCourse.course_id == section.course_id)
                    .filter(models.StudentCompletedCourse.status == "completed")
                    .first()
                )

                if existing_completion is None:
                    db.add(models.StudentCompletedCourse(
                        student_id=plan.student_id,
                        course_id=section.course_id,
                        term_id=term_id,
                        grade="CR",
                        status="completed",
                    ))
                    completed_count += 1

            plan.status = "finalized"

        setting = get_or_create_term_setting(db, term)
        setting.status = "finalized"
        setting.planning_mode = "read-only"
        setting.submission_window = "closed"
        db.commit()

        return {
            "success": True,
            "message": f"Finalized {term.term_name}. Submitted courses are now completed.",
            "term": build_term_payload(db, term),
            "finalized_plans": len(submitted_plans),
            "completed_courses_created": completed_count,
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error finalizing term: {str(error)}"
        }

    finally:
        db.close()


def undo_finalize_term(term_id):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found."
            }

        finalized_plans = (
            db.query(models.StudentPlan)
            .filter(models.StudentPlan.term_id == term_id)
            .filter(models.StudentPlan.status == "finalized")
            .all()
        )

        removed_completed_courses = 0
        for plan in finalized_plans:
            plan_courses = (
                db.query(models.StudentPlanCourse, models.CourseSection)
                .join(models.CourseSection, models.StudentPlanCourse.section_id == models.CourseSection.section_id)
                .filter(models.StudentPlanCourse.plan_id == plan.plan_id)
                .all()
            )

            for _, section in plan_courses:
                completions = (
                    db.query(models.StudentCompletedCourse)
                    .filter(models.StudentCompletedCourse.student_id == plan.student_id)
                    .filter(models.StudentCompletedCourse.course_id == section.course_id)
                    .filter(models.StudentCompletedCourse.term_id == term_id)
                    .filter(models.StudentCompletedCourse.status == "completed")
                    .filter(models.StudentCompletedCourse.grade == "CR")
                    .all()
                )

                for completion in completions:
                    db.delete(completion)
                    removed_completed_courses += 1

            plan.status = "submitted"

        setting = get_or_create_term_setting(db, term)
        setting.status = "closed"
        setting.planning_mode = "read-only"
        setting.submission_window = "closed"
        db.commit()

        return {
            "success": True,
            "message": f"Undo finalization completed for {term.term_name}. Completed courses moved back to In Progress.",
            "term": build_term_payload(db, term),
            "restored_plans": len(finalized_plans),
            "completed_courses_removed": removed_completed_courses,
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error undoing finalization: {str(error)}"
        }

    finally:
        db.close()


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
