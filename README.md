# Atmos House

Two decoupled components, each with its own frontend app and API service.

## Layout

```
apps/
  invite/        # Vite + React — event site: landing, RSVP, invites, guest chat
  recipes/       # Vite + React — recipe builder: dish manager + shopping list
services/
  invite-api/    # FastAPI — /users, /chat (SQLite locally, Postgres via DATABASE_URL)
  recipes-api/   # FastAPI — /dishes, /ingredients, /shopping, /recipes, /stores
                   #            + LLM ingredient parsing (OpenAI-compatible API)
```

## Quickstart

```bash
make setup     # create venvs + install all deps (requires uv and npm)
make migrate   # create SQLite databases and run migrations
```

Then in four terminals:

```bash
make dev-invite-api    # http://localhost:8002  (docs at /docs)
make dev-invite        # http://localhost:5173
make dev-recipes-api   # http://localhost:8001  (docs at /docs)
make dev-recipes       # http://localhost:5174
```

Each component has a `.env.example` — copy to `.env` to override defaults.
Without env files, both APIs run on local SQLite and the apps default to
the ports above.

## Deployment

- `apps/invite` and `apps/recipes` are independent Vite SPAs (Vercel-ready,
  each has its own `vercel.json` SPA rewrite). Set `VITE_API_URL` per app.
- `services/*-api` are independent FastAPI services. Set `DATABASE_URL` to a
  Postgres async URL (`postgresql+asyncpg://...`) in production; SQLite is
  the local default.
