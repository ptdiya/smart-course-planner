from fastapi import APIRouter
from app.schemas.schemas import RoadmapRequest
from app.services.roadmap_service import generate_track_roadmap

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.post("/")
def get_track_roadmap(request: RoadmapRequest):
    result = generate_track_roadmap(
        student_id=request.student_id,
        track_name=request.track_name,
        mode=request.mode
    )

    return result