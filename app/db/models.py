from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Date, Time, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Track(Base):
    __tablename__ = "tracks"

    track_id = Column(Integer, primary_key=True, index=True)
    track_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    major = Column(String(100))
    academic_year = Column(String(50))
    preferred_track_id = Column(Integer, ForeignKey("tracks.track_id"))
    preferred_credit_load = Column(Integer)
    max_credit_load = Column(Integer)


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    department_name = Column(String(100))
    permission_level = Column(String(50))


class Term(Base):
    __tablename__ = "terms"

    term_id = Column(Integer, primary_key=True, index=True)
    term_name = Column(String(50), unique=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), unique=True, nullable=False)
    course_title = Column(String(150), nullable=False)
    description = Column(Text)
    credits = Column(Integer, nullable=False)
    level = Column(Integer, nullable=False)
    default_track_id = Column(Integer, ForeignKey("tracks.track_id"))
    is_active = Column(Boolean, default=True)


class CourseSection(Base):
    __tablename__ = "course_sections"

    section_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.term_id", ondelete="CASCADE"), nullable=False)
    section_number = Column(String(20), nullable=False)
    instructor_name = Column(String(100))
    capacity = Column(Integer, nullable=False)
    enrolled_count = Column(Integer, default=0)
    waitlist_count = Column(Integer, default=0)
    delivery_mode = Column(String(30))


class SectionMeeting(Base):
    __tablename__ = "section_meetings"

    meeting_id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("course_sections.section_id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(2), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    building = Column(String(50))
    room = Column(String(20))


class PrerequisiteRule(Base):
    __tablename__ = "prerequisite_rules"

    rule_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), unique=True, nullable=False)
    rule_expression = Column(Text, nullable=False)
    notes = Column(Text)


class StudentCompletedCourse(Base):
    __tablename__ = "student_completed_courses"

    completion_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.term_id"))
    grade = Column(String(5))
    status = Column(String(20), nullable=False)


class StudentPlan(Base):
    __tablename__ = "student_plans"

    plan_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    term_id = Column(Integer, ForeignKey("terms.term_id", ondelete="CASCADE"), nullable=False)
    plan_name = Column(String(100), nullable=False)
    status = Column(String(20), default="draft", nullable=False)
    total_credits = Column(Integer, default=0)
    submitted_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class StudentPlanCourse(Base):
    __tablename__ = "student_plan_courses"

    plan_course_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("student_plans.plan_id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("course_sections.section_id", ondelete="CASCADE"), nullable=False)
    is_locked = Column(Boolean, default=False)
    added_at = Column(TIMESTAMP, server_default=func.now())


class Watchlist(Base):
    __tablename__ = "watchlists"

    watchlist_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("course_sections.section_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_active = Column(Boolean, default=True)


class QuotaAlert(Base):
    __tablename__ = "quota_alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.watchlist_id", ondelete="CASCADE"), nullable=False)
    alert_message = Column(Text, nullable=False)
    available_seats = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_read = Column(Boolean, default=False)
