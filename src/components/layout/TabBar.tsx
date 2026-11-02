import React from 'react';
import { X, FileText, File } from 'lucide-react';
import { useTabs } from '../../context/TabsContext';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab } = useTabs();

  if (tabs.length === 0) {
    return null;
  }

  const getTabIcon = (name: string) => {
    if (name.endsWith('.pdf')) {
      return <File className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  };

  return (
    <div className="h-9 border-b border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-[#161b22] flex items-center overflow-x-auto select-none no-scrollbar shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                // Middle click closes tab
                e.preventDefault();
                closeTab(tab.id);
              }
            }}
            className={`group relative flex items-center gap-2 px-3 h-full border-r border-gray-200 dark:border-gray-800/80 text-xs cursor-pointer transition-colors max-w-[200px] shrink-0 ${
              isActive
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            {/* Active top border highlight */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}

            {getTabIcon(tab.name)}
            <span className="truncate">{tab.name}</span>

            {/* Dirty indicator or Close button */}
            <div className="flex items-center ml-1">
              {tab.isDirty ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="w-4 h-4 flex items-center justify-center rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Unsaved changes (click to close)"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:hidden" />
                  <X className="w-3 h-3 hidden group-hover:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
