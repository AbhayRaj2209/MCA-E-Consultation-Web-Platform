# MCA E-Consultation — User Panel Backend

Express API that lets citizens submit feedback on draft legislation. Every submission is
validated, analysed for sentiment by the FastAPI ML service, and stored in PostgreSQL (Neon).

> **OTP phone verification is built but currently switched off.** Turn it on with
> `OTP_ENABLED=true` here and `VITE_OTP_ENABLED=true` in the frontend (plus Twilio keys).

## Folder structure

```
Backend-UserPanel/
├── server.js                      # Entry point: loads .env and starts the server
├── src/
│   ├── app.js                     # Express app: security middleware, routes, error handling
│   ├── config/
│   │   └── db.js                  # PostgreSQL connection pool
│   ├── routes/                    # URL -> controller mapping (+ validation & rate limits)
│   │   ├── comment.routes.js
│   │   ├── otp.routes.js
│   │   └── document.routes.js
│   ├── controllers/               # Request handling logic
│   │   ├── comment.controller.js
│   │   ├── otp.controller.js
│   │   └── document.controller.js
│   ├── services/                  # External integrations
│   │   ├── otp.service.js         # Twilio Verify SMS OTP (or console mode for local dev)
│   │   └── sentiment.service.js   # FastAPI ML sentiment model
│   ├── models/
│   │   └── comment.model.js       # Database queries (parameterized)
│   ├── middleware/
│   │   ├── validate.js            # Input validation rules
│   │   ├── rateLimiters.js        # Per-IP rate limits
│   │   └── errorHandler.js        # Central error handler
│   ├── data/
│   │   └── documentSummaries.js   # Section-wise document summaries (EN/HI/ES/TA)
│   └── utils/
│       ├── AppError.js            # Error with a client-safe message
│       └── mask.js                # Masks Aadhaar/PAN and phone numbers
├── migrations/                    # SQL schema migrations
└── scripts/
    └── run-migration.js           # `npm run migrate`
```

## Request flow: submitting feedback

```
Frontend ──POST /api/submit-comment──► validate ► rate limit
          ► [verify OTP, if enabled] ► sentiment.service (FastAPI) ► mask ID ► comment.model (INSERT)

(OTP enabled only)
Frontend ──POST /api/otp/send──► validate ► rate limit ► otp.service ──► Twilio SMS
```

## Setup

```bash
npm install
cp .env.sample .env      # fill in DATABASE_URL, FASTAPI_URL
npm run dev              # development (nodemon)
npm start                # production
```

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/otp/send` | Send a 6-digit OTP (only when `OTP_ENABLED=true`) |
| POST | `/api/submit-comment` | Validate, analyse sentiment, store feedback |
| GET | `/api/documents/:id/summary?lang=en` | Section-wise summary with text-to-speech audio |
| GET | `/api/documents/:id/audio-proxy?u=` | Streams Google TTS audio (host allow-listed) |
| GET | `/health` | Health check |

### POST /api/otp/send
```json
{ "phone": "9876543210" }
```

### POST /api/submit-comment
```json
{
  "documentId": 1,
  "section": "Section 1",
  "commentData": "This is my detailed comment",
  "commenterName": "John Doe",
  "commenterEmail": "john@example.com",
  "commenterPhone": "9876543210",
  "commenterAddress": "123 Main St",
  "idType": "aadhar",
  "idNumber": "123456789012",
  "stakeholderType": "individual",
  "supportedDocFilename": "document.pdf",
  "otp": "123456"            // only when OTP is enabled
}
```

Response:
```json
{
  "success": true,
  "message": "Comment submitted successfully",
  "data": { "commentId": 1 },
  "sentiment": { "sentiment": "positive", "confidence": 0.92, "strong_opinion": false, "keywords": [] }
}
```

Comments are read by the Admin Panel backend; this service exposes no endpoint that returns citizen data.

## Security

- **OTP verification (switchable)** — Twilio Verify; 60 s resend cooldown, max 5 OTPs per number per hour, codes are single-use
- **Input validation** — strict formats for phone, email, Aadhaar/PAN, allowed stakeholder types, length limits
- **Data minimisation** — Aadhaar/PAN stored masked (`XXXXXXXX9012`); responses never echo personal data
- **Rate limiting** — global, OTP and submission limits per IP
- **Helmet** security headers, 2 MB request body limit (CORS is open: the API is public and uses no cookies)
- **Server-side sentiment only** — client cannot set its own sentiment
- **Parameterized SQL** — no SQL injection
- **Safe errors** — 5xx responses never leak internal details

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `PORT` | Server port (default 5046) |
| `NODE_ENV` | `development` / `production` |
| `FASTAPI_URL` | Sentiment model service URL |
| `OTP_ENABLED` | `true` to require OTP before submitting (default `false`) |
| `OTP_PROVIDER` | `twilio` (real SMS, default) or `console` (OTP printed in server log — local testing only) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify credentials |
| `TRUST_PROXY` | Number of reverse proxies in front of the server (Render = 1) |
| `RATE_LIMIT_MAX_REQUESTS` | Global requests per IP per 15 minutes (default 300) |

## Database

Table `bill_1_comments` — see `migrations/` for schema changes. Run `npm run migrate` to add the
sentiment columns (`confidence`, `strong_opinion`, `keywords`).
