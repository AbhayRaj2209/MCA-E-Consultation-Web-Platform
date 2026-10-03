const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { globalLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');
const commentRoutes = require('./routes/comment.routes');
const otpRoutes = require('./routes/otp.routes');
const documentRoutes = require('./routes/document.routes');
const { OTP_ENABLED } = require('./services/otp.service');

const app = express();

// Render/other hosts ek reverse proxy ke peeche chalate hain; rate limiting ko real client IP chahiye
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

app.use(morgan('combined'));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Local machine ka frontend kisi bhi port pe ho (Vite 8080 busy hone par 8081 le leta hai)
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

if (allowedOrigins.length === 0) {
  console.warn('WARNING: CORS_ORIGIN is not set - allowing requests from any origin.');
}

app.use(cors({
  origin: (origin, callback) => {
    const allowed = !origin
      || allowedOrigins.length === 0
      || allowedOrigins.includes(origin)
      || LOCAL_ORIGIN.test(origin);
    if (!allowed) console.warn(`CORS blocked request from origin: ${origin}`);
    callback(null, allowed);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));

app.use('/api', commentRoutes);
if (OTP_ENABLED) app.use('/api', otpRoutes);
app.use('/api', documentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
