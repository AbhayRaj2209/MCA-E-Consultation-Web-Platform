# Admin Panel - Saaransh

Admin dashboard for managing and analyzing public consultations, stakeholder feedback, and sentiment analysis.

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript, Vite, TailwindCSS, Shadcn/ui, React Query, Recharts  
**Backend:** Node.js, Express, PostgreSQL, dotenv

## 🚀 Quick Start

### Frontend Setup
```bash
cd AdminPanel/Frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

Run development server:
```bash
npm run dev  # http://localhost:5173
```

### Backend Setup
```bash
cd AdminPanel/backend
npm install
```

Create `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Run server:
```bash
npm start       # Production
npm run dev     # Development
```

## 📊 Features

- **Dashboard:** Real-time statistics, sentiment visualizations, engagement metrics
- **Consultation Management:** View responses, filter/search, stakeholder categorization
- **Analytics:** Sentiment analysis, trend tracking, word clouds, geographic distribution
- **Reports:** PDF export, custom filtering, automated scheduling
- **Authorization:** User management, role-based access control

## 📝 Available Scripts

**Frontend:** `npm run dev` | `npm run build` | `npm run lint`  
**Backend:** `npm start` | `npm run dev`

## 📄 License

Smart India Hackathon 2025 Initiative
