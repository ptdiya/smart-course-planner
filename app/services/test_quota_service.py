from app.services.quota_service import check_section_capacity


def run_tests():
    test_cases = [
        ("CSCI 36200", "Fall 2026"),
        ("CSCI 45500", "Fall 2026"),
        ("CSCI 45200", "Fall 2026"),
        ("CSCI 41600", "Spring 2027"),
        ("CSCI 49500", "Fall 2026"),
    ]

    for course_code, term_name in test_cases:
        result = check_section_capacity(course_code, term_name)

        print("=" * 70)
        print("Course:", result["course_code"])
        print("Term:", result["term_name"])
        print("Section:", result["section_number"])
        print("Capacity:", result.get("capacity"))
        print("Enrolled:", result.get("enrolled_count"))
        print("Waitlist:", result.get("waitlist_count"))
        print("Available Seats:", result.get("available_seats"))
        print("Has Capacity:", result["has_capacity"])
        print("Message:", result["message"])


if __name__ == "__main__":
    run_tests()