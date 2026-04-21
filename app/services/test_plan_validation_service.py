from app.services.plan_validation_service import validate_plan


def print_validation_result(result):
    print("=" * 80)
    print("Student ID:", result["student_id"])
    print("Mode:", result["mode"])
    print("Selected Courses:", [item["course_code"] for item in result["selected_courses"]])
    print("Total Credits:", result["total_credits"])
    print("Overall Valid:", result["is_valid"])
    print()

    print("Credit Status:")
    print(" ", result["credit_status"].get("message", "No credit information available."))
    print()

    print("Prerequisite Results:")
    for item in result["prerequisite_results"]:
        print(f"  {item['course_code']}: Eligible = {item['eligible']}")
        print(f"    Explanation: {item['explanation']}")

    print()
    print("Capacity Results:")
    for item in result["capacity_results"]:
        print(f"  {item['course_code']}: Has Capacity = {item['has_capacity']}")
        print(f"    Message: {item['message']}")

    print()
    print("Schedule Conflicts:")

    if not result["schedule_conflicts"]:
        print("  No schedule conflicts found.")
    else:
        for conflict in result["schedule_conflicts"]:
            print(
                f"  {conflict['course_1']} section {conflict['section_1']} conflicts with "
                f"{conflict['course_2']} section {conflict['section_2']}"
            )
            for detail in conflict["details"]:
                print(
                    f"    Day: {detail['day']} | "
                    f"{detail['section_1_time']} vs {detail['section_2_time']}"
                )

    print("=" * 80)
    print()


def run_tests():
    test_cases = [
        {
            "student_id": 1,
            "mode": "planning",
            "selections": [
                {"course_code": "CSCI 34000", "term_name": "Spring 2027"},
                {"course_code": "CSCI 41600", "term_name": "Spring 2027"},
                {"course_code": "CSCI 43500", "term_name": "Spring 2027"},
                {"course_code": "CSCI 47300", "term_name": "Spring 2027"},
            ]
        },
        {
            "student_id": 1,
            "mode": "registration",
            "selections": [
                {"course_code": "CSCI 40300", "term_name": "Fall 2026"},
                {"course_code": "CSCI 43100", "term_name": "Fall 2026"},
                {"course_code": "CSCI 45200", "term_name": "Fall 2026"},
            ]
        },
        {
            "student_id": 2,
            "mode": "planning",
            "selections": [
                {"course_code": "CSCI 23000", "term_name": "Spring 2027"},
                {"course_code": "CSCI 24000", "term_name": "Spring 2027"},
                {"course_code": "CSCI 30100", "term_name": "Spring 2027"},
                {"course_code": "CSCI 34000", "term_name": "Spring 2027"},
                {"course_code": "CSCI 47500", "term_name": "Spring 2027"},
            ]
        }
    ]

    for case in test_cases:
        result = validate_plan(
            student_id=case["student_id"],
            selections=case["selections"],
            mode=case["mode"]
        )
        print_validation_result(result)


if __name__ == "__main__":
    run_tests()