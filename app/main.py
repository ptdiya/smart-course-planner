from fastapi import FastAPI
from app.db.database import engine
from app.db import models

from app.routes import plans, recommendations, roadmap, admins

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Course Selection and Quota Grabbing System",
    description="Backend API for course planning, prerequisite reasoning, and quota monitoring.",
    version="1.0.0"
)

app.include_router(plans.router)
app.include_router(recommendations.router)
app.include_router(roadmap.router)
app.include_router(admins.router)


@app.get("/")
def read_root():
    return {
        "message": "Course Selection and Quota Grabbing System API is running."
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}