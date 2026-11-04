import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  ChevronDown,
  Clock,
  X,
  FolderOpen,
  FileText,
  FilePlus,
  FolderPlus,
  Globe,
  Database,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTabs } from '../../context/TabsContext';
import { OpenUrlModal } from './OpenUrlModal';

export const RecentsDropdown: React.FC = () => {
  const {
    directoryName,
    isLocalWorkspace,
    recentWorkspaces,
    openFolder,
    openRecentFolder,
    removeRecent,
    createLocalProject,
  } = useWorkspace();
  const { openFileFromDisk, createNewInMemoryFile } = useTabs();

  const [isOpen, setIsOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
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
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
          title="Current Workspace & Recents"
        >
          {isLocalWorkspace ? (
            <Database className="w-3.5 h-3.5 text-indigo-500" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span className="max-w-[130px] truncate">{directoryName || 'Open Folder...'}</span>
          {isLocalWorkspace && (
            <span className="text-[10px] px-1 py-0.2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded font-semibold">
              Local
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-xs">
            {/* Action: New In-Memory File */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                createNewInMemoryFile();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-blue-500" />
                <span>New In-Memory File</span>
              </div>
              <span className="text-[10px] text-gray-400">Local</span>
            </button>

            {/* Action: New Local Project */}
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await createLocalProject();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-500" />
                <span>New Local Project...</span>
              </div>
              <span className="text-[10px] text-indigo-500 font-medium">LocalStorage</span>
            </button>

            {/* Action: Open from URL */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsUrlModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/60 pb-2"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>Open from URL...</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">?url=</span>
            </button>

            {/* Action: Open File from Disk */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openFileFromDisk();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer pt-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Open File from Disk...</span>
              </div>
              <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">Ctrl+O</kbd>
            </button>

            {/* Action: Open Folder from Disk */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openFolder();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/60 pb-2"
            >
              <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Open Folder from Disk...</span>
            </button>

            {/* Recents list */}
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              Recent Workspaces
            </div>

            {recentWorkspaces.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 italic">No recent workspaces yet</div>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {recentWorkspaces.map((recent) => (
                  <div
                    key={recent.id || recent.name}
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
                      {recent.isLocal ? (
                        <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{recent.name}</span>
                      {recent.isLocal && (
                        <span className="text-[9px] px-1 py-0.1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 rounded shrink-0 font-medium">
                          Local
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(recent.id || recent.name);
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

      <OpenUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
      />
    </>
  );
};
