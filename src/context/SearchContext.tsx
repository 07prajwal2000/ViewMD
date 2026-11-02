import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type SearchMode = 'files' | 'content';

interface SearchContextType {
  isOpen: boolean;
  mode: SearchMode;
  query: string;
  setQuery: (q: string) => void;
  openSearch: (mode?: SearchMode, initialQuery?: string) => void;
  closeSearch: () => void;
  toggleSearch: (mode?: SearchMode) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>('files');
  const [query, setQuery] = useState('');

  const openSearch = useCallback((newMode?: SearchMode, initialQuery?: string) => {
    if (newMode) setMode(newMode);
    if (initialQuery !== undefined) setQuery(initialQuery);
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSearch = useCallback((newMode?: SearchMode) => {
    setIsOpen((prev) => {
      if (!prev) {
        if (newMode) setMode(newMode);
        return true;
      }
      if (newMode && newMode !== mode) {
        setMode(newMode);
        return true;
      }
      return false;
    });
  }, [mode]);

  // Global keyboard shortcuts:
  // Ctrl+P / Cmd+P -> Quick Open (Files)
  // Ctrl+Shift+F / Cmd+Shift+F -> Find in Files (Content)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearch('content');
      } else if (modifier && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openSearch('files');
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  return (
    <SearchContext.Provider
      value={{
        isOpen,
        mode,
        query,
        setQuery,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
