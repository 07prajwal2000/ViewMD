import React from 'react';
import { WrapText } from 'lucide-react';
import { useEditorSettings } from '../../context/EditorSettingsContext';

export const WrapToggle: React.FC = () => {
  const { isWrapText, toggleWrapText } = useEditorSettings();

  return (
    <button
      type="button"
      onClick={toggleWrapText}
      className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center ${
        isWrapText
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={isWrapText ? 'Word Wrap: ON (click to disable)' : 'Word Wrap: OFF (click to enable)'}
    >
      <WrapText className="w-4 h-4" />
    </button>
  );
};
