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

export interface StoreCreate extends StoreBase {}

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

export interface IngredientCreate extends IngredientBase {}

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
  notes?: string;
}

export interface IngredientInstanceCreate extends IngredientInstanceBase {}

export interface IngredientInstanceUpdate {
  quantity?: number;
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

// Shopping types
export interface ShoppingItem {
  ingredient: string;
  quantity: number;
  units: string;
  location?: string;
  price?: number;
  done?: boolean;
  notes?: string;
  dish_id?: number;
}

export interface DataDefaults {
  quantity: number;
  price: number;
  location: string;
  units: string;
  ingredient: string;
}

export interface ShoppingListRequest {
  items: ShoppingItem[];
  defaults?: DataDefaults;
  enable_unit_conversion?: boolean;
}

export interface ConsolidatedItem {
  location: string;
  ingredient: string;
  quantity: number;
  units: string;
  price: number;
}

export interface ValidationWarning {
  row: number;
  message: string;
}

export interface ShoppingListResponse {
  items: ConsolidatedItem[];
  total_items: number;
  warnings: ValidationWarning[];
  conversions_applied: string[];
}

// Database-backed shopping list item types
export interface ShoppingListItemCreate {
  ingredient_name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
  dish_id?: number;
}

export interface ShoppingListItemUpdate {
  ingredient_name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
  is_checked?: boolean;
  dish_id?: number;
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

// =============================================================================
// User & RSVP Types
// =============================================================================

export interface UserBase {
  first_name: string;
  last_name: string;
}

export interface UserCreate extends UserBase {
  original_invitee_id?: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
}

export interface UserResponse extends UserBase {
  id: string;
  has_rsvped: boolean;
  original_invitee_id?: string;
  created_at: string;
  rsvped_at?: string;
}

export interface UserPublicResponse {
  id: string;
  first_name: string;
  last_name: string;
  has_rsvped: boolean;
  rsvped_at?: string;
  is_plus_one: boolean;
}

export interface RSVPListResponse {
  users: UserPublicResponse[];
  total: number;
  total_rsvped: number;
}

export interface RSVPResponse {
  success: boolean;
  message: string;
  user: UserResponse;
}

export interface PlusOneCreate {
  first_name: string;
  last_name: string;
}
