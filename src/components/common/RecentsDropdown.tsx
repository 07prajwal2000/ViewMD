import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Clock, X, FolderOpen } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const RecentsDropdown: React.FC = () => {
  const { directoryName, recentWorkspaces, openFolder, openRecentFolder, removeRecent } =
    useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
        title="Current Workspace & Recents"
      >
        <Folder className="w-3.5 h-3.5 text-blue-500" />
        <span className="max-w-[130px] truncate">{directoryName || 'Open Folder...'}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-xs">
          {/* Action: Open Folder */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              openFolder();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/60"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Folder from Disk...</span>
          </button>

          {/* Recents list */}
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Recent Workspaces
          </div>

          {recentWorkspaces.length === 0 ? (
            <div className="px-3 py-2 text-gray-400 italic">No recent folders yet</div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {recentWorkspaces.map((recent) => (
                <div
                  key={recent.name}
                  className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 group transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openRecentFolder(recent);
                    }}
                    className="flex-1 flex items-center gap-2 text-left text-gray-700 dark:text-gray-200 truncate cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{recent.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecent(recent.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-opacity cursor-pointer"
                    title="Remove from recents"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
