from datetime import date, time
from app.db.database import SessionLocal
from app.db import models


def clear_tables(db):
    # child tables first
    db.query(models.QuotaAlert).delete()
    db.query(models.Watchlist).delete()
    db.query(models.StudentPlanCourse).delete()
    db.query(models.StudentPlan).delete()
    db.query(models.StudentCompletedCourse).delete()
    db.query(models.SectionMeeting).delete()
    db.query(models.CourseSection).delete()
    db.query(models.PrerequisiteRule).delete()
    db.query(models.Student).delete()
    db.query(models.Admin).delete()
    db.query(models.Course).delete()
    db.query(models.Term).delete()
    db.query(models.Track).delete()
    db.query(models.User).delete()
    db.commit()


def seed_tracks(db):
    tracks = [
        models.Track(track_name="AI", description="Artificial Intelligence and machine learning focused courses"),
        models.Track(track_name="Data Science", description="Data analytics, databases, and data mining focused courses"),
        models.Track(track_name="Systems", description="Systems programming, operating systems, and software engineering"),
        models.Track(track_name="Networks", description="Computer networks, security, and distributed systems"),
    ]
    db.add_all(tracks)
    db.commit()
    return {track.track_name: track.track_id for track in db.query(models.Track).all()}


def seed_terms(db):
    terms = [
        models.Term(term_name="Fall 2026", start_date=date(2026, 8, 24), end_date=date(2026, 12, 12)),
        models.Term(term_name="Spring 2027", start_date=date(2027, 1, 11), end_date=date(2027, 5, 1)),
    ]
    db.add_all(terms)
    db.commit()
    return {term.term_name: term.term_id for term in db.query(models.Term).all()}


def seed_users(db):
    users = [
        models.User(
            full_name="Diya Patel",
            email="diya@example.com",
            password_hash="hashed_password_1",
            role="student"
        ),
        models.User(
            full_name="Alex Johnson",
            email="alex@example.com",
            password_hash="hashed_password_2",
            role="student"
        ),
        models.User(
            full_name="CS Department Admin",
            email="admin@example.com",
            password_hash="hashed_admin_password",
            role="admin"
        ),
    ]
    db.add_all(users)
    db.commit()

    user_map = {user.email: user.user_id for user in db.query(models.User).all()}

    students = [
        models.Student(
            user_id=user_map["diya@example.com"],
            major="Computer Science",
            academic_year="Senior",
            preferred_credit_load=12,
            max_credit_load=18
        ),
        models.Student(
            user_id=user_map["alex@example.com"],
            major="Computer Science",
            academic_year="Junior",
            preferred_credit_load=15,
            max_credit_load=18
        ),
    ]

    admins = [
        models.Admin(
            user_id=user_map["admin@example.com"],
            department_name="Computer Science",
            permission_level="full"
        )
    ]

    db.add_all(students + admins)
    db.commit()

    student_map = {student.user_id: student.student_id for student in db.query(models.Student).all()}
    admin_map = {admin.user_id: admin.admin_id for admin in db.query(models.Admin).all()}

    return user_map, student_map, admin_map


