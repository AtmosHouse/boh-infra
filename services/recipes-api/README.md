# recipes-api

FastAPI service for the recipe builder: dishes, ingredients, shopping lists,
stores, and LLM-powered ingredient parsing.

## Endpoints (all under `/api/v1`)

- `POST/GET/PUT/DELETE /dishes` — dishes with course assignments
- `POST/GET/PUT/DELETE /ingredients` + `/ingredients/instances` — ingredient catalog and per-dish usage
- `POST /ingredients/parse` — parse natural-language recipe text via LLM
- `POST /recipes/process` — batch-process multiple recipes
- `POST /shopping/generate`, `/shopping/items` — consolidated shopping list with unit conversion
- `GET/POST/PUT/DELETE /stores` — store/location tracking

## Run locally

```bash
uv venv .venv && uv pip install -r requirements.txt --python .venv/bin/python
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8001
```

Defaults to `sqlite+aiosqlite:///./recipes.db`. See `.env.example` for
`DATABASE_URL` (Postgres) and `OPENAI_API_KEY`/`OPENAI_MODEL` (ingredient parsing).

`scripts/make_shopping_list.py` is the original standalone CLI consolidator.
