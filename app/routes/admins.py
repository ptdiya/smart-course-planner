from fastapi import APIRouter
from app.schemas.schemas import (
    AdminCourseOfferingRequest,
    AdminCoursePrerequisiteRequest,
    AdminCourseUpdateRequest,
    AdminCreateTermRequest,
    AdminCreateUserRequest,
    AdminCourseListRequest,
    AdminSectionCapacityRequest,
    AdminSectionUpdateRequest,
    AdminSubmissionWindowRequest,
    AdminUpdateTermRequest,
    AdminUpdateUserRequest,
    AdminUserStatusRequest,
    CapacityUpdateRequest,
    PrerequisiteUpdateRequest
)
from app.services.admin_service import (
    add_course_offering,
    create_admin_user,
    create_admin_term,
    create_section_for_course,
    delete_admin_term,
    delete_section,
    finalize_term,
    get_admin_system_stats,
    get_admin_terms,
    get_admin_users,
    list_master_courses,
    list_catalog_courses_for_term,
    list_courses_with_sections,
    remove_course_offering,
    undo_finalize_term,
    update_admin_term,
    update_admin_user,
    update_admin_user_status,
    update_course_details,
    update_course_prerequisite_by_id,
    update_section_details,
    update_section_capacity_by_id,
    update_submission_window,
    update_section_capacity,
    update_prerequisite_rule
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def admin_get_users():
    return get_admin_users()


@router.post("/users")
def admin_create_user(request: AdminCreateUserRequest):
    return create_admin_user(
        full_name=request.full_name,
        email=request.email,
        temporary_password=request.temporary_password,
        role=request.role,
        major=request.major,
        track_id=request.track_id
    )


@router.patch("/users/{user_id}")
def admin_update_user(user_id: int, request: AdminUpdateUserRequest):
    return update_admin_user(
        user_id=user_id,
        full_name=request.full_name,
        email=request.email,
        major=request.major,
        track_id=request.track_id,
        is_active=request.is_active,
        actor_user_id=request.actor_user_id
    )


@router.patch("/users/{user_id}/status")
def admin_update_user_status(user_id: int, request: AdminUserStatusRequest):
    return update_admin_user_status(
        user_id=user_id,
        is_active=request.is_active,
        actor_user_id=request.actor_user_id
    )


@router.get("/terms")
def admin_get_terms():
    terms = get_admin_terms()
    selected_term_id = None
    for term in terms:
        if term["status"] == "open":
            selected_term_id = term["term_id"]
            break
    if selected_term_id is None and terms:
        selected_term_id = terms[-1]["term_id"]

    return {
        "terms": terms,
        "stats": get_admin_system_stats(selected_term_id)
    }


@router.post("/terms")
def admin_create_term(request: AdminCreateTermRequest):
    return create_admin_term(
        semester=request.semester,
        year=request.year,
        start_date=request.start_date,
        end_date=request.end_date,
        status=request.status,
        planning_mode=request.planning_mode,
        submission_window=request.submission_window
    )


@router.put("/terms/{term_id}")
def admin_update_term(term_id: int, request: AdminUpdateTermRequest):
    return update_admin_term(
        term_id=term_id,
        semester=request.semester,
        year=request.year,
        start_date=request.start_date,
        end_date=request.end_date
    )


@router.delete("/terms/{term_id}")
def admin_delete_term(term_id: int):
    return delete_admin_term(term_id=term_id)


@router.patch("/terms/{term_id}/submission-window")
def admin_update_submission_window(term_id: int, request: AdminSubmissionWindowRequest):
    return update_submission_window(
        term_id=term_id,
        submission_window=request.submission_window
    )


@router.post("/terms/{term_id}/finalize")
def admin_finalize_term(term_id: int):
    return finalize_term(term_id=term_id)


@router.post("/terms/{term_id}/undo-finalize")
def admin_undo_finalize_term(term_id: int):
    return undo_finalize_term(term_id=term_id)


@router.post("/courses")
def get_admin_course_list(request: AdminCourseListRequest):
    results = list_courses_with_sections(term_name=request.term_name)
    return {
        "term_name": request.term_name,
        "courses": results
    }


@router.get("/courses")
def admin_get_course_catalog(term_id: int):
    return list_catalog_courses_for_term(term_id=term_id)


@router.get("/master-courses")
def admin_get_master_courses():
    return list_master_courses()


@router.patch("/courses/{course_id}")
def admin_update_course(course_id: int, request: AdminCourseUpdateRequest):
    return update_course_details(
        course_id=course_id,
        course_title=request.course_title,
        description=request.description,
        credits=request.credits,
        prerequisite_rule=request.prerequisite_rule,
        prerequisite_notes=request.prerequisite_notes
    )


@router.patch("/sections/{section_id}/capacity")
def admin_update_section_capacity_by_id(section_id: int, request: AdminSectionCapacityRequest):
    return update_section_capacity_by_id(
        section_id=section_id,
        capacity=request.capacity
    )


@router.patch("/sections/{section_id}")
def admin_update_section(section_id: int, request: AdminSectionUpdateRequest):
    return update_section_details(
        section_id=section_id,
        section_number=request.section_number,
        instructor=request.instructor,
        days=request.days,
        start_time=request.start_time,
        end_time=request.end_time,
        location=request.location,
        capacity=request.capacity
    )


@router.post("/courses/{course_id}/terms/{term_id}/sections")
def admin_add_section(course_id: int, term_id: int, request: AdminSectionUpdateRequest):
    return create_section_for_course(
        course_id=course_id,
        term_id=term_id,
        section_number=request.section_number,
        instructor=request.instructor,
        days=request.days,
        start_time=request.start_time,
        end_time=request.end_time,
        location=request.location,
        capacity=request.capacity
    )


@router.delete("/sections/{section_id}")
def admin_delete_section(section_id: int):
    return delete_section(section_id=section_id)


@router.post("/course-offerings")
def admin_add_course_offering(request: AdminCourseOfferingRequest):
    return add_course_offering(
        course_id=request.course_id,
        term_id=request.term_id,
        section_number=request.section_number,
        instructor=request.instructor,
        days=request.days,
        start_time=request.start_time,
        end_time=request.end_time,
        location=request.location,
        capacity=request.capacity
    )


@router.delete("/course-offerings")
def admin_remove_course_offering(course_id: int, term_id: int):
    return remove_course_offering(course_id=course_id, term_id=term_id)


@router.patch("/courses/{course_id}/prerequisites")
def admin_update_course_prerequisite_by_id(course_id: int, request: AdminCoursePrerequisiteRequest):
    return update_course_prerequisite_by_id(
        course_id=course_id,
        prerequisite_rule=request.prerequisite_rule,
        notes=request.notes
    )


@router.post("/update-capacity")
def admin_update_capacity(request: CapacityUpdateRequest):
    return update_section_capacity(
        admin_id=request.admin_id,
        course_code=request.course_code,
        term_name=request.term_name,
        section_number=request.section_number,
        new_capacity=request.new_capacity
    )


@router.post("/update-prerequisite")
def admin_update_prerequisite(request: PrerequisiteUpdateRequest):
    return update_prerequisite_rule(
        admin_id=request.admin_id,
        course_code=request.course_code,
        new_rule_expression=request.new_rule_expression,
        notes=request.notes
    )
