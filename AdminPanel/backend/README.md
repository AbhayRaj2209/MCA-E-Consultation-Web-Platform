# Saaransh Admin Backend

Express API for the admin dashboard, backed by Neon PostgreSQL, with email/password
authentication (bcrypt + JWT). Folder structure, API list and environment variables are
documented in [../README.md](../README.md).

```bash
npm install
cp .env.sample .env      # DATABASE_URL, JWT_SECRET, FASTAPI_URL
npm run dev              # or: npm start
```

Tables: `admin_users` (created automatically on start), `documents`,
`bill_1_comments`, `bill_2_comments`, `bill_3_comments`.
