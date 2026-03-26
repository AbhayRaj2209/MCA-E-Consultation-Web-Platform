# MCA E-Consultation Web Platform

Unified repository for the Smart India Hackathon 2025 / MCA E-Consultation project. It contains:
- **AdminPanel**: management + analytics dashboard.
- **UserPanel**: public consultation portal (document reading + comment submission).

This README describes architecture, setup, and usage for both modules.

---

## 🚀 Project Overview

The platform supports:
- Uploading and analyzing public consultation documents
- OTP-verified citizen feedback submission
- ML-assisted sentiment analysis and summarization
- Admin analytics (sentiment, stakeholder trends, wordclouds)
- Document-level audit and report generation

### Core capabilities
- multi-role user flows (public user, admin)
- secure comment lifecycle with CRUD endpoints
- rich UI components with responsive layout
- PostgreSQL database (Neon-compatible) for incremental data capture
- analytics endpoints for dashboards and charts

---

## 🗂️ Repository Structure

- `AdminPanel/`
  - `Frontend/`: React + TypeScript admin UI
  - `backend/`: Node.js + Express admin API
- `UserPanel/`
  - `Frontend-UserPanel/`: React + Vite user-facing app
  - `Backend-UserPanel/`: Node.js + Express user API

---

## 🛠️ Technology Stack

Shared:
- Node.js, Express
- PostgreSQL
- Tailwind CSS
- React (Vite base)

Admin:
- TypeScript
- Recharts
- React Query
- dashboards, charts, role management

User:
- OTP via Twilio
- Nodemailer
- TTS support (Google Text-to-Speech)
- document analysis and feedback forms

---

## 📦 Quick Start (Local)

### 1) Database

1. Start PostgreSQL (or use Neon). Create DB, user, password.
2. Apply migrations from `UserPanel/Backend-UserPanel/migrations`:
```bash
psql -U postgres -d consultation_db -f migrations/20251205_add_ml_columns.sql
psql -U postgres -d consultation_db -f migrations/20251207_drop_confidence_score.sql
```

---

### 2) UserPanel Backend

```bash
cd UserPanel/Backend-UserPanel
npm install
```

Create `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=consultation_db
DB_USER=postgres
DB_PASSWORD=your_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
ML_SERVICE_URL=http://localhost:5001
DATABASE_URL=postgres://postgres:your_password@localhost:5432/consultation_db
```

Run:
```bash
npm run dev     # development
npm start       # production
```

Available endpoints (selected):
- `POST /api/submit-comment`
- `GET /api/comments/:documentId`
- `GET /api/comments`
- `PUT /api/comments/:commentId`

---

### 3) UserPanel Frontend

```bash
cd UserPanel/Frontend-UserPanel
npm install
```

`.env`:
```env
VITE_API_URL=http://localhost:3000
```

Run:
```bash
npm run dev        # opens at http://localhost:5173
npm run build      # production build
```

---

### 4) AdminPanel Backend

```bash
cd AdminPanel/backend
npm install
```

`.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Run:
```bash
npm run dev
npm start
```

Endpoints (selected):
- `GET /health`
- `GET /api/recent-activity`
- `GET /api/comments/:bill`
- `POST /api/comments/:bill`
- `GET /api/sentiment/:bill`
- `GET /api/summaries/:bill`

---

### 5) AdminPanel Frontend

```bash
cd AdminPanel/Frontend
npm install
```

`.env`:
```env
VITE_API_URL=http://localhost:5000
```

Run:
```bash
npm run dev  # http://localhost:5173
```

---

## 🧩 Features Summary

### Public User Panel
- Browse active consultations
- Read document details and summaries
- Submit comments with OTP verification
- Sentiment analysis + summary generation
- File attachments for comments

### Admin Panel
- Dashboard analytics and KPIs
- Stakeholder and trend analysis
- Sentiment distribution, wordcloud, and export
- Document-level comment curation
- Role-based access and report generation

---

## 🧪 NPM Scripts

### Frontend (both panels)
- `npm run dev`
- `npm run build`
- `npm run lint`

### Backend (both panels)
- `npm run dev`
- `npm start`

---

## 🛡️ Recommendations

- Use environment-specific `.env` files and secrets manager for Twilio and DB credentials.
- Setup CI/CD with `npm run build` and test commands.
- Add integration tests for endpoints using Supertest and Jest.
- Add Swagger/OpenAPI docs for backend APIs.

---

## 📁 Important Files

- `UserPanel/Backend-UserPanel/models/commentsModel.js`
- `UserPanel/Backend-UserPanel/routes/comments.js`
- `AdminPanel/backend/index.js`
- `AdminPanel/Frontend/src/pages` (dashboard, trend analysis, sentiment)
- `UserPanel/Frontend-UserPanel/src/pages/DocumentDetails.jsx`

---

## 📝 Contribution

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/<name>`
3. Commit: `git commit -m "feat: ..."`
4. Push and open a PR.

Follow code style: lint with ESLint, format with Prettier.

---

## 🏷️ License

India Innovates 2026 / Municipal Corporation of Delhi.

---

## 📬 Contact

For issues or questions, open GitHub Issues in this repository or contact the project team.
