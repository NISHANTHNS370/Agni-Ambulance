/**
 * Agni Ambulance — Backend Entry Point
 * -----------------------------------------------------------------------
 * Serves the static frontend (../frontend), exposes the JSON API under
 * /api/*, and hosts uploaded files (photos, RC book scans) under /uploads.
 * -----------------------------------------------------------------------
 */
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const hospitalRoutes = require('./routes/hospitals');
const emergencyRoutes = require('./routes/emergency');
const dashboardRoutes = require('./routes/dashboard');
const signalRoutes = require('./routes/signal');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'agni.sid',
    secret: process.env.SESSION_SECRET || 'agni-ambulance-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 8 * 60 * 60 * 1000, // 8 hour shift
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

// Uploaded photos / RC book scans
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/signal', signalRoutes);

// Frontend static files (login.html, dashboard.html, css/, js/, ...)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Any unknown non-API route falls back to the login page.
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(FRONTEND_DIR, 'login.html'));
});

app.listen(PORT, () => {
  console.log(`🔥 Agni Ambulance backend running at http://localhost:${PORT}`);
});
