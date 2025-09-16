# Phasee2 Dev

## Run

```bash
npm run dev
```

This starts:
- API at http://localhost:8787
- Vite dev at http://localhost:5173 (proxies /api)

## Env

Create `.env` with:

```
OPENAI_API_KEY=sk-...
```

## Notes
- API: Express + SQLite at `server/index.js`
- Generation endpoint: POST `/api/generate` { profile, notes, count }

<!-- deploy trigger: 2025-09-16T03:33:00Z -->
