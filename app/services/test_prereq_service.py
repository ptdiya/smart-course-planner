from app.services.prereq_service import check_course_eligibility


def run_tests():
    completed_1 = ["CSCI 16200", "CSCI 23000", "CSCI 26500", "CSCI 24000"]
    completed_2 = ["CSCI 16200", "CSCI 23000"]

    test_cases = [
        ("CSCI 27000", "CSCI 23000 AND CSCI 26500", completed_1),
        ("CSCI 30100", "CSCI 23000 AND CSCI 24000", completed_1),
        ("CSCI 36200", "CSCI 27000 AND CSCI 30100", completed_2),
        ("CSCI 43100", "CSCI 30100 AND (CSCI 40300 OR CSCI 41600)", ["CSCI 30100", "CSCI 40300"]),
        ("CSCI 43100", "CSCI 30100 AND (CSCI 40300 OR CSCI 41600)", ["CSCI 30100"]),
    ]

    for course_code, expr, completed in test_cases:
        result = check_course_eligibility(course_code, expr, completed)
        print("=" * 60)
        print("Course:", result["course_code"])
        print("Eligible:", result["eligible"])
        print("Missing:", result["missing_requirements"])
        print("Explanation:", result["explanation"])


if __name__ == "__main__":
    run_tests()