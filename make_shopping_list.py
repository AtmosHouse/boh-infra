#!/usr/bin/env python3
import csv
import argparse
from collections import defaultdict

def generate_shopping_list(input_path: str, output_path: str):
    # Use a dict keyed by (location, ingredient, units) to accumulate totals
    totals = defaultdict(lambda: {"quantity": 0.0, "price": 0.0})

    with open(input_path, newline='') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            # skip items already bought
            done = row["Done?"].strip().lower()
            if done in ("1", "true", "yes"):
                continue

            key = (row["Location"], row["Ingredient"], row["Units"])
            # handle quantities -- default to zero if not parsible
            try:
                qty = float(row["Qty"])
            except Exception as e:
                qty = 0.0
            price = float(row["Price"] if row["Price"] else 0)
            totals[key]["quantity"] += qty
            totals[key]["price"] += price

    # write out the aggregated shopping list
    with open(output_path, "w", newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(["Location", "Ingredient", "Qty", "Units", "Price"])
        for (loc, ing, unit), vals in sorted(totals.items()):
            writer.writerow([loc, ing, vals["quantity"], unit, vals["price"]])

def main():
    parser = argparse.ArgumentParser(
        description="Generate a shopping list CSV from a master ingredients CSV."
    )
    parser.add_argument(
        "input_csv",
        help="Path to master CSV with columns: dish,ingredient,quantity,units,location,done,price"
    )
    parser.add_argument(
        "output_csv",
        help="Path where the aggregated shopping list CSV should be written"
    )
    args = parser.parse_args()
    generate_shopping_list(args.input_csv, args.output_csv)

if __name__ == "__main__":
    main()

