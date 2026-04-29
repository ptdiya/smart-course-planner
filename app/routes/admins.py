from fastapi import APIRouter
from app.schemas.schemas import (
    AdminCreateTermRequest,
    AdminCourseListRequest,
    AdminSubmissionWindowRequest,
    AdminUpdateTermRequest,
    CapacityUpdateRequest,
    PrerequisiteUpdateRequest
)
from app.services.admin_service import (
    create_admin_term,
    delete_admin_term,
    finalize_term,
    get_admin_system_stats,
    get_admin_terms,
    list_courses_with_sections,
    undo_finalize_term,
    update_admin_term,
    update_submission_window,
    update_section_capacity,
    update_prerequisite_rule
)

router = APIRouter(prefix="/admin", tags=["Admin"])


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
