const express = require('express');
const router = express.Router();
const { readDB } = require('../db');
const { requireAuth } = require('../middleware');

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.use(requireAuth);

/**
 * GET /api/hospitals?search=&lat=&lng=
 * Returns the full Chennai + Thiruvallur hospital directory. If lat/lng
 * (driver's current position) are supplied, each entry gets a computed
 * `distanceKm` so the UI can show "12.4 km away" without another API call.
 */
router.get('/', (req, res) => {
  const db = readDB();
  const { search, lat, lng } = req.query;

  let list = db.hospitals;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((h) => h.name.toLowerCase().includes(q) || h.area.toLowerCase().includes(q));
  }

  if (lat && lng) {
    list = list.map((h) => ({
      ...h,
      distanceKm: Math.round(haversineKm(parseFloat(lat), parseFloat(lng), h.lat, h.lng) * 10) / 10,
    }));
  }

  res.json(list);
});

router.get('/:hospitalId', (req, res) => {
  const db = readDB();
  const hospital = db.hospitals.find((h) => h.hospitalId === req.params.hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json(hospital);
});

module.exports = router;
