/**
 * Tiny fetch wrapper shared by every page. Always sends cookies
 * (credentials: 'include') so the express-session cookie reaches the API
 * even when the frontend is opened from a different port during dev.
 */
const API_BASE = window.AGNI_API_BASE || 'http://localhost:4000';

async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body && isForm) {
    opts.body = body; // FormData — browser sets the multipart boundary header itself
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch { /* empty body is fine */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

/** Small bottom-right toast, used across all pages for success/error feedback. */
function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/** Redirects to login if there is no active session. Call at the top of every protected page. */
async function requireSession() {
  try {
    return await api('/api/auth/me');
  } catch {
    window.location.href = 'login.html';
    return null;
  }
}
