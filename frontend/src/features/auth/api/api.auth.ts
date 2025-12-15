import { axiosInstance } from '@/api/instance.ts';
import { LOGIN, REGISTER } from '@/features/auth/api/api.const.ts';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/model';

export const register = async ({
  email,
  username,
  password,
}: RegisterRequest): Promise<RegisterResponse> => {
  const { data } = await axiosInstance.post<RegisterResponse>(REGISTER, {
    email,
    username,
    password,
  });

  return data;
};

export const login = async ({
  email,
  username,
  password,
}: LoginRequest): Promise<string> => {
  const { data } = await axiosInstance.post<string>(LOGIN, {
    email,
    username,
    password,
  });

  return data;
};
