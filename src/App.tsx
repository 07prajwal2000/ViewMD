import React, { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { FileText, FolderOpen } from 'lucide-react';
import { AppHeader } from './components/layout/AppHeader';
import { TabBar } from './components/layout/TabBar';
import { FileTree } from './components/filetree/FileTree';
import { useTabs } from './context/TabsContext';
import { useWorkspace } from './context/WorkspaceContext';
import { pluginRegistry } from './plugins';
import { getStoredSidebarOpen, setStoredSidebarOpen } from './services/storage/settings';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(getStoredSidebarOpen);
  const { activeTab, updateTabContent, saveActiveFile } = useTabs();
  const { currentDirectory, openFolder } = useWorkspace();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      setStoredSidebarOpen(next);
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveViewer = () => {
    if (!activeTab) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-gray-50/50 dark:bg-[#0d1117]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No File Open
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Select a Markdown or PDF document from the file tree on the left, or open a new directory to begin.
          </p>

          {!currentDirectory && (
            <button
              type="button"
              onClick={openFolder}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Open Local Folder</span>
            </button>
          )}

          <div className="mt-8 flex items-center gap-4 text-[11px] text-gray-400">
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+B</kbd> Toggle Sidebar</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+S</kbd> Save File</span>
          </div>
        </div>
      );
    }

    const plugin = pluginRegistry.get(activeTab.pluginId);
    if (!plugin) {
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          Unsupported file type
        </div>
      );
    }

    const ViewerComponent = plugin.component;
    return (
      <ViewerComponent
        tab={activeTab}
        onContentChange={(val) => updateTabContent(activeTab.id, val)}
        onSave={saveActiveFile}
      />
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Top Application Header */}
      <AppHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Workspace with Resizable Splitter */}
      <div className="flex-1 w-full overflow-hidden">
        {isSidebarOpen ? (
          <Group orientation="horizontal" className="h-full w-full">
            {/* Left Sidebar (File Tree) - resizable up to half the screen (50%) */}
            <Panel defaultSize="22%" minSize="180px" maxSize="50%" className="h-full">
              <FileTree />
            </Panel>

            {/* Splitter Divider with generous grab area */}
            <Separator className="relative w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize z-20 after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']" />

            {/* Right Main Panel (Tabs + Viewer) */}
            <Panel defaultSize="78%" minSize="40%" className="h-full flex flex-col overflow-hidden">
              <TabBar />
              <div className="flex-1 overflow-hidden relative">
                {renderActiveViewer()}
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="h-full w-full flex flex-col overflow-hidden">
            <TabBar />
            <div className="flex-1 overflow-hidden relative">
              {renderActiveViewer()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
