'use client';

import { useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth';
import { api } from '@/lib/api';
import type { User, ApiResponse, LoginInput, RegisterInput } from '@/types';

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    login,
    logout: storeLogout,
  } = useAuthStore();

  // Fetch profile on mount if we have a token
  const { isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>('/users/profile');

      const userData = res.data.data;

      useAuthStore.getState().setUser(userData);

      return userData;
    },
    enabled: !!accessToken && !user,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),

    onSuccess: async (tokens) => {
      // Fetch full user profile after login
      const res = await api.get<ApiResponse<User>>('/users/profile', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      // Create cookie for middleware auth check
      document.cookie =
        'sf_logged_in=true; path=/; max-age=86400';

      // Save auth state
      login(res.data.data, tokens.accessToken);

      // Force full reload so middleware receives cookie
      window.location.href = '/dashboard';
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),

    onSuccess: async (tokens) => {
      const res = await api.get<ApiResponse<User>>('/users/profile', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      // Create cookie for middleware auth check
      document.cookie =
        'sf_logged_in=true; path=/; max-age=86400';

      // Save auth state
      login(res.data.data, tokens.accessToken);

      // Force full reload so middleware receives cookie
      window.location.href = '/dashboard';
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),

    onSettled: () => {
      // Remove auth cookie
      document.cookie =
        'sf_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Clear store
      storeLogout();

      // Full reload
      window.location.href = '/login';
    },
  });

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    isAuthenticated,
    isLoading:
      isLoading || useAuthStore.getState().isLoading,

    loginMutation,
    registerMutation,

    logout: handleLogout,

    isLoggingOut: logoutMutation.isPending,
  };
}