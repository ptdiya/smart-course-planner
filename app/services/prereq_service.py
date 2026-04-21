from app.utils.prereq_parser import build_prereq_tree


def evaluate_prereq_tree(node, completed_courses):
    if node is None:
        return True, []

    if node.value == "AND":
        left_ok, left_missing = evaluate_prereq_tree(node.left, completed_courses)
        right_ok, right_missing = evaluate_prereq_tree(node.right, completed_courses)
        return left_ok and right_ok, left_missing + right_missing

    if node.value == "OR":
        left_ok, left_missing = evaluate_prereq_tree(node.left, completed_courses)
        right_ok, right_missing = evaluate_prereq_tree(node.right, completed_courses)

        if left_ok or right_ok:
            return True, []

        return False, left_missing + right_missing

    if node.value in completed_courses:
        return True, []

    return False, [node.value]


def check_course_eligibility(course_code, rule_expression, completed_courses):
    if not rule_expression:
        return {
            "course_code": course_code,
            "eligible": True,
            "missing_requirements": [],
            "explanation": f"{course_code} has no prerequisites."
        }

    tree = build_prereq_tree(rule_expression)
    eligible, missing = evaluate_prereq_tree(tree, completed_courses)

    unique_missing = sorted(list(set(missing)))

    if eligible:
        explanation = f"The student satisfies the prerequisite requirements for {course_code}."
    else:
        if len(unique_missing) == 1:
            explanation = f"{course_code} is not currently available because the student is missing {unique_missing[0]}."
        else:
            missing_text = ", ".join(unique_missing[:-1]) + f" and {unique_missing[-1]}"
            explanation = f"{course_code} is not currently available because the student is missing {missing_text}."

    return {
        "course_code": course_code,
        "eligible": eligible,
        "missing_requirements": unique_missing,
        "explanation": explanation
    }