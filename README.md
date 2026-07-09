# JFC Cineplex

Cinema ticket booking site for **JFC Cineplex — DHA Phase II, Islamabad**.

Includes public browsing (movies, showtimes, food, promos), multi-step booking with seat map, and an admin CMS. Movie details can be auto-filled from **OMDb** by title.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in:

   | Variable | Purpose |
   |----------|---------|
   | `ADMIN_PASSWORD` | Admin login (default if unset: `jfc-admin`) |
   | `OMDB_API_KEY` | Auto-fetch movie cast, poster, IMDb rating, plot (never commit) |
   | `PORT` | Server port (default `3000`) |
   | `GEMINI_API_KEY` | Optional fallback if OMDb fails |

   Secrets go only in local `.env` (gitignored) or your host’s env vars.

3. **Run (dev)**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

4. **Production build**

   ```bash
   npm run build
   npm start
   ```

## Admin

- Open the site → navigate to **Admin** (or set view to admin via the shield control if present).
- Password: value of `ADMIN_PASSWORD` in `.env`.
- **Movies → type title → Add Movie instantly** → OMDb fills synopsis, cast, ratings, poster.
- You can still edit fields manually after import (e.g. YouTube trailer ID, Featured flag).

## Data (Firebase / Firestore)

- Production data lives in **Google Cloud Firestore** (project `jfcnewweb`).
- Put your service account file at `firebase-service-account.json` (gitignored) or set `FIREBASE_SERVICE_ACCOUNT_PATH`.
- First server start **seeds** movies/showtimes if Firestore is empty.
- Bookings use a **Firestore transaction** so two people cannot take the same seat.
- Export/import backups from Admin → Settings still work (full JSON dump/restore).

## Demo notes

- Checkout is **demo mode** (no real card charges). Seats still lock in `db.json`.
- Promo codes like `STUDENT20` / `FAMILY15` work if seeded promotions exist.

## Repo

https://github.com/danyalamin-art/JFCWebNew

## Next: Firebase (planned)

Local/dev currently uses `db.json`. For multi-user live hosting we will migrate to **Cloud Firestore**:

1. Create a Firebase project → enable Firestore
2. Add Admin SDK service account on the server (or use Firebase Hosting + Cloud Functions)
3. Map collections: `movies`, `showtimes`, `bookings`, `snacks`, `promotions`, `settings`, etc.
4. Replace `loadDatabase` / `saveDatabase` in `server.ts` with Firestore reads/writes
5. Use transactions when booking seats (prevent double-booking)
6. Deploy server (Cloud Run / Railway / Render) + optional static frontend

See chat / project docs for the full step-by-step when ready to implement.
