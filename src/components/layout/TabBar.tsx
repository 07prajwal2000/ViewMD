import React, { useState } from 'react';
import { X, FileText, File, Pin, Columns2 } from 'lucide-react';
import { useTabs } from '../../context/TabsContext';
import type { TabItem } from '../../types/plugin';

interface TabBarProps {
  pane?: 'primary' | 'secondary';
}

export const TabBar: React.FC<TabBarProps> = ({ pane = 'primary' }) => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    splitActiveTabId,
    setSplitActiveTabId,
    closeTab,
    togglePinTab,
    reorderTabs,
    isSplitView,
    toggleSplitView,
  } = useTabs();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenuTab, setContextMenuTab] = useState<{ tab: TabItem; x: number; y: number } | null>(null);

  if (tabs.length === 0) {
    return null;
  }

  const currentActiveId = pane === 'primary' ? activeTabId : splitActiveTabId;
  const setThisActiveId = (id: string) => {
    if (pane === 'primary') {
      setActiveTabId(id);
    } else {
      setSplitActiveTabId(id);
    }
  };

  const getTabIcon = (name: string) => {
    if (name.endsWith('.pdf')) {
      return <File className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderTabs(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tab: TabItem) => {
    e.preventDefault();
    setContextMenuTab({ tab, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="h-9 border-b border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-[#161b22] flex items-center justify-between select-none shrink-0 relative">
      {/* Scrollable tabs list */}
      <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1">
        {tabs.map((tab, index) => {
          const isActive = tab.id === currentActiveId;

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => setThisActiveId(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              title={tab.path}
              className={`group relative flex items-center gap-1.5 px-3 h-full border-r border-gray-200 dark:border-gray-800/80 text-xs cursor-pointer transition-colors max-w-[220px] shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
              } ${tab.isMissing ? 'text-rose-500 dark:text-rose-400' : ''}`}
            >
              {/* Active top border highlight */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}

              {tab.isPinned ? (
                <Pin className="w-3 h-3 text-blue-500 fill-current shrink-0 rotate-45" />
              ) : (
                getTabIcon(tab.name)
              )}

              <span className="truncate max-w-[120px]">{tab.name}</span>

              {/* Pin button on hover for non-pinned tabs */}
              {!tab.isPinned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-opacity"
                  title="Pin Tab"
                >
                  <Pin className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Dirty indicator or Close button */}
              <div className="flex items-center">
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
                  !tab.isPinned && (
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
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pane action toolbar (Split Editor View button) */}
      {pane === 'primary' && (
        <div className="px-2 flex items-center">
          <button
            type="button"
            onClick={toggleSplitView}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isSplitView
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800'
            }`}
            title={isSplitView ? 'Close Split View' : 'Split Editor Right (View 2 files side-by-side)'}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Context Menu on Tab */}
      {contextMenuTab && (
        <div
          style={{ top: `${contextMenuTab.y}px`, left: `${contextMenuTab.x}px` }}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 text-xs"
          onClick={() => setContextMenuTab(null)}
        >
          <button
            type="button"
            onClick={() => togglePinTab(contextMenuTab.tab.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            <Pin className="w-3 h-3" />
            <span>{contextMenuTab.tab.isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isSplitView) toggleSplitView();
              setSplitActiveTabId(contextMenuTab.tab.id);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
          >
            <Columns2 className="w-3 h-3" />
            <span>Open to the Side (Split)</span>
          </button>

          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          <button
            type="button"
            onClick={() => closeTab(contextMenuTab.tab.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Close Tab</span>
          </button>
        </div>
      )}
    </div>
  );
};
