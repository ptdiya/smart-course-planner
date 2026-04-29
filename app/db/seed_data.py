from datetime import date, time

from sqlalchemy import text

from app.db.database import SessionLocal
from app.db import models


def clear_tables(db):
    db.execute(text("""
        TRUNCATE TABLE
            quota_alerts,
            watchlists,
            student_plan_courses,
            student_plans,
            student_completed_courses,
            section_meetings,
            course_sections,
            prerequisite_rules,
            track_requirement_groups,
            degree_requirement_options,
            degree_requirement_groups,
            students,
            admins,
            courses,
            terms,
            tracks,
            users
        RESTART IDENTITY CASCADE
    """))
    db.commit()


def seed_tracks(db):
    tracks = [
        models.Track(track_name="Artificial Intelligence", description="AI, machine learning, and intelligent systems."),
        models.Track(track_name="Data Science", description="Data mining, analytics, databases, and visualization."),
        models.Track(track_name="Systems / IT", description="Operating systems, networks, cloud, and security."),
        models.Track(track_name="Software Engineering / Web", description="Software design, web applications, and product delivery."),
    ]
    db.add_all(tracks)
    db.commit()
    return {track.track_name: track.track_id for track in db.query(models.Track).all()}


def seed_terms(db):
    terms = [
        models.Term(term_name="Spring 2026", start_date=date(2026, 1, 12), end_date=date(2026, 5, 2)),
        models.Term(term_name="Fall 2026", start_date=date(2026, 8, 24), end_date=date(2026, 12, 12)),
        models.Term(term_name="Spring 2027", start_date=date(2027, 1, 11), end_date=date(2027, 5, 1)),
    ]
    db.add_all(terms)
    db.commit()
    term_ids = {term.term_name: term.term_id for term in db.query(models.Term).all()}
    term_settings = {
        "Spring 2026": ("closed", "read-only", "closed"),
        "Fall 2026": ("open", "editable", "open"),
        "Spring 2027": ("draft", "not_open_yet", "not_open_yet"),
    }

    for term_name, (status, planning_mode, submission_window) in term_settings.items():
        db.add(models.TermSetting(
            term_id=term_ids[term_name],
            status=status,
            planning_mode=planning_mode,
            submission_window=submission_window,
        ))

    db.commit()
    return term_ids


def seed_users(db, track_ids):
    users = [
        models.User(full_name="Maya Patel", email="maya@example.com", password_hash="hashed_password_1", role="student"),
        models.User(full_name="Noah Kim", email="noah@example.com", password_hash="hashed_password_2", role="student"),
        models.User(full_name="Jordan Rivera", email="jordan@example.com", password_hash="hashed_password_3", role="student"),
        models.User(full_name="CS Department Admin", email="admin@example.com", password_hash="hashed_admin_password", role="admin"),
    ]
    db.add_all(users)
    db.commit()

    user_map = {user.email: user.user_id for user in db.query(models.User).all()}

    students = [
        models.Student(
            user_id=user_map["maya@example.com"],
            major="Computer Science",
            academic_year="Year 3",
            preferred_track_id=track_ids["Artificial Intelligence"],
            preferred_credit_load=15,
            max_credit_load=18,
        ),
        models.Student(
            user_id=user_map["noah@example.com"],
            major="Computer Science",
            academic_year="Year 1",
            preferred_track_id=track_ids["Software Engineering / Web"],
            preferred_credit_load=15,
            max_credit_load=18,
        ),
        models.Student(
            user_id=user_map["jordan@example.com"],
            major="Computer Science",
            academic_year="Year 4",
            preferred_track_id=track_ids["Systems / IT"],
            preferred_credit_load=12,
            max_credit_load=18,
        ),
    ]
    admins = [
        models.Admin(
            user_id=user_map["admin@example.com"],
            department_name="Computer Science",
            permission_level="full",
        )
    ]
    db.add_all(students + admins)
    db.commit()

    student_map = {student.user_id: student.student_id for student in db.query(models.Student).all()}
    admin_map = {admin.user_id: admin.admin_id for admin in db.query(models.Admin).all()}
    return user_map, student_map, admin_map