def seed_courses(db, track_ids):
    courses_data = [
        # foundational / intro
        ("CSCI 16100", "Introduction to Computer Science I", 3, 100, None, "Introduction to computing and programming."),
        ("CSCI 16200", "Introduction to Computer Science II", 3, 100, None, "Continuation of introductory programming."),
        ("CSCI 23000", "Data Structures", 3, 200, "Systems", "Data organization and common abstract data types."),
        ("CSCI 24000", "Discrete Mathematical Structures", 3, 200, "Systems", "Logic, sets, relations, functions, and proof techniques."),
        ("CSCI 26500", "Computer Architecture", 3, 200, "Systems", "Machine organization and low-level architecture concepts."),
        ("CSCI 27000", "Systems Programming", 3, 200, "Systems", "Programming close to the operating system and memory model."),
        ("CSCI 30000", "Professional Practice in Computing", 1, 300, "Systems", "Professional topics, ethics, and communication."),
        ("CSCI 30100", "Introduction to Algorithms", 3, 300, "Systems", "Algorithm design, analysis, and problem-solving techniques."),

        # software / systems
        ("CSCI 33200", "Object-Oriented Programming", 3, 300, "Systems", "Object-oriented design and implementation."),
        ("CSCI 34000", "Software Engineering", 3, 300, "Systems", "Software lifecycle, requirements, testing, and design."),
        ("CSCI 36200", "Operating Systems", 3, 300, "Systems", "Processes, memory, scheduling, and concurrency."),
        ("CSCI 37500", "Computer Graphics", 3, 300, "Systems", "Graphics pipeline and rendering principles."),
        ("CSCI 43500", "Multimedia Information Systems", 3, 400, "Systems", "Storage, retrieval, and processing of multimedia information."),
        ("CSCI 44200", "Database Systems", 3, 400, "Data Science", "Relational design, SQL, normalization, and transactions."),
        ("CSCI 45500", "Computer Security", 3, 400, "Networks", "Security principles, threats, and defensive mechanisms."),
        ("CSCI 46000", "Programming Languages", 3, 400, "Systems", "Language paradigms, semantics, and implementation concepts."),
        ("CSCI 46500", "Compiler Construction", 3, 400, "Systems", "Lexing, parsing, semantic analysis, and code generation."),

        # data / AI
        ("CSCI 38100", "Introduction to the Analysis of Algorithms", 3, 300, "Systems", "Asymptotic analysis and advanced algorithmic techniques."),
        ("CSCI 40300", "Introduction to Artificial Intelligence", 3, 400, "AI", "Search, reasoning, knowledge representation, and intelligent agents."),
        ("CSCI 41300", "Web Search", 3, 400, "Data Science", "Search engines, indexing, ranking, and retrieval."),
        ("CSCI 41600", "Data Mining", 3, 400, "Data Science", "Pattern discovery, clustering, classification, and association analysis."),
        ("CSCI 43100", "Machine Learning", 3, 400, "AI", "Supervised and unsupervised learning methods."),
        ("CSCI 43800", "Human-Computer Interaction", 3, 400, "Systems", "Interaction design, prototyping, and usability."),
        ("CSCI 44000", "Large-Scale Data Analytics", 3, 400, "Data Science", "Distributed data processing and scalable analytics."),
        ("CSCI 45200", "Intro to Computer Networks", 3, 400, "Networks", "Network layers, routing, protocols, and communication."),
        ("CSCI 47300", "Web Information Search and Management", 3, 400, "Data Science", "Web-scale information retrieval and management."),
        ("CSCI 47500", "Natural Language Processing", 3, 400, "AI", "Computational processing of human language."),
        ("CSCI 48300", "Introduction to the Theory of Computation", 3, 400, "Systems", "Automata, computability, and formal languages."),
        ("CSCI 48900", "Applied Data Science", 3, 400, "Data Science", "Applied workflows in data science projects."),
        ("CSCI 49000", "Senior Project", 3, 400, "Systems", "Capstone design and implementation project."),

        # network / distributed / advanced
        ("CSCI 49400", "Cloud Computing", 3, 400, "Networks", "Virtualization, distributed systems, and cloud platforms."),
        ("CSCI 49500", "Capstone Project", 3, 400, "Systems", "Comprehensive team-based CS capstone."),
        ("CSCI 49800", "Special Topics in Computer Science", 3, 400, None, "Selected current topics in computer science."),
        ("CSCI 51500", "Numerical Methods for Computer Science", 3, 500, "Data Science", "Numerical computation methods used in CS applications."),
        ("CSCI 52000", "Advanced Operating Systems", 3, 500, "Systems", "Distributed, parallel, and advanced operating system concepts."),
        ("CSCI 52500", "Computer Networks II", 3, 500, "Networks", "Advanced network design and protocol topics."),
        ("CSCI 53000", "Advanced Algorithms", 3, 500, "Systems", "Advanced algorithmic design and optimization."),
        ("CSCI 54100", "Advanced Database Systems", 3, 500, "Data Science", "Query optimization, distributed databases, and advanced storage."),
        ("CSCI 54500", "Information Assurance and Security", 3, 500, "Networks", "Security policy, assurance, and risk management."),
        ("CSCI 55000", "Distributed Systems", 3, 500, "Networks", "Communication, consistency, replication, and fault tolerance."),
    ]

    course_objects = []
    for code, title, credits, level, track_name, description in courses_data:
        track_id = track_ids.get(track_name) if track_name else None
        course_objects.append(
            models.Course(
                course_code=code,
                course_title=title,
                description=description,
                credits=credits,
                level=level,
                default_track_id=track_id,
                is_active=True
            )
        )
    
    db.add_all(course_objects)
    db.commit()

    return {course.course_code: course.course_id for course in db.query(models.Course).all()}


