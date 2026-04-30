from datetime import datetime
from collections import OrderedDict

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


def parse_time(value):
    return datetime.strptime(value, "%H:%M").time()


def parse_location(value):
    parts = (value or "").strip().split(maxsplit=1)
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], parts[1]


def parse_days(value):
    clean_value = (value or "").replace(",", "").replace(" ", "").upper()
    days = [day for day in clean_value if day in {"M", "T", "W", "R", "F", "S", "U"}]
    return days


def validate_section_payload(section_number, instructor, days, start_time, end_time, location, capacity, enrolled_count=0):
    if not str(section_number or "").strip():
        return "Section number is required."
    if not str(instructor or "").strip():
        return "Instructor is required."
    if not parse_days(days):
        return "Meeting days are required."
    if not str(location or "").strip():
        return "Location is required."

    try:
        parsed_start = parse_time(start_time)
        parsed_end = parse_time(end_time)
    except ValueError:
        return "Start time and end time are required."

    if parsed_start >= parsed_end:
        return "Start time must be before end time."

    if capacity < enrolled_count:
        return f"Capacity cannot be lower than enrolled count ({enrolled_count})."

    return None


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


def build_admin_section_payload(db, section):
    meeting = get_section_meeting_summary(db, section.section_id)
    seats_remaining = max(section.capacity - section.enrolled_count, 0)

    return {
        "section_id": section.section_id,
        "section_number": section.section_number,
        "instructor": section.instructor_name,
        "days": meeting["days"],
        "start_time": meeting["start_time"],
        "end_time": meeting["end_time"],
        "location": meeting["location"],
        "capacity": section.capacity,
        "enrolled_count": section.enrolled_count,
        "seats_remaining": seats_remaining,
        "seat_status": get_seat_status(seats_remaining),
    }


def summarize_sections(sections):
    summary = {
        "open": 0,
        "low_seats": 0,
        "full": 0,
    }

    for section in sections:
        summary[section["seat_status"]] = summary.get(section["seat_status"], 0) + 1

    return summary


def list_catalog_courses_for_term(term_id):
    db = SessionLocal()

    try:
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if term is None:
            return {
                "success": False,
                "message": "Term not found.",
                "term": None,
                "courses": []
            }

        records = (
            db.query(models.Course, models.CourseSection, models.PrerequisiteRule)
            .join(models.CourseSection, models.Course.course_id == models.CourseSection.course_id)
            .outerjoin(models.PrerequisiteRule, models.PrerequisiteRule.course_id == models.Course.course_id)
            .filter(models.CourseSection.term_id == term_id)
            .order_by(models.Course.course_code, models.CourseSection.section_number)
            .all()
        )

        grouped = OrderedDict()
        for course, section, prerequisite in records:
            if course.course_id not in grouped:
                grouped[course.course_id] = {
                    "course_id": course.course_id,
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "credits": course.credits,
                    "description": course.description,
                    "prerequisite_rule": prerequisite.rule_expression if prerequisite else "",
                    "prerequisite_notes": prerequisite.notes if prerequisite else None,
                    "sections": []
                }

            grouped[course.course_id]["sections"].append(build_admin_section_payload(db, section))

        courses = []
        for course in grouped.values():
            course["section_count"] = len(course["sections"])
            course["section_summary"] = summarize_sections(course["sections"])
            courses.append(course)

        return {
            "success": True,
            "term": build_term_payload(db, term),
            "courses": courses
        }

    finally:
        db.close()


def list_master_courses():
    db = SessionLocal()

    try:
        courses = (
            db.query(models.Course)
            .filter(models.Course.is_active == True)
            .order_by(models.Course.course_code)
            .all()
        )

        return {
            "courses": [
                {
                    "course_id": course.course_id,
                    "course_code": course.course_code,
                    "course_title": course.course_title,
                    "credits": course.credits,
                }
                for course in courses
            ]
        }

    finally:
        db.close()


def replace_section_meetings(db, section, days, start_time, end_time, location):
    db.query(models.SectionMeeting).filter(models.SectionMeeting.section_id == section.section_id).delete()
    building, room = parse_location(location)
    parsed_start = parse_time(start_time)
    parsed_end = parse_time(end_time)

    for day in parse_days(days):
        db.add(models.SectionMeeting(
            section_id=section.section_id,
            day_of_week=day,
            start_time=parsed_start,
            end_time=parsed_end,
            building=building,
            room=room,
        ))


