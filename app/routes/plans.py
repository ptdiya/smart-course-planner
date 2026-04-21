from fastapi import APIRouter
from app.schemas.schemas import PlanValidationRequest
from app.services.plan_validation_service import validate_plan

router = APIRouter(prefix="/plan", tags=["Plan Validation"])


@router.post("/validate")
def validate_student_plan(request: PlanValidationRequest):
    selections = [selection.model_dump() for selection in request.selections]

    result = validate_plan(
        student_id=request.student_id,
        selections=selections,
        mode=request.mode
    )

    return result