import type { PresentationTheme, PresentationThemeId } from './types';

export const PRESENTATION_THEMES: Record<PresentationThemeId, PresentationTheme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    isDark: true,
    bgClass: 'bg-[#0a0f1d]',
    textClass: 'text-slate-200',
    headingClass: 'text-white font-extrabold tracking-tight',
    accentColor: '#38bdf8',
    codeTheme: 'dark',
    containerStyle: {
      backgroundColor: '#0a0f1d',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    slideStyle: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    isDark: true,
    bgClass: 'bg-[#1a1b26]',
    textClass: 'text-[#c0caf5]',
    headingClass: 'text-[#7aa2f7] font-bold tracking-tight',
    accentColor: '#bb9af7',
    codeTheme: 'dark',
    containerStyle: {
      backgroundColor: '#1a1b26',
      color: '#c0caf5',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    slideStyle: {
      borderColor: 'rgba(122, 162, 247, 0.15)',
    },
  },
  mocha: {
    id: 'mocha',
    name: 'Mocha',
    isDark: true,
    bgClass: 'bg-[#1e1e2e]',
    textClass: 'text-[#cdd6f4]',
    headingClass: 'text-[#f5c2e7] font-bold tracking-tight',
    accentColor: '#cba6f7',
    codeTheme: 'dark',
    containerStyle: {
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    slideStyle: {
      borderColor: 'rgba(203, 166, 247, 0.15)',
    },
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    isDark: false,
    bgClass: 'bg-[#faf8f5]',
    textClass: 'text-[#1c1917]',
    headingClass: 'text-[#1c1917] font-serif font-bold tracking-tight',
    accentColor: '#d97706',
    codeTheme: 'light',
    containerStyle: {
      backgroundColor: '#faf8f5',
      color: '#1c1917',
      fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
    },
    slideStyle: {
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
  },
  daylight: {
    id: 'daylight',
    name: 'Daylight',
    isDark: false,
    bgClass: 'bg-[#f8fafc]',
    textClass: 'text-[#0f172a]',
    headingClass: 'text-[#0f172a] font-extrabold tracking-tight',
    accentColor: '#2563eb',
    codeTheme: 'light',
    containerStyle: {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    slideStyle: {
      borderColor: 'rgba(0, 0, 0, 0.06)',
    },
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    isDark: true,
    bgClass: 'bg-[#000000]',
    textClass: 'text-[#e5e5e5]',
    headingClass: 'text-white font-extrabold tracking-tight',
    accentColor: '#a3e635',
    codeTheme: 'dark',
    containerStyle: {
      backgroundColor: '#000000',
      color: '#e5e5e5',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    slideStyle: {
      borderColor: 'rgba(163, 230, 53, 0.2)',
    },
  },
};

export function getTheme(themeId?: string): PresentationTheme {
  if (themeId && themeId in PRESENTATION_THEMES) {
    return PRESENTATION_THEMES[themeId as PresentationThemeId];
  }
  return PRESENTATION_THEMES.midnight;
}
