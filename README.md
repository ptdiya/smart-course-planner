# PathWise: Course Selection and Planning System

## Overview
PathWise is a full-stack academic planning system designed to help students build valid course schedules while making informed decisions about their academic path.

Unlike traditional systems that only block invalid actions, PathWise provides real-time validation with explanations and guidance, helping users understand why a course cannot be selected and what to do next.

---

## Tech Stack

- Frontend: React (Vite), JavaScript, CSS  
- Backend: FastAPI (Python)  
- Database: PostgreSQL  

---

## Key Features

- Scheduling Assistant with real-time validation  
- Academic Progress tracking  
- Admin interface for managing courses, terms, and users  
- Path guidance with explanations for invalid selections  
- User-specific data handling  

---

## Setup and Installation

### 1. Clone Repository
```bash
git clone https://github.com/ptdiya/smart-course-planner.git
cd smart-course-planner
```

### 2. Backend Setup
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:  
http://127.0.0.1:8000

---

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:  
http://localhost:5173

---

### 4. Database Setup

- Ensure PostgreSQL is running  
- Create the database  
- Configure connection if needed  
- Run seed scripts if provided  

---

## Demo Credentials

### Student Account
- Username: `student`  
- Password: `student123`  

### Admin Account
- Username: `admin`  
- Password: `admin123`
