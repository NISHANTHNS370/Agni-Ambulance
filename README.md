# Agni Ambulance — Driver Console

A full driver-facing web app: login, profile, vehicle & drone readiness,
emergency case logging, live GPS + Google Maps routing to the chosen
hospital, a demo V2X traffic-signal panel, and a dashboard with history —
matching your wireframes end to end, with real data persistence (not mock
data — everything you save is written to disk and reloads after a refresh
or server restart).

## 1. What's inside

```
agni-ambulance/
  backend/            Node.js + Express API (real storage, no DB install needed)
    server.js         entry point
    db.js             JSON-file "database" + seeded hospital directory
    routes/           auth, driver profile/vehicle/drone, hospitals, emergency, signal
    uploads/           driver photos + RC book uploads land here
  frontend/           Plain HTML/CSS/JS (no build step)
    login.html, dashboard.html, emergency.html, location.html,
    hospitals.html, vehicle.html, drone.html, profile.html, hospital-view.html
    css/, js/
```

## 2. Run it locally (5 minutes)

**Requirements:** Node.js 18+ installed on your laptop.

```bash
cd agni-ambulance/backend
npm install
cp .env.example .env      # then edit SESSION_SECRET if you like
npm start
```

You should see:
```
🔥 Agni Ambulance backend running at http://localhost:4000
```

The backend also serves the frontend directly, so just open:
**http://localhost:4000/login.html**

No separate frontend server needed — one command runs the whole thing.

## 3. First-time use

1. Open the login page → click **Create Ambulance ID** → pick an ID like
   `TN-AMB-1042` and a password → Create.
2. Switch to **Log in** and sign in with the same details.
3. You'll land on the Dashboard. Go to **Profile** first and fill in your
   details + photo — this is what shows up across the app.
4. Fill **Vehicle Info** and **Drone Status** once (from Profile setup, as
   in your flow).
5. Go to **Emergency**, pick a hospital + patient case, hit **Connect and
   start the Ambulance Route** — you'll be dropped onto the **Location**
   page with a live map.
6. Open `http://localhost:4000/hospital-view.html?caseId=<the case ID
   printed in your browser console after starting the route>` in another
   tab/window to see the "hospital's screen" for that trip update live.

## 4. Google Maps setup (for the Location page)

The Location Tracking page needs a **Google Maps JavaScript API key** with
the *Maps JavaScript API* and *Directions API* enabled.

1. Go to https://console.cloud.google.com/google/maps-apis/
2. Create a project (or reuse one) → **Enable APIs** → enable "Maps
   JavaScript API" and "Directions API".
3. Create an **API key** under Credentials.
4. Open `frontend/location.html`, find this line near the bottom:
   ```html
   src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap"
   ```
   and replace `YOUR_GOOGLE_MAPS_API_KEY` with your real key.
5. For the hackathon demo, you can restrict the key to `localhost` /
   your demo domain in the Google Cloud Console for safety.

Without a key, every other page still works fully — only the live map on
the Location page needs it.

## 5. Where your data actually lives

Everything is stored in `backend/data/db.json` — drivers, hospitals,
emergency cases, and signal states. Delete that file any time to reset the
whole system to a clean slate (hospitals will reseed automatically).

Uploaded photos and RC-book files are saved under `backend/uploads/` and
served back at `http://localhost:4000/uploads/<filename>`.

## 6. Deploying for the SIH demo day (optional)

If you want it reachable from a phone on the same WiFi as your laptop:

1. Find your laptop's local IP (e.g. `192.168.1.23`).
2. In `frontend/js/api.js`, change:
   ```js
   const API_BASE = window.AGNI_API_BASE || 'http://localhost:4000';
   ```
   to your laptop's IP, e.g. `'http://192.168.1.23:4000'`.
3. Restart the backend (`npm start`), then open
   `http://192.168.1.23:4000/login.html` on your phone.

For a real public deployment later, put this behind HTTPS (e.g. a small
VPS + Let's Encrypt, or a platform like Render/Railway) and swap the
JSON-file store for a real database — the code is structured so that's a
change only inside `db.js`.

## 7. Notes

- Hospital contact numbers in the seed data are **placeholders** —
  swap them for verified numbers before using this for real dispatch.
- The traffic-signal panel on the Location page is a **UI simulation**
  only; there's no physical IoT hardware wired to it in this build.
- Passwords are hashed with Node's built-in `scrypt` — no extra
  dependency, no plaintext storage.
