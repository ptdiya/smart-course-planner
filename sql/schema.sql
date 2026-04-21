CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracks (
    track_id SERIAL PRIMARY KEY,
    track_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    major VARCHAR(100),
    academic_year VARCHAR(50),
    preferred_track_id INT,
    preferred_credit_load INT,
    max_credit_load INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_track_id) REFERENCES tracks(track_id)
);

CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    department_name VARCHAR(100),
    permission_level VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE terms (
    term_id SERIAL PRIMARY KEY,
    term_name VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_title VARCHAR(150) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    level INT NOT NULL,
    default_track_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (default_track_id) REFERENCES tracks(track_id)
);

CREATE TABLE course_sections (
    section_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    term_id INT NOT NULL,
    section_number VARCHAR(20) NOT NULL,
    instructor_name VARCHAR(100),
    capacity INT NOT NULL,
    enrolled_count INT DEFAULT 0,
    waitlist_count INT DEFAULT 0,
    delivery_mode VARCHAR(30),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(term_id) ON DELETE CASCADE
);

CREATE TABLE section_meetings (
    meeting_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL,
    day_of_week VARCHAR(2) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    building VARCHAR(50),
    room VARCHAR(20),
    FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE
);

CREATE TABLE prerequisite_rules (
    rule_id SERIAL PRIMARY KEY,
    course_id INT UNIQUE NOT NULL,
    rule_expression TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE student_completed_courses (
    completion_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    term_id INT,
    grade VARCHAR(5),
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(term_id)
);

CREATE TABLE student_plans (
    plan_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    term_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    total_credits INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(term_id) ON DELETE CASCADE
);

CREATE TABLE student_plan_courses (
    plan_course_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    section_id INT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES student_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE
);

CREATE TABLE watchlists (
    watchlist_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES course_sections(section_id) ON DELETE CASCADE
);

CREATE TABLE quota_alerts (
    alert_id SERIAL PRIMARY KEY,
    watchlist_id INT NOT NULL,
    alert_message TEXT NOT NULL,
    available_seats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (watchlist_id) REFERENCES watchlists(watchlist_id) ON DELETE CASCADE
);