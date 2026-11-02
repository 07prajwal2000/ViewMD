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

export type PaneType = 'primary' | 'secondary';

interface TabsContextType {
  primaryTabs: TabItem[];
  secondaryTabs: TabItem[];
  activePrimaryTabId: string | null;
  activeSecondaryTabId: string | null;
  activePrimaryTab: TabItem | undefined;
  activeSecondaryTab: TabItem | undefined;
  activeTab: TabItem | undefined; // Active tab in the currently focused pane
  focusedPane: PaneType;
  setFocusedPane: (pane: PaneType) => void;
  isSplitView: boolean;
  openFile: (entry: FileEntry, targetPane?: PaneType) => Promise<void>;
  closeTab: (tabId: string, pane: PaneType) => void;
  setActiveTabId: (tabId: string, pane: PaneType) => void;
  toggleSplitView: () => void;
  openToSide: (tabId: string, fromPane: PaneType) => void;
  moveTabToPane: (tabId: string, fromPane: PaneType, toPane: PaneType) => void;
  togglePinTab: (tabId: string, pane: PaneType) => void;
  reorderTabs: (sourceIndex: number, destinationIndex: number, pane: PaneType) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<boolean>;
  saveActiveFile: (targetPane?: PaneType) => Promise<boolean>;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDirectory, directoryName } = useWorkspace();

  const [primaryTabs, setPrimaryTabs] = useState<TabItem[]>([]);
  const [secondaryTabs, setSecondaryTabs] = useState<TabItem[]>([]);
  const [activePrimaryTabId, setActivePrimaryTabId] = useState<string | null>(null);
  const [activeSecondaryTabId, setActiveSecondaryTabId] = useState<string | null>(null);
  const [focusedPane, setFocusedPane] = useState<PaneType>('primary');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);

  const isRestoringSession = useRef(false);

  const activePrimaryTab = primaryTabs.find((t) => t.id === activePrimaryTabId);
  const activeSecondaryTab = secondaryTabs.find((t) => t.id === activeSecondaryTabId);
  const activeTab = focusedPane === 'secondary' && isSplitView ? activeSecondaryTab || activePrimaryTab : activePrimaryTab;

  // Restore workspace session when currentDirectory changes
  useEffect(() => {
    if (!currentDirectory || !directoryName) {
      setPrimaryTabs([]);
      setSecondaryTabs([]);
      setActivePrimaryTabId(null);
      setActiveSecondaryTabId(null);
      setIsSplitView(false);
      return;
    }

    const restoreSession = async () => {
      isRestoringSession.current = true;
      const session = getWorkspaceSession(directoryName);

      if (!session) {
        setPrimaryTabs([]);
        setSecondaryTabs([]);
        setActivePrimaryTabId(null);
        setActiveSecondaryTabId(null);
        setIsSplitView(false);
        isRestoringSession.current = false;
        return;
      }

      const pPaths = session.primaryPaths || session.openPaths || [];
      const sPaths = session.secondaryPaths || [];

      const loadTabsFromPaths = async (paths: string[]): Promise<TabItem[]> => {
        const loaded: TabItem[] = [];
        for (const filePath of paths) {
          const isPinned = session.pinnedPaths ? session.pinnedPaths.includes(filePath) : false;
          const resolved = await resolvePath(currentDirectory, filePath);

          if (!resolved || !resolved.fileHandle) {
            const fileName = filePath.split('/').pop() || filePath;
            const plugin = pluginRegistry.getForFile(fileName);
            loaded.push({
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

            loaded.push({
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
            loaded.push({
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

        return loaded.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
      };

      const restoredPrimary = await loadTabsFromPaths(pPaths);
      const restoredSecondary = await loadTabsFromPaths(sPaths);

      setPrimaryTabs(restoredPrimary);
      setSecondaryTabs(restoredSecondary);

      const pActive = session.activePrimaryPath || session.activePath;
      if (pActive && restoredPrimary.some((t) => t.id === pActive)) {
        setActivePrimaryTabId(pActive);
      } else if (restoredPrimary.length > 0) {
        setActivePrimaryTabId(restoredPrimary[0].id);
      }

      if (session.isSplit && restoredSecondary.length > 0) {
        setIsSplitView(true);
        const sActive = session.activeSecondaryPath || session.splitActivePath;
        if (sActive && restoredSecondary.some((t) => t.id === sActive)) {
          setActiveSecondaryTabId(sActive);
        } else {
          setActiveSecondaryTabId(restoredSecondary[0].id);
        }
      } else {
        setIsSplitView(false);
        setActiveSecondaryTabId(null);
      }

      isRestoringSession.current = false;
    };

    restoreSession();
  }, [currentDirectory, directoryName]);

  // Save session when tabs or layout change
  useEffect(() => {
    if (!directoryName || isRestoringSession.current) return;

    const allPinned = [
      ...primaryTabs.filter((t) => t.isPinned).map((t) => t.path),
      ...secondaryTabs.filter((t) => t.isPinned).map((t) => t.path),
    ];

    saveWorkspaceSession(directoryName, {
      primaryPaths: primaryTabs.map((t) => t.path),
      activePrimaryPath: activePrimaryTabId,
      secondaryPaths: secondaryTabs.map((t) => t.path),
      activeSecondaryPath: activeSecondaryTabId,
      pinnedPaths: Array.from(new Set(allPinned)),
      isSplit: isSplitView,
    });
  }, [
    primaryTabs,
    secondaryTabs,
    activePrimaryTabId,
    activeSecondaryTabId,
    isSplitView,
    directoryName,
  ]);

  const openFile = useCallback(
    async (entry: FileEntry, targetPane?: PaneType) => {
      if (entry.kind !== 'file' || !entry.fileHandle) return;

      const pane = targetPane || (isSplitView ? focusedPane : 'primary');
      const tabs = pane === 'primary' ? primaryTabs : secondaryTabs;
      const setTabs = pane === 'primary' ? setPrimaryTabs : setSecondaryTabs;
      const setActiveId = pane === 'primary' ? setActivePrimaryTabId : setActiveSecondaryTabId;

      // Check if already open in target pane
      const existing = tabs.find((t) => t.id === entry.id);
      if (existing) {
        setActiveId(entry.id);
        setFocusedPane(pane);
        return;
      }

      // Check if already open in other pane to reuse existing in-memory content
      const otherTabs = pane === 'primary' ? secondaryTabs : primaryTabs;
      const inOtherPane = otherTabs.find((t) => t.id === entry.id);

      try {
        let content: string | Blob = '';
        const plugin = pluginRegistry.getForFile(entry.name);

        if (inOtherPane) {
          content = inOtherPane.content;
        } else if (plugin.id === 'pdf') {
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
          isDirty: inOtherPane ? inOtherPane.isDirty : false,
          pluginId: plugin.id,
          isPinned: false,
        };

        setTabs((prev) => [...prev, newTab]);
        setActiveId(newTab.id);
        setFocusedPane(pane);
      } catch (err) {
        console.error('Failed to open file:', err);
        alert('Failed to read file: ' + (err instanceof Error ? err.message : String(err)));
      }
    },
    [primaryTabs, secondaryTabs, focusedPane, isSplitView]
  );

  const closeTab = useCallback(
    (tabId: string, pane: PaneType) => {
      const isPrimary = pane === 'primary';
      const tabs = isPrimary ? primaryTabs : secondaryTabs;
      const setTabs = isPrimary ? setPrimaryTabs : setSecondaryTabs;
      const activeId = isPrimary ? activePrimaryTabId : activeSecondaryTabId;
      const setActiveId = isPrimary ? setActivePrimaryTabId : setActiveSecondaryTabId;

      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      const tabToClose = tabs[tabIndex];
      if (tabToClose.isDirty) {
        const confirmed = window.confirm(
          `"${tabToClose.name}" has unsaved changes. Are you sure you want to close it?`
        );
        if (!confirmed) return;
      }

      const nextTabs = tabs.filter((t) => t.id !== tabId);
      setTabs(nextTabs);

      // Adjust active tab in this pane
      if (activeId === tabId) {
        if (nextTabs.length === 0) {
          setActiveId(null);
        } else if (tabIndex < nextTabs.length) {
          setActiveId(nextTabs[tabIndex].id);
        } else {
          setActiveId(nextTabs[nextTabs.length - 1].id);
        }
      }

      // If secondary pane closed its last tab, close split view automatically
      if (!isPrimary && nextTabs.length === 0) {
        setIsSplitView(false);
        setActiveSecondaryTabId(null);
        setFocusedPane('primary');
      }
    },
    [primaryTabs, secondaryTabs, activePrimaryTabId, activeSecondaryTabId]
  );

  const setActiveTabId = useCallback((tabId: string, pane: PaneType) => {
    if (pane === 'primary') {
      setActivePrimaryTabId(tabId);
    } else {
      setActiveSecondaryTabId(tabId);
    }
    setFocusedPane(pane);
  }, []);

  const togglePinTab = useCallback((tabId: string, pane: PaneType) => {
    const isPrimary = pane === 'primary';
    const setTabs = isPrimary ? setPrimaryTabs : setSecondaryTabs;

    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

  const reorderTabs = useCallback((sourceIndex: number, destinationIndex: number, pane: PaneType) => {
    const isPrimary = pane === 'primary';
    const setTabs = isPrimary ? setPrimaryTabs : setSecondaryTabs;

    setTabs((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(sourceIndex, 1);
      copy.splice(destinationIndex, 0, removed);
      return copy;
    });
  }, []);

  const openToSide = useCallback(
    (tabId: string, fromPane: PaneType) => {
      const sourceTabs = fromPane === 'primary' ? primaryTabs : secondaryTabs;
      const targetTabs = fromPane === 'primary' ? secondaryTabs : primaryTabs;
      const setTargetTabs = fromPane === 'primary' ? setSecondaryTabs : setPrimaryTabs;
      const setTargetActive = fromPane === 'primary' ? setActiveSecondaryTabId : setActivePrimaryTabId;

      const tab = sourceTabs.find((t) => t.id === tabId);
      if (!tab) return;

      setIsSplitView(true);

      // Check if already in target
      if (!targetTabs.some((t) => t.id === tabId)) {
        setTargetTabs((prev) => [...prev, { ...tab }]);
      }
      setTargetActive(tabId);
      setFocusedPane(fromPane === 'primary' ? 'secondary' : 'primary');
    },
    [primaryTabs, secondaryTabs]
  );

  const moveTabToPane = useCallback(
    (tabId: string, fromPane: PaneType, toPane: PaneType) => {
      if (fromPane === toPane) return;

      const sourceTabs = fromPane === 'primary' ? primaryTabs : secondaryTabs;
      const setSourceTabs = fromPane === 'primary' ? setPrimaryTabs : setSecondaryTabs;
      const setTargetTabs = toPane === 'primary' ? setPrimaryTabs : setSecondaryTabs;
      const setTargetActive = toPane === 'primary' ? setActivePrimaryTabId : setActiveSecondaryTabId;
      const setSourceActive = fromPane === 'primary' ? setActivePrimaryTabId : setActiveSecondaryTabId;

      const tab = sourceTabs.find((t) => t.id === tabId);
      if (!tab) return;

      if (toPane === 'secondary') {
        setIsSplitView(true);
      }

      // Remove from source
      setSourceTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        const activeId = fromPane === 'primary' ? activePrimaryTabId : activeSecondaryTabId;
        if (activeId === tabId) {
          if (next.length === 0) {
            setSourceActive(null);
          } else {
            setSourceActive(next[0].id);
          }
        }
        // If moving out of secondary and it is now empty, close split view
        if (fromPane === 'secondary' && next.length === 0) {
          setIsSplitView(false);
          setActiveSecondaryTabId(null);
        }
        return next;
      });

      // Add to target if not exists
      setTargetTabs((prev) => {
        if (prev.some((t) => t.id === tabId)) return prev;
        return [...prev, tab];
      });

      setTargetActive(tabId);
      setFocusedPane(toPane);
    },
    [primaryTabs, secondaryTabs, activePrimaryTabId, activeSecondaryTabId]
  );

  const toggleSplitView = useCallback(() => {
    setIsSplitView((prev) => {
      const next = !prev;
      if (next) {
        // Opening split view:
        if (secondaryTabs.length === 0) {
          if (primaryTabs.length > 1) {
            // Move non-active tab or clone active tab to secondary
            const otherTab = primaryTabs.find((t) => t.id !== activePrimaryTabId) || primaryTabs[0];
            if (otherTab) {
              setSecondaryTabs([{ ...otherTab }]);
              setActiveSecondaryTabId(otherTab.id);
            }
          } else if (activePrimaryTab) {
            // Clone the active tab into secondary pane
            setSecondaryTabs([{ ...activePrimaryTab }]);
            setActiveSecondaryTabId(activePrimaryTab.id);
          }
        }
        setFocusedPane('secondary');
      } else {
        // Closing split view: merge secondary tabs back into primary tabs
        setPrimaryTabs((prev) => {
          const merged = [...prev];
          for (const sTab of secondaryTabs) {
            if (!merged.some((t) => t.id === sTab.id)) {
              merged.push(sTab);
            }
          }
          return merged;
        });
        setSecondaryTabs([]);
        setActiveSecondaryTabId(null);
        setFocusedPane('primary');
      }
      return next;
    });
  }, [secondaryTabs, primaryTabs, activePrimaryTabId, activePrimaryTab]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    const updateFn = (prev: TabItem[]) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, content, isDirty: true } : tab));

    setPrimaryTabs(updateFn);
    setSecondaryTabs(updateFn);
  }, []);

  const saveTab = useCallback(
    async (tabId: string): Promise<boolean> => {
      const allTabs = [...primaryTabs, ...secondaryTabs];
      const tab = allTabs.find((t) => t.id === tabId);
      if (!tab || !tab.fileHandle || !tab.isDirty) return false;

      try {
        await writeFile(tab.fileHandle, tab.content);
        const clearDirty = (prev: TabItem[]) =>
          prev.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t));

        setPrimaryTabs(clearDirty);
        setSecondaryTabs(clearDirty);
        return true;
      } catch (err) {
        console.error('Failed to save file:', err);
        alert('Failed to save file: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [primaryTabs, secondaryTabs]
  );

  const saveActiveFile = useCallback(
    async (targetPane?: PaneType): Promise<boolean> => {
      const pane = targetPane || focusedPane;
      const activeId = pane === 'primary' ? activePrimaryTabId : activeSecondaryTabId;
      if (!activeId) return false;
      return saveTab(activeId);
    },
    [focusedPane, activePrimaryTabId, activeSecondaryTabId, saveTab]
  );

  return (
    <TabsContext.Provider
      value={{
        primaryTabs,
        secondaryTabs,
        activePrimaryTabId,
        activeSecondaryTabId,
        activePrimaryTab,
        activeSecondaryTab,
        activeTab,
        focusedPane,
        setFocusedPane,
        isSplitView,
        openFile,
        closeTab,
        setActiveTabId,
        toggleSplitView,
        openToSide,
        moveTabToPane,
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
