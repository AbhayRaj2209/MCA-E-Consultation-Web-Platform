# Project Saaransh — MCA E-Consultation Platform

AI-powered e-consultation platform for the Ministry of Corporate Affairs (Smart India Hackathon 2025).
Citizens read draft legislation and submit feedback; officials see that feedback analysed by an ML
model — sentiment, summaries and word clouds — on an admin dashboard.

## Architecture

```
 Citizens                                          Officials
    │                                                  │
    ▼                                                  ▼
 UserPanel Frontend (React)                 AdminPanel Frontend (React + TS)
    │                                                  │
    ▼                                                  ▼
 UserPanel Backend (Express :5046)          AdminPanel Backend (Express :5000)
    │            │                                 │            │
    │            └──────────► ML Service ◄─────────┘            │
    │                   (FastAPI :8001)                         │
    │            sentiment + summarisation                      │
    └───────────────► PostgreSQL (Neon) ◄───────────────────────┘
```

## Repository layout

| Folder | What it is | Stack |
|--------|-----------|-------|
| [`UserPanel/`](UserPanel/README.md) | Public site: browse consultations, read documents (multilingual + text-to-speech), submit feedback | React, Vite, Tailwind · Node, Express |
| [`AdminPanel/`](AdminPanel/README.md) | Dashboard: consultation responses, sentiment charts, stakeholder & trend analytics, word clouds | React + TypeScript, Recharts · Node, Express |
| `models-new/` | ML API: sentiment (`cardiffnlp/twitter-roberta-base-sentiment`) and summarisation (`facebook/bart-large-cnn`) | Python, FastAPI, Hugging Face Transformers |

## How feedback flows

1. A citizen submits a comment on a document in the **User Panel**.
2. The backend validates it, calls the **ML service** `/predict` for sentiment, masks the ID number and stores it in **PostgreSQL**.
3. The **Admin Panel** reads the stored comments and shows sentiment distribution, summaries and trends.

## Running locally

Start the ML service first, then the two backends, then the frontends.

```bash
# 1. ML service
cd models-new
pip install fastapi uvicorn transformers torch emoji scikit-learn matplotlib seaborn
uvicorn app:app --port 8001

# 2. User Panel  (see UserPanel/README.md)
cd UserPanel/Backend-UserPanel && npm install && npm run dev
cd UserPanel/Frontend-UserPanel && npm install && npm run dev

# 3. Admin Panel (see AdminPanel/README.md)
cd AdminPanel/backend && npm install && npm run dev
cd AdminPanel/Frontend && npm install && npm run dev
```

Each backend needs a `.env` with `DATABASE_URL` (PostgreSQL) and `FASTAPI_URL=http://127.0.0.1:8001`;
each frontend needs `VITE_API_URL` pointing at its backend.

## Key features

- Multilingual document summaries (English, Hindi, Spanish, Tamil) with text-to-speech
- Transformer-based sentiment analysis and summarisation of every comment
- Admin analytics: sentiment distribution, stakeholder breakdown, trends, word clouds
- Secure submission: input validation, rate limiting, masked ID storage, optional OTP verification

## License

Smart India Hackathon 2025 — Ministry of Corporate Affairs
