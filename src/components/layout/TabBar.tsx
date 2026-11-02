import React, { useState } from 'react';
import { X, FileText, File, Pin, Columns2, ArrowRightLeft } from 'lucide-react';
import { useTabs, type PaneType } from '../../context/TabsContext';
import type { TabItem } from '../../types/plugin';

interface TabBarProps {
  pane?: PaneType;
}

export const TabBar: React.FC<TabBarProps> = ({ pane = 'primary' }) => {
  const {
    primaryTabs,
    secondaryTabs,
    activePrimaryTabId,
    activeSecondaryTabId,
    setActiveTabId,
    closeTab,
    togglePinTab,
    reorderTabs,
    moveTabToPane,
    openToSide,
    isSplitView,
    toggleSplitView,
    setFocusedPane,
  } = useTabs();

  const [draggedTab, setDraggedTab] = useState<{ id: string; index: number; pane: PaneType } | null>(null);
  const [contextMenuTab, setContextMenuTab] = useState<{ tab: TabItem; x: number; y: number } | null>(null);

  const tabs = pane === 'primary' ? primaryTabs : secondaryTabs;
  const currentActiveId = pane === 'primary' ? activePrimaryTabId : activeSecondaryTabId;

  const getTabIcon = (name: string) => {
    if (name.endsWith('.pdf')) {
      return <File className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  };

  const handleDragStart = (e: React.DragEvent, tab: TabItem, index: number) => {
    const data = { id: tab.id, index, pane };
    setDraggedTab(data);
    e.dataTransfer.setData('application/viewmd-tab', JSON.stringify(data));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/viewmd-tab');
      if (!dataStr) return;
      const data = JSON.parse(dataStr) as { id: string; index: number; pane: PaneType };

      if (data.pane === pane) {
        // Reordering inside the same pane
        if (data.index !== targetIndex) {
          reorderTabs(data.index, targetIndex, pane);
        }
      } else {
        // Moving tab across panes!
        moveTabToPane(data.id, data.pane, pane);
      }
    } catch (err) {
      console.error('Error handling tab drop:', err);
    } finally {
      setDraggedTab(null);
    }
  };

  const handleDropOnBarEnd = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTab && draggedTab.pane !== pane) {
      moveTabToPane(draggedTab.id, draggedTab.pane, pane);
      setDraggedTab(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tab: TabItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuTab({ tab, x: e.clientX, y: e.clientY });
  };

  return (
    <div
      onClick={() => setFocusedPane(pane)}
      onDragOver={handleDragOver}
      onDrop={handleDropOnBarEnd}
      className="h-9 border-b border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-[#161b22] flex items-center justify-between select-none shrink-0 relative"
    >
      {/* Scrollable tabs list */}
      <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1">
        {tabs.length === 0 ? (
          <div className="px-3 text-xs text-gray-400 italic">No tabs open in this pane</div>
        ) : (
          tabs.map((tab, index) => {
            const isActive = tab.id === currentActiveId;

            return (
              <div
                key={tab.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tab, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(e, index);
                }}
                onClick={() => {
                  setActiveTabId(tab.id, pane);
                  setFocusedPane(pane);
                }}
                onContextMenu={(e) => handleContextMenu(e, tab)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTab(tab.id, pane);
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
                      togglePinTab(tab.id, pane);
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
                        closeTab(tab.id, pane);
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
                          closeTab(tab.id, pane);
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
          })
        )}
      </div>

      {/* Pane action toolbar */}
      <div className="px-2 flex items-center gap-1">
        {pane === 'primary' ? (
          <button
            type="button"
            onClick={toggleSplitView}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isSplitView
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800'
            }`}
            title={isSplitView ? 'Close Split View (merge tabs)' : 'Split Editor Right (View 2 files side-by-side)'}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSplitView}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Close Split View (merge tabs)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Context Menu with Transparent Backdrop Overlay to guarantee close on outside click */}
      {contextMenuTab && (
        <div
          className="fixed inset-0 z-50 bg-transparent"
          onClick={() => setContextMenuTab(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuTab(null);
          }}
        >
          <div
            style={{ top: `${contextMenuTab.y}px`, left: `${contextMenuTab.x}px` }}
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-51 text-xs min-w-[170px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                togglePinTab(contextMenuTab.tab.id, pane);
                setContextMenuTab(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <Pin className="w-3 h-3" />
              <span>{contextMenuTab.tab.isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isSplitView) {
                  openToSide(contextMenuTab.tab.id, pane);
                } else {
                  moveTabToPane(
                    contextMenuTab.tab.id,
                    pane,
                    pane === 'primary' ? 'secondary' : 'primary'
                  );
                }
                setContextMenuTab(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              {isSplitView ? (
                <>
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Move to Other Pane</span>
                </>
              ) : (
                <>
                  <Columns2 className="w-3 h-3" />
                  <span>Open to the Side (Split)</span>
                </>
              )}
            </button>

            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

            <button
              type="button"
              onClick={() => {
                closeTab(contextMenuTab.tab.id, pane);
                setContextMenuTab(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Close Tab</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
