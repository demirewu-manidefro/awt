require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// ─── Passport (must be required after dotenv) ───────────────────
const passport = require('./config/passport');

// ─── Rate Limiters ──────────────────────────────────────────────
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Global Rate Limiting ────────────────────────────────────────
app.use(globalLimiter);

// ─── Body & Cookie Parsing ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Session (required by Passport, even though we use JWT) ─────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 5 * 60 * 1000, // 5 minutes — only for OAuth handshake
  },
}));

// ─── Passport Initialization ─────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth System API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/sessions', require('./routes/session.routes'));

// ─── 404 Handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  // Passport/OAuth errors
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API base:    http://localhost:${PORT}/api`);
  console.log(`❤️  Health:      http://localhost:${PORT}/health`);
});

module.exports = app;
