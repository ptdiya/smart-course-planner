from fastapi import APIRouter
from app.schemas.schemas import (
    AdminCourseListRequest,
    CapacityUpdateRequest,
    PrerequisiteUpdateRequest
)
from app.services.admin_service import (
    list_courses_with_sections,
    update_section_capacity,
    update_prerequisite_rule
)

router = APIRouter(prefix="/admin", tags=["Admin"])


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