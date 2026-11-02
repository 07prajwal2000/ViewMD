import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabItem } from '../types/plugin';
import type { FileEntry } from '../types/fileSystem';
import { pluginRegistry } from '../plugins';
import { readFileAsText, readFileAsBlob, writeFile } from '../services/fileSystem/fileAccess';

interface TabsContextType {
  tabs: TabItem[];
  activeTabId: string | null;
  activeTab: TabItem | undefined;
  openFile: (entry: FileEntry) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<boolean>;
  saveActiveFile: () => Promise<boolean>;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const openFile = useCallback(async (entry: FileEntry) => {
    if (entry.kind !== 'file' || !entry.fileHandle) return;

    // Check if already open
    const existing = tabs.find((t) => t.id === entry.id);
    if (existing) {
      setActiveTabId(entry.id);
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
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (err) {
      console.error('Failed to open file:', err);
      alert('Failed to read file: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [tabs]);

  const closeTab = useCallback((tabId: string) => {
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

      // If active tab is closed, switch to adjacent tab
      if (activeTabId === tabId) {
        if (nextTabs.length === 0) {
          setActiveTabId(null);
        } else if (tabIndex < nextTabs.length) {
          setActiveTabId(nextTabs[tabIndex].id);
        } else {
          setActiveTabId(nextTabs[nextTabs.length - 1].id);
        }
      }

      return nextTabs;
    });
  }, [activeTabId]);

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

  const saveTab = useCallback(async (tabId: string): Promise<boolean> => {
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
  }, [tabs]);

  const saveActiveFile = useCallback(async (): Promise<boolean> => {
    if (!activeTabId) return false;
    return saveTab(activeTabId);
  }, [activeTabId, saveTab]);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabId,
        activeTab,
        openFile,
        closeTab,
        setActiveTabId,
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
