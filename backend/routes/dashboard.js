const express = require('express');
const router = express.Router();
const { readDB } = require('../db');
const { requireAuth } = require('../middleware');

router.use(requireAuth);

/**
 * GET /api/dashboard/stats
 * Everything the Dashboard page needs in one call: welcome name, lifetime
 * totals, and today's case types (grouped so the UI can show a quick
 * breakdown instead of a raw list).
 */
router.get('/stats', (req, res) => {
  const db = readDB();
  const driver = db.drivers[req.session.ambulanceId];

  const todayStr = new Date().toDateString();
  const todaysCases = db.emergencyCases.filter(
    (c) => c.ambulanceId === req.session.ambulanceId && new Date(c.createdAt).toDateString() === todayStr
  );

  const caseTypeCounts = {};
  for (const c of todaysCases) {
    caseTypeCounts[c.patientCase] = (caseTypeCounts[c.patientCase] || 0) + 1;
  }

  res.json({
    name: driver.profile.name || driver.ambulanceId,
    totalCases: driver.stats.totalCases,
    kmTraveled: driver.stats.kmTraveled,
    todayCaseCount: todaysCases.length,
    todayCaseTypes: Object.entries(caseTypeCounts).map(([type, count]) => ({ type, count })),
  });
});

module.exports = router;
