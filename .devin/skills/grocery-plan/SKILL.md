---
name: grocery-plan
description: Turn the consolidated shopping list into a real shopping plan — map store buckets to actual stores near a location, walk vs. delivery routing, per-stop item lists
allowed-tools:
  - exec
  - web_search
  - read
---

Turn `recipes shopping list` into an executable shopping plan: which
physical stores to hit near the user's location and what to order for
delivery instead. Research is advisory — never claim real-time stock or
prices; mark uncertain finds "verify in store".

## Inputs

- `scripts/recipes shopping list --json` — items grouped by `store_id` bucket
- `scripts/recipes stores list --json` — bucket names (Costco, Asian Market, etc.)
- Home base from the user (neighborhood/city). Default test anchor: Rincon Hill, SF.
- Ask the user which buckets they want in-person vs. delivery, unless obvious.

## Workflow

1. Pull the list + stores via the CLI (`--json`).
2. For each store bucket, `web_search` for the nearest real store matching
   the bucket's character (ethnic market, warehouse club, supermarket,
   farmers market — including market day schedules).
3. Route each bucket: walking distance (< ~20 min), transit/drive, or
   delivery. Prefer delivery for specialty items when a good service exists
   (Weee!/Yamibuy for Asian groceries, Instacart for Costco/Safeway, Amazon).
4. Present the plan: per stop — store name, address, est. distance/time,
   item sublist with qty+unit; per order — service + item sublist + link.
   Wait for approval before mutating anything.
5. Optionally rename DB stores to real ones (`stores` API/CLI) so the list
   and xlsx export reflect the plan.

## Rincon Hill, SF reference routes

- Costco → SF Costco, 450 10th St (~1 mi walk / drive-and-park better for a haul)
- Safeway → Safeway 298 King St, Mission Bay (~15 min walk) — or Instacart
- Asian Market → Weee! delivery (SF-based; genmaicha/arare/nori/mirin/mitsuba).
  In-person fallback: Chinatown markets on Stockton St (~20 min)
- Farmers Market → Ferry Plaza Farmers Market, Embarcadero (~15 min walk,
  Tue/Thu/Sat mornings — plan around market days)
- Whole Foods 399 4th St (~10 min) covers burrata/brie/organic produce gaps
- "House" bucket → pantry check, no shopping

## Rules

- Never claim items are in stock — say "carries" not "has".
- Distances are estimates from search results, not Maps API precision —
  say "~15 min walk" not exact times.
- Perishables (burrata, salmon, herbs) → last stop or delivery closest to
  cook day; call that out in the plan.
- Split orders by perishability/lead time when it helps (dry goods can
  come a week early; produce 1-2 days out).
