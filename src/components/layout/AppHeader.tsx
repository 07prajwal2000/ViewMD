import React from 'react';
import { PanelLeft, Search } from 'lucide-react';
import { ViewMDLogo } from '../common/ViewMDLogo';
import { RecentsDropdown } from '../common/RecentsDropdown';
import { ThemeToggle } from '../common/ThemeToggle';
import { WrapToggle } from '../common/WrapToggle';
import { useTabs } from '../../context/TabsContext';
import { useSearch } from '../../context/SearchContext';
import { pluginRegistry } from '../../plugins';
import type { ViewerHeaderActionProps } from '../../types/plugin';

interface AppHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const { activeTab, saveTab, saveActiveFile } = useTabs();
  const { openSearch } = useSearch();

  // Determine active plugin header actions if any
  let HeaderActionComponent: React.ComponentType<ViewerHeaderActionProps> | null = null;
  if (activeTab) {
    const plugin = pluginRegistry.get(activeTab.pluginId);
    if (plugin && plugin.headerActions) {
      HeaderActionComponent = plugin.headerActions;
    }
  }

  const handleSave = () => {
    if (activeTab) {
      void saveTab(activeTab.id);
    } else {
      void saveActiveFile();
    }
  };

  return (
    <header className="h-11 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] px-3 flex items-center justify-between select-none z-30 transition-colors">
      {/* Left section: Sidebar toggle, Branding, Workspace selector */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isSidebarOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-1 pr-2 border-r border-gray-200 dark:border-gray-700">
          <ViewMDLogo className="w-4 h-4 shadow-2xs" />
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100">
            ViewMD
          </span>
        </div>

        <RecentsDropdown />
      </div>

      {/* Center: Plugin Header Action (e.g. 3-switch Edit/Split/Preview + Save) */}
      <div className="flex items-center justify-center shrink-0">
        {HeaderActionComponent && activeTab && (
          <HeaderActionComponent tab={activeTab} onSave={handleSave} />
        )}
      </div>

      {/* Right section: Search, Theme Switcher, Wrap Text & Links */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => openSearch('files')}
          className="flex items-center gap-2 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800/80 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-md transition-colors cursor-pointer mr-0.5"
          title="Search workspace (Ctrl+P / Ctrl+Shift+F)"
        >
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400">
            Ctrl+P
          </kbd>
        </button>

        <WrapToggle />
        <ThemeToggle />

        <a
          href="https://github.com/07prajwal2000/ViewMD"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="GitHub Repository"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
