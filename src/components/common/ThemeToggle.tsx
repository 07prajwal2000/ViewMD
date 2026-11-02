import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeMode } from '../../types/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-blue-400" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="w-4 h-4 text-gray-400" /> },
  ];

  const currentIcon =
    theme === 'light' ? (
      <Sun className="w-4 h-4 text-amber-500" />
    ) : theme === 'dark' ? (
      <Moon className="w-4 h-4 text-blue-400" />
    ) : (
      <Laptop className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    );

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 cursor-pointer flex items-center justify-center"
        title={`Theme: ${theme}`}
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 text-xs">
          {options.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                setTheme(opt.mode);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors cursor-pointer ${
                theme === opt.mode
                  ? 'font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
