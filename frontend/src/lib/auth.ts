import { api } from './api';
import type { AuthTokens, LoginInput, RegisterInput, ApiResponse } from '@/types';

export const authApi = {
  register: async (data: RegisterInput): Promise<AuthTokens> => {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: LoginInput): Promise<AuthTokens> => {
    const res = await api.post<ApiResponse<AuthTokens>>('/auth/login', data);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },
};