def seed_courses(db, track_ids):
    courses_data = [
        ("CSCI 16100", "Introduction to Computer Science I", 3, 100, None, "Algorithmic thinking and programming fundamentals."),
        ("CSCI 16200", "Introduction to Computer Science II", 3, 100, None, "Object-oriented programming and problem solving."),
        ("CSCI 23000", "Data Structures", 3, 200, None, "Lists, trees, graphs, hashing, and algorithmic tradeoffs."),
        ("CSCI 24000", "Discrete Mathematical Structures", 3, 200, None, "Logic, proof, sets, functions, relations, and combinatorics."),
        ("CSCI 26500", "Computer Organization", 3, 200, "Systems / IT", "Computer architecture, assembly, memory, and machine organization."),
        ("CSCI 27000", "Systems Programming", 3, 200, "Systems / IT", "C programming, processes, memory, and Unix systems."),
        ("CSCI 30000", "Professional Practice in Computing", 1, 300, None, "Ethics, communication, teamwork, and professional expectations."),
        ("CSCI 30100", "Algorithms", 3, 300, None, "Algorithm design, correctness, and complexity analysis."),
        ("CSCI 30700", "Software Engineering I", 3, 300, "Software Engineering / Web", "Requirements, design, testing, and team software delivery."),
        ("CSCI 33200", "Object-Oriented Software Design", 3, 300, "Software Engineering / Web", "Design patterns, interfaces, and maintainable object-oriented systems."),
        ("CSCI 34000", "Software Engineering", 3, 300, "Software Engineering / Web", "Software lifecycle, project management, testing, and quality."),
        ("CSCI 34800", "Information Systems", 3, 300, "Data Science", "Information systems, data modeling, SQL, and applied database usage."),
        ("CSCI 36200", "Operating Systems", 3, 300, "Systems / IT", "Processes, scheduling, memory management, file systems, and concurrency."),
        ("CSCI 37300", "Data Mining", 3, 300, "Data Science", "Classification, clustering, association rules, and model evaluation."),
        ("CSCI 37500", "Computer Graphics", 3, 300, "Software Engineering / Web", "Graphics pipeline, geometry, rendering, and interaction."),
        ("CSCI 39000", "Web Application Development", 3, 300, "Software Engineering / Web", "Frontend and backend development for practical web applications."),
        ("CSCI 40300", "Introduction to Artificial Intelligence", 3, 400, "Artificial Intelligence", "Search, planning, knowledge representation, and intelligent agents."),
        ("CSCI 41300", "Information Retrieval", 3, 400, "Data Science", "Indexing, ranking, search systems, and retrieval evaluation."),
        ("CSCI 41600", "Applied Data Mining", 3, 400, "Data Science", "End-to-end data mining workflows and applied predictive modeling."),
        ("CSCI 42000", "Computer Vision", 3, 400, "Artificial Intelligence", "Image processing, feature extraction, and visual recognition."),
        ("CSCI 43100", "Machine Learning", 3, 400, "Artificial Intelligence", "Supervised and unsupervised learning methods."),
        ("CSCI 43500", "Multimedia Information Systems", 3, 400, "Data Science", "Storage, retrieval, and analysis of multimedia content."),
        ("CSCI 43800", "Human-Computer Interaction", 3, 400, "Software Engineering / Web", "User research, prototyping, usability, and interaction design."),
        ("CSCI 44000", "Large-Scale Data Analytics", 3, 400, "Data Science", "Distributed data processing and scalable analytics."),
        ("CSCI 44200", "Database Systems", 3, 400, "Data Science", "Relational design, transactions, indexing, and query optimization."),
        ("CSCI 45200", "Computer Networks", 3, 400, "Systems / IT", "Network architecture, protocols, routing, and transport."),
        ("CSCI 45500", "Computer Security", 3, 400, "Systems / IT", "Threats, cryptography, secure systems, and defensive practices."),
        ("CSCI 46000", "Programming Languages", 3, 400, "Systems / IT", "Language paradigms, syntax, semantics, and implementation."),
        ("CSCI 46500", "Compiler Construction", 3, 400, "Systems / IT", "Lexing, parsing, type checking, and code generation."),
        ("CSCI 47100", "Advanced Artificial Intelligence", 3, 400, "Artificial Intelligence", "Reasoning, planning, and modern AI techniques."),
        ("CSCI 47300", "Web Search and Data Management", 3, 400, "Data Science", "Web-scale search, crawling, and information management."),
        ("CSCI 47500", "Natural Language Processing", 3, 400, "Artificial Intelligence", "Language models, parsing, classification, and text analytics."),
        ("CSCI 48300", "Theory of Computation", 3, 400, None, "Automata, computability, complexity, and formal languages."),
        ("CSCI 48900", "Applied Data Science", 3, 400, "Data Science", "Project-based analytics using real-world datasets."),
        ("CSCI 49000", "Senior Project", 3, 400, "Software Engineering / Web", "Capstone-style design and implementation project."),
        ("CSCI 49400", "Cloud Computing", 3, 400, "Systems / IT", "Virtualization, containers, cloud architecture, and distributed deployment."),
        ("CSCI 49500", "Capstone Project", 3, 400, "Software Engineering / Web", "Team-based senior capstone project."),
        ("CSCI 49800", "Special Topics in Computer Science", 3, 400, None, "Rotating advanced topics in computer science."),
        ("CSCI 52000", "Advanced Operating Systems", 3, 500, "Systems / IT", "Distributed and advanced operating system concepts."),
        ("CSCI 52500", "Computer Networks II", 3, 500, "Systems / IT", "Advanced network design and protocols."),
        ("CSCI 53000", "Advanced Algorithms", 3, 500, None, "Advanced algorithm design and optimization."),
        ("CSCI 54100", "Advanced Database Systems", 3, 500, "Data Science", "Distributed databases, query planning, and storage systems."),
        ("CSCI 55000", "Distributed Systems", 3, 500, "Systems / IT", "Replication, consistency, fault tolerance, and distributed coordination."),
        ("MATH 16500", "Calculus I", 4, 100, None, "Limits, derivatives, integrals, and applications."),
        ("MATH 16600", "Calculus II", 4, 100, None, "Integration techniques, sequences, series, and applications."),
        ("MATH 35100", "Elementary Linear Algebra", 3, 300, None, "Matrices, vector spaces, eigenvalues, and linear transformations."),
        ("STAT 35000", "Introduction to Statistics", 3, 300, None, "Probability, inference, regression, and statistical reasoning."),
        ("STAT 41600", "Probability", 3, 400, None, "Probability theory for computing and data science."),
        ("BIOL 11000", "Biology I with Lab", 4, 100, None, "Introductory biology with laboratory."),
        ("CHEM 11500", "General Chemistry I with Lab", 4, 100, None, "Chemical principles with laboratory."),
        ("PHYS 15200", "Mechanics with Lab", 4, 100, None, "Mechanics and laboratory for science and engineering."),
        ("ENGL 10600", "First-Year Composition", 3, 100, None, "Academic writing and research."),
        ("COMM 11400", "Fundamentals of Speech Communication", 3, 100, None, "Oral communication and presentation."),
        ("PHIL 11000", "Introduction to Ethics", 3, 100, None, "Ethical reasoning and philosophical traditions."),
        ("PSY 12000", "Elementary Psychology", 3, 100, None, "Psychological science and behavior."),
        ("ECON 25100", "Microeconomics", 3, 200, None, "Markets, incentives, firms, and consumers."),
    ]

    course_objects = []
    for code, title, credits, level, track_name, description in courses_data:
        course_objects.append(models.Course(
            course_code=code,
            course_title=title,
            description=description,
            credits=credits,
            level=level,
            default_track_id=track_ids.get(track_name) if track_name else None,
            is_active=True,
        ))

    db.add_all(course_objects)
    db.commit()
    return {course.course_code: course.course_id for course in db.query(models.Course).all()}


