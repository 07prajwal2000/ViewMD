import type { ThemeMode } from '../../types/theme';

export type MarkdownViewMode = 'edit' | 'split' | 'preview';

const THEME_KEY = 'viewmd_theme';
const VIEW_MODE_KEY = 'viewmd_view_mode';
const SIDEBAR_KEY = 'viewmd_sidebar_open';
const WRAP_TEXT_KEY = 'viewmd_wrap_text';

export function getStoredTheme(): ThemeMode {
  const val = localStorage.getItem(THEME_KEY);
  if (val === 'light' || val === 'dark' || val === 'system') {
    return val;
  }
  return 'system';
}

export function setStoredTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredViewMode(): MarkdownViewMode {
  const val = localStorage.getItem(VIEW_MODE_KEY);
  if (val === 'edit' || val === 'split' || val === 'preview') {
    return val;
  }
  return 'split';
}

export function setStoredViewMode(mode: MarkdownViewMode): void {
  localStorage.setItem(VIEW_MODE_KEY, mode);
}

export function getStoredSidebarOpen(): boolean {
  const val = localStorage.getItem(SIDEBAR_KEY);
  return val === null ? true : val === 'true';
}

export function setStoredSidebarOpen(isOpen: boolean): void {
  localStorage.setItem(SIDEBAR_KEY, String(isOpen));
}

export function getStoredWrapText(): boolean {
  const val = localStorage.getItem(WRAP_TEXT_KEY);
  return val === 'true'; // default to false
}

export function setStoredWrapText(wrap: boolean): void {
  localStorage.setItem(WRAP_TEXT_KEY, String(wrap));
}
