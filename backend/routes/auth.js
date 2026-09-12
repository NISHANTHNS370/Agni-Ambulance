const express = require('express');
const router = express.Router();
const { readDB, writeDB, hashPassword, verifyPassword } = require('../db');

/**
 * POST /api/auth/register
 * Creates a brand-new Ambulance ID + password. Called once from the
 * "Create new Ambulance ID" tab on the login screen. Profile details
 * (name, vehicle, drone, etc.) are filled in afterwards on the Profile page.
 */
router.post('/register', (req, res) => {
  const { ambulanceId, password, confirmPassword } = req.body;

  if (!ambulanceId || !password) {
    return res.status(400).json({ error: 'Ambulance ID and password are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = readDB();
  if (db.drivers[ambulanceId]) {
    return res.status(409).json({ error: 'This Ambulance ID is already registered. Please login instead.' });
  }

  db.drivers[ambulanceId] = {
    ambulanceId,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    profile: { name: '', email: '', mobile: '', phone: '', address: '', aadharNumber: '', experience: '', licenceDetails: '', photoPath: '' },
    vehicle: { name: '', insuranceDate: '', fcDate: '', lastServiceDate: '', wheelAirCondition: '', backupWheel: '', toolKit: '', fuelType: '', medicalKit: '', oxygenCylinder: '', airValves: '', emergencyTools: '', rcBookPath: '' },
    drone: { name: '', type: '', speedLimit: '', loadingWeightMax: '', transmitterType: '', batteryCondition: '', spareParts: '', organBox: '', controller: '', pilot: '', testingLevel: '', gps: '', photoPath: '' },
    settings: { homeLat: null, homeLng: null, locationSharing: true },
    stats: { totalCases: 0, kmTraveled: 0 },
  };

  writeDB(db);
  res.json({ ok: true, message: 'Ambulance ID created. You can log in now.' });
});

/** POST /api/auth/login */
router.post('/login', (req, res) => {
  const { ambulanceId, password } = req.body;
  const db = readDB();
  const driver = db.drivers[ambulanceId];

  if (!driver || !verifyPassword(password || '', driver.passwordHash)) {
    return res.status(401).json({ error: 'Invalid Ambulance ID or password.' });
  }

  req.session.ambulanceId = ambulanceId;
  res.json({ ok: true, ambulanceId, name: driver.profile.name || ambulanceId });
});

/** POST /api/auth/logout */
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/** GET /api/auth/me — used by every protected page to check the session on load */
router.get('/me', (req, res) => {
  if (!req.session.ambulanceId) return res.status(401).json({ error: 'Not logged in' });
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];
  if (!driver) return res.status(401).json({ error: 'Session invalid' });
  res.json({ ambulanceId: driver.ambulanceId, name: driver.profile.name || driver.ambulanceId });
});

module.exports = router;