def seed_requirement_templates(db, course_ids, track_ids):
    groups = [
        ("Computer Science", "CS Major Core", "core", 27, 1),
        ("Computer Science", "Math and Statistics Requirements", "supporting", 14, 2),
        ("Computer Science", "General Education / Humanities", "flexible", 12, 3),
        ("Computer Science", "Lab Science", "flexible", 4, 4),
        ("Computer Science", "Supporting Elective", "flexible", 3, 5),
        ("Computer Science", "Upper-Level CS Credits", "flexible", 12, 6),
        ("Computer Science", "Advanced CS Elective", "flexible", 6, 7),
    ]

    group_ids = {}
    for major, name, group_type, credits, sort_order in groups:
        group = models.DegreeRequirementGroup(
            major=major,
            group_name=name,
            group_type=group_type,
            credits_required=credits,
            sort_order=sort_order,
        )
        db.add(group)
        db.flush()
        group_ids[name] = group.group_id

    options = {
        "CS Major Core": [
            "CSCI 16100", "CSCI 16200", "CSCI 23000", "CSCI 24000", "CSCI 26500",
            "CSCI 27000", "CSCI 30100", "CSCI 34000", "CSCI 44200", "CSCI 36200",
        ],
        "Math and Statistics Requirements": ["MATH 16500", "MATH 16600", "MATH 35100", "STAT 35000"],
        "General Education / Humanities": ["ENGL 10600", "COMM 11400", "PHIL 11000", "PSY 12000", "ECON 25100"],
        "Lab Science": ["BIOL 11000", "CHEM 11500", "PHYS 15200"],
        "Supporting Elective": ["STAT 41600", "MATH 35100", "ECON 25100"],
        "Upper-Level CS Credits": [
            "CSCI 40300", "CSCI 41600", "CSCI 43100", "CSCI 43800", "CSCI 45200",
            "CSCI 45500", "CSCI 47500", "CSCI 48900", "CSCI 49400", "CSCI 49800",
        ],
        "Advanced CS Elective": ["CSCI 42000", "CSCI 47100", "CSCI 47500", "CSCI 48900", "CSCI 49400"],
    }

    for group_name, course_codes in options.items():
        for course_code in course_codes:
            db.add(models.DegreeRequirementOption(
                group_id=group_ids[group_name],
                course_id=course_ids[course_code],
                requirement_label=course_code,
                credits=None,
                notes=None,
            ))

    track_groups = [
        ("Artificial Intelligence", "AI Track Required Courses", 9, 3, "Choose intro AI, machine learning, and one AI elective."),
        ("Artificial Intelligence", "AI Advanced Electives", 6, 2, "Choose from NLP, computer vision, advanced AI, or applied data science."),
        ("Data Science", "Data Science Track Required Courses", 9, 3, "Choose data mining, databases, and applied analytics."),
        ("Data Science", "Data Science Advanced Electives", 6, 2, "Choose from large-scale analytics, retrieval, visualization, or ML."),
        ("Systems / IT", "Systems / IT Required Courses", 9, 3, "Choose OS, networks, and security."),
        ("Systems / IT", "Systems / IT Advanced Electives", 6, 2, "Choose cloud, distributed systems, compilers, or advanced OS."),
        ("Software Engineering / Web", "Software/Web Required Courses", 9, 3, "Choose software engineering, web development, and databases."),
        ("Software Engineering / Web", "Software/Web Project Electives", 6, 2, "Choose HCI, senior project, capstone, or special topics."),
    ]

    for track_name, group_name, credits, min_courses, notes in track_groups:
        db.add(models.TrackRequirementGroup(
            track_id=track_ids[track_name],
            group_name=group_name,
            credits_required=credits,
            min_courses_required=min_courses,
            notes=notes,
        ))

    db.commit()


