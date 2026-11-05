"""recipes-cli — thin CLI over the recipes-api HTTP API.

Deterministic verbs; the agent supplies judgment upstream (parsing recipe
text, deduping ingredients) and calls these commands to write/inspect state.

Usage:
    python -m app.cli <command> [options]
    scripts/recipes <command> [options]      # venv wrapper

All commands accept --json for machine-readable output and
--api-url / $RECIPES_API_URL to point at a non-default server.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

import httpx

DEFAULT_API_URL = "http://localhost:8001"


class ApiError(Exception):
    pass


def _client(api_url: str) -> httpx.Client:
    return httpx.Client(base_url=f"{api_url.rstrip('/')}/api/v1", timeout=30.0)


def _request(client: httpx.Client, method: str, path: str, **kwargs) -> Any:
    try:
        resp = client.request(method, path, **kwargs)
    except httpx.ConnectError:
        raise ApiError(
            f"cannot reach recipes-api at {client.base_url} — is it running? "
            "(make dev-recipes-api)"
        )
    if resp.status_code >= 400:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise ApiError(f"{method} {path} -> {resp.status_code}: {detail}")
    if resp.status_code == 204:
        return None
    return resp.json()


def _emit(data: Any, as_json: bool, render=None) -> None:
    if as_json:
        print(json.dumps(data, indent=2, default=str))
    elif render is not None:
        render(data)
    else:
        print(json.dumps(data, indent=2, default=str))


def _fail(err: ApiError) -> None:
    print(json.dumps({"error": str(err)}), file=sys.stderr)
    sys.exit(1)


# --- renderers (human-readable, used when --json is absent) ----------------

def _table(rows: list[dict], cols: list[tuple[str, str]]) -> None:
    """cols: list of (header, key-or-format). Empty rows print 'no results'."""
    if not rows:
        print("no results")
        return
    widths = [max(len(h), max(len(str(r.get(k, "") or "")) for r in rows)) for h, k in cols]
    print("  ".join(h.ljust(w) for h, w in zip((c[0] for c in cols), widths)))
    for r in rows:
        print("  ".join(str(r.get(k, "") or "").ljust(w) for (h, k), w in zip(cols, widths)))


def _render_dishes(data: dict) -> None:
    rows = [
        {
            "id": d["id"],
            "name": d["name"],
            "course": d["course"],
            "servings": d.get("servings"),
            "ingredients": len(d.get("ingredient_instances", [])),
        }
        for d in data["dishes"]
    ]
    _table(rows, [("id", "id"), ("name", "name"), ("course", "course"),
                  ("servings", "servings"), ("#ing", "ingredients")])


def _render_ingredients(data: list) -> None:
    rows = [
        {
            "id": i["id"],
            "name": i["name"],
            "unit": i["unit"],
            "store": (i.get("store") or {}).get("name", ""),
            "purchased": "x" if i["is_purchased"] else "",
        }
        for i in data
    ]
    _table(rows, [("id", "id"), ("name", "name"), ("unit", "unit"),
                  ("store", "store"), ("done", "purchased")])


def _render_stores(data: dict) -> None:
    _table(data["stores"], [("id", "id"), ("name", "name")])


def _render_items(data: dict) -> None:
    rows = [
        {
            "id": i["id"],
            "name": i["ingredient_name"],
            "qty": i.get("quantity"),
            "unit": i.get("unit"),
            "store": i.get("store_id"),
            "dish": (i.get("dish") or {}).get("name", ""),
            "done": "x" if i["is_checked"] else "",
        }
        for i in data["items"]
    ]
    _table(rows, [("id", "id"), ("name", "name"), ("qty", "qty"),
                  ("unit", "unit"), ("store", "store"), ("dish", "dish"), ("done", "done")])


def make_render_shopping(store_names: dict[int, str]):
    def render(data: dict) -> None:
        by_store: dict[str, list[dict]] = {}
        for item in data["items"]:
            sid = item["store_id"]
            label = store_names.get(sid, "No Store Assigned") if sid else "No Store Assigned"
            by_store.setdefault(label, []).append(item)
        for store in sorted(by_store):
            print(f"{store} ({len(by_store[store])})")
            for i in by_store[store]:
                qty = i["quantity"]
                qty_s = "—" if qty is None else (str(int(qty)) if float(qty) == int(qty) else f"{qty:.2f}")
                unit = f" {i['unit']}" if i.get("unit") else ""
                done = " [done]" if i["is_done"] else ""
                print(f"  {i['name']}: {qty_s}{unit}{done}")
        conv = data.get("conversions_applied") or []
        if conv:
            print("conversions:")
            for c in conv:
                print(f"  {c}")
    return render


# --- commands ---------------------------------------------------------------

def cmd_dishes_list(args, client):
    params = {}
    if args.course:
        params["course"] = args.course
    data = _request(client, "GET", "/dishes/", params=params)
    _emit(data, args.json, _render_dishes)


def cmd_dishes_show(args, client):
    data = _request(client, "GET", f"/dishes/{args.id}")
    _emit(data, args.json)


def cmd_dishes_create(args, client):
    """Create a dish from a DishCreate JSON file (or '-' for stdin)."""
    if args.file == "-":
        payload = json.load(sys.stdin)
    else:
        with open(args.file) as f:
            payload = json.load(f)
    data = _request(client, "POST", "/dishes/", json=payload)
    if args.json:
        _emit(data, True)
    else:
        print(json.dumps({
            "id": data["id"], "name": data["name"],
            "ingredients": len(data.get("ingredient_instances", [])),
        }))


def cmd_dishes_delete(args, client):
    _request(client, "DELETE", f"/dishes/{args.id}")
    _emit({"deleted": args.id}, args.json, lambda d: print(f"deleted dish {args.id}"))


def cmd_ingredients_list(args, client):
    params = {}
    if args.search:
        params["search"] = args.search
    data = _request(client, "GET", "/ingredients/", params=params)
    _emit(data, args.json, _render_ingredients)


def cmd_ingredients_set(args, client):
    payload: dict[str, Any] = {}
    if args.name is not None:
        payload["name"] = args.name
    if args.unit is not None:
        payload["unit"] = args.unit
    if args.store_id is not None:
        payload["store_id"] = args.store_id or None  # 0 clears the store
    if args.done is not None:
        payload["is_purchased"] = args.done
    if not payload:
        raise ApiError("nothing to update — pass --name/--unit/--store-id/--done/--undone")
    data = _request(client, "PUT", f"/ingredients/{args.id}", json=payload)
    _emit(data, args.json, lambda d: print(json.dumps(d)))


def cmd_stores_list(args, client):
    data = _request(client, "GET", "/stores")
    _emit(data, args.json, _render_stores)


def cmd_stores_create(args, client):
    data = _request(client, "POST", "/stores", json={"name": args.name})
    _emit(data, args.json, lambda d: print(json.dumps(d)))


def cmd_stores_assign(args, client):
    for iid in args.ingredient_ids:
        _request(client, "PUT", f"/ingredients/{iid}", json={"store_id": args.store_id})
    out = {"store_id": args.store_id, "assigned": args.ingredient_ids}
    _emit(out, args.json, lambda d: print(f"assigned {len(args.ingredient_ids)} ingredients to store {args.store_id}"))


def cmd_stores_delete(args, client):
    _request(client, "DELETE", f"/stores/{args.id}")
    _emit({"deleted": args.id}, args.json, lambda d: print(f"deleted store {args.id}"))


def cmd_items_list(args, client):
    params = {}
    if args.checked is not None:
        params["checked"] = str(args.checked).lower()
    data = _request(client, "GET", "/shopping/items", params=params)
    _emit(data, args.json, _render_items)


def cmd_items_add(args, client):
    payload: dict[str, Any] = {"ingredient_name": args.name}
    for attr, key in [
        ("qty", "quantity"), ("unit", "unit"), ("category", "category"),
        ("notes", "notes"), ("dish_id", "dish_id"), ("store_id", "store_id"),
    ]:
        val = getattr(args, attr)
        if val is not None:
            payload[key] = val
    data = _request(client, "POST", "/shopping/items", json=payload)
    _emit(data, args.json, lambda d: print(json.dumps(d)))


def cmd_items_toggle(args, client):
    data = _request(client, "PATCH", f"/shopping/items/{args.id}/toggle")
    _emit(data, args.json, lambda d: print(json.dumps({"id": d["id"], "is_checked": d["is_checked"]})))


def cmd_items_delete(args, client):
    _request(client, "DELETE", f"/shopping/items/{args.id}")
    _emit({"deleted": args.id}, args.json, lambda d: print(f"deleted item {args.id}"))


def cmd_shopping_list(args, client):
    data = _request(client, "GET", "/shopping/list")
    if args.json:
        _emit(data, True)
        return
    stores = _request(client, "GET", "/stores")
    store_names = {s["id"]: s["name"] for s in stores["stores"]}
    make_render_shopping(store_names)(data)


# --- parser -----------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="recipes", description=__doc__.splitlines()[0])
    p.add_argument("--api-url", default=os.environ.get("RECIPES_API_URL", DEFAULT_API_URL),
                   help="recipes-api base URL (env: RECIPES_API_URL)")
    sub = p.add_subparsers(dest="command", required=True)

    def add(name, handler, **kw):
        sp = sub.add_parser(name, **kw)
        sp.add_argument("--json", action="store_true", help="emit raw API JSON")
        sp.set_defaults(handler=handler)
        return sp

    d = sub.add_parser("dishes", help="dish operations")
    dsub = d.add_subparsers(dest="sub", required=True)

    def dadd(name, handler, **kw):
        sp = dsub.add_parser(name, **kw)
        sp.add_argument("--json", action="store_true")
        sp.set_defaults(handler=handler)
        return sp

    sp = dadd("list", cmd_dishes_list)
    sp.add_argument("--course", choices=["appetizer", "soup", "salad", "main", "side", "dessert", "beverage", "other"])
    sp = dadd("show", cmd_dishes_show); sp.add_argument("id", type=int)
    sp = dadd("create", cmd_dishes_create, help="create a dish from a DishCreate JSON file")
    sp.add_argument("--file", required=True, help="path to dish JSON, or '-' for stdin")
    sp = dadd("delete", cmd_dishes_delete); sp.add_argument("id", type=int)

    ig = sub.add_parser("ingredients", help="ingredient catalog operations")
    igsub = ig.add_subparsers(dest="sub", required=True)
    sp = igsub.add_parser("list"); sp.add_argument("--search"); sp.add_argument("--json", action="store_true")
    sp.set_defaults(handler=cmd_ingredients_list)
    sp = igsub.add_parser("set", help="update an ingredient (store, purchased, name, unit)")
    sp.add_argument("id", type=int)
    sp.add_argument("--name"); sp.add_argument("--unit"); sp.add_argument("--store-id", type=int)
    g = sp.add_mutually_exclusive_group()
    g.add_argument("--done", dest="done", action="store_const", const=True, default=None)
    g.add_argument("--undone", dest="done", action="store_const", const=False)
    sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_ingredients_set)

    st = sub.add_parser("stores", help="store operations")
    stsub = st.add_subparsers(dest="sub", required=True)
    sp = stsub.add_parser("list"); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_stores_list)
    sp = stsub.add_parser("create"); sp.add_argument("name"); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_stores_create)
    sp = stsub.add_parser("delete"); sp.add_argument("id", type=int); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_stores_delete)
    sp = stsub.add_parser("assign", help="assign ingredients to a store (bulk)")
    sp.add_argument("store_id", type=int); sp.add_argument("ingredient_ids", type=int, nargs="+")
    sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_stores_assign)

    it = sub.add_parser("items", help="manual shopping list items")
    itsub = it.add_subparsers(dest="sub", required=True)
    sp = itsub.add_parser("list"); sp.add_argument("--checked", type=lambda s: s == "true"); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_items_list)
    sp = itsub.add_parser("add"); sp.add_argument("name")
    sp.add_argument("--qty", type=float); sp.add_argument("--unit"); sp.add_argument("--category")
    sp.add_argument("--notes"); sp.add_argument("--dish-id", type=int); sp.add_argument("--store-id", type=int)
    sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_items_add)
    sp = itsub.add_parser("toggle"); sp.add_argument("id", type=int); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_items_toggle)
    sp = itsub.add_parser("delete"); sp.add_argument("id", type=int); sp.add_argument("--json", action="store_true"); sp.set_defaults(handler=cmd_items_delete)

    sh = sub.add_parser("shopping", help="consolidated shopping list")
    shsub = sh.add_subparsers(dest="sub", required=True)
    sp = shsub.add_parser("list")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(handler=cmd_shopping_list)

    return p


def main(argv: list[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    client = _client(args.api_url)
    try:
        args.handler(args, client)
    except ApiError as e:
        _fail(e)


if __name__ == "__main__":
    main()
