# INTERVIA

## AI-Powered Mock Interview System for Technical Assessment

INTERVIA is a web-based AI-powered mock interview platform designed to simulate technical interviews and provide automated evaluation of candidate responses.

The system combines a React frontend with a FastAPI backend and uses AI-based answer evaluation, adaptive technical questioning, resume intelligence, voice interaction, camera support, interview timing, and performance analytics.

---

## 🚀 Project Overview

Technical interview preparation often lacks realistic interview environments, structured evaluation, and personalized questioning.

INTERVIA addresses this by providing an interactive mock interview experience where candidates can:

- Register and log in
- Select a technical skill
- Upload a resume
- Receive personalized interview questions
- Answer questions using voice or text
- Use microphone and camera interaction
- Receive AI-generated evaluation and feedback
- Complete a structured 20-question interview
- View interview scores and performance results

The project is designed as a practical full-stack AI application demonstrating frontend development, backend API development, database integration, AI integration, resume processing, and real-time browser capabilities.

---

## ✨ Key Features

### 🔐 Authentication

- Candidate signup and login
- User information stored in the backend database
- Persistent authentication state using browser local storage

### 🎯 Skill-Based Interviews

INTERVIA currently supports technical interview preparation for:

- Python
- Java
- JavaScript

Questions are selected according to the candidate's selected technical skill.

### 🧠 Adaptive Questioning

The technical interview includes adaptive question selection based on difficulty levels.

The system can progress through:

- Easier questions
- Same-level questions
- Harder questions

This allows the interview experience to become more dynamic instead of relying on a completely static sequence.

### 📄 Resume Intelligence

Candidates can upload their resume in:

- PDF
- DOCX

The system extracts resume content and identifies relevant technical information such as:

- Skills
- Projects
- Experience

Resume information can then be used to generate personalized interview questions.

### 🤖 AI Answer Evaluation

Candidate responses are evaluated using an AI-powered evaluation service.

The evaluation produces:

- Numerical score
- Feedback
- Performance assessment

This allows candidates to understand both their result and areas where their answer can be improved.

### 🎤 Voice Interview

INTERVIA supports browser-based voice interaction using Web Speech APIs.

The system can:

- Read interview questions aloud
- Capture spoken candidate answers
- Convert speech to text
- Detect speech completion
- Automatically submit an answer after a period of silence

### 📷 Camera Support

The interview interface supports browser camera access to provide a more realistic interview environment.

The candidate can enable camera functionality during an interview session.

### ⏱️ Timed Interview

The interview is structured around a total interview duration of:

**20 minutes**

Each question has a:

**60-second time limit**

The backend also validates the overall interview duration.

### 📝 Structured 20-Question Interview

The interview consists of exactly 20 questions:

| Section | Questions | Purpose |
|---|---:|---|
| Technical / Adaptive | 1–12 | Skill-specific technical assessment |
| Programming / Problem Solving | 13–16 | Coding and problem-solving ability |
| Aptitude / Logical Reasoning | 17–20 | Logical and analytical reasoning |

This provides a balanced technical assessment rather than focusing exclusively on theoretical questions.

### 📊 Performance Results

After completing an interview, the system provides performance information including:

- Individual question scores
- AI feedback
- Average performance
- Overall performance classification

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────────┐
                    │        Candidate         │
                    │                          │
                    │  Browser / Web Interface │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTP / REST API
                                 ▼
                    ┌──────────────────────────┐
                    │      React Frontend      │
                    │                          │
                    │  • Authentication        │
                    │  • Interview UI          │
                    │  • Voice Interaction     │
                    │  • Camera Support        │
                    │  • Timer                 │
                    │  • Results               │
                    └────────────┬─────────────┘
                                 │
                                 │ Axios
                                 ▼
                    ┌──────────────────────────┐
                    │      FastAPI Backend     │
                    │                          │
                    │  • Authentication        │
                    │  • Candidate Management  │
                    │  • Interview Management  │
                    │  • Resume Processing     │
                    │  • AI Evaluation         │
                    │  • Analytics             │
                    └───────┬─────────┬────────┘
                            │         │
                ┌───────────┘         └────────────┐
                ▼                                  ▼
       ┌──────────────────┐              ┌──────────────────┐
       │ SQLite Database  │              │   AI Service     │
       │                  │              │                  │
       │ • Users          │              │ Answer Evaluation│
       │ • Candidates     │              │ Question Support │
       │ • Interviews     │              └──────────────────┘
       │ • Sessions       │
       │ • Resumes        │
       └──────────────────┘

                            │
                            ▼
                 ┌──────────────────────┐
                 │ Resume Intelligence   │
                 │                      │
                 │ PDF / DOCX Extraction│
                 │ Skill Detection      │
                 │ Project Detection     │
                 │ Experience Detection │
                 └──────────────────────┘