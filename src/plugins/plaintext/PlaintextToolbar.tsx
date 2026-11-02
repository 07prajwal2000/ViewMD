import React from 'react';
import { Save, AlignLeft } from 'lucide-react';
import type { ViewerHeaderActionProps } from '../../types/plugin';

export const PlaintextToolbar: React.FC<ViewerHeaderActionProps> = ({ tab, onSave }) => {
  const text = typeof tab.content === 'string' ? tab.content : '';
  const lines = text.split('\n').length;
  const chars = text.length;

  return (
    <div className="flex items-center gap-2 select-none text-xs">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
        <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
        <span>Plain Text</span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span>{lines} {lines === 1 ? 'line' : 'lines'}</span>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span>{chars > 1024 ? `${(chars / 1024).toFixed(1)} KB` : `${chars} chars`}</span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!tab.isDirty}
        title={tab.isDirty ? 'Save to disk (Ctrl+S)' : 'All changes saved to disk'}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
          tab.isDirty
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
            : 'bg-transparent text-gray-400 dark:text-gray-500 cursor-default opacity-60'
        }`}
      >
        <Save className="w-3.5 h-3.5" />
        <span>{tab.isDirty ? 'Save' : 'Saved'}</span>
      </button>
    </div>
  );
};
