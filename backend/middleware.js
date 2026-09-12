/** Blocks any request that doesn't have a valid logged-in session. */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.ambulanceId) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  next();
}

module.exports = { requireAuth };