def seed_prerequisite_rules(db, course_ids):
    prereq_data = {
        "CSCI 16200": "CSCI 16100",
        "CSCI 23000": "CSCI 16200",
        "CSCI 24000": "CSCI 16200",
        "CSCI 26500": "CSCI 16200",
        "CSCI 27000": "CSCI 23000 AND CSCI 26500",
        "CSCI 30000": "CSCI 23000",
        "CSCI 30100": "CSCI 23000 AND CSCI 24000",
        "CSCI 33200": "CSCI 23000",
        "CSCI 34000": "CSCI 23000",
        "CSCI 36200": "CSCI 27000 AND CSCI 30100",
        "CSCI 37500": "CSCI 23000",
        "CSCI 38100": "CSCI 30100",
        "CSCI 40300": "CSCI 30100",
        "CSCI 41300": "CSCI 30100 AND CSCI 44200",
        "CSCI 41600": "CSCI 30100 AND CSCI 44200",
        "CSCI 43100": "CSCI 30100 AND (CSCI 40300 OR CSCI 41600)",
        "CSCI 43500": "CSCI 23000",
        "CSCI 43800": "CSCI 34000",
        "CSCI 44000": "CSCI 41600 OR CSCI 44200",
        "CSCI 44200": "CSCI 23000",
        "CSCI 45200": "CSCI 27000",
        "CSCI 45500": "CSCI 45200",
        "CSCI 46000": "CSCI 30100",
        "CSCI 46500": "CSCI 46000 AND CSCI 30100",
        "CSCI 47300": "CSCI 41300 OR CSCI 41600",
        "CSCI 47500": "CSCI 40300 OR CSCI 43100",
        "CSCI 48300": "CSCI 24000 AND CSCI 30100",
        "CSCI 48900": "CSCI 41600",
        "CSCI 49000": "CSCI 34000",
        "CSCI 49400": "CSCI 45200 OR CSCI 36200",
        "CSCI 49500": "CSCI 34000 AND CSCI 30100",
        "CSCI 49800": "CSCI 30100",
        "CSCI 51500": "CSCI 30100",
        "CSCI 52000": "CSCI 36200",
        "CSCI 52500": "CSCI 45200",
        "CSCI 53000": "CSCI 38100",
        "CSCI 54100": "CSCI 44200",
        "CSCI 54500": "CSCI 45500",
        "CSCI 55000": "CSCI 36200 AND CSCI 45200",
    }

    rule_objects = []
    for course_code, expr in prereq_data.items():
        rule_objects.append(
            models.PrerequisiteRule(
                course_id=course_ids[course_code],
                rule_expression=expr,
                notes=None
            )
        )

    db.add_all(rule_objects)
    db.commit()


