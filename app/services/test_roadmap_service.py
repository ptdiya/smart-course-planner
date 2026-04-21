from app.services.roadmap_service import generate_track_roadmap


def print_roadmap(result, top_n_suggestions=8):
    print("=" * 90)
    print("Student ID:", result["student_id"])
    print("Mode:", result["mode"])
    print("Track:", result["track_name"])
    print()

    if "message" in result:
        print("Message:", result["message"])
        print("=" * 90)
        print()
        return

    print("Completed / In Progress:")
    if not result["completed_or_in_progress"]:
        print("  None")
    else:
        for item in result["completed_or_in_progress"]:
            print(
                f"  {item['course_code']} - {item['course_title']} "
                f"({item['status']})"
            )

    print()
    print("Unlocked Now:")
    if not result["unlocked_now"]:
        print("  None")
    else:
        for item in result["unlocked_now"]:
            print(
                f"  {item['course_code']} - {item['course_title']}"
            )
            print(f"    Explanation: {item['explanation']}")

    print()
    print("Blocked:")
    if not result["blocked"]:
        print("  None")
    else:
        for item in result["blocked"]:
            print(
                f"  {item['course_code']} - {item['course_title']}"
            )
            print(f"    Missing: {item['missing_requirements']}")
            print(f"    Explanation: {item['explanation']}")

    print()
    print("Suggested Next Steps:")
    if not result["next_step_suggestions"]:
        print("  None")
    else:
        for item in result["next_step_suggestions"][:top_n_suggestions]:
            print(
                f"  {item['course_code']} | helps unlock {item['helps_unlock_count']} course(s) "
                f"| available now = {item['available_now']}"
            )

    print("=" * 90)
    print()


def run_tests():
    test_cases = [
        (1, "AI", "planning"),
        (1, "Data Science", "planning"),
        (1, "AI", "registration"),
        (2, "Systems", "planning"),
        (2, None, "planning"),
    ]

    for student_id, track_name, mode in test_cases:
        result = generate_track_roadmap(student_id, track_name, mode)
        print_roadmap(result)


if __name__ == "__main__":
    run_tests()