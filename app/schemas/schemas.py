from typing import List, Optional
from pydantic import BaseModel


class CourseSelectionInput(BaseModel):
    course_code: str
    term_name: str
    section_number: Optional[str] = "001"


class PlanValidationRequest(BaseModel):
    student_id: int
    mode: str = "planning"
    selections: List[CourseSelectionInput]


class RecommendationRequest(BaseModel):
    student_id: int
    term_name: str
    mode: str = "planning"


class RoadmapRequest(BaseModel):
    student_id: int
    track_name: Optional[str] = None
    mode: str = "planning"


class AdminCourseListRequest(BaseModel):
    term_name: Optional[str] = None


class CapacityUpdateRequest(BaseModel):
    admin_id: int
    course_code: str
    term_name: str
    section_number: str = "001"
    new_capacity: int


class PrerequisiteUpdateRequest(BaseModel):
    admin_id: int
    course_code: str
    new_rule_expression: str
    notes: Optional[str] = None