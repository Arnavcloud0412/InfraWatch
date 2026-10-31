# InfraWatch AI

Public infrastructure intelligence prototype for Maharashtra. It collects open announcements, extracts structured claims, keeps the source attached, scores evidence separately from civilian criticality, and lets a reviewer accept, reject, or send a record back.

This is an internship prototype. It is not a defence-grade system and it does not analyse military movement or operational vulnerability.

## Run it

Use two terminals.

```powershell
cd agents
.\.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

```powershell
cd web
npm run dev
```

Open http://localhost:3000. The dashboard loads ten labelled synthetic projects even when the agent service is stopped. Delete `web/data/store.json` to restore that demonstration set.

Create the Python environment if `.venv` is missing:

```powershell
cd agents
py -3.12 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python scripts\build_seed.py
```

## Configuration

Copy `web/.env.example` to `web/.env.local` and `agents/.env.example` to `agents/.env`.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `AGENT_SERVICE_URL` | Next.js | Python service, default `http://127.0.0.1:8000` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Next.js | Optional Postgres. Blank uses the local JSON file |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Agents | Gemini Flash through Google ADK. Blank uses the keyword fallback |
| `OFFICIAL_RSS_URLS` | Agents | Optional official feeds |
| `DATA_GOV_IN_API_KEY`, `DATA_GOV_IN_RESOURCE_IDS` | Agents | Optional data.gov.in resources |
| `X_BEARER_TOKEN` | Agents | Optional X recent search |
| `YOUTUBE_API_KEY` | Agents | Optional YouTube search |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Agents | Optional Reddit search |

GDELT needs no key. Maharashtra PWD has no API in this build; paste a notice URL on the Ingest page. Social and data.gov.in adapters do nothing until their variables are set, and the Ingest page says so.

Apply `db/schema.sql` in the Supabase SQL editor before setting the Supabase variables. The app seeds an empty database from `web/data/seed.json`. The service-role key stays on the server. Row level security is enabled with no policies, so the anon key cannot read the tables.

## Pipeline

1. Discovery reads GDELT, optional RSS, and configured social APIs, then filters for infrastructure.
2. Extraction returns a validated claim. It is told not to invent budgets or dates.
3. Correlation suggests an existing project and attaches an event only on a clear match. It does not overwrite project fields.
4. An ADK sequential workflow runs evidence review, then classification commentary.
5. Python computes the criticality tier. A model may nudge a factor by at most four points.
6. The record is stored as unverified. Official confirmation and rejection are human actions.

Evidence status and lifecycle status are different fields. A reported stage is not copied onto the project unless a reviewer accepts it and ticks that option.

Criticality uses `hybrid_weighted_v1`. Each of connectivity, essential service, economic significance, public dependency, and emergency relevance is scored from 0 to 20. The contextual score is their weighted sum on a 0–100 scale (equal weights). Baseline tiers come from the prototype taxonomy in the project guidelines. A score of 75 or more moves the proposed tier up one step. A score of 30 or less moves it down one step. The score is not a measure of truth.

Rebuild the demonstration file after changing the scorer:

```powershell
cd agents
.\.venv\Scripts\python scripts\build_seed.py
```

Tests for scoring, correlation, and the evidence clamp:

```powershell
cd agents
.\.venv\Scripts\python -m unittest tests.test_core
```

## Layout

- `web` — Next.js 15 dashboard and review API
- `agents` — FastAPI service and Google ADK agents
- `db/schema.sql` — Postgres tables
- `web/data/seed.json` — synthetic demonstration workspace

## Deployment sketch

The Next.js app can be hosted on Vercel. Set `AGENT_SERVICE_URL` to the Python host and, if used, the Supabase variables. Run the agent service with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` on Render or an equivalent host.

An operational deployment would replace the commercial model API and the open collectors. That proposal is described on the Architecture page and is not what this prototype implements.
