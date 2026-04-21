from app.db.database import SessionLocal
from app.db import models


def time_overlap(start1, end1, start2, end2):
    return start1 < end2 and start2 < end1


def get_section_meetings(db, section_id):
    meetings = (
        db.query(models.SectionMeeting)
        .filter(models.SectionMeeting.section_id == section_id)
        .all()
    )
    return meetings


def check_two_sections_conflict(db, section_id_1, section_id_2):
    meetings_1 = get_section_meetings(db, section_id_1)
    meetings_2 = get_section_meetings(db, section_id_2)

    conflicts = []

    for meeting_1 in meetings_1:
        for meeting_2 in meetings_2:
            same_day = meeting_1.day_of_week == meeting_2.day_of_week
            overlap = time_overlap(
                meeting_1.start_time,
                meeting_1.end_time,
                meeting_2.start_time,
                meeting_2.end_time
            )

            if same_day and overlap:
                conflicts.append({
                    "day": meeting_1.day_of_week,
                    "section_1_time": f"{meeting_1.start_time} - {meeting_1.end_time}",
                    "section_2_time": f"{meeting_2.start_time} - {meeting_2.end_time}"
                })

    return {
        "has_conflict": len(conflicts) > 0,
        "conflicts": conflicts
    }


def get_section_by_course_and_term(db, course_code, term_name, section_number="001"):
    record = (
        db.query(models.CourseSection.section_id)
        .join(models.Course, models.CourseSection.course_id == models.Course.course_id)
        .join(models.Term, models.CourseSection.term_id == models.Term.term_id)
        .filter(models.Course.course_code == course_code)
        .filter(models.Term.term_name == term_name)
        .filter(models.CourseSection.section_number == section_number)
        .first()
    )

    if record is None:
        return None

    return record[0]


def check_course_pair_conflict(course_code_1, course_code_2, term_name, section_number_1="001", section_number_2="001"):
    db = SessionLocal()

    try:
        section_id_1 = get_section_by_course_and_term(db, course_code_1, term_name, section_number_1)
        section_id_2 = get_section_by_course_and_term(db, course_code_2, term_name, section_number_2)

        if section_id_1 is None or section_id_2 is None:
            return {
                "has_conflict": False,
                "error": "One or both sections could not be found."
            }

        result = check_two_sections_conflict(db, section_id_1, section_id_2)
        result["course_1"] = course_code_1
        result["course_2"] = course_code_2
        result["term_name"] = term_name

        return result

    finally:
        db.close()