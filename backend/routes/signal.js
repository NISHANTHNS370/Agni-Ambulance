const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');
const { requireAuth } = require('../middleware');

router.use(requireAuth);

/**
 * These endpoints are an explicitly DEMO-ONLY mock of the "Near Traffic
 * Signal Alert Board" panel — there is no real IoT hardware wired up here.
 * They just persist the driver's chosen command/light per active case so
 * the UI has something real to show and clear, matching the wireframe.
 */

router.post('/command', (req, res) => {
  const { caseId, boardId, command, light } = req.body;
  if (!caseId) return res.status(400).json({ error: 'No active case to send a signal command for.' });

  const db = readDB();
  db.signalCommands[caseId] = {
    boardId: boardId || 'Nearest Board',
    command: command || '',
    light: light || 'none',
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  res.json({ ok: true, signal: db.signalCommands[caseId] });
});

router.get('/status/:caseId', (req, res) => {
  const db = readDB();
  res.json(db.signalCommands[req.params.caseId] || { boardId: '', command: '', light: 'none' });
});

router.post('/clear/:caseId', (req, res) => {
  const db = readDB();
  delete db.signalCommands[req.params.caseId];
  writeDB(db);
  res.json({ ok: true });
});

module.exports = router;
