import React from 'react';
import { Edit3, Columns, Eye, Save } from 'lucide-react';
import type { ViewerHeaderActionProps } from '../../types/plugin';
import { getStoredViewMode, setStoredViewMode, type MarkdownViewMode } from '../../services/storage/settings';

interface MarkdownToolbarProps extends ViewerHeaderActionProps {
  viewMode?: MarkdownViewMode;
  onViewModeChange?: (mode: MarkdownViewMode) => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  tab,
  onSave,
  viewMode: propViewMode,
  onViewModeChange,
}) => {
  const [internalMode, setInternalMode] = React.useState<MarkdownViewMode>(getStoredViewMode());
  const currentMode = propViewMode ?? internalMode;

  const handleModeChange = (mode: MarkdownViewMode) => {
    setStoredViewMode(mode);
    setInternalMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    // Also dispatch a custom event so the viewer component can react immediately
    window.dispatchEvent(new CustomEvent('viewmd:viewmode-change', { detail: mode }));
  };

  return (
    <div className="flex items-center gap-2">
      {/* 3-Switch Segment Control */}
      <div className="flex items-center bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs select-none">
        <button
          type="button"
          onClick={() => handleModeChange('edit')}
          title="Editor Only"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            currentMode === 'edit'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('split')}
          title="Split View (Edit & Preview)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            currentMode === 'split'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('preview')}
          title="Preview Only"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            currentMode === 'preview'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={onSave}
        disabled={!tab.isDirty}
        title={tab.isDirty ? 'Save to disk (Ctrl+S)' : 'All changes saved to disk'}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all ${
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
