import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { TabItem } from '../types/plugin';
import type { FileEntry } from '../types/fileSystem';
import { pluginRegistry } from '../plugins';
import {
  readFileAsText,
  readFileAsBlob,
  writeFile,
  resolvePath,
} from '../services/fileSystem/fileAccess';
import {
  getWorkspaceSession,
  saveWorkspaceSession,
} from '../services/storage/workspaceSessions';
import { useWorkspace } from './WorkspaceContext';

interface TabsContextType {
  tabs: TabItem[];
  activeTabId: string | null;
  activeTab: TabItem | undefined;
  splitActiveTabId: string | null;
  splitActiveTab: TabItem | undefined;
  isSplitView: boolean;
  openFile: (entry: FileEntry, openInSplitPane?: boolean) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  setSplitActiveTabId: (tabId: string | null) => void;
  toggleSplitView: () => void;
  togglePinTab: (tabId: string) => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<boolean>;
  saveActiveFile: (isSplitPaneActive?: boolean) => Promise<boolean>;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDirectory, directoryName } = useWorkspace();
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [splitActiveTabId, setSplitActiveTabId] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const splitActiveTab = tabs.find((t) => t.id === splitActiveTabId);

  const isRestoringSession = useRef(false);

  // Restore workspace session when currentDirectory changes
  useEffect(() => {
    if (!currentDirectory || !directoryName) {
      setTabs([]);
      setActiveTabId(null);
      setSplitActiveTabId(null);
      setIsSplitView(false);
      return;
    }

    const restoreSession = async () => {
      isRestoringSession.current = true;
      const session = getWorkspaceSession(directoryName);

      if (!session || session.openPaths.length === 0) {
        setTabs([]);
        setActiveTabId(null);
        setSplitActiveTabId(null);
        setIsSplitView(false);
        isRestoringSession.current = false;
        return;
      }

      const loadedTabs: TabItem[] = [];

      for (const filePath of session.openPaths) {
        const isPinned = session.pinnedPaths.includes(filePath);
        const resolved = await resolvePath(currentDirectory, filePath);

        if (!resolved || !resolved.fileHandle) {
          // File was deleted or moved - show missing error tab
          const fileName = filePath.split('/').pop() || filePath;
          const plugin = pluginRegistry.getForFile(fileName);
          loadedTabs.push({
            id: filePath,
            name: fileName,
            path: filePath,
            fileHandle: null,
            content: '',
            isDirty: false,
            pluginId: plugin.id,
            isPinned,
            isMissing: true,
            errorMessage: `File "${filePath}" could not be found. It may have been moved, renamed, or deleted from disk.`,
          });
          continue;
        }

        try {
          const plugin = pluginRegistry.getForFile(resolved.fileHandle.name);
          let content: string | Blob = '';

          if (plugin.id === 'pdf') {
            content = await readFileAsBlob(resolved.fileHandle);
          } else {
            content = await readFileAsText(resolved.fileHandle);
          }

          loadedTabs.push({
            id: filePath,
            name: resolved.fileHandle.name,
            path: filePath,
            fileHandle: resolved.fileHandle,
            content,
            isDirty: false,
            pluginId: plugin.id,
            isPinned,
          });
        } catch (err) {
          console.error(`Failed to read file during session restore: ${filePath}`, err);
          loadedTabs.push({
            id: filePath,
            name: filePath.split('/').pop() || filePath,
            path: filePath,
            fileHandle: null,
            content: '',
            isDirty: false,
            pluginId: 'markdown',
            isPinned,
            isMissing: true,
            errorMessage: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // Sort pinned tabs to the front
      loadedTabs.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });

      setTabs(loadedTabs);

      if (session.activePath && loadedTabs.some((t) => t.id === session.activePath)) {
        setActiveTabId(session.activePath);
      } else if (loadedTabs.length > 0) {
        setActiveTabId(loadedTabs[0].id);
      }

      if (session.isSplit) {
        setIsSplitView(true);
        if (session.splitActivePath && loadedTabs.some((t) => t.id === session.splitActivePath)) {
          setSplitActiveTabId(session.splitActivePath);
        } else if (loadedTabs.length > 1) {
          setSplitActiveTabId(loadedTabs[1].id);
        }
      } else {
        setIsSplitView(false);
      }

      isRestoringSession.current = false;
    };

    restoreSession();
  }, [currentDirectory, directoryName]);

  // Save session when tabs or layout change
  useEffect(() => {
    if (!directoryName || isRestoringSession.current) return;

    saveWorkspaceSession(directoryName, {
      openPaths: tabs.map((t) => t.path),
      activePath: activeTabId,
      pinnedPaths: tabs.filter((t) => t.isPinned).map((t) => t.path),
      splitActivePath: splitActiveTabId,
      isSplit: isSplitView,
    });
  }, [tabs, activeTabId, splitActiveTabId, isSplitView, directoryName]);

  const openFile = useCallback(
    async (entry: FileEntry, openInSplitPane = false) => {
      if (entry.kind !== 'file' || !entry.fileHandle) return;

      const existingIndex = tabs.findIndex((t) => t.id === entry.id);

      if (existingIndex !== -1) {
        if (openInSplitPane) {
          setIsSplitView(true);
          setSplitActiveTabId(entry.id);
        } else {
          setActiveTabId(entry.id);
        }
        return;
      }

      try {
        const plugin = pluginRegistry.getForFile(entry.name);
        let content: string | Blob = '';

        if (plugin.id === 'pdf') {
          content = await readFileAsBlob(entry.fileHandle);
        } else {
          content = await readFileAsText(entry.fileHandle);
        }

        const newTab: TabItem = {
          id: entry.id,
          name: entry.name,
          path: entry.path,
          fileHandle: entry.fileHandle,
          content,
          isDirty: false,
          pluginId: plugin.id,
          isPinned: false,
        };

        setTabs((prev) => [...prev, newTab]);

        if (openInSplitPane) {
          setIsSplitView(true);
          setSplitActiveTabId(newTab.id);
        } else {
          setActiveTabId(newTab.id);
        }
      } catch (err) {
        console.error('Failed to open file:', err);
        alert('Failed to read file: ' + (err instanceof Error ? err.message : String(err)));
      }
    },
    [tabs]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const tabIndex = prev.findIndex((t) => t.id === tabId);
        if (tabIndex === -1) return prev;

        const tabToClose = prev[tabIndex];
        if (tabToClose.isDirty) {
          const confirmed = window.confirm(
            `"${tabToClose.name}" has unsaved changes. Are you sure you want to close it?`
          );
          if (!confirmed) return prev;
        }

        const nextTabs = prev.filter((t) => t.id !== tabId);

        // Adjust primary active tab
        if (activeTabId === tabId) {
          if (nextTabs.length === 0) {
            setActiveTabId(null);
          } else if (tabIndex < nextTabs.length) {
            setActiveTabId(nextTabs[tabIndex].id);
          } else {
            setActiveTabId(nextTabs[nextTabs.length - 1].id);
          }
        }

        // Adjust split active tab
        if (splitActiveTabId === tabId) {
          if (nextTabs.length <= 1) {
            setSplitActiveTabId(null);
            setIsSplitView(false);
          } else {
            const fallback = nextTabs.find((t) => t.id !== activeTabId) || nextTabs[0];
            setSplitActiveTabId(fallback.id);
          }
        }

        return nextTabs;
      });
    },
    [activeTabId, splitActiveTabId]
  );

  const togglePinTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

  const reorderTabs = useCallback((sourceIndex: number, destinationIndex: number) => {
    setTabs((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destinationIndex, 0, removed);
      return copy;
    });
  }, []);

  const toggleSplitView = useCallback(() => {
    setIsSplitView((prev) => {
      const next = !prev;
      if (next && !splitActiveTabId) {
        // Select an adjacent tab or the active tab
        const alt = tabs.find((t) => t.id !== activeTabId) || activeTab;
        if (alt) {
          setSplitActiveTabId(alt.id);
        }
      }
      return next;
    });
  }, [tabs, activeTabId, activeTab, splitActiveTabId]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          return {
            ...tab,
            content,
            isDirty: true,
          };
        }
        return tab;
      })
    );
  }, []);

  const saveTab = useCallback(
    async (tabId: string): Promise<boolean> => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab || !tab.fileHandle || !tab.isDirty) return false;

      try {
        await writeFile(tab.fileHandle, tab.content);
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t))
        );
        return true;
      } catch (err) {
        console.error('Failed to save file:', err);
        alert('Failed to save file: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [tabs]
  );

  const saveActiveFile = useCallback(
    async (isSplitPaneActive = false): Promise<boolean> => {
      const targetId = isSplitPaneActive ? splitActiveTabId : activeTabId;
      if (!targetId) return false;
      return saveTab(targetId);
    },
    [activeTabId, splitActiveTabId, saveTab]
  );

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabId,
        activeTab,
        splitActiveTabId,
        splitActiveTab,
        isSplitView,
        openFile,
        closeTab,
        setActiveTabId,
        setSplitActiveTabId,
        toggleSplitView,
        togglePinTab,
        reorderTabs,
        updateTabContent,
        saveTab,
        saveActiveFile,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};

export function useTabs(): TabsContextType {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}
