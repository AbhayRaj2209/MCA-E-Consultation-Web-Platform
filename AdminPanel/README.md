# Admin Panel — Project Saaransh

Dashboard for MCA officials to review public consultation feedback: sentiment distribution,
AI-generated summaries, stakeholder and trend analytics, word clouds and PDF reports.
Officials sign up and sign in with email and password; every data API requires a valid login.

## Tech Stack

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Recharts, jsPDF
**Backend:** Node.js, Express, PostgreSQL (Neon), bcrypt password hashing, JWT sessions, Helmet, express-rate-limit

## Folder structure

```
AdminPanel/
├── backend/
│   ├── index.js                     # Entry point: loads .env, creates admin_users table, starts server
│   ├── migrations/001_create_admin_users.sql
│   └── src/
│       ├── app.js                   # Express app: middleware + routes
│       ├── config/
│       │   ├── db.js                # PostgreSQL pool
│       │   ├── auth.js              # JWT secret / expiry, allowed sign-up domains
│       │   └── bills.js             # Allow-list of bill tables (bill_1..bill_3)
│       ├── db/schema.js             # CREATE TABLE IF NOT EXISTS admin_users
│       ├── routes/                  # URL -> controller (+ auth, validation, rate limits)
│       │   ├── auth.routes.js
│       │   ├── comment.routes.js
│       │   ├── consultation.routes.js
│       │   └── analysis.routes.js
│       ├── controllers/             # Request handling
│       │   ├── auth.controller.js
│       │   ├── comment.controller.js
│       │   ├── consultation.controller.js
│       │   ├── document.controller.js
│       │   └── analysis.controller.js
│       ├── models/user.model.js     # admin_users queries
│       ├── services/
│       │   ├── sentiment.service.js # FastAPI sentiment model
│       │   └── summary.service.js   # Group summarisation model
│       ├── middleware/              # requireAuth, validation, rate limits, error handler
│       └── utils/validateInput.js   # Comment length / prompt-injection guard
└── Frontend/
    ├── public/                      # Logos, word-cloud images
    └── src/
        ├── App.tsx                  # Routes (protected + public)
        ├── lib/api.ts               # apiFetch: base URL + Bearer token + 401 handling
        ├── contexts/AuthContext.tsx # login, signup, logout, profile, change password
        ├── pages/                   # Dashboard, Consultations, ConsultationDetail, Trends,
        │                            # StakeholderAnalytics, ExportReports, Profile, Settings, AuthPage
        ├── components/              # Header, Sidebar, Layout, charts, modals, ui/ (shadcn)
        ├── data/mockData.ts         # Chart colours + word-cloud image paths
        └── hooks/, lib/
```

## Authentication

| Step | What happens |
|------|--------------|
| Sign up | `POST /api/auth/signup` — name, email, password (+ phone, designation, department, location). Password hashed with bcrypt; row stored in `admin_users`. |
| Sign in | `POST /api/auth/login` — email + password. Returns a signed JWT (8 h) and the user profile. |
| Requests | Frontend sends `Authorization: Bearer <token>`; `requireAuth` verifies it on every data route. |
| Profile | `GET/PUT /api/auth/me`, `PUT /api/auth/password` |
| Logout | Token removed from the browser; an expired token logs the user out automatically. |

Security details: generic "invalid email or password" message, constant-time check for unknown
emails, rate limits (10 logins / 15 min, 5 sign-ups / hour per IP), password rules
(8+ chars, letter + number), optional `ALLOWED_SIGNUP_DOMAINS` to restrict sign-up to official emails.

## API

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/signup`, `/api/auth/login` | Public |
| GET/PUT | `/api/auth/me`, PUT `/api/auth/password` | Login |
| GET | `/api/consultations`, `/api/documents`, `/api/recent-activity` | Login |
| GET | `/api/comments/:bill`, `/api/admin/comments` | Login |
| GET | `/api/sentiment/:bill`, `/api/summaries/:bill`, `/api/sections/:bill`, `/api/section-sentiments/:bill` | Login |
| POST | `/api/generate-overview/:bill`, `/api/documents` | Login |
| POST | `/api/submit-comment`, `/api/comments/:bill` | Public (rate limited) |

## Quick Start

### Backend
```bash
cd AdminPanel/backend
npm install
cp .env.sample .env      # DATABASE_URL, JWT_SECRET, FASTAPI_URL
npm run dev              # http://localhost:5000
```
The `admin_users` table is created automatically on first start.

### Frontend
```bash
cd AdminPanel/Frontend
npm install
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev              # http://localhost:8080
```
Open the app, choose **Create an account**, and sign in.

## Environment variables (backend)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | Long random string used to sign login tokens (**required in production**) |
| `JWT_EXPIRES_IN` | Session length, default `8h` |
| `ALLOWED_SIGNUP_DOMAINS` | Optional, e.g. `gov.in,nic.in` — restricts who can sign up |
| `FASTAPI_URL` | Sentiment model service |
| `GROUP_SUMMARY_URL` | Group summarisation model used by "Generate Overview" |
| `TRUST_PROXY` | Reverse proxies in front of the server (Render = 1) |

## License

Smart India Hackathon 2025 — Ministry of Corporate Affairs