def seed_prerequisite_rules(db, course_ids):
    prereq_data = {
        "CSCI 16200": "CSCI 16100",
        "CSCI 23000": "CSCI 16200",
        "CSCI 24000": "CSCI 16200",
        "CSCI 26500": "CSCI 16200",
        "CSCI 27000": "CSCI 23000 AND CSCI 26500",
        "CSCI 30000": "CSCI 23000",
        "CSCI 30100": "CSCI 23000 AND CSCI 24000",
        "CSCI 30700": "CSCI 23000",
        "CSCI 33200": "CSCI 23000",
        "CSCI 34000": "CSCI 23000",
        "CSCI 34800": "CSCI 23000",
        "CSCI 36200": "CSCI 27000 AND CSCI 30100",
        "CSCI 37300": "CSCI 30100 AND STAT 35000",
        "CSCI 37500": "CSCI 23000",
        "CSCI 39000": "CSCI 23000",
        "CSCI 40300": "CSCI 30100",
        "CSCI 41300": "CSCI 30100 AND CSCI 44200",
        "CSCI 41600": "CSCI 30100 AND STAT 35000",
        "CSCI 42000": "CSCI 40300 AND MATH 35100",
        "CSCI 43100": "CSCI 41600 AND MATH 35100",
        "CSCI 43500": "CSCI 34800 OR CSCI 44200",
        "CSCI 43800": "CSCI 34000",
        "CSCI 44000": "CSCI 41600 OR CSCI 44200",
        "CSCI 44200": "CSCI 23000",
        "CSCI 45200": "CSCI 27000",
        "CSCI 45500": "CSCI 45200",
        "CSCI 46000": "CSCI 30100",
        "CSCI 46500": "CSCI 46000 AND CSCI 30100",
        "CSCI 47100": "CSCI 40300",
        "CSCI 47300": "CSCI 41300 OR CSCI 41600",
        "CSCI 47500": "CSCI 40300 AND CSCI 43100",
        "CSCI 48300": "CSCI 24000 AND CSCI 30100",
        "CSCI 48900": "CSCI 41600",
        "CSCI 49000": "CSCI 34000 AND CSCI 30100",
        "CSCI 49400": "CSCI 45200 OR CSCI 36200",
        "CSCI 49500": "CSCI 34000 AND CSCI 30100",
        "CSCI 49800": "CSCI 30100",
        "CSCI 52000": "CSCI 36200",
        "CSCI 52500": "CSCI 45200",
        "CSCI 53000": "CSCI 30100",
        "CSCI 54100": "CSCI 44200",
        "CSCI 55000": "CSCI 36200 AND CSCI 45200",
        "MATH 16600": "MATH 16500",
        "MATH 35100": "MATH 16600",
        "STAT 41600": "STAT 35000",
    }

    for course_code, expression in prereq_data.items():
        db.add(models.PrerequisiteRule(
            course_id=course_ids[course_code],
            rule_expression=expression,
            notes="Seeded degree progression prerequisite.",
        ))

    db.commit()


