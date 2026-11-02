import React, { createContext, useContext, useState } from 'react';
import { getStoredWrapText, setStoredWrapText } from '../services/storage/settings';

interface EditorSettingsContextType {
  isWrapText: boolean;
  toggleWrapText: () => void;
}

const EditorSettingsContext = createContext<EditorSettingsContextType | undefined>(undefined);

export const EditorSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWrapText, setIsWrapText] = useState<boolean>(getStoredWrapText);

  const toggleWrapText = () => {
    setIsWrapText((prev) => {
      const next = !prev;
      setStoredWrapText(next);
      return next;
    });
  };

  return (
    <EditorSettingsContext.Provider value={{ isWrapText, toggleWrapText }}>
      {children}
    </EditorSettingsContext.Provider>
  );
};

export function useEditorSettings(): EditorSettingsContextType {
  const context = useContext(EditorSettingsContext);
  if (!context) {
    throw new Error('useEditorSettings must be used within EditorSettingsProvider');
  }
  return context;
}