def update_course_details(course_id, course_title, description, credits, prerequisite_rule="", prerequisite_notes=None):
    db = SessionLocal()

    try:
        course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
        if course is None:
            return {
                "success": False,
                "message": "Course not found."
            }

        if not course_title.strip():
            return {
                "success": False,
                "message": "Course title is required."
            }

        if credits <= 0:
            return {
                "success": False,
                "message": "Credits must be greater than zero."
            }

        course.course_title = course_title.strip()
        course.description = description
        course.credits = credits

        prerequisite_result = update_course_prerequisite_in_session(
            db=db,
            course=course,
            prerequisite_rule=prerequisite_rule or "",
            notes=prerequisite_notes,
        )
        if not prerequisite_result["success"]:
            return prerequisite_result

        db.commit()

        return {
            "success": True,
            "message": f"Updated {course.course_code}.",
            "course_id": course.course_id,
            "course_code": course.course_code,
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating course: {str(error)}"
        }

    finally:
        db.close()


def update_course_prerequisite_in_session(db, course, prerequisite_rule, notes=None):
    clean_rule = prerequisite_rule.strip()
    existing_rule = (
        db.query(models.PrerequisiteRule)
        .filter(models.PrerequisiteRule.course_id == course.course_id)
        .first()
    )

    if existing_rule is None:
        if clean_rule:
            existing_rule = models.PrerequisiteRule(
                course_id=course.course_id,
                rule_expression=clean_rule,
                notes=notes,
            )
            db.add(existing_rule)
    elif clean_rule:
        existing_rule.rule_expression = clean_rule
        existing_rule.notes = notes
    else:
        db.delete(existing_rule)

    return {"success": True}


def update_section_capacity_by_id(section_id, capacity):
    db = SessionLocal()

    try:
        section = (
            db.query(models.CourseSection)
            .filter(models.CourseSection.section_id == section_id)
            .first()
        )

        if section is None:
            return {
                "success": False,
                "message": "Section not found."
            }

        if capacity < section.enrolled_count:
            return {
                "success": False,
                "message": f"Capacity cannot be lower than enrolled count ({section.enrolled_count})."
            }

        section.capacity = capacity
        db.commit()
        db.refresh(section)

        return {
            "success": True,
            "message": "Section capacity updated.",
            "section": build_admin_section_payload(db, section)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating section capacity: {str(error)}"
        }

    finally:
        db.close()


def update_course_prerequisite_by_id(course_id, prerequisite_rule, notes=None):
    db = SessionLocal()

    try:
        course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
        if course is None:
            return {
                "success": False,
                "message": "Course not found."
            }

        clean_rule = prerequisite_rule.strip()
        update_course_prerequisite_in_session(db, course, clean_rule, notes)

        db.commit()

        return {
            "success": True,
            "message": f"Updated prerequisite rule for {course.course_code}.",
            "course_id": course.course_id,
            "course_code": course.course_code,
            "prerequisite_rule": clean_rule,
            "notes": notes,
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating prerequisite rule: {str(error)}"
        }

    finally:
        db.close()


def update_section_details(section_id, section_number, instructor, days, start_time, end_time, location, capacity):
    db = SessionLocal()

    try:
        section = db.query(models.CourseSection).filter(models.CourseSection.section_id == section_id).first()
        if section is None:
            return {
                "success": False,
                "message": "Section not found."
            }

        validation_message = validate_section_payload(
            section_number=section_number,
            instructor=instructor,
            days=days,
            start_time=start_time,
            end_time=end_time,
            location=location,
            capacity=capacity,
            enrolled_count=section.enrolled_count,
        )
        if validation_message:
            return {
                "success": False,
                "message": validation_message
            }

        duplicate = (
            db.query(models.CourseSection)
            .filter(models.CourseSection.course_id == section.course_id)
            .filter(models.CourseSection.term_id == section.term_id)
            .filter(models.CourseSection.section_number == section_number)
            .filter(models.CourseSection.section_id != section.section_id)
            .first()
        )
        if duplicate is not None:
            return {
                "success": False,
                "message": "Another section with this section number already exists for this course and term."
            }

        section.section_number = section_number.strip()
        section.instructor_name = instructor.strip()
        section.capacity = capacity
        replace_section_meetings(db, section, days, start_time, end_time, location)
        db.commit()
        db.refresh(section)

        return {
            "success": True,
            "message": "Section updated.",
            "section": build_admin_section_payload(db, section)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error updating section: {str(error)}"
        }

    finally:
        db.close()


