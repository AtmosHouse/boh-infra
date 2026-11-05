---
name: recipes
description: Plan the menu and shopping list — parse recipes into dishes, manage ingredients/stores, generate the consolidated shopping list via the recipes CLI
allowed-tools:
  - exec
  - read
  - write
  - edit
---

Drive the recipe planner via the `recipes` CLI — a thin wrapper over the
local recipes-api. You are the parser/judgment layer; the CLI and API are
the source of truth. Never write the SQLite db directly.

## Setup

The CLI lives at `services/recipes-api/scripts/recipes` (repo root). It
needs the API running:

```bash
cd services/recipes-api
.venv/bin/uvicorn app.main:app --port 8001   # or: make dev-recipes-api
```

If `.venv` is missing: `make setup && make migrate` (creates SQLite db).
Target another server with `RECIPES_API_URL` or `--api-url`.

## Commands

All commands support `--json` (use it — machine-readable output).

- `recipes dishes list [--course X]` / `dishes show <id>` / `dishes delete <id>`
- `recipes dishes create --file <dish.json>` (`--file -` reads stdin)
- `recipes ingredients list [--search <q>]`  ← dedupe check
- `recipes ingredients set <id> [--name --unit --store-id N|--store-id 0 --done|--undone]`
- `recipes stores list|create <name>|delete <id>`
- `recipes items list|add <name> [--qty --unit --category --notes --dish-id --store-id]|toggle <id>|delete <id>`
- `recipes shopping list`  ← consolidated, grouped by store

## Adding recipes (the main workflow)

1. **Intake**: user gives recipe text, a file, or a URL. You read and parse
   it — do NOT call the API's `/ingredients/parse` LLM endpoint.

2. **Structure it** into a DishCreate JSON:

```json
{
  "name": "Mushroom Wellington",
  "course": "main",
  "description": "optional",
  "servings": 8,
  "recipe_url": "optional",
  "ingredients": [
    {"name": "puff pastry", "unit": "package", "quantity": 2, "notes": "thawed"},
    {"existing_ingredient_id": 14, "unit": "ounce", "quantity": 8}
  ]
}
```

   `course` is one of: appetizer, soup, salad, main, side, dessert,
   beverage, other.

3. **Dedupe first**: for each ingredient, `recipes ingredients list
   --search <name> --json`. If a match exists, use
   `existing_ingredient_id` — do NOT create a near-duplicate
   ("olive oil" vs "extra virgin olive oil" = same ingredient; when in
   doubt, ask the user once for the whole batch).

4. **Review before writing**: show the user the parsed dishes (name,
   course, per-ingredient qty+unit) and wait for approval, unless the
   user asked you to just do it.

5. **Write**: `recipes dishes create --file dish.json --json` (or pipe via
   `--file -`). Repeat per dish.

## Units

- `unit` on an ingredient input is the unit the quantity is expressed in.
- For a NEW ingredient, the input unit becomes its base unit — pick what
  makes sense for shopping (e.g. "pound" for meat, "each" for produce).
- For an EXISTING ingredient (`existing_ingredient_id`), `unit` should be
  the recipe's own unit — the aggregator converts to the base unit at read
  time. Do not pre-convert; record what the recipe says.
- Canonical units: teaspoon, tablespoon, cup, pint, quart, gallon,
  milliliter, liter, ounce, pound, gram, kilogram, each, clove, head,
  bunch, sprig, stalk, slice, stick, can, package, pinch, dash.
  Aliases (tbsp, oz, lbs, c) normalize server-side — use canonical forms.
- "to taste"/unquantified → `quantity: 1, unit: "each"` plus a note.

## Shopping list

- `recipes shopping list --json` returns `items` (each with `quantity`,
  `unit`, `store_id`, `is_done`, `contributions` showing per-source
  breakdown) plus `conversions_applied`.
- Present it grouped by store. Items with no store land under
  "No Store Assigned" — offer to assign them (`items` / ingredient store
  fields) or create new stores.
- Non-recipe supplies (foil, napkins, charcoal) → `recipes items add`.
  Name-matching a manual item to an existing ingredient merges it into
  that line with unit conversion.
- Marking done: dish-derived lines → `recipes ingredients set <ingredient_id>
  --done` (id is on the line item); manual items → `recipes items toggle <id>`.
- Assigning a store: `recipes ingredients set <ingredient_id> --store-id N`
  (`--store-id 0` clears); manual items take `--store-id` on `items add`.

## Rules

- Never duplicate ingredients — always search first.
- Never invent quantities; if the recipe doesn't say, use
  `quantity: 1, unit: "each"` + note "amount unspecified".
- Show the user what you parsed before creating dishes.
- The API is the source of truth — all writes go through the CLI.
