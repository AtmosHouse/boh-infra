# Dinner Party Utility 🍽️

A collection of scripts to help organize and host dinner parties better! This utility takes a CSV of ingredients organized by dish and creates a consolidated shopping list with robust data validation and customizable defaults.

## Features

✅ **Smart Shopping List Generation**: Consolidates ingredients across multiple dishes
✅ **Robust Data Validation**: Handles missing, invalid, or malformed data gracefully
✅ **Configurable Defaults**: Customize default values for missing data
✅ **Data Quality Reporting**: Get detailed warnings about data issues
✅ **Flexible Input Handling**: Works with real-world messy CSV data
🚧 **Unit Conversion** (Coming Soon): Automatically convert and aggregate different units

## Quick Start

### Prerequisites
- Python 3.7 or higher
- No external dependencies required (uses Python standard library)

### Installation
```bash
git clone <your-repo-url>
cd boh-infra
```

### Basic Usage
```bash
# Try it with the included example
python3 make_shopping_list.py example_ingredients.csv my_shopping_list.csv

# Or use your own CSV file
python3 make_shopping_list.py ingredients.csv shopping_list.csv
```

## Input CSV Format

Your input CSV should have the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `Ingredient` | Name of the ingredient | Yes | "Tomatoes" |
| `Qty` | Quantity needed | No* | "2" or "1.5" |
| `Units` | Unit of measurement | No* | "lbs", "cups", "each" |
| `Location` | Where to buy it | No* | "Grocery Store" |
| `Done?` | Already purchased? | No | "yes", "no", "true", "1" |
| `Price` | Cost per unit | No | "3.50" |

*\*Fields marked as "No" will use configurable default values when missing*

### Example Input CSV
```csv
Ingredient,Qty,Units,Location,Done?,Price
Tomatoes,2,lbs,Grocery Store,no,3.50
Onions,,each,Grocery Store,no,0.75
Garlic,1,head,Grocery Store,no,1.25
Olive Oil,1,bottle,Grocery Store,yes,8.99
Salt,,,,no,
```

## Advanced Usage

### Configurable Defaults

Customize default values for missing or invalid data:

```bash
# Use custom defaults
python3 make_shopping_list.py ingredients.csv shopping_list.csv \
  --default-location "Whole Foods" \
  --default-quantity 2.0 \
  --default-units "package" \
  --default-price 5.0
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--default-quantity` | Default quantity for missing/invalid values | 1.0 |
| `--default-price` | Default price for missing/invalid values | 0.0 |
| `--default-location` | Default store location for missing values | "Unknown" |
| `--default-units` | Default units for missing values | "each" |
| `--default-ingredient` | Default ingredient name for missing values | "Unknown Item" |

### Data Validation Features

The script provides comprehensive data validation:

- **Missing Data Handling**: Uses configurable defaults for missing fields
- **Invalid Quantity Detection**: Handles non-numeric quantities gracefully
- **Negative Value Protection**: Prevents negative quantities and prices
- **Critical Data Validation**: Skips rows missing essential information
- **Detailed Reporting**: Shows exactly what data issues were found

### Example Output

```
Data Validation Summary:
  Total rows processed: 11
  Rows skipped: 1
  Warnings generated: 4

Warnings:
  ⚠️  Row 5: Invalid quantity 'invalid_qty', using default (1.0)
  ⚠️  Row 6: Missing location, using 'Unknown'
  ⚠️  Row 8: Missing ingredient name
  ⚠️  Row 8: Skipping row due to missing critical data

Shopping list written to: shopping_list.csv
Total unique items: 8
```

## Output Format

The generated shopping list CSV contains:

| Column | Description |
|--------|-------------|
| `Location` | Store/location to buy from |
| `Ingredient` | Consolidated ingredient name |
| `Qty` | Total quantity needed (aggregated) |
| `Units` | Unit of measurement |
| `Price` | Total estimated cost |

### Example Output CSV
```csv
Location,Ingredient,Qty,Units,Price
Grocery Store,Tomatoes,3.5,lbs,6.25
Grocery Store,Onions,1.0,each,0.75
Grocery Store,Garlic,1.0,head,1.25
Unknown,Salt,1.0,each,0.0
```

## How It Works

1. **Data Loading**: Reads your ingredient CSV with robust error handling
2. **Validation**: Validates each field and applies defaults where needed
3. **Aggregation**: Combines identical ingredients (same location, name, and units)
4. **Consolidation**: Sums quantities and prices for duplicate items
5. **Output**: Generates a clean shopping list sorted by location and ingredient

## Roadmap

- [ ] **Unit Conversion**: Automatically convert between units (e.g., "8 oz" + "1 cup" = "2 cups")
- [ ] **Smart Ingredient Matching**: Handle variations in ingredient names
- [ ] **Store-specific Optimization**: Organize by store layout/aisles
- [ ] **Price Tracking**: Integration with grocery store APIs
- [ ] **Recipe Integration**: Direct import from recipe websites

## Repository Structure

```
boh-infra/
├── make_shopping_list.py      # Main script
├── requirements.txt           # Python dependencies
├── example_ingredients.csv    # Sample input file
└── README.md                 # This documentation
```

## Contributing

This is a personal utility script, but suggestions and improvements are welcome!

## License

MIT License - feel free to use and modify for your own dinner parties! 🎉