def parse_time(value):
    hour, minute = map(int, value.split(":"))
    return time(hour, minute)


def add_section(db, section_map, course_ids, term_ids, course_code, term_name, section_number,
                instructor, capacity, enrolled, waitlist, mode, meetings):
    section = models.CourseSection(
        course_id=course_ids[course_code],
        term_id=term_ids[term_name],
        section_number=section_number,
        instructor_name=instructor,
        capacity=capacity,
        enrolled_count=enrolled,
        waitlist_count=waitlist,
        delivery_mode=mode,
    )
    db.add(section)
    db.flush()
    section_map[f"{course_code}-{term_name}-{section_number}"] = section.section_id

    for day, start_value, end_value, building, room in meetings:
        db.add(models.SectionMeeting(
            section_id=section.section_id,
            day_of_week=day,
            start_time=parse_time(start_value),
            end_time=parse_time(end_value),
            building=building,
            room=room,
        ))


def seed_sections_and_meetings(db, course_ids, term_ids):
    section_map = {}
    fall_specs = [
        ("CSCI 16100", "001", "Dr. Evans", 60, 52, 0, "In-Person", [("M", "09:00", "10:15", "SL", "100"), ("W", "09:00", "10:15", "SL", "100")]),
        ("CSCI 16200", "001", "Dr. Kim", 55, 50, 0, "In-Person", [("T", "10:30", "11:45", "IT", "201"), ("R", "10:30", "11:45", "IT", "201")]),
        ("CSCI 23000", "001", "Dr. Patel", 50, 48, 0, "In-Person", [("M", "10:30", "11:45", "IT", "152"), ("W", "10:30", "11:45", "IT", "152")]),
        ("CSCI 24000", "001", "Dr. Moore", 45, 40, 0, "In-Person", [("T", "09:00", "10:15", "LD", "110"), ("R", "09:00", "10:15", "LD", "110")]),
        ("CSCI 26500", "001", "Dr. Singh", 40, 36, 0, "In-Person", [("M", "13:00", "14:15", "SL", "220"), ("W", "13:00", "14:15", "SL", "220")]),
        ("CSCI 27000", "001", "Dr. Turner", 35, 33, 0, "In-Person", [("T", "13:00", "14:15", "IT", "205"), ("R", "13:00", "14:15", "IT", "205")]),
        ("CSCI 30000", "001", "Prof. White", 80, 44, 0, "Hybrid", [("F", "10:00", "10:50", "CA", "101")]),
        ("CSCI 30100", "001", "Dr. Lopez", 40, 38, 0, "In-Person", [("M", "14:30", "15:45", "IT", "210"), ("W", "14:30", "15:45", "IT", "210")]),
        ("CSCI 30700", "001", "Dr. Martin", 34, 26, 0, "In-Person", [("T", "09:00", "10:15", "IT", "305"), ("R", "09:00", "10:15", "IT", "305")]),
        ("CSCI 30700", "002", "Dr. Martin", 30, 30, 5, "In-Person", [("M", "09:00", "10:15", "IT", "306"), ("W", "09:00", "10:15", "IT", "306")]),
        ("CSCI 33200", "001", "Dr. Brown", 35, 29, 0, "In-Person", [("T", "14:30", "15:45", "IT", "310"), ("R", "14:30", "15:45", "IT", "310")]),
        ("CSCI 34000", "001", "Dr. Scott", 40, 35, 0, "In-Person", [("M", "16:00", "17:15", "IT", "315"), ("W", "16:00", "17:15", "IT", "315")]),
        ("CSCI 34800", "001", "Dr. Chen", 38, 36, 0, "In-Person", [("T", "10:30", "11:45", "IT", "350"), ("R", "10:30", "11:45", "IT", "350")]),
        ("CSCI 34800", "002", "Dr. Chen", 32, 23, 0, "In-Person", [("M", "12:00", "13:15", "IT", "351"), ("W", "12:00", "13:15", "IT", "351")]),
        ("CSCI 36200", "001", "Dr. Hall", 34, 31, 0, "In-Person", [("M", "09:00", "10:15", "IT", "320"), ("W", "09:00", "10:15", "IT", "320")]),
        ("CSCI 37300", "001", "Dr. Green", 35, 32, 0, "In-Person", [("T", "12:00", "13:15", "IT", "331"), ("R", "12:00", "13:15", "IT", "331")]),
        ("CSCI 39000", "001", "Prof. Williams", 32, 25, 0, "In-Person", [("M", "12:00", "13:15", "IT", "212"), ("W", "12:00", "13:15", "IT", "212")]),
        ("CSCI 40300", "001", "Dr. Shah", 35, 31, 0, "In-Person", [("M", "09:00", "10:15", "IT", "330"), ("W", "09:00", "10:15", "IT", "330")]),
        ("CSCI 41600", "001", "Dr. Green", 35, 29, 0, "In-Person", [("T", "12:00", "13:15", "IT", "331"), ("R", "12:00", "13:15", "IT", "331")]),
        ("CSCI 42000", "001", "Dr. Iyer", 28, 25, 0, "In-Person", [("T", "09:00", "10:15", "IT", "333"), ("R", "09:00", "10:15", "IT", "333")]),
        ("CSCI 43100", "001", "Dr. Rao", 30, 27, 0, "In-Person", [("M", "10:30", "11:45", "IT", "340"), ("W", "10:30", "11:45", "IT", "340")]),
        ("CSCI 43800", "001", "Dr. Baker", 30, 22, 0, "In-Person", [("M", "13:30", "14:45", "IT", "345"), ("W", "13:30", "14:45", "IT", "345")]),
        ("CSCI 44000", "001", "Dr. Young", 30, 27, 0, "Hybrid", [("T", "16:00", "17:15", "IT", "350"), ("R", "16:00", "17:15", "IT", "350")]),
        ("CSCI 44200", "001", "Dr. Chen", 40, 37, 0, "In-Person", [("T", "10:30", "11:45", "IT", "350"), ("R", "10:30", "11:45", "IT", "350")]),
        ("CSCI 45200", "001", "Dr. Brooks", 35, 34, 0, "In-Person", [("M", "10:30", "11:45", "IT", "360"), ("W", "10:30", "11:45", "IT", "360")]),
        ("CSCI 45500", "001", "Dr. Reed", 30, 30, 4, "In-Person", [("T", "09:00", "10:15", "IT", "361"), ("R", "09:00", "10:15", "IT", "361")]),
        ("CSCI 47100", "001", "Dr. Ahmed", 28, 24, 0, "In-Person", [("F", "11:00", "13:30", "IT", "337")]),
        ("CSCI 47500", "001", "Dr. Rao", 25, 20, 0, "In-Person", [("T", "14:30", "15:45", "IT", "372"), ("R", "14:30", "15:45", "IT", "372")]),
        ("CSCI 48900", "001", "Dr. Davis", 25, 23, 0, "In-Person", [("M", "14:30", "15:45", "IT", "370"), ("W", "14:30", "15:45", "IT", "370")]),
        ("CSCI 49000", "001", "Dr. Carter", 25, 21, 0, "Hybrid", [("M", "13:30", "14:45", "IT", "400"), ("W", "13:30", "14:45", "IT", "400")]),
        ("CSCI 49400", "001", "Dr. Kumar", 25, 23, 0, "In-Person", [("F", "13:00", "15:30", "IT", "385")]),
        ("MATH 35100", "001", "Dr. Nguyen", 45, 41, 0, "In-Person", [("M", "11:00", "11:50", "LD", "210"), ("W", "11:00", "11:50", "LD", "210"), ("F", "11:00", "11:50", "LD", "210")]),
        ("STAT 35000", "001", "Dr. Lee", 50, 46, 0, "In-Person", [("T", "12:00", "13:15", "LD", "220"), ("R", "12:00", "13:15", "LD", "220")]),
        ("ENGL 10600", "001", "Prof. Clark", 24, 19, 0, "In-Person", [("M", "10:30", "11:45", "LA", "105"), ("W", "10:30", "11:45", "LA", "105")]),
        ("COMM 11400", "001", "Prof. Morgan", 28, 24, 0, "In-Person", [("T", "13:30", "14:45", "LA", "110"), ("R", "13:30", "14:45", "LA", "110")]),
        ("PHIL 11000", "001", "Prof. Adler", 35, 28, 0, "Online", [("F", "09:00", "09:50", "LA", "201")]),
    ]

    spring_2026_specs = [
        ("CSCI 16100", "001", "Dr. Evans", 60, 58, 0, "In-Person", [("M", "09:00", "10:15", "SL", "100"), ("W", "09:00", "10:15", "SL", "100")]),
        ("CSCI 16200", "001", "Dr. Kim", 55, 53, 0, "In-Person", [("T", "10:30", "11:45", "IT", "201"), ("R", "10:30", "11:45", "IT", "201")]),
        ("CSCI 23000", "001", "Dr. Patel", 50, 48, 0, "In-Person", [("M", "10:30", "11:45", "IT", "152"), ("W", "10:30", "11:45", "IT", "152")]),
        ("CSCI 24000", "001", "Dr. Moore", 45, 41, 0, "In-Person", [("T", "09:00", "10:15", "LD", "110"), ("R", "09:00", "10:15", "LD", "110")]),
        ("CSCI 30100", "001", "Dr. Lopez", 40, 38, 0, "In-Person", [("M", "14:30", "15:45", "IT", "210"), ("W", "14:30", "15:45", "IT", "210")]),
        ("CSCI 34000", "001", "Dr. Scott", 40, 36, 0, "In-Person", [("T", "14:30", "15:45", "IT", "315"), ("R", "14:30", "15:45", "IT", "315")]),
        ("MATH 16600", "001", "Dr. Nguyen", 50, 48, 0, "In-Person", [("M", "12:00", "12:50", "LD", "210"), ("W", "12:00", "12:50", "LD", "210"), ("F", "12:00", "12:50", "LD", "210")]),
    ]

    spring_2027_specs = [
        ("CSCI 27000", "001", "Dr. Turner", 35, 27, 0, "In-Person", [("T", "13:00", "14:15", "IT", "205"), ("R", "13:00", "14:15", "IT", "205")]),
        ("CSCI 30700", "001", "Dr. Martin", 34, 22, 0, "In-Person", [("M", "09:00", "10:15", "IT", "305"), ("W", "09:00", "10:15", "IT", "305")]),
        ("CSCI 36200", "001", "Dr. Hall", 34, 24, 0, "In-Person", [("T", "10:30", "11:45", "IT", "320"), ("R", "10:30", "11:45", "IT", "320")]),
        ("CSCI 40300", "001", "Dr. Shah", 35, 20, 0, "In-Person", [("M", "12:00", "13:15", "IT", "330"), ("W", "12:00", "13:15", "IT", "330")]),
        ("CSCI 41600", "001", "Dr. Green", 35, 25, 0, "In-Person", [("T", "12:00", "13:15", "IT", "331"), ("R", "12:00", "13:15", "IT", "331")]),
        ("CSCI 43100", "001", "Dr. Rao", 30, 18, 0, "In-Person", [("M", "10:30", "11:45", "IT", "340"), ("W", "10:30", "11:45", "IT", "340")]),
        ("CSCI 45200", "001", "Dr. Brooks", 35, 22, 0, "In-Person", [("M", "14:30", "15:45", "IT", "360"), ("W", "14:30", "15:45", "IT", "360")]),
        ("CSCI 47500", "001", "Dr. Rao", 25, 15, 0, "In-Person", [("T", "14:30", "15:45", "IT", "372"), ("R", "14:30", "15:45", "IT", "372")]),
        ("CSCI 49500", "001", "Dr. Carter", 25, 16, 0, "Hybrid", [("F", "13:00", "15:30", "IT", "400")]),
        ("MATH 35100", "001", "Dr. Nguyen", 45, 33, 0, "In-Person", [("M", "11:00", "11:50", "LD", "210"), ("W", "11:00", "11:50", "LD", "210"), ("F", "11:00", "11:50", "LD", "210")]),
    ]

    for spec in spring_2026_specs:
        add_section(db, section_map, course_ids, term_ids, spec[0], "Spring 2026", *spec[1:])
    for spec in fall_specs:
        add_section(db, section_map, course_ids, term_ids, spec[0], "Fall 2026", *spec[1:])
    for spec in spring_2027_specs:
        add_section(db, section_map, course_ids, term_ids, spec[0], "Spring 2027", *spec[1:])

    db.commit()
    return section_map


