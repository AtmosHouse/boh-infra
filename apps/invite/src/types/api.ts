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

// =============================================================================
// Chat Types
// =============================================================================

export interface ChatMessageCreate {
  message: string;
}

export interface ChatMessageResponse {
  id: number;
  user_id: string;
  message: string;
  created_at: string;
  user_first_name: string;
  user_last_name: string;
}

export interface ChatListResponse {
  messages: ChatMessageResponse[];
  total: number;
}
