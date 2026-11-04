import axios from 'axios';
import type {
  ChatListResponse,
  ChatMessageCreate,
  ChatMessageResponse,
  PlusOneCreate,
  RSVPListResponse,
  RSVPResponse,
  UserCreate,
  UserResponse,
  UserUpdate,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
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

  // Chat endpoints
  getChatMessages: async (skip = 0, limit = 100): Promise<ChatListResponse> => {
    const response = await apiClient.get<ChatListResponse>('/chat', {
      params: { skip, limit },
    });
    return response.data;
  },

  sendChatMessage: async (userId: string, message: ChatMessageCreate): Promise<ChatMessageResponse> => {
    const response = await apiClient.post<ChatMessageResponse>('/chat', message, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get<{ status: string }>('/health');
    return response.data;
  },
};

export default api;