def seed_sections_and_meetings(db, course_ids, term_ids):
    section_specs = [
        # Fall 2026
        ("CSCI 16100", "Fall 2026", "001", "Dr. Evans", 60, 48, 0, "In-Person", [("M", "09:00", "10:15", "SL", "100"), ("W", "09:00", "10:15", "SL", "100")]),
        ("CSCI 16200", "Fall 2026", "001", "Dr. Kim", 55, 50, 0, "In-Person", [("T", "10:30", "11:45", "IT", "201"), ("R", "10:30", "11:45", "IT", "201")]),
        ("CSCI 23000", "Fall 2026", "001", "Dr. Patel", 50, 49, 0, "In-Person", [("M", "10:30", "11:45", "IT", "152"), ("W", "10:30", "11:45", "IT", "152")]),
        ("CSCI 24000", "Fall 2026", "001", "Dr. Moore", 45, 42, 0, "In-Person", [("T", "09:00", "10:15", "LD", "110"), ("R", "09:00", "10:15", "LD", "110")]),
        ("CSCI 26500", "Fall 2026", "001", "Dr. Singh", 40, 38, 0, "In-Person", [("M", "13:00", "14:15", "SL", "220"), ("W", "13:00", "14:15", "SL", "220")]),
        ("CSCI 27000", "Fall 2026", "001", "Dr. Turner", 35, 34, 0, "In-Person", [("T", "13:00", "14:15", "IT", "205"), ("R", "13:00", "14:15", "IT", "205")]),
        ("CSCI 30000", "Fall 2026", "001", "Prof. White", 80, 45, 0, "Hybrid", [("F", "10:00", "10:50", "CA", "101")]),
        ("CSCI 30100", "Fall 2026", "001", "Dr. Lopez", 40, 39, 0, "In-Person", [("M", "14:30", "15:45", "IT", "210"), ("W", "14:30", "15:45", "IT", "210")]),
        ("CSCI 33200", "Fall 2026", "001", "Dr. Brown", 35, 28, 0, "In-Person", [("T", "14:30", "15:45", "IT", "310"), ("R", "14:30", "15:45", "IT", "310")]),
        ("CSCI 34000", "Fall 2026", "001", "Dr. Scott", 40, 36, 0, "In-Person", [("M", "16:00", "17:15", "IT", "315"), ("W", "16:00", "17:15", "IT", "315")]),
        ("CSCI 36200", "Fall 2026", "001", "Dr. Hall", 30, 30, 4, "In-Person", [("T", "16:00", "17:15", "IT", "320"), ("R", "16:00", "17:15", "IT", "320")]),
        ("CSCI 40300", "Fall 2026", "001", "Dr. Shah", 35, 33, 0, "In-Person", [("M", "12:00", "13:15", "IT", "330"), ("W", "12:00", "13:15", "IT", "330")]),
        ("CSCI 41600", "Fall 2026", "001", "Dr. Green", 35, 31, 0, "In-Person", [("T", "12:00", "13:15", "IT", "331"), ("R", "12:00", "13:15", "IT", "331")]),
        ("CSCI 43100", "Fall 2026", "001", "Dr. Rao", 30, 29, 0, "In-Person", [("M", "09:00", "10:15", "IT", "340"), ("W", "09:00", "10:15", "IT", "340")]),
        ("CSCI 44200", "Fall 2026", "001", "Dr. Chen", 40, 37, 0, "In-Person", [("T", "10:30", "11:45", "IT", "350"), ("R", "10:30", "11:45", "IT", "350")]),
        ("CSCI 45200", "Fall 2026", "001", "Dr. Brooks", 35, 35, 2, "In-Person", [("M", "10:30", "11:45", "IT", "360"), ("W", "10:30", "11:45", "IT", "360")]),
        ("CSCI 45500", "Fall 2026", "001", "Dr. Reed", 30, 30, 5, "In-Person", [("T", "09:00", "10:15", "IT", "361"), ("R", "09:00", "10:15", "IT", "361")]),
        ("CSCI 48900", "Fall 2026", "001", "Dr. Davis", 25, 22, 0, "In-Person", [("M", "14:30", "15:45", "IT", "370"), ("W", "14:30", "15:45", "IT", "370")]),
        ("CSCI 49500", "Fall 2026", "001", "Dr. Carter", 25, 24, 0, "Hybrid", [("F", "13:00", "15:30", "IT", "400")]),

        # Spring 2027
        ("CSCI 23000", "Spring 2027", "001", "Dr. Patel", 50, 43, 0, "In-Person", [("M", "09:00", "10:15", "IT", "152"), ("W", "09:00", "10:15", "IT", "152")]),
        ("CSCI 24000", "Spring 2027", "001", "Dr. Moore", 45, 40, 0, "In-Person", [("T", "10:30", "11:45", "LD", "110"), ("R", "10:30", "11:45", "LD", "110")]),
        ("CSCI 26500", "Spring 2027", "001", "Dr. Singh", 40, 35, 0, "In-Person", [("M", "12:00", "13:15", "SL", "220"), ("W", "12:00", "13:15", "SL", "220")]),
        ("CSCI 27000", "Spring 2027", "001", "Dr. Turner", 35, 30, 0, "In-Person", [("T", "13:00", "14:15", "IT", "205"), ("R", "13:00", "14:15", "IT", "205")]),
        ("CSCI 30100", "Spring 2027", "001", "Dr. Lopez", 40, 34, 0, "In-Person", [("M", "13:00", "14:15", "IT", "210"), ("W", "13:00", "14:15", "IT", "210")]),
        ("CSCI 34000", "Spring 2027", "001", "Dr. Scott", 40, 32, 0, "In-Person", [("T", "14:30", "15:45", "IT", "315"), ("R", "14:30", "15:45", "IT", "315")]),
        ("CSCI 36200", "Spring 2027", "001", "Dr. Hall", 30, 28, 0, "In-Person", [("M", "16:00", "17:15", "IT", "320"), ("W", "16:00", "17:15", "IT", "320")]),
        ("CSCI 41300", "Spring 2027", "001", "Dr. Nelson", 30, 24, 0, "In-Person", [("T", "12:00", "13:15", "IT", "330"), ("R", "12:00", "13:15", "IT", "330")]),
        ("CSCI 41600", "Spring 2027", "001", "Dr. Green", 35, 30, 0, "In-Person", [("M", "10:30", "11:45", "IT", "331"), ("W", "10:30", "11:45", "IT", "331")]),
        ("CSCI 43500", "Spring 2027", "001", "Dr. Adams", 30, 21, 0, "In-Person", [("T", "16:00", "17:15", "IT", "340"), ("R", "16:00", "17:15", "IT", "340")]),
        ("CSCI 43800", "Spring 2027", "001", "Dr. Baker", 30, 18, 0, "In-Person", [("M", "12:00", "13:15", "IT", "345"), ("W", "12:00", "13:15", "IT", "345")]),
        ("CSCI 44000", "Spring 2027", "001", "Dr. Young", 30, 20, 0, "Hybrid", [("T", "09:00", "10:15", "IT", "350"), ("R", "09:00", "10:15", "IT", "350")]),
        ("CSCI 45200", "Spring 2027", "001", "Dr. Brooks", 35, 33, 0, "In-Person", [("M", "14:30", "15:45", "IT", "360"), ("W", "14:30", "15:45", "IT", "360")]),
        ("CSCI 46000", "Spring 2027", "001", "Dr. Price", 25, 19, 0, "In-Person", [("T", "10:30", "11:45", "IT", "365"), ("R", "10:30", "11:45", "IT", "365")]),
        ("CSCI 47300", "Spring 2027", "001", "Dr. Nelson", 25, 17, 0, "In-Person", [("M", "09:00", "10:15", "IT", "370"), ("W", "09:00", "10:15", "IT", "370")]),
        ("CSCI 47500", "Spring 2027", "001", "Dr. Rao", 25, 16, 0, "In-Person", [("T", "14:30", "15:45", "IT", "372"), ("R", "14:30", "15:45", "IT", "372")]),
        ("CSCI 48300", "Spring 2027", "001", "Dr. Lewis", 30, 22, 0, "In-Person", [("M", "10:30", "11:45", "IT", "375"), ("W", "10:30", "11:45", "IT", "375")]),
        ("CSCI 48900", "Spring 2027", "001", "Dr. Davis", 25, 18, 0, "In-Person", [("T", "12:00", "13:15", "IT", "380"), ("R", "12:00", "13:15", "IT", "380")]),
        ("CSCI 49400", "Spring 2027", "001", "Dr. Kumar", 25, 20, 0, "In-Person", [("M", "16:00", "17:15", "IT", "385"), ("W", "16:00", "17:15", "IT", "385")]),
        ("CSCI 55000", "Spring 2027", "001", "Dr. Kumar", 20, 18, 0, "In-Person", [("T", "16:00", "17:15", "IT", "390"), ("R", "16:00", "17:15", "IT", "390")]),
    ]

    section_map = {}

    for course_code, term_name, section_number, instructor, capacity, enrolled, waitlist, mode, meetings in section_specs:
        section = models.CourseSection(
            course_id=course_ids[course_code],
            term_id=term_ids[term_name],
            section_number=section_number,
            instructor_name=instructor,
            capacity=capacity,
            enrolled_count=enrolled,
            waitlist_count=waitlist,
            delivery_mode=mode
        )
        db.add(section)
        db.flush()

        section_key = f"{course_code}-{term_name}-{section_number}"
        section_map[section_key] = section.section_id

        for day, start_str, end_str, building, room in meetings:
            start_hour, start_min = map(int, start_str.split(":"))
            end_hour, end_min = map(int, end_str.split(":"))

            db.add(
                models.SectionMeeting(
                    section_id=section.section_id,
                    day_of_week=day,
                    start_time=time(start_hour, start_min),
                    end_time=time(end_hour, end_min),
                    building=building,
                    room=room
                )
            )

    db.commit()
    return section_map


