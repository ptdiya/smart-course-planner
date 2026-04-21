from app.services.recommendation_service import recommend_courses_for_student


def print_group(title, items, top_n=10):
    print(title)

    if not items:
        print("  None")
        print()
        return

    for idx, item in enumerate(items[:top_n], start=1):
        print(f"{idx}. {item['course_code']} - {item['course_title']}")
        print(f"   Score: {item['score']}")
        print(f"   Eligible: {item['eligible']}")
        print(f"   Has Capacity: {item['has_capacity']}")
        print(f"   Available Seats: {item['available_seats']}")
        print(f"   Track: {item['track']}")
        print(f"   Reasons: {', '.join(item['reasons'])}")
        print(f"   Status: {item['status_label']}")
        print(f"   Explanation: {item['prerequisite_explanation']}")
        print()


def print_recommendations(result, top_n=10):
    print("=" * 90)
    print("Student ID:", result["student_id"])
    print("Term:", result["term_name"])
    print("Mode:", result["mode"])
    print("Preferred Track:", result["preferred_track"])
    print()

    print_group("Recommended Now:", result["recommended_now"], top_n=top_n)
    print_group("Recommended Later / Currently Blocked:", result["recommended_later"], top_n=top_n)

    print("=" * 90)
    print()


def run_tests():
    test_cases = [
        (1, "Spring 2027", "planning"),
        (1, "Spring 2027", "registration"),
        (2, "Spring 2027", "planning"),
        (1, "Fall 2026", "registration"),
    ]

    for student_id, term_name, mode in test_cases:
        result = recommend_courses_for_student(student_id, term_name, mode)
        print_recommendations(result, top_n=8)


if __name__ == "__main__":
    run_tests()