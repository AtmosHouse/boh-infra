# invite-api

FastAPI service for the event invite site: users, RSVPs, plus-ones, and the
guest chat board.

## Endpoints (all under `/api/v1`)

- `POST/GET/PUT/DELETE /users` — invitees with UUID invite links
- `POST /users/{id}/rsvp`, `GET /users/rsvp-list` — RSVP tracking
- `GET/POST /users/{id}/plus-one` — plus-one invite links
- `GET/POST /chat` — guest message board

## Run locally

```bash
uv venv .venv && uv pip install -r requirements.txt --python .venv/bin/python
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8002
```

Defaults to `sqlite+aiosqlite:///./invite.db`. See `.env.example` for
`DATABASE_URL` (Postgres).
