from fastapi import APIRouter
from app.schemas.schemas import RecommendationRequest
from app.services.recommendation_service import recommend_courses_for_student

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/")
def get_recommendations(request: RecommendationRequest):
    result = recommend_courses_for_student(
        student_id=request.student_id,
        term_name=request.term_name,
        mode=request.mode
    )

    return result