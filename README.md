# D-Trashify

D-Trashify is an educational waste-sorting app with two connected parts:

- A scanner, database, local-rules notes, sample facility directory, and impact log for real household items.
- A five-level Recycling Adventure that teaches the same categories through play, plus quick-play modes (Daily Challenge, Sort Rush, Review Pile).

Game points are never counted as real recycling.

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

Other scripts:

- `npm run build` — typecheck and production build
- `npm run preview` — serve the production build
- `npm run lint` — oxlint

## Demo mode

No API keys are required. Leave `RECOGNITION_API_KEY` blank and the scanner stays in demo mode.

The scanner can preview a photo from an upload or the device camera. Photos are not saved in this app. Clicking **Identify item** asks the local dev server whether Gemini is configured. If it is not, you choose the item yourself. A file name can suggest one item when the name is unambiguous. That suggestion is labeled as a filename hint, not as image recognition.

Progress is stored in `localStorage` under `releaf-demo-v1`. Reset it from Settings. Reset keeps your display name, ZIP code, and sound preference.

## Local rules and facilities

The app includes an **unverified** educational summary for a handful of City of Los Angeles ZIP codes, based on widely published LA Sanitation guidance. It was not re-checked against the live municipal site. Santa Monica, Beverly Hills, Pasadena, and Long Beach entries link to the city site and do not invent a material list. Any other ZIP is shown as unknown.

Official starting points are linked in the app:

- https://www.lacitysan.org/
- https://pw.lacounty.gov/
- https://calrecycle.ca.gov/

The map uses Leaflet and OpenStreetMap tiles. No map key is required.

**Real drop-off points** (blue diamonds) come live from OpenStreetMap through the public Overpass API when you search near your location or saved ZIP. Only an approximate point is sent, and nothing is saved. Community data can be incomplete or out of date, and the app says so next to every result.

**Sample directory** pins (green dots) are sample data placed in public areas to show facility types. Hours and phone numbers are omitted. Do not treat those pins as real drop-off sites.

## Impact estimates

Logged sorts use a typical weight stored on each database item. Diverted weight includes recycling, compost, and special drop-off. Recovered material includes recycling only. Emissions are shown only for recyclables with a rounded educational factor, and the Impact page lists those factors. They are not a measurement.

## The game

- **Story levels:** neighborhood cleanup (carry up to 3 items, the bin is never named for you), sorting facility, compost facility, recycling facility, and the Trash Monster boss (3 waves, a shrinking speed-bonus timer, and the monster visibly loses pieces).
- **Scoring:** 100 per correct sort, a combo bonus of +10 per item in a streak (capped at +50), 25 for a second try after a hint, and +50 for a clean run. Stars still depend only on mistakes.
- **Replays:** first play uses the hand-picked teaching set. Replays shuffle rounds and draw fresh items, so they are not a memory test.
- **Review pile:** every wrong answer raises that item's review weight, and every right answer lowers it. Trouble items show up more often in Sort Rush and boss rematches until you clear them.
- **Daily Challenge:** the same 10 items for everyone on a given date (seeded), one counted try per day, a streak, and a copyable emoji result.
- **Sort Rush:** 60 seconds, 3 lives, +1 second per correct sort. Items you have scanned show up more often.

## Optional Gemini recognition

Copy `.env.example` to `.env` and put a Gemini API key in it as `RECOGNITION_API_KEY`. The file must be named exactly `.env`. Do not prefix it with `VITE_`. The browser never receives the key. It only calls `GET /api/status` and, when recognition is on, `POST /api/recognize` on this dev server.

Identify then sends the photo to Google's Gemini API (`gemini-3.5-flash` unless `GEMINI_MODEL` is set). If that model is busy, the server tries another Gemini flash model. Gemini must pick an item id from the local waste database. If the object is household waste that is not in the database, Gemini can return a clearly labeled, unverified guess (name, bin, and advice), which is shown but not logged as a scan. A confidence of 72% or higher is shown as a recognition result. A weaker match is labeled uncertain and you confirm or change it. If Gemini is unavailable, the scanner opens demo mode and says the photo was not identified.

Restart `npm run dev` after changing `.env`. `.env` and `env.txt` are gitignored.

## Deploying (Vercel)

`api/status.ts` and `api/recognize.ts` are serverless functions that wrap the same handler the dev server uses, so recognition works in a deployed build. `vercel.json` sends every non-API path to `index.html` for client-side routing. Set `RECOGNITION_API_KEY` (and optionally `GEMINI_MODEL`) in the Vercel project's environment variables. Without a key the deployed scanner stays in demo mode.

## Project map

- `src/data` — items, location notes, sample facilities, levels
- `src/pages` — dashboard, scanner, database, centers, impact, settings, game shell
- `src/game` — neighborhood exploration, facility tasks, boss challenge, arcade modes (`Arcade.tsx`), item pools (`pools.ts`)
- `src/context/AppContext.tsx` — saved progress
- `vite.config.ts` — local status and recognize endpoints
- `api/` — the same endpoints as serverless functions for deployment
- `src/lib/overpass.ts` — OpenStreetMap recycling-point search
- `server/recognize.ts` — Gemini adapter; the API key stays here on the server
