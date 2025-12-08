import axios from 'axios';
import type {
  CourseType,
  DishCreate,
  DishListResponse,
  DishResponse,
  DishUpdate,
  IngredientCreate,
  IngredientResponse,
  IngredientUpdate,
  IngredientInstanceCreate,
  IngredientInstanceResponse,
  IngredientInstanceUpdate,
  ParseIngredientsRequest,
  ParseIngredientsResponse,
  PlusOneCreate,
  ProcessRecipesRequest,
  ProcessRecipesResponse,
  RSVPListResponse,
  RSVPResponse,
  ShoppingListItemCreate,
  ShoppingListItemResponse,
  ShoppingListItemsResponse,
  ShoppingListItemUpdate,
  ShoppingListRequest,
  ShoppingListResponse,
  StoreCreate,
  StoreListResponse,
  StoreResponse,
  StoreUpdate,
  UserCreate,
  UserResponse,
  UserUpdate,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.4.43:10000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dish endpoints
  createDish: async (dish: DishCreate): Promise<DishResponse> => {
    const response = await apiClient.post<DishResponse>('/dishes/', dish);
    return response.data;
  },

  listDishes: async (params?: {
    skip?: number;
    limit?: number;
    course?: CourseType;
  }): Promise<DishListResponse> => {
    const response = await apiClient.get<DishListResponse>('/dishes/', { params });
    return response.data;
  },

  getDish: async (dishId: number): Promise<DishResponse> => {
    const response = await apiClient.get<DishResponse>(`/dishes/${dishId}`);
    return response.data;
  },

  updateDish: async (dishId: number, dish: DishUpdate): Promise<DishResponse> => {
    const response = await apiClient.put<DishResponse>(`/dishes/${dishId}`, dish);
    return response.data;
  },

  deleteDish: async (dishId: number): Promise<void> => {
    await apiClient.delete(`/dishes/${dishId}`);
  },

  // Ingredient endpoints (base ingredients)
  createIngredient: async (ingredient: IngredientCreate): Promise<IngredientResponse> => {
    const response = await apiClient.post<IngredientResponse>('/ingredients/', ingredient);
    return response.data;
  },

  listIngredients: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<IngredientResponse[]> => {
    const response = await apiClient.get<IngredientResponse[]>('/ingredients/', { params });
    return response.data;
  },

  getIngredient: async (ingredientId: number): Promise<IngredientResponse> => {
    const response = await apiClient.get<IngredientResponse>(`/ingredients/${ingredientId}`);
    return response.data;
  },

  updateIngredient: async (
    ingredientId: number,
    ingredient: IngredientUpdate
  ): Promise<IngredientResponse> => {
    const response = await apiClient.put<IngredientResponse>(
      `/ingredients/${ingredientId}`,
      ingredient
    );
    return response.data;
  },

  deleteIngredient: async (ingredientId: number): Promise<void> => {
    await apiClient.delete(`/ingredients/${ingredientId}`);
  },

  // Ingredient instance endpoints (ingredient usage in dishes)
  createIngredientInstance: async (
    instance: IngredientInstanceCreate
  ): Promise<IngredientInstanceResponse> => {
    const response = await apiClient.post<IngredientInstanceResponse>(
      '/ingredients/instances',
      instance
    );
    return response.data;
  },

  updateIngredientInstance: async (
    instanceId: number,
    update: IngredientInstanceUpdate
  ): Promise<IngredientInstanceResponse> => {
    const response = await apiClient.put<IngredientInstanceResponse>(
      `/ingredients/instances/${instanceId}`,
      update
    );
    return response.data;
  },

  deleteIngredientInstance: async (instanceId: number): Promise<void> => {
    await apiClient.delete(`/ingredients/instances/${instanceId}`);
  },

  // Parsing endpoint
  parseIngredients: async (request: ParseIngredientsRequest): Promise<ParseIngredientsResponse> => {
    const response = await apiClient.post<ParseIngredientsResponse>('/ingredients/parse', request);
    return response.data;
  },

  // Shopping list endpoints (consolidation)
  generateShoppingList: async (request: ShoppingListRequest): Promise<ShoppingListResponse> => {
    const response = await apiClient.post<ShoppingListResponse>('/shopping/generate', request);
    return response.data;
  },

  // Shopping list item endpoints (database-backed)
  createShoppingItem: async (item: ShoppingListItemCreate): Promise<ShoppingListItemResponse> => {
    const response = await apiClient.post<ShoppingListItemResponse>('/shopping/items', item);
    return response.data;
  },

  listShoppingItems: async (params?: {
    skip?: number;
    limit?: number;
    checked?: boolean;
    dish_id?: number;
  }): Promise<ShoppingListItemsResponse> => {
    const response = await apiClient.get<ShoppingListItemsResponse>('/shopping/items', { params });
    return response.data;
  },

  getShoppingItem: async (itemId: number): Promise<ShoppingListItemResponse> => {
    const response = await apiClient.get<ShoppingListItemResponse>(`/shopping/items/${itemId}`);
    return response.data;
  },

  updateShoppingItem: async (itemId: number, item: ShoppingListItemUpdate): Promise<ShoppingListItemResponse> => {
    const response = await apiClient.put<ShoppingListItemResponse>(`/shopping/items/${itemId}`, item);
    return response.data;
  },

  deleteShoppingItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/shopping/items/${itemId}`);
  },

  toggleShoppingItem: async (itemId: number): Promise<ShoppingListItemResponse> => {
    const response = await apiClient.patch<ShoppingListItemResponse>(`/shopping/items/${itemId}/toggle`);
    return response.data;
  },

  // Recipe endpoints
  processRecipes: async (request: ProcessRecipesRequest): Promise<ProcessRecipesResponse> => {
    const response = await apiClient.post<ProcessRecipesResponse>('/recipes/process', request);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get<{ status: string }>('/health');
    return response.data;
  },

  // Store endpoints
  listStores: async (): Promise<StoreListResponse> => {
    const response = await apiClient.get<StoreListResponse>('/stores');
    return response.data;
  },

  createStore: async (store: StoreCreate): Promise<StoreResponse> => {
    const response = await apiClient.post<StoreResponse>('/stores', store);
    return response.data;
  },

  updateStore: async (storeId: number, store: StoreUpdate): Promise<StoreResponse> => {
    const response = await apiClient.put<StoreResponse>(`/stores/${storeId}`, store);
    return response.data;
  },

  deleteStore: async (storeId: number): Promise<void> => {
    await apiClient.delete(`/stores/${storeId}`);
  },

  // User & RSVP endpoints
  getUser: async (userId: string): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  createUser: async (user: UserCreate): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/users', user);
    return response.data;
  },

  updateUser: async (userId: string, user: UserUpdate): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(`/users/${userId}`, user);
    return response.data;
  },

  listUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>('/users');
    return response.data;
  },

  getRSVPList: async (): Promise<RSVPListResponse> => {
    const response = await apiClient.get<RSVPListResponse>('/users/rsvp-list');
    return response.data;
  },

  rsvp: async (userId: string): Promise<RSVPResponse> => {
    const response = await apiClient.post<RSVPResponse>(`/users/${userId}/rsvp`);
    return response.data;
  },

  getPlusOne: async (userId: string): Promise<UserResponse | null> => {
    const response = await apiClient.get<UserResponse | null>(`/users/${userId}/plus-one`);
    return response.data;
  },

  addPlusOne: async (userId: string, plusOne: PlusOneCreate): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>(`/users/${userId}/plus-one`, plusOne);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};

export default api;
