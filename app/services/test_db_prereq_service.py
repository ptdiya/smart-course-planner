from app.services.db_prereq_service import check_student_course_eligibility


def run_tests():
    test_cases = [
        (1, "CSCI 40300", "planning"),
        (1, "CSCI 40300", "registration"),
        (1, "CSCI 43100", "planning"),
        (1, "CSCI 43100", "registration"),
        (2, "CSCI 30100", "planning"),
        (2, "CSCI 30100", "registration"),
    ]

    for student_id, course_code, mode in test_cases:
        result = check_student_course_eligibility(student_id, course_code, mode)

        print("=" * 70)
        print("Mode:", result["mode"])
        print("Student ID:", result["student_id"])
        print("Course:", result["course_code"])
        print("Completed Courses:", result["completed_courses"])
        print("Eligible:", result["eligible"])
        print("Missing:", result["missing_requirements"])
        print("Explanation:", result["explanation"])


if __name__ == "__main__":
    run_tests()