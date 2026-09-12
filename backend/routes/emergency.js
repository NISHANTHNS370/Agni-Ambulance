const express = require('express');
const router = express.Router();
const { readDB, writeDB, newCaseId } = require('../db');
const { requireAuth } = require('../middleware');

/**
 * POST /api/emergency
 * Creates a new emergency case: driver selects hospital + patient case type
 * + age band + drink status + accident area + an optional free-text
 * additional command, then hits "Connect and start the Ambulance Route".
 * The case is persisted immediately (so it survives a refresh / server
 * restart) and is what the Location page + the demo hospital-facing screen
 * both read from.
 */
router.post('/', requireAuth, (req, res) => {
  const { hospitalId, patientCase, patientAge, drinkStatus, accidentArea, additionalCommand } = req.body;

  if (!hospitalId || !patientCase) {
    return res.status(400).json({ error: 'Please select a hospital and a patient case type.' });
  }

  const db = readDB();
  const hospital = db.hospitals.find((h) => h.hospitalId === hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Selected hospital was not found.' });

  const caseRecord = {
    caseId: newCaseId(),
    ambulanceId: req.session.ambulanceId,
    hospital,
    patientCase,
    patientAge: patientAge || '',
    drinkStatus: drinkStatus || 'no',
    accidentArea: accidentArea || '',
    additionalCommand: additionalCommand || '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    completedAt: null,
    distanceKm: null,
  };

  db.emergencyCases.push(caseRecord);
  writeDB(db);

  res.json({ ok: true, case: caseRecord });
});

/** GET /api/emergency/active — the driver's current in-progress case, if any. */
router.get('/active', requireAuth, (req, res) => {
  const db = readDB();
  const active = db.emergencyCases
    .filter((c) => c.ambulanceId === req.session.ambulanceId && c.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  res.json(active || null);
});

/** POST /api/emergency/:caseId/complete — closes the trip and updates driver stats. */
router.post('/:caseId/complete', requireAuth, (req, res) => {
  const { distanceKm } = req.body;
  const db = readDB();
  const caseRecord = db.emergencyCases.find(
    (c) => c.caseId === req.params.caseId && c.ambulanceId === req.session.ambulanceId
  );
  if (!caseRecord) return res.status(404).json({ error: 'Case not found.' });

  caseRecord.status = 'COMPLETED';
  caseRecord.completedAt = new Date().toISOString();
  caseRecord.distanceKm = Number(distanceKm) || 0;

  const driver = db.drivers[req.session.ambulanceId];
  driver.stats.totalCases += 1;
  driver.stats.kmTraveled += caseRecord.distanceKm;

  writeDB(db);
  res.json({ ok: true, case: caseRecord, stats: driver.stats });
});

/** GET /api/emergency/history — every past case for the logged-in driver. */
router.get('/history/list', requireAuth, (req, res) => {
  const db = readDB();
  const history = db.emergencyCases
    .filter((c) => c.ambulanceId === req.session.ambulanceId && c.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  res.json(history);
});

/**
 * GET /api/emergency/hospital-view/:caseId
 * NOT session-protected on purpose: this simulates the receiving hospital's
 * own screen (a different physical device with no ambulance login) polling
 * for the live case details the driver just sent, per the wireframe request
 * that trip data "should show on the hospital's screen too."
 */
router.get('/hospital-view/:caseId', (req, res) => {
  const db = readDB();
  const caseRecord = db.emergencyCases.find((c) => c.caseId === req.params.caseId);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found.' });
  res.json(caseRecord);
});

module.exports = router;
