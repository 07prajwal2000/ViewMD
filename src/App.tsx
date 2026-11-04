import React, { useState, useEffect, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { FolderOpen, AlertTriangle, FileText, FilePlus, FolderPlus, Globe, Presentation } from 'lucide-react';
import { ViewMDLogo } from './components/common/ViewMDLogo';
import { AppHeader } from './components/layout/AppHeader';
import { TabBar } from './components/layout/TabBar';
import { FileTree } from './components/filetree/FileTree';
import { WorkspaceSearchModal } from './components/search/WorkspaceSearchModal';
import { OpenUrlModal } from './components/common/OpenUrlModal';
import { useTabs, type PaneType } from './context/TabsContext';
import { useWorkspace } from './context/WorkspaceContext';
import { pluginRegistry } from './plugins';
import { getStoredSidebarOpen, setStoredSidebarOpen } from './services/storage/settings';
import { usePwaFileHandling } from './services/pwa/usePwaFileHandling';
import type { TabItem } from './types/plugin';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(getStoredSidebarOpen);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const { openFileFromDisk } = usePwaFileHandling();
  const {
    activePrimaryTab,
    activeSecondaryTab,
    isSplitView,
    updateTabContent,
    saveActiveFile,
    closeTab,
    moveTabToPane,
    setFocusedPane,
    createNewInMemoryFile,
    createNewPresentationDeck,
    loadFromUrl,
  } = useTabs();
  const { currentDirectory, isLocalWorkspace, openFolder, createLocalProject } = useWorkspace();

  const urlProcessedRef = useRef(false);

  // Check ?url=<url> query parameter on application load
  useEffect(() => {
    if (urlProcessedRef.current) return;
    urlProcessedRef.current = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('url');
      if (urlParam) {
        loadFromUrl(urlParam);
      }
    } catch (e) {
      console.error('Failed to parse URL query param:', e);
    }
  }, [loadFromUrl]);

  const handlePaneDrop = (e: React.DragEvent, targetPane: PaneType) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/viewmd-tab');
      if (!dataStr) return;
      const data = JSON.parse(dataStr) as { id: string; pane: PaneType };
      if (data.pane !== targetPane) {
        moveTabToPane(data.id, data.pane, targetPane);
      }
    } catch (err) {
      console.error('Error dropping tab on pane:', err);
    }
  };

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

  const renderViewer = (tab: TabItem | undefined, pane: PaneType) => {
    if (!tab) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-gray-50/50 dark:bg-[#0d1117] overflow-y-auto">
          <ViewMDLogo className="w-16 h-16 mb-4 shadow-lg rounded-[22%]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
            No File Open
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            Create an in-memory document or project, load Markdown directly from a URL, or open files from disk.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-lg">
            <button
              type="button"
              onClick={() => createNewInMemoryFile()}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>New File</span>
            </button>

            <button
              type="button"
              onClick={() => createNewPresentationDeck()}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Presentation className="w-4 h-4" />
              <span>New Deck (.mdp)</span>
            </button>

            <button
              type="button"
              onClick={() => createLocalProject()}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Project</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUrlModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Open URL...</span>
            </button>

            <button
              type="button"
              onClick={openFileFromDisk}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Open File...</span>
            </button>

            {!currentDirectory && !isLocalWorkspace && (
              <button
                type="button"
                onClick={openFolder}
                className="flex items-center gap-2 px-3.5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open Folder...</span>
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400">
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+O</kbd> Open File</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+B</kbd> Toggle Sidebar</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+P</kbd> Quick Search</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+Shift+F</kbd> Find in Files</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">Ctrl+S</kbd> Save File</span>
          </div>
        </div>
      );
    }

    if (tab.isMissing) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-[#0d1117] select-none">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4 shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
            File Not Found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            {tab.errorMessage || `File "${tab.path}" could not be found. It may have been moved, renamed, or deleted from disk.`}
          </p>
          <button
            type="button"
            onClick={() => closeTab(tab.id, pane)}
            className="px-4 py-2 text-xs bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium cursor-pointer transition-colors"
          >
            Close Tab
          </button>
        </div>
      );
    }

    const plugin = pluginRegistry.get(tab.pluginId);
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
        tab={tab}
        onContentChange={(val) => updateTabContent(tab.id, val)}
        onSave={() => saveActiveFile(pane)}
      />
    );
  };

  const renderContentPanes = () => {
    if (isSplitView) {
      return (
        <Group orientation="horizontal" className="h-full w-full">
          {/* Primary View Pane */}
          <Panel defaultSize="50%" minSize="20%" className="h-full flex flex-col overflow-hidden">
            <div
              className="h-full w-full flex flex-col overflow-hidden"
              onClick={() => setFocusedPane('primary')}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/viewmd-tab')) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handlePaneDrop(e, 'primary')}
            >
              <TabBar pane="primary" />
              <div className="flex-1 overflow-hidden relative">
                {renderViewer(activePrimaryTab, 'primary')}
              </div>
            </div>
          </Panel>

          {/* Resizable Divider between the two file views */}
          <Separator className="relative w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize z-20 after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']" />

          {/* Secondary View Pane (Split View) */}
          <Panel defaultSize="50%" minSize="20%" className="h-full flex flex-col overflow-hidden border-l border-gray-200/50 dark:border-gray-800/50">
            <div
              className="h-full w-full flex flex-col overflow-hidden"
              onClick={() => setFocusedPane('secondary')}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('application/viewmd-tab')) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handlePaneDrop(e, 'secondary')}
            >
              <TabBar pane="secondary" />
              <div className="flex-1 overflow-hidden relative">
                {renderViewer(activeSecondaryTab, 'secondary')}
              </div>
            </div>
          </Panel>
        </Group>
      );
    }

    return (
      <div className="h-full w-full flex flex-col overflow-hidden" onClick={() => setFocusedPane('primary')}>
        <TabBar pane="primary" />
        <div className="flex-1 overflow-hidden relative">
          {renderViewer(activePrimaryTab, 'primary')}
        </div>
      </div>
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
            {/* Left Sidebar (File Tree) - resizable up to 50% */}
            <Panel defaultSize="22%" minSize="180px" maxSize="50%" className="h-full">
              <FileTree />
            </Panel>

            {/* Splitter Divider with generous grab area */}
            <Separator className="relative w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize z-20 after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']" />

            {/* Right Main Panel (Tabs + Viewer) */}
            <Panel defaultSize="78%" minSize="40%" className="h-full flex flex-col overflow-hidden">
              {renderContentPanes()}
            </Panel>
          </Group>
        ) : (
          <div className="h-full w-full flex flex-col overflow-hidden">
            {renderContentPanes()}
          </div>
        )}
      </div>

      {/* Global Workspace Fuzzy Search & Quick Open Modal */}
      <WorkspaceSearchModal />

      {/* Open from URL Modal */}
      <OpenUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
      />
    </div>
  );
};

export default App;