def create_section_for_course(course_id, term_id, section_number, instructor, days, start_time, end_time, location, capacity):
    db = SessionLocal()

    try:
        course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
        term = db.query(models.Term).filter(models.Term.term_id == term_id).first()
        if course is None or term is None:
            return {
                "success": False,
                "message": "Course or term not found."
            }

        validation_message = validate_section_payload(
            section_number=section_number,
            instructor=instructor,
            days=days,
            start_time=start_time,
            end_time=end_time,
            location=location,
            capacity=capacity,
            enrolled_count=0,
        )
        if validation_message:
            return {
                "success": False,
                "message": validation_message
            }

        duplicate = (
            db.query(models.CourseSection)
            .filter(models.CourseSection.course_id == course_id)
            .filter(models.CourseSection.term_id == term_id)
            .filter(models.CourseSection.section_number == section_number)
            .first()
        )
        if duplicate is not None:
            return {
                "success": False,
                "message": "This section already exists for the selected course and term."
            }

        section = models.CourseSection(
            course_id=course_id,
            term_id=term_id,
            section_number=section_number.strip(),
            instructor_name=instructor.strip(),
            capacity=capacity,
            enrolled_count=0,
            waitlist_count=0,
            delivery_mode="In-Person",
        )
        db.add(section)
        db.flush()
        replace_section_meetings(db, section, days, start_time, end_time, location)
        db.commit()
        db.refresh(section)

        return {
            "success": True,
            "message": f"Added {course.course_code} section {section.section_number} to {term.term_name}.",
            "section": build_admin_section_payload(db, section)
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error adding section: {str(error)}"
        }

    finally:
        db.close()


def delete_section(section_id):
    db = SessionLocal()

    try:
        section = db.query(models.CourseSection).filter(models.CourseSection.section_id == section_id).first()
        if section is None:
            return {
                "success": False,
                "message": "Section not found."
            }

        submitted_count = (
            db.query(models.StudentPlanCourse)
            .filter(models.StudentPlanCourse.section_id == section_id)
            .count()
        )
        if section.enrolled_count > 0 or submitted_count > 0:
            return {
                "success": False,
                "message": "This section has enrolled or submitted students and cannot be removed."
            }

        db.delete(section)
        db.commit()

        return {
            "success": True,
            "message": "Section removed."
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error removing section: {str(error)}"
        }

    finally:
        db.close()


def add_course_offering(course_id, term_id, section_number, instructor, days, start_time, end_time, location, capacity):
    db = SessionLocal()

    try:
        existing_offering = (
            db.query(models.CourseSection)
            .filter(models.CourseSection.course_id == course_id)
            .filter(models.CourseSection.term_id == term_id)
            .first()
        )
        if existing_offering is not None:
            return {
                "success": False,
                "message": "This course is already offered in the selected term."
            }

    finally:
        db.close()

    return create_section_for_course(
        course_id=course_id,
        term_id=term_id,
        section_number=section_number,
        instructor=instructor,
        days=days,
        start_time=start_time,
        end_time=end_time,
        location=location,
        capacity=capacity,
    )


def remove_course_offering(course_id, term_id):
    db = SessionLocal()

    try:
        sections = (
            db.query(models.CourseSection)
            .filter(models.CourseSection.course_id == course_id)
            .filter(models.CourseSection.term_id == term_id)
            .all()
        )
        if not sections:
            return {
                "success": False,
                "message": "Course offering not found for this term."
            }

        for section in sections:
            submitted_count = (
                db.query(models.StudentPlanCourse)
                .filter(models.StudentPlanCourse.section_id == section.section_id)
                .count()
            )
            if section.enrolled_count > 0 or submitted_count > 0:
                return {
                    "success": False,
                    "message": "This course offering has enrolled or submitted students and cannot be removed."
                }

        for section in sections:
            db.delete(section)

        db.commit()

        return {
            "success": True,
            "message": "Course offering removed from the selected term."
        }

    except Exception as error:
        db.rollback()
        return {
            "success": False,
            "message": f"Error removing course offering: {str(error)}"
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