def seed_student_history(db, user_map, student_map, course_ids, term_ids):
    maya_student_id = student_map[user_map["maya@example.com"]]
    noah_student_id = student_map[user_map["noah@example.com"]]
    jordan_student_id = student_map[user_map["jordan@example.com"]]

    student_histories = {
        maya_student_id: [
            ("CSCI 16100", "Spring 2026", "A"),
            ("CSCI 16200", "Spring 2026", "A-"),
            ("CSCI 23000", "Spring 2026", "B+"),
            ("CSCI 24000", "Spring 2026", "A"),
            ("CSCI 26500", "Spring 2026", "B+"),
            ("CSCI 27000", "Spring 2026", "B"),
            ("CSCI 30000", "Spring 2026", "A"),
            ("CSCI 30100", "Spring 2026", "B+"),
            ("CSCI 34000", "Spring 2026", "A-"),
            ("CSCI 40300", "Spring 2026", "B+"),
            ("MATH 16500", "Spring 2026", "A-"),
            ("MATH 16600", "Spring 2026", "B+"),
            ("STAT 35000", "Spring 2026", "A-"),
        ],
        noah_student_id: [
            ("MATH 16500", "Spring 2026", "B"),
            ("ENGL 10600", "Spring 2026", "A-"),
        ],
        jordan_student_id: [
            ("CSCI 16100", "Spring 2026", "A"),
            ("CSCI 16200", "Spring 2026", "A"),
            ("CSCI 23000", "Spring 2026", "A-"),
            ("CSCI 24000", "Spring 2026", "B+"),
            ("CSCI 26500", "Spring 2026", "A-"),
            ("CSCI 27000", "Spring 2026", "B+"),
            ("CSCI 30000", "Spring 2026", "A"),
            ("CSCI 30100", "Spring 2026", "A-"),
            ("CSCI 34000", "Spring 2026", "B+"),
            ("CSCI 36200", "Spring 2026", "B"),
            ("CSCI 44200", "Spring 2026", "A-"),
            ("CSCI 45200", "Spring 2026", "B+"),
            ("CSCI 45500", "Spring 2026", "B"),
            ("MATH 16500", "Spring 2026", "A-"),
            ("MATH 16600", "Spring 2026", "B+"),
            ("MATH 35100", "Spring 2026", "B+"),
            ("STAT 35000", "Spring 2026", "A-"),
        ],
    }

    records = []
    for student_id, completed_courses in student_histories.items():
        for course_code, term_name, grade in completed_courses:
            records.append(models.StudentCompletedCourse(
                student_id=student_id,
                course_id=course_ids[course_code],
                term_id=term_ids[term_name],
                grade=grade,
                status="completed",
            ))

    db.add_all(records)
    db.commit()


