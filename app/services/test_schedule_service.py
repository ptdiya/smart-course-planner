from app.services.schedule_service import check_course_pair_conflict


def run_tests():
    test_cases = [
        ("CSCI 34000", "CSCI 47300", "Spring 2027"),
        ("CSCI 41600", "CSCI 48300", "Spring 2027"),
        ("CSCI 45200", "CSCI 49400", "Spring 2027"),
        ("CSCI 23000", "CSCI 41600", "Spring 2027"),
        ("CSCI 34000", "CSCI 47500", "Spring 2027"),
    ]

    for course_1, course_2, term_name in test_cases:
        result = check_course_pair_conflict(course_1, course_2, term_name)

        print("=" * 70)
        print("Term:", term_name)
        print("Course 1:", result.get("course_1", course_1))
        print("Course 2:", result.get("course_2", course_2))

        if "error" in result:
            print("Error:", result["error"])
            continue

        print("Has Conflict:", result["has_conflict"])

        if result["has_conflict"]:
            print("Conflict Details:")
            for conflict in result["conflicts"]:
                print(
                    f"  Day: {conflict['day']} | "
                    f"{result['course_1']}: {conflict['section_1_time']} | "
                    f"{result['course_2']}: {conflict['section_2_time']}"
                )
        else:
            print("Conflict Details: No time conflict found.")


if __name__ == "__main__":
    run_tests()