# 🧠 CandidateAI — AI-Powered Candidate Evaluation System

A production-ready system that automates candidate screening, interview analysis, and ranking using AI/ML. The system ingests resumes (PDF/DOCX) and video interviews (MP4/MOV), runs them through LLM-powered analysis pipelines, and produces recruiter-friendly dashboards and exportable reports.

---

## ⚡ Quick Start (Docker Compose)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your OpenAI API key and database credentials

# 2. Start all services
docker-compose up --build

# 3. Access the app
#    Frontend: http://localhost:3000
#    Backend API: http://localhost:8000/api/docs
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind + ShadCN)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │
│  │Dashboard │ │Candidates│ │ Rankings │ │ AI Search  │   │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────────┐
│  Backend (FastAPI)                                       │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐   │
│  │  Auth   │ │ Services │ │   AI     │ │ Repositories│   │
│  │  JWT    │ │  Layer   │ │ Pipeline │ │   Layer     │   │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘   │
│                               │                          │
│  ┌────────────────────────────▼──────────────────────┐   │
│  │  AI Services                                      │   │
│  │  • OpenAI GPT / Gemini (Resume + Interview LLM)   │   │
│  │  • Whisper (Speech-to-Text)                       │   │
│  │  • Sentence Transformers (Embeddings)             │   │
│  │  • Scikit-learn (Clustering)                      │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│  PostgreSQL Database                                     │
│  Users | Candidates | Resumes | Interviews | Scores      │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
CC/
├── backend/
│   ├── app/
│   │   ├── ai/           # AI/ML pipeline layer
│   │   ├── api/routes/   # FastAPI route handlers
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── repositories/ # Data access layer
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Security, file handling, PDF generation
│   │   ├── config.py     # Pydantic BaseSettings
│   │   ├── database.py   # Async SQLAlchemy engine
│   │   └── main.py       # FastAPI application factory
│   ├── alembic/          # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, dashboard, candidate components
│   │   ├── context/      # Auth context
│   │   ├── lib/          # API client, utilities, constants
│   │   ├── pages/        # Dashboard, Candidates, Rankings, etc.
│   │   └── index.css     # Design system (dark theme, glassmorphism)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## 🔑 Core Features

| Module | Description |
|--------|-------------|
| **Resume Analysis** | Upload PDF/DOCX → Extract text → LLM analysis → Skills, experience, scoring |
| **Interview Analysis** | Upload video → Extract audio → Whisper transcription → LLM evaluation |
| **Candidate Ranking** | Weighted composite scoring → Automatic ranking → Recommendations |
| **AI Search** | Natural language query → LLM parses → SQL + Semantic search |
| **Report Generation** | LLM-generated reports → PDF/DOCX export |
| **Authentication** | JWT tokens, role-based access control |

---

## 🛠️ Local & Docker Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows

# Install lightweight core dependencies (fast ~80MB download)
pip install -r requirements.txt

# (Optional) Install local PyTorch & local offline Whisper model if needed:
# pip install -r requirements-ml.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your settings (e.g. OPENAI_API_KEY)

# Start the backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a recruiter account |
| `POST` | `/api/auth/login` | Login and receive JWT tokens |
| `GET` | `/api/candidates` | List candidates (paginated, filterable) |
| `POST` | `/api/candidates` | Create a new candidate |
| `GET` | `/api/candidates/{id}` | Get candidate details with analysis |
| `POST` | `/api/resumes/upload/{candidate_id}` | Upload and analyze a resume |
| `POST` | `/api/interviews/upload/{candidate_id}` | Upload and analyze a video interview |
| `GET` | `/api/rankings` | Get candidate leaderboard |
| `POST` | `/api/rankings/recalculate` | Recalculate rankings with custom weights |
| `POST` | `/api/search` | Natural language candidate search |
| `POST` | `/api/reports/generate/{candidate_id}` | Generate evaluation report |
| `GET` | `/api/reports/{id}/download` | Download report (PDF/DOCX) |

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `JWT_SECRET_KEY` | Secret for JWT signing | *Required* |
| `LLM_PROVIDER` | `openai` or `gemini` | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | *Required if using OpenAI* |
| `GEMINI_API_KEY` | Google Gemini API key | *Required if using Gemini* |
| `WHISPER_MODE` | `api` (OpenAI API) or `local` | `api` |
| `EMBEDDING_MODEL` | Sentence Transformers model | `all-MiniLM-L6-v2` |

---

## 📝 License

MIT License — see LICENSE file for details.
