const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { readDB, writeDB } = require('../db');
const { requireAuth } = require('../middleware');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.session.ambulanceId}-${file.fieldname}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

router.use(requireAuth);

/* ------------------------------- PROFILE ------------------------------- */

router.get('/profile', (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];
  res.json({ ambulanceId: driver.ambulanceId, ...driver.profile });
});

router.post('/profile', upload.single('photo'), (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];

  const { name, email, mobile, phone, address, aadharNumber, experience, licenceDetails } = req.body;
  driver.profile = {
    ...driver.profile,
    name: name ?? driver.profile.name,
    email: email ?? driver.profile.email,
    mobile: mobile ?? driver.profile.mobile,
    phone: phone ?? driver.profile.phone,
    address: address ?? driver.profile.address,
    aadharNumber: aadharNumber ?? driver.profile.aadharNumber,
    experience: experience ?? driver.profile.experience,
    licenceDetails: licenceDetails ?? driver.profile.licenceDetails,
  };
  if (req.file) {
    driver.profile.photoPath = `/uploads/${req.file.filename}`;
  }

  writeDB(db);
  res.json({ ok: true, profile: driver.profile });
});

/* ------------------------------- VEHICLE ------------------------------- */

router.get('/vehicle', (req, res) => {
  const db = readDB();
  res.json(db.drivers[req.session.ambulanceId].vehicle);
});

router.post('/vehicle', upload.single('rcBook'), (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];

  const fields = [
    'name', 'insuranceDate', 'fcDate', 'lastServiceDate', 'wheelAirCondition',
    'backupWheel', 'toolKit', 'fuelType', 'medicalKit', 'oxygenCylinder',
    'airValves', 'emergencyTools',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) driver.vehicle[f] = req.body[f];
  }
  if (req.file) driver.vehicle.rcBookPath = `/uploads/${req.file.filename}`;

  writeDB(db);
  res.json({ ok: true, vehicle: driver.vehicle });
});

/* -------------------------------- DRONE -------------------------------- */

router.get('/drone', (req, res) => {
  const db = readDB();
  res.json(db.drivers[req.session.ambulanceId].drone);
});

router.post('/drone', upload.single('dronePhoto'), (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];

  const fields = [
    'name', 'type', 'speedLimit', 'loadingWeightMax', 'transmitterType',
    'batteryCondition', 'spareParts', 'organBox', 'controller', 'pilot',
    'testingLevel', 'gps',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) driver.drone[f] = req.body[f];
  }
  if (req.file) driver.drone.photoPath = `/uploads/${req.file.filename}`;

  writeDB(db);
  res.json({ ok: true, drone: driver.drone });
});

/* ------------------------------- SETTINGS ------------------------------- */

router.get('/settings', (req, res) => {
  const db = readDB();
  res.json(db.drivers[req.session.ambulanceId].settings);
});

router.post('/settings', (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];
  const { homeLat, homeLng, locationSharing } = req.body;

  if (homeLat !== undefined) driver.settings.homeLat = homeLat;
  if (homeLng !== undefined) driver.settings.homeLng = homeLng;
  if (locationSharing !== undefined) driver.settings.locationSharing = locationSharing;

  writeDB(db);
  res.json({ ok: true, settings: driver.settings });
});

module.exports = router;
