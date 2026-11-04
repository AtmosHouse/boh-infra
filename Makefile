.PHONY: setup dev-recipes-api dev-invite-api dev-recipes dev-invite migrate

# Install Python deps (via uv) and npm deps for all four components
setup:
	cd services/recipes-api && uv venv .venv && uv pip install -r requirements.txt --python .venv/bin/python
	cd services/invite-api && uv venv .venv && uv pip install -r requirements.txt --python .venv/bin/python
	cd apps/recipes && npm ci
	cd apps/invite && npm ci

# Run DB migrations for both services (idempotent)
migrate:
	cd services/recipes-api && .venv/bin/alembic upgrade head
	cd services/invite-api && .venv/bin/alembic upgrade head

dev-recipes-api:
	cd services/recipes-api && .venv/bin/uvicorn app.main:app --reload --port 8001

dev-invite-api:
	cd services/invite-api && .venv/bin/uvicorn app.main:app --reload --port 8002

dev-recipes:
	cd apps/recipes && npm run dev -- --port 5174

dev-invite:
	cd apps/invite && npm run dev -- --port 5173
