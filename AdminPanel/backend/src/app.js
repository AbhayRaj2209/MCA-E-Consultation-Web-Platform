const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const commentRoutes = require('./routes/comment.routes');
const analysisRoutes = require('./routes/analysis.routes');
const consultationRoutes = require('./routes/consultation.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Render/other hosts ek reverse proxy ke peeche chalate hain; rate limiting ko real client IP chahiye
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

app.use(helmet());
// API bearer tokens se protected hai (cookies nahi), isliye CORS open rakha hai
app.use(cors());
// New bills can carry a base64 attachment (PDF), so allow larger bodies than the 100 KB default
app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Har route par requireAuth alag se laga hai; sirf login/signup aur comment submission public hain
app.use('/api', authRoutes);
app.use('/api', commentRoutes);
app.use('/api', consultationRoutes);
app.use('/api', analysisRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