def seed_student_history(db, user_map, student_map, course_ids, track_ids, term_ids):
    diya_student_id = student_map[user_map["diya@example.com"]]
    alex_student_id = student_map[user_map["alex@example.com"]]

    diya = db.query(models.Student).filter_by(student_id=diya_student_id).first()
    alex = db.query(models.Student).filter_by(student_id=alex_student_id).first()

    diya.preferred_track_id = track_ids["AI"]
    alex.preferred_track_id = track_ids["Systems"]

    completed_records = [
        models.StudentCompletedCourse(
            student_id=diya_student_id,
            course_id=course_ids["CSCI 16100"],
            term_id=term_ids["Fall 2026"],
            grade="A",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=diya_student_id,
            course_id=course_ids["CSCI 16200"],
            term_id=term_ids["Fall 2026"],
            grade="A-",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=diya_student_id,
            course_id=course_ids["CSCI 23000"],
            term_id=term_ids["Fall 2026"],
            grade="B+",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=diya_student_id,
            course_id=course_ids["CSCI 24000"],
            term_id=term_ids["Fall 2026"],
            grade="A",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=diya_student_id,
            course_id=course_ids["CSCI 30100"],
            term_id=term_ids["Spring 2027"],
            grade=None,
            status="in_progress"
        ),
        models.StudentCompletedCourse(
            student_id=alex_student_id,
            course_id=course_ids["CSCI 16100"],
            term_id=term_ids["Fall 2026"],
            grade="B",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=alex_student_id,
            course_id=course_ids["CSCI 16200"],
            term_id=term_ids["Fall 2026"],
            grade="B+",
            status="completed"
        ),
        models.StudentCompletedCourse(
            student_id=alex_student_id,
            course_id=course_ids["CSCI 23000"],
            term_id=term_ids["Spring 2027"],
            grade=None,
            status="in_progress"
        ),
    ]

    db.add_all(completed_records)
    db.commit()


