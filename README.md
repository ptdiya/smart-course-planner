# PathWise: Course Selection and Planning System

## Overview

PathWise is a full-stack academic planning system designed to help students build valid course schedules while making informed decisions about their academic path.

Unlike traditional systems that only block invalid actions, PathWise provides real-time validation with explanations and guidance, helping users understand why a course cannot be selected and what steps they can take to resolve it.

This system is fully deployed and accessible online, allowing real-time interaction without requiring local setup.

---

## Live Demo

**Frontend (User Interface):**  
https://smart-course-planner-sandy.vercel.app  

**Backend API (Swagger Docs):**  
https://pathwise-backend-iyks.onrender.com/docs  

**Note:** The backend is hosted on a free-tier service (Render), so the first request may take up to 30–50 seconds due to cold start behavior.

---

## Tech Stack

- Frontend: React (Vite), JavaScript, CSS  
- Backend: FastAPI (Python)  
- Database: PostgreSQL (Supabase - hosted)  

### Deployment
- Frontend: Vercel  
- Backend: Render  
- Database: Supabase PostgreSQL  

The deployed system follows a full-stack architecture where the React frontend communicates with a FastAPI backend, which in turn interacts with a PostgreSQL database hosted on Supabase.

---

## Key Features

- Scheduling Assistant with real-time validation  
- Academic Progress tracking with requirement groups  
- Admin interface for managing courses, terms, and users  
- Explainable prerequisite checking and constraint validation  
- User-specific data handling and planning workflows  

---

## Demo Credentials

### Student Account
- Username: `student`  
- Password: `student123`  

### Admin Account
- Username: `admin`  
- Password: `admin123`  

---

## How to Use

1. Log in using the provided student or admin credentials  
2. As a student, use the Scheduling Assistant to add and validate courses  
3. Submit a schedule to see it reflected in Academic Progress  
4. As an admin, manage terms, courses, and user accounts  

---

## Local Setup and Installation

### 1. Clone Repository

    git clone https://github.com/ptdiya/smart-course-planner.git
    cd smart-course-planner

---

### 2. Backend Setup

    pip install -r requirements.txt
    uvicorn app.main:app --reload

Backend runs at:  
http://127.0.0.1:8000  

---

### 3. Frontend Setup

    cd frontend
    npm install
    npm run dev

Frontend runs at:  
http://localhost:5173  

---

### 4. Database Setup

- Ensure PostgreSQL is running locally  
- Create the database  
- Configure the `DATABASE_URL` if needed  
- Run seed scripts to populate initial data  

---

## Notes

- The deployed version uses a hosted PostgreSQL database (Supabase), while local development uses a separate local PostgreSQL instance  
- Local and deployed environments may have different datasets depending on seeding and usage  
- The system supports full scheduling workflows including validation, recommendations, and admin management  

---

## Project Context

This project was developed as part of a Computer Science Capstone course. It is designed to simulate a real-world academic planning system with both student-facing and administrative functionality, along with a deployed full-stack architecture.