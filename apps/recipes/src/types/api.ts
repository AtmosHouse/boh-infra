// Course types
export type CourseType =
  | 'appetizer'
  | 'soup'
  | 'salad'
  | 'main'
  | 'side'
  | 'dessert'
  | 'beverage'
  | 'other';

export const COURSE_LABELS: Record<CourseType, string> = {
  appetizer: '🥗 Appetizer',
  soup: '🍲 Soup',
  salad: '🥬 Salad',
  main: '🍽️ Main Course',
  side: '🥔 Side Dish',
  dessert: '🍰 Dessert',
  beverage: '🥤 Beverage',
  other: '📦 Other',
};

// =============================================================================
// Store Types
// =============================================================================

export interface StoreBase {
  name: string;
}

export type StoreCreate = StoreBase;

export interface StoreUpdate {
  name?: string;
}

export interface StoreResponse extends StoreBase {
  id: number;
  created_at: string;
}

export interface StoreListResponse {
  stores: StoreResponse[];
  total: number;
}

// =============================================================================
// Ingredient Types (base ingredient definitions)
// =============================================================================

export interface IngredientBase {
  name: string;
  store_id?: number;
  unit: string;
  is_purchased: boolean;
}

export type IngredientCreate = IngredientBase;

export interface IngredientUpdate {
  name?: string;
  store_id?: number;
  unit?: string;
  is_purchased?: boolean;
}

export interface IngredientResponse {
  id: number;
  name: string;
  store_id?: number;
  store?: StoreResponse;
  unit: string;
  is_purchased: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Ingredient Instance Types (ingredient usage in a dish)
// =============================================================================

export interface IngredientInstanceBase {
  ingredient_id: number;
  dish_id: number;
  quantity: number;
  unit?: string;
  notes?: string;
}

export type IngredientInstanceCreate = IngredientInstanceBase;

export interface IngredientInstanceUpdate {
  quantity?: number;
  unit?: string;
  notes?: string;
}

export interface IngredientInstanceResponse extends IngredientInstanceBase {
  id: number;
  created_at: string;
  ingredient: IngredientResponse;
}

// =============================================================================
// Dish Types
// =============================================================================

export interface DishBase {
  name: string;
  course: CourseType;
  description?: string;
  servings?: number;
  recipe_url?: string;
}

export interface DishIngredientInput {
  existing_ingredient_id?: number;
  name?: string;
  source_store?: string;
  unit?: string;
  quantity: number;
  notes?: string;
}

export interface DishCreate extends DishBase {
  ingredients?: DishIngredientInput[];
}

export interface DishUpdate {
  name?: string;
  course?: CourseType;
  description?: string;
  servings?: number;
  recipe_url?: string;
}

export interface DishSummary {
  id: number;
  name: string;
  course: CourseType;
  recipe_url?: string;
}

export interface DishIngredientResponse {
  id: number;
  ingredient_id: number;
  quantity: number;
  unit: string;
  notes: string | null;
  ingredient: IngredientResponse;
}

export interface DishResponse extends DishBase {
  id: number;
  created_at: string;
  updated_at: string;
  ingredient_instances: DishIngredientResponse[];
}

export interface DishListResponse {
  dishes: DishResponse[];
  total: number;
}

// =============================================================================
// Parsing Types
// =============================================================================

export interface ParsedIngredientItem {
  name: string;
  quantity: number | null;
  unit: string;
  notes: string;
  existing_ingredient_id: number | null;
  is_new: boolean;
  // Unit conversion fields (populated when matched to existing ingredient)
  converted_quantity: number | null;
  converted_unit: string | null;
}

export interface ParseIngredientsRequest {
  text: string;
}

export interface ParseIngredientsResponse {
  ingredients: ParsedIngredientItem[];
  count: number;
}

// Legacy ingredient type (for backwards compatibility)
export interface Ingredient {
  ingredient: string;
  qty: number | null;
  units: string | null;
  notes: string;
}

// =============================================================================
// Consolidated shopping list view (GET /shopping/list)
// =============================================================================

export interface ShoppingContribution {
  instance_id: number | null;
  item_id: number | null;
  dish_id: number | null;
  dish_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

export interface ShoppingListLineItem {
  key: string;
  ingredient_id: number | null;
  item_id: number | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  store_id: number | null;
  is_done: boolean;
  has_dish_items: boolean;
  contributions: ShoppingContribution[];
}

export interface ShoppingListViewResponse {
  items: ShoppingListLineItem[];
  total_items: number;
  done_count: number;
  conversions_applied: string[];
}

// Database-backed shopping list item types (manual items)
export interface ShoppingListItemCreate {
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
  dish_id?: number;
  store_id?: number;
}

export interface ShoppingListItemUpdate {
  ingredient_name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
  is_checked?: boolean;
  dish_id?: number;
  store_id?: number;
}

export interface ShoppingListItemResponse {
  id: number;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  notes: string | null;
  is_checked: boolean;
  dish: DishSummary | null;
  store_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItemsResponse {
  items: ShoppingListItemResponse[];
  total: number;
  checked_count: number;
}

// Recipe types
export interface RecipeInput {
  dish_name: string;
  recipe_text: string;
}

export interface ProcessRecipesRequest {
  recipes: RecipeInput[];
}

export interface DishIngredients {
  dish_name: string;
  ingredients: Ingredient[];
  count: number;
}

export interface ProcessRecipesResponse {
  dishes: DishIngredients[];
  total_ingredients: number;
}
