import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      login: (user, accessToken) => {
  document.cookie = "sf_logged_in=true; path=/; max-age=86400";

  window.location.href = "/dashboard";

  set({
    user,
    accessToken,
    isAuthenticated: true,
    isLoading: false
  });
},

logout: () => {
  document.cookie =
    "sf_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  window.location.href = "/login";

  set({
    user: null,
    accessToken: null,
    isAuthenticated: false
  });
},
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'Vodys-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.accessToken;
          state.isLoading = false;
        }
      },
    }
  )
);
