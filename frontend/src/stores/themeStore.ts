import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      resolvedTheme: 'light',
      setMode: (mode) => set({ mode }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    { name: 'avt-theme' }
  )
);

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  let resolved: 'light' | 'dark' = 'light';

  if (mode === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = mode;
  }

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  useThemeStore.getState().setResolvedTheme(resolved);
  return resolved;
}
