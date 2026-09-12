/**
 * Renders the sidebar nav + topbar shared by every protected page, wires
 * the live clock, the settings gear (location sharing + logout), and does
 * the session guard. Call `initShell({ active, title, subtitle })` once
 * per page, after the DOM's #sidebar and #topbar elements exist.
 */

const NAV_ITEMS = [
  { key: 'dashboard', href: 'dashboard.html', icon: '&#9635;', label: 'Dashboard' },
  { key: 'emergency', href: 'emergency.html', icon: '&#9888;', label: 'Emergency' },
  { key: 'location', href: 'location.html', icon: '&#8982;', label: 'Location Tracking & Signal Access' },
  { key: 'hospitals', href: 'hospitals.html', icon: '&#9970;', label: 'Hospital List' },
  { key: 'vehicle', href: 'vehicle.html', icon: '&#128663;', label: 'Vehicle Info' },
  { key: 'drone', href: 'drone.html', icon: '&#9992;', label: 'Drone Status' },
  { key: 'profile', href: 'profile.html', icon: '&#128100;', label: 'Profile' },
];

async function initShell({ active, title, subtitle }) {
  const session = await requireSession();
  if (!session) return null;

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-brand">
      <div class="flame">&#128293;</div>
      <div class="brand-text">Agni Ambulance<span>Driver Console</span></div>
    </div>
    <ul class="nav-list">
      ${NAV_ITEMS.map(item => `
        <li class="nav-item ${item.key === active ? 'active' : ''}">
          <a href="${item.href}"><span class="icon">${item.icon}</span>${item.label}</a>
        </li>
      `).join('')}
    </ul>
    <div class="sidebar-foot">Shift ID: ${session.ambulanceId}</div>
  `;

  document.getElementById('topbar').innerHTML = `
    <div>
      <h1>${title}</h1>
      <div class="subtitle">${subtitle || ''}</div>
    </div>
    <div class="topbar-right">
      <div class="clock-pill" id="live-clock"></div>
      <button class="icon-btn" id="settings-btn" title="Settings">&#9881;</button>
    </div>
  `;

  startClock();
  wireSettingsPanel(session);

  return session;
}

function startClock() {
  const el = document.getElementById('live-clock');
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };
  tick();
  setInterval(tick, 1000);
}

function wireSettingsPanel(session) {
  const btn = document.getElementById('settings-btn');
  btn.addEventListener('click', () => openSettingsModal(session));
}

async function openSettingsModal(session) {
  let settings = { locationSharing: true, homeLat: null, homeLng: null };
  try { settings = await api('/api/driver/settings'); } catch { /* use defaults */ }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);display:grid;place-items:center;z-index:100;';
  overlay.innerHTML = `
    <div class="panel" style="width:360px;">
      <h3 style="margin-bottom:4px;">Settings</h3>
      <div class="helper-note" style="margin-bottom:18px;">Signed in as <strong>${session.ambulanceId}</strong></div>

      <div class="field">
        <label>Location sharing</label>
        <div class="radio-row">
          <label><input type="radio" name="locsharing" value="on" ${settings.locationSharing ? 'checked' : ''}/> On</label>
          <label><input type="radio" name="locsharing" value="off" ${!settings.locationSharing ? 'checked' : ''}/> Off</label>
        </div>
      </div>

      <button class="btn btn-outline btn-block" id="set-home-btn" type="button" style="margin-bottom:10px;">
        Set current spot as my base location
      </button>
      <div class="helper-note" id="home-loc-note" style="margin-bottom:18px;">
        ${settings.homeLat ? `Base set at ${Number(settings.homeLat).toFixed(4)}, ${Number(settings.homeLng).toFixed(4)}` : 'No base location set yet.'}
      </div>

      <button class="btn btn-danger btn-block" id="logout-btn" type="button" style="margin-bottom:10px;">Log out</button>
      <button class="btn btn-outline btn-block" id="close-settings-btn" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#close-settings-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('input[name="locsharing"]').forEach((r) => {
    r.addEventListener('change', async (e) => {
      try {
        await api('/api/driver/settings', { method: 'POST', body: { locationSharing: e.target.value === 'on' } });
        toast('Location sharing updated.');
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  overlay.querySelector('#set-home-btn').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Geolocation not supported on this device.', 'error');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api('/api/driver/settings', {
          method: 'POST',
          body: { homeLat: pos.coords.latitude, homeLng: pos.coords.longitude },
        });
        overlay.querySelector('#home-loc-note').textContent =
          `Base set at ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        toast('Base location saved.');
      } catch (err) { toast(err.message, 'error'); }
    }, () => toast('Could not read your location.', 'error'));
  });

  overlay.querySelector('#logout-btn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = 'login.html';
  });
}
