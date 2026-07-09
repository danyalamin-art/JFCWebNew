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
   | `OMDB_API_KEY` | Auto-fetch movie cast, poster, IMDb rating, plot |
   | `PORT` | Server port (default `3000`) |
   | `GEMINI_API_KEY` | Optional fallback if OMDb fails |

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

## Data

- Server stores data in `db.json` (created on first run).
- Bookings update seats on the server so multiple browsers stay in sync.
- Export/import backups from Admin → Settings.

## Demo notes

- Checkout is **demo mode** (no real card charges). Seats still lock in `db.json`.
- Promo codes like `STUDENT20` / `FAMILY15` work if seeded promotions exist.
