'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Theme } from '@/types';

export function useTheme() {
  const { theme, setTheme: setNextTheme } = useNextTheme();
  const { theme: storedTheme, setTheme: setStoreTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const updateThemeMutation = useMutation({
    mutationFn: (themePreference: Theme) =>
      api.patch('/users/profile', { themePreference }),
  });

  const setTheme = (newTheme: Theme) => {
    setNextTheme(newTheme);
    setStoreTheme(newTheme);
    if (isAuthenticated) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  // Sync on mount
  useEffect(() => {
    if (storedTheme && storedTheme !== theme) {
      setNextTheme(storedTheme);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    theme: (theme as Theme) ?? 'dark',
    setTheme,
    isDark: theme === 'dark',
  };
}
