# User Panel — E-Consultation Platform

Public platform where citizens read draft legislation from the Ministry of Corporate Affairs and
submit feedback. Each comment is analysed for sentiment by an ML model and shown to
officials in the Admin Panel.

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix), React Router
**Backend:** Node.js, Express, PostgreSQL (Neon), Twilio Verify (SMS OTP), Google TTS, Helmet, express-rate-limit
**ML:** FastAPI sentiment model (`../models-new`)

## Architecture

```
Browser (React) ──► Backend-UserPanel (Express) ──► PostgreSQL
                                   │──► Twilio Verify (OTP SMS)
                                   │──► FastAPI (sentiment)
                                   └──► Google TTS (section audio)
```

## Folder structure

```
UserPanel/
├── Frontend-UserPanel/
│   ├── public/                     # Static files (logo, public notice PDF)
│   └── src/
│       ├── main.jsx                # React entry
│       ├── App.jsx                 # Routes
│       ├── config/constants.js     # API base URL, logo path
│       ├── services/api.js         # All backend calls (OTP, submit, summary)
│       ├── pages/
│       │   ├── EConsultationLanding.jsx
│       │   ├── ConsultationListing.jsx
│       │   ├── FilteredConsultation.jsx
│       │   ├── NotFound.jsx
│       │   └── documents/          # One page per consultation document
│       │       ├── MdpFirmsConsultation.jsx      (/document-details)
│       │       ├── DigitalCompetitionBill.jsx    (/document-details2)
│       │       └── CompaniesAmendmentBill.jsx    (/document-details3)
│       ├── components/
│       │   ├── layout/             # Header, Footer, Breadcrumb
│       │   ├── modals/CommentModal.jsx   # Details form -> (OTP) -> submit
│       │   └── ui/                 # shadcn/ui primitives
│       ├── hooks/use-toast.js
│       └── lib/utils.js
└── Backend-UserPanel/              # See Backend-UserPanel/README.md
```

## Feedback submission flow

1. Citizen writes a comment on a document page and clicks **Submit**.
2. `CommentModal` collects name, email, phone, ID (Aadhaar/PAN) and stakeholder type, validated in the browser.
3. **Submit** → `POST /api/submit-comment` → the backend validates the data, runs sentiment analysis,
   masks the ID number and stores the comment.

> OTP phone verification (Twilio) is built but switched off. Enable it with `OTP_ENABLED=true` (backend)
> and `VITE_OTP_ENABLED=true` (frontend); the modal then adds a Send OTP → Verify step.

## Quick Start

### Backend
```bash
cd UserPanel/Backend-UserPanel
npm install
cp .env.sample .env      # DATABASE_URL, FASTAPI_URL
npm run dev              # http://localhost:5046
```

### Frontend
```bash
cd UserPanel/Frontend-UserPanel
npm install
echo "VITE_API_URL=http://localhost:5046" > .env
npm run dev              # http://localhost:8080
```

## Available scripts

**Frontend:** `npm run dev` | `npm run build` | `npm run lint` | `npm run preview`
**Backend:** `npm run dev` | `npm start` | `npm run migrate`

## Features

- **Browse consultations** with search and date filters
- **Document access:** read, download and print the public notice PDF
- **Multilingual summaries** (English, Hindi, Spanish, Tamil) with text-to-speech
- **Feedback submission** with server-side sentiment analysis (optional OTP verification)
- **Security:** rate limiting, strict validation, masked ID storage, security headers

## License

Smart India Hackathon 2025 — Ministry of Corporate Affairs
