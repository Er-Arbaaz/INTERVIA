from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import Base, engine

from routes.candidate import router as candidate_router
from routes.interview import router as interview_router
from routes.resume import router as resume_router
from routes.auth import router as auth_router


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="AI-Powered Mock Interview System",
    version="1.0"
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# REGISTER ROUTERS
# =========================================================

app.include_router(candidate_router)
app.include_router(interview_router)
app.include_router(resume_router)
app.include_router(auth_router)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to AI-Powered Mock Interview System"
    }


# =========================================================
# ABOUT
# =========================================================

@app.get("/about")
def about():
    return {
        "project": "AI Mock Interview System",
        "developer": "Yusuf",
        "version": "1.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "Server Running Successfully"
    }