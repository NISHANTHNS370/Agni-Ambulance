/**
 * Agni Ambulance — lightweight JSON-file "database".
 * -----------------------------------------------------------------------
 * For a hackathon/demo build we avoid native DB drivers entirely (no
 * SQLite/Postgres install headaches) while still giving REAL persistence:
 * every write goes to disk (data/db.json) and survives server restarts.
 *
 * Swap `readDB`/`writeDB` for a real DB client later — every route only
 * talks to this file, so that's a localized change.
 * -----------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function defaultDB() {
  return {
    drivers: {}, // ambulanceId -> driver record
    hospitals: seedHospitals(),
    emergencyCases: [], // { caseId, ambulanceId, ... }
    signalCommands: {}, // caseId -> last traffic signal command (demo only)
  };
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    writeDB(defaultDB());
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDB(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // Write to a temp file then rename -> avoids a half-written file if the
  // process is killed mid-write.
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

/* ---------------------------- password hashing ---------------------------- */
// Uses Node's built-in scrypt (no extra dependency like bcrypt needed).

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(plain, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

/* ---------------------------- id helpers ---------------------------- */

function newCaseId() {
  const stamp = new Date();
  const y = stamp.getFullYear();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CASE-${y}-${rand}`;
}

/* ---------------------------- seed data ---------------------------- */
// Demo directory of Chennai & Thiruvallur hospitals. Coordinates are
// approximate (city-accurate) for map/demo purposes. Phone numbers are
// PLACEHOLDER DEMO VALUES — replace with verified hospital contact numbers
// before any real-world / production use.
function seedHospitals() {
  const list = [
    { name: 'Rajiv Gandhi Government General Hospital', area: 'Park Town, Chennai', lat: 13.0844, lng: 80.2764 },
    { name: 'Government Stanley Medical College Hospital', area: 'Old Washermanpet, Chennai', lat: 13.1071, lng: 80.2884 },
    { name: 'Apollo Hospitals Greams Road', area: 'Thousand Lights, Chennai', lat: 13.0604, lng: 80.2545 },
    { name: 'MIOT International', area: 'Manapakkam, Chennai', lat: 13.0089, lng: 80.1875 },
    { name: 'Fortis Malar Hospital', area: 'Adyar, Chennai', lat: 13.0067, lng: 80.2570 },
    { name: 'Sri Ramachandra Medical Centre', area: 'Porur, Chennai', lat: 13.0382, lng: 80.1565 },
    { name: 'Government Kilpauk Medical College Hospital', area: 'Kilpauk, Chennai', lat: 13.0776, lng: 80.2417 },
    { name: 'Institute of Child Health & Hospital for Children', area: 'Egmore, Chennai', lat: 13.0762, lng: 80.2603 },
    { name: 'Sundaram Medical Foundation Hospital', area: 'Shenoy Nagar, Chennai', lat: 13.0813, lng: 80.2280 },
    { name: 'Global Hospitals Perumbakkam', area: 'Perumbakkam, Chennai', lat: 12.8998, lng: 80.2201 },
    { name: 'Thiruvallur Government Medical College Hospital', area: 'Thiruvallur Town', lat: 13.1439, lng: 79.9089 },
    { name: 'Sri Sathya Sai Medical Centre', area: 'Ambattur, Thiruvallur Dist.', lat: 13.0985, lng: 80.1611 },
    { name: 'Avadi Government Hospital', area: 'Avadi, Thiruvallur Dist.', lat: 13.1147, lng: 80.0982 },
    { name: 'Sri Ramakrishna Hospital Poonamallee', area: 'Poonamallee, Thiruvallur Dist.', lat: 13.0489, lng: 80.0948 },
    { name: 'Tiruttani Government Hospital', area: 'Tiruttani, Thiruvallur Dist.', lat: 13.1755, lng: 79.6082 },
  ];

  return list.map((h, i) => ({
    hospitalId: `HOSP-${String(i + 1).padStart(3, '0')}`,
    name: h.name,
    area: h.area,
    lat: h.lat,
    lng: h.lng,
    contactNumber: `044-2${(800000 + i * 137).toString().slice(0, 6)}`, // DEMO placeholder
    altNumber: `98${(4000000 + i * 911).toString().slice(0, 8)}`, // DEMO placeholder
  }));
}

module.exports = { readDB, writeDB, hashPassword, verifyPassword, newCaseId };
