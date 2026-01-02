# User Panel - E-Consultation Platform

Public platform for citizens to participate in government consultations by viewing documents and submitting feedback.

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, TailwindCSS, Shadcn/ui, React Query, Supabase  
**Backend:** Node.js, Express, PostgreSQL, Twilio (OTP), Nodemailer, Google TTS

## 🚀 Quick Start

### Frontend Setup
```bash
cd UserPanel/Frontend-UserPanel
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

Run server:
```bash
npm run dev  # http://localhost:5173
```

### Backend Setup
```bash
cd UserPanel/Backend-UserPanel
npm install
```

Create `.env` file:
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
```

Run migrations & start:
```bash
psql -U postgres -d consultation_db -f migrations/20251205_add_ml_columns.sql
npm start       # Production
npm run dev     # Development
```

## 📊 Features

- **Browse Consultations:** View active consultations with filter/search
- **Document Access:** Read details, download materials
- **Comment Submission:** OTP-verified feedback with sentiment analysis
- **Accessibility:** Text-to-speech, mobile-responsive design

## 📝 Available Scripts

**Frontend:** `npm run dev` | `npm run build` | `npm run lint`  
**Backend:** `npm start` | `npm run dev`

## 📄 License

Smart India Hackathon 2025 - Ministry of Corporate Affairs
