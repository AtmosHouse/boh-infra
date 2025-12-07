# Dinner Party Utility 🍽️

Tools for converting natural language recipe ingredients into structured shopping lists.

## Features

✅ **LLM-Powered Ingredient Parsing**: Convert recipe text into structured data using AI

✅ **Multi-Recipe Processing**: Process entire folders of recipes at once

✅ **Smart Shopping List Generation**: Consolidates ingredients across multiple dishes

✅ **Robust Data Validation**: Handles missing, invalid, or malformed data gracefully

✅ **Intelligent Unit Conversion**: Automatically converts and aggregates different units (e.g., "8 oz" + "1 cup" → "2 cups")

✅ **Ingredient Deduplication**: Combines duplicate ingredients within and across recipes

## Quick Start

### Prerequisites
- Python 3.7 or higher

### Installation
```bash
git clone <your-repo-url>
cd boh-infra
pip install -r requirements.txt
```

Configure your LLM endpoint in `make_ingredient_list.py` or set:
```bash
export OPENAI_API_KEY='your-key-here'
```

### Basic Usage

**Process multiple recipes at once (recommended):**
```bash
python process_recipes.py recipes/ -o ingredients.csv --shopping-list shopping.csv
```

**Process a single recipe:**
```bash
python make_ingredient_list.py recipe.txt -d "Mushroom Wellington" ingredients.csv
```

**Consolidate into shopping list:**
```bash
python make_shopping_list.py ingredients.csv shopping.csv
```

## Workflow

### 1. Collect Recipes

Create a folder with your recipe text files. Recipes can be in any natural language format:

```
recipes/
  wellington.txt
  salad.txt
  config.yaml
```

**Example recipe file (`wellington.txt`):**
```
For the Filling
2 lbs ground beef
1 large onion, diced
3 cloves garlic, minced
Salt and pepper to taste

For the Sauce
1 cup tomato sauce
2 tablespoons olive oil
```

### 2. Create Config File

Create `config.yaml` mapping dish names to recipe files:

```yaml
dishes:
  "Beef Wellington": "wellington.txt"
  "Caesar Salad": "salad.txt"
```

### 3. Generate Ingredient List

```bash
python process_recipes.py recipes/ -o ingredients.csv
```

This will:
- Parse each recipe using the LLM
- Normalize ingredient names (e.g., "fresh rosemary" → "rosemary")
- Deduplicate ingredients within each recipe
- Output a unified CSV with all dishes

### 4. Fill In Details

Open `ingredients.csv` and add:
- `Location` (e.g., "Grocery Store", "Butcher", "Costco")
- `Price` estimates (optional)

### 5. Generate Shopping List

```bash
python make_shopping_list.py ingredients.csv shopping.csv
```

Or do steps 3-5 in one command:
```bash
python process_recipes.py recipes/ -o ingredients.csv --shopping-list shopping.csv
```

## Scripts Reference

### `make_ingredient_list.py` - Parse Single Recipe

```bash
# From a text file
python make_ingredient_list.py recipe.txt -d "Dish Name" output.csv

# From direct text
python make_ingredient_list.py "2 lbs tomatoes, garlic" -d "Pasta" output.csv

# From stdin
cat recipe.txt | python make_ingredient_list.py - -d "Soup" output.csv
```

### `process_recipes.py` - Process Multiple Recipes

```bash
# Basic usage
python process_recipes.py recipes/ -o ingredients.csv

# With shopping list generation
python process_recipes.py recipes/ -o ingredients.csv --shopping-list shopping.csv

# Custom config file name
python process_recipes.py recipes/ -o ingredients.csv --config my_config.yaml
```

### `make_shopping_list.py` - Consolidate Shopping List

```bash
python make_shopping_list.py ingredients.csv shopping.csv
```

## CSV Formats

### Ingredient List (output of parsing)

| Column | Description |
|--------|-------------|
| `Dish` | Name of the dish |
| `Ingredient` | Ingredient name |
| `Qty` | Quantity (blank if unspecified) |
| `Units` | Unit of measurement (blank if unspecified) |
| `Location` | Where to buy (fill in manually) |
| `Done?` | Already purchased? (default: False) |
| `Price` | Cost (fill in manually) |
| `Notes` | Preparation notes, sizes, etc. |

### Shopping List (output of consolidation)

| Column | Description |
|--------|-------------|
| `Location` | Store/location |
| `Ingredient` | Consolidated ingredient name |
| `Qty` | Total quantity needed |
| `Units` | Unit of measurement |
| `Price` | Total estimated cost |

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
| `--disable-unit-conversion` | Disable automatic unit conversion | False (conversion enabled) |

### Unit Conversion Features

The script automatically converts and aggregates ingredients with different units:

**Supported Conversions:**
- **Volume Units**: cups, tablespoons, teaspoons, fluid ounces
- **Weight Units**: pounds, ounces, grams, kilograms
- **Count Units**: each, cloves, heads, bunches, packages, containers, bottles, loaves
- **Special Units**: sticks (butter = 4 oz)

**Ingredient-Specific Conversions:**
- **Sugar**: 1 cup ≈ 7.05 oz
- **Flour**: 1 cup ≈ 4.25 oz
- **Butter**: 1 cup ≈ 8 oz, 1 stick = 4 oz

**Example Conversions:**
```
Milk: 8 fl oz + 1 cup → 2 cups
Flour: 2 lbs + 16 oz → 3 pounds
Sugar: 1 cup + 8 oz → 2.13 cups
Butter: 1 stick + 4 oz → 0.5 pounds
```

**Disable Unit Conversion:**
```bash
python3 make_shopping_list.py ingredients.csv shopping_list.csv --disable-unit-conversion
```

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

Unit Conversions Applied:
  ✓ Milk: 8.0 fl oz + 1.0 cup → 2 cups
  ✓ Flour: 2.0 lbs + 16.0 oz → 3 pounds
  ✓ Sugar: 1.0 cup + 8.0 oz → 2.13 cups

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

## Repository Structure

```
boh-infra/
├── process_recipes.py         # Multi-recipe processor (main entry point)
├── make_ingredient_list.py    # Single recipe parser (LLM-powered)
├── make_shopping_list.py      # Shopping list consolidator
├── requirements.txt           # Python dependencies
├── example_ingredients.csv    # Sample ingredient CSV
└── README.md                  # This documentation
```

## License

MIT License - feel free to use and modify for your own dinner parties! 🎉
