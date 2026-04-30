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


class AdminCreateTermRequest(BaseModel):
    semester: str
    year: int
    start_date: str
    end_date: str
    status: Optional[str] = "draft"
    planning_mode: Optional[str] = "read-only"
    submission_window: Optional[str] = "closed"


class AdminUpdateTermRequest(BaseModel):
    semester: str
    year: int
    start_date: str
    end_date: str


class AdminSubmissionWindowRequest(BaseModel):
    submission_window: str


class AdminSectionCapacityRequest(BaseModel):
    capacity: int


class AdminCoursePrerequisiteRequest(BaseModel):
    prerequisite_rule: str
    notes: Optional[str] = None


class AdminCourseUpdateRequest(BaseModel):
    course_title: str
    description: Optional[str] = None
    credits: int
    prerequisite_rule: Optional[str] = ""
    prerequisite_notes: Optional[str] = None


class AdminSectionUpdateRequest(BaseModel):
    section_number: str
    instructor: str
    days: str
    start_time: str
    end_time: str
    location: str
    capacity: int


class AdminCourseOfferingRequest(AdminSectionUpdateRequest):
    course_id: int
    term_id: int


class AdminCreateUserRequest(BaseModel):
    full_name: str
    email: str
    temporary_password: str
    role: str
    major: Optional[str] = None
    track_id: Optional[int] = None


class AdminUpdateUserRequest(BaseModel):
    full_name: str
    email: str
    major: Optional[str] = None
    track_id: Optional[int] = None
    is_active: Optional[bool] = None
    actor_user_id: Optional[int] = None


class AdminUserStatusRequest(BaseModel):
    is_active: bool
    actor_user_id: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str


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


class StudentSubmitSectionInput(BaseModel):
    course_code: str
    section_number: str = "001"


class StudentSubmitPlanRequest(BaseModel):
    student_id: int
    term_name: str
    sections: List[StudentSubmitSectionInput]


class StudentTermResponse(BaseModel):
    term_id: int
    term_name: str
    semester: str
    year: int
    status: str
    planning_mode: str
    submission_window: str