def seed_student_plans(db, user_map, student_map, term_ids, section_map):
    jordan_student_id = student_map[user_map["jordan@example.com"]]

    plan = models.StudentPlan(
        student_id=jordan_student_id,
        term_id=term_ids["Fall 2026"],
        plan_name="Jordan Fall 2026 Submitted Schedule",
        status="submitted",
        total_credits=12,
    )
    db.add(plan)
    db.flush()

    for section_key in [
        "CSCI 49400-Fall 2026-001",
        "CSCI 49000-Fall 2026-001",
        "CSCI 43800-Fall 2026-001",
        "CSCI 44000-Fall 2026-001",
    ]:
        if section_key in section_map:
            db.add(models.StudentPlanCourse(
                plan_id=plan.plan_id,
                section_id=section_map[section_key],
                is_locked=False,
            ))

    db.commit()


def seed_watchlists_and_alerts(db, user_map, student_map, section_map):
    maya_student_id = student_map[user_map["maya@example.com"]]

    watchlist_entries = []
    for section_key in ["CSCI 45500-Fall 2026-001", "CSCI 43100-Fall 2026-001"]:
        watchlist_entries.append(models.Watchlist(
            student_id=maya_student_id,
            section_id=section_map[section_key],
            is_active=True,
        ))

    db.add_all(watchlist_entries)
    db.flush()

    alerts = [
        models.QuotaAlert(
            watchlist_id=watchlist_entries[0].watchlist_id,
            alert_message="A seat opened in CSCI 45500 section 001.",
            available_seats=1,
            is_read=False,
        ),
        models.QuotaAlert(
            watchlist_id=watchlist_entries[1].watchlist_id,
            alert_message="CSCI 43100 section 001 has low seats.",
            available_seats=3,
            is_read=False,
        ),
    ]
    db.add_all(alerts)
    db.commit()


def main():
    db = SessionLocal()

    try:
        models.Base.metadata.create_all(bind=db.get_bind())
        clear_tables(db)
        track_ids = seed_tracks(db)
        term_ids = seed_terms(db)
        user_map, student_map, admin_map = seed_users(db, track_ids)
        course_ids = seed_courses(db, track_ids)
        seed_requirement_templates(db, course_ids, track_ids)
        seed_prerequisite_rules(db, course_ids)
        section_map = seed_sections_and_meetings(db, course_ids, term_ids)
        seed_student_history(db, user_map, student_map, course_ids, term_ids)
        seed_student_plans(db, user_map, student_map, term_ids, section_map)
        seed_watchlists_and_alerts(db, user_map, student_map, section_map)
        print("Department-sized PathWise database seeded successfully.")

    except Exception as error:
        db.rollback()
        print("Error while seeding database:", error)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
