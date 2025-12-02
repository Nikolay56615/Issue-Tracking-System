export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  username: string;
}