def seed_student_plans(db, user_map, student_map, term_ids, section_map):
    diya_student_id = student_map[user_map["diya@example.com"]]

    plan = models.StudentPlan(
        student_id=diya_student_id,
        term_id=term_ids["Spring 2027"],
        plan_name="Diya Spring 2027 Draft Plan",
        total_credits=12
    )
    db.add(plan)
    db.flush()

    selected_sections = [
        "CSCI 34000-Spring 2027-001",
        "CSCI 41600-Spring 2027-001",
        "CSCI 43500-Spring 2027-001",
        "CSCI 47300-Spring 2027-001",
    ]

    for section_key in selected_sections:
        db.add(
            models.StudentPlanCourse(
                plan_id=plan.plan_id,
                section_id=section_map[section_key],
                is_locked=False
            )
        )

    db.commit()


def seed_watchlists_and_alerts(db, user_map, student_map, section_map):
    diya_student_id = student_map[user_map["diya@example.com"]]

    watchlist_entries = [
        models.Watchlist(
            student_id=diya_student_id,
            section_id=section_map["CSCI 36200-Fall 2026-001"],
            is_active=True
        ),
        models.Watchlist(
            student_id=diya_student_id,
            section_id=section_map["CSCI 45500-Fall 2026-001"],
            is_active=True
        ),
    ]

    db.add_all(watchlist_entries)
    db.flush()

    alerts = [
        models.QuotaAlert(
            watchlist_id=watchlist_entries[0].watchlist_id,
            alert_message="A seat opened in CSCI 36200 section 001.",
            available_seats=1,
            is_read=False
        ),
        models.QuotaAlert(
            watchlist_id=watchlist_entries[1].watchlist_id,
            alert_message="A seat opened in CSCI 45500 section 001.",
            available_seats=1,
            is_read=False
        ),
    ]

    db.add_all(alerts)
    db.commit()


def main():
    db = SessionLocal()

    try:
        clear_tables(db)

        track_ids = seed_tracks(db)
        term_ids = seed_terms(db)
        user_map, student_map, admin_map = seed_users(db)
        course_ids = seed_courses(db, track_ids)
        seed_prerequisite_rules(db, course_ids)
        section_map = seed_sections_and_meetings(db, course_ids, term_ids)
        seed_student_history(db, user_map, student_map, course_ids, track_ids, term_ids)
        seed_student_plans(db, user_map, student_map, term_ids, section_map)
        seed_watchlists_and_alerts(db, user_map, student_map, section_map)

        print("Database seeded successfully.")

    except Exception as e:
        db.rollback()
        print("Error while seeding database:", e)

    finally:
        db.close()


if __name__ == "__main__":
    main()