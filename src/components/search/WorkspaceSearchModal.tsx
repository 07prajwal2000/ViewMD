import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  FileText,
  FileCode,
  File,
  X,
  Split,
  CornerDownLeft,
  Loader2,
  FolderOpen,
  CaseSensitive,
  Regex as RegexIcon,
  Presentation,
} from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTabs } from '../../context/TabsContext';
import type { FileEntry } from '../../types/fileSystem';
import {
  flattenFileTree,
  searchFilesFuzzy,
  searchContentInWorkspace,
  type FuzzyFileMatch,
  type FileContentSearchResult,
  type ContentMatch,
} from '../../services/search/workspaceSearch';

/**
 * Highlights characters matching Fuse.js fuzzy index ranges.
 */
const FuzzyHighlight: React.FC<{
  text: string;
  indices?: readonly (readonly [number, number])[];
  className?: string;
}> = ({ text, indices, className = '' }) => {
  if (!indices || indices.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < indices.length; i++) {
    const [start, end] = indices[i];
    if (start > lastIndex) {
      parts.push(
        <span key={`un-${lastIndex}`}>{text.substring(lastIndex, start)}</span>
      );
    }
    parts.push(
      <mark
        key={`match-${start}`}
        className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded-xs"
      >
        {text.substring(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`un-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
};

/**
 * Returns an appropriate icon based on file extension.
 */
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
    case 'markdown':
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    case 'mdp':
    case 'deck':
      return <Presentation className="w-4 h-4 text-indigo-500 shrink-0" />;
    case 'pdf':
      return <File className="w-4 h-4 text-rose-500 shrink-0" />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'json':
    case 'html':
    case 'css':
    case 'yml':
    case 'yaml':
      return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

/**
 * Clips long lines around a match and highlights the matching substring.
 */
const ContentLineSnippet: React.FC<{
  lineText: string;
  matchIndex: number;
  matchLength: number;
}> = ({ lineText, matchIndex, matchLength }) => {
  const start = Math.max(0, matchIndex - 35);
  const end = Math.min(lineText.length, matchIndex + matchLength + 55);

  const prefix = start > 0 ? '… ' : '';
  const suffix = end < lineText.length ? ' …' : '';

  const beforeMatch = lineText.substring(start, matchIndex);
  const matchedText = lineText.substring(matchIndex, matchIndex + matchLength);
  const afterMatch = lineText.substring(matchIndex + matchLength, end);

  return (
    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">
      {prefix}
      <span>{beforeMatch}</span>
      <mark className="bg-amber-400/30 text-amber-900 dark:text-amber-200 font-semibold px-0.5 rounded-xs">
        {matchedText}
      </mark>
      <span>{afterMatch}</span>
      {suffix}
    </span>
  );
};

export const WorkspaceSearchModal: React.FC = () => {
  const { isOpen, mode, query, setQuery, closeSearch, openSearch } = useSearch();
  const { fileTree, currentDirectory, isLocalWorkspace, openFolder, createLocalProject } = useWorkspace();
  const { openFile, primaryTabs, secondaryTabs, setActiveTabId, isSplitView, focusedPane } = useTabs();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [contentResults, setContentResults] = useState<FileContentSearchResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all files in current file tree + include open in-memory/unsaved tabs
  const allFiles = useMemo(() => {
    const treeFiles = flattenFileTree(fileTree);
    const seen = new Set(treeFiles.map((f) => f.path.toLowerCase()));

    const extraFiles: FileEntry[] = [];
    for (const tab of [...primaryTabs, ...secondaryTabs]) {
      const lower = tab.path.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        extraFiles.push({
          id: tab.id,
          name: tab.name,
          path: tab.path,
          kind: 'file',
          content: typeof tab.content === 'string' ? tab.content : undefined,
          isLocal: tab.isLocal,
        });
      }
    }

    return [...treeFiles, ...extraFiles];
  }, [fileTree, primaryTabs, secondaryTabs]);

  // Fuzzy file search results
  const fileResults = useMemo<FuzzyFileMatch[]>(() => {
    if (mode !== 'files') return [];
    return searchFilesFuzzy(allFiles, query);
  }, [allFiles, query, mode]);

  // In-memory open tab content mapping (to search unsaved edits)
  const openTabsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const tab of [...primaryTabs, ...secondaryTabs]) {
      if (typeof tab.content === 'string') {
        map.set(tab.id, tab.content);
        map.set(tab.path, tab.content);
      }
    }
    return map;
  }, [primaryTabs, secondaryTabs]);

  // Debounced content search execution
  useEffect(() => {
    if (!isOpen || mode !== 'content') {
      setContentResults([]);
      setIsSearchingContent(false);
      return;
    }

    if (!query.trim()) {
      setContentResults([]);
      setIsSearchingContent(false);
      return;
    }

    let isMounted = true;
    setIsSearchingContent(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchContentInWorkspace(allFiles, query, openTabsMap, {
          caseSensitive,
          isRegex,
          maxResults: 80,
        });
        if (isMounted) {
          setContentResults(results);
        }
      } catch (err) {
        console.error('Error during workspace content search:', err);
      } finally {
        if (isMounted) {
          setIsSearchingContent(false);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, mode, query, allFiles, openTabsMap, caseSensitive, isRegex]);

  // Reset selected index on query/mode change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, mode]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, mode]);

  // Flatten content items for single-list keyboard navigation
  const flatContentItems = useMemo(() => {
    const items: { file: FileEntry; match: ContentMatch }[] = [];
    for (const res of contentResults) {
      for (const match of res.matches) {
        items.push({ file: res.file, match });
      }
    }
    return items;
  }, [contentResults]);

  const totalItemsCount = mode === 'files' ? fileResults.length : flatContentItems.length;

  const handleSelectFile = useCallback(
    (file: FileEntry, targetPane?: 'primary' | 'secondary') => {
      const pane = targetPane || (isSplitView ? focusedPane : 'primary');

      // Check if already open in tabs
      const openTab = [...primaryTabs, ...secondaryTabs].find(
        (t) => t.id === file.id || t.path === file.path
      );
      if (openTab) {
        setActiveTabId(openTab.id, pane);
        closeSearch();
        return;
      }

      openFile(file, targetPane);
      closeSearch();
    },
    [primaryTabs, secondaryTabs, isSplitView, focusedPane, setActiveTabId, openFile, closeSearch]
  );

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (totalItemsCount > 0 ? (prev + 1) % totalItemsCount : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        totalItemsCount > 0 ? (prev - 1 + totalItemsCount) % totalItemsCount : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetPane = e.ctrlKey || e.metaKey ? 'secondary' : undefined;

      if (mode === 'files') {
        const selected = fileResults[selectedIndex];
        if (selected) {
          handleSelectFile(selected.file, targetPane);
        }
      } else {
        const selected = flatContentItems[selectedIndex];
        if (selected) {
          handleSelectFile(selected.file, targetPane);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      openSearch(mode === 'files' ? 'content' : 'files');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  };

  // Keep selected item scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector<HTMLElement>('[data-selected="true"]');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/40 dark:bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'files'
                ? 'Type to search files by name (e.g. index.ts, readme)...'
                : 'Search inside files in workspace...'
            }
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden"
          />

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => openSearch('files')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'files'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Files
            </button>
            <button
              type="button"
              onClick={() => openSearch('content')}
              className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'content'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Content
            </button>
          </div>

          {/* Content Search Filter Options (Case & Regex) */}
          {mode === 'content' && (
            <div className="flex items-center gap-1 pl-1 border-l border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setCaseSensitive((prev) => !prev)}
                className={`p-1 rounded-md cursor-pointer transition-colors ${
                  caseSensitive
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Match Case"
              >
                <CaseSensitive className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsRegex((prev) => !prev)}
                className={`p-1 rounded-md cursor-pointer transition-colors ${
                  isRegex
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Use Regular Expression"
              >
                <RegexIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto min-h-[160px] max-h-[50vh] p-1.5">
          {!currentDirectory && !isLocalWorkspace && allFiles.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center px-4">
              <FolderOpen className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No workspace or files open
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Open a local directory, create a local project, or create a file to search.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    closeSearch();
                    createLocalProject();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  New Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeSearch();
                    openFolder();
                  }}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Open Folder
                </button>
              </div>
            </div>
          ) : mode === 'files' ? (
            /* Files Fuzzy Search List */
            fileResults.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                No files found matching "{query}"
              </div>
            ) : (
              fileResults.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                const nameMatches = result.matches?.find((m) => m.key === 'name')?.indices;
                const pathMatches = result.matches?.find((m) => m.key === 'path')?.indices;

                return (
                  <div
                    key={result.file.id}
                    data-selected={isSelected}
                    onClick={() => handleSelectFile(result.file)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {getFileIcon(result.file.name)}
                      <div className="flex flex-col min-w-0">
                        <div className="truncate flex items-center gap-1.5">
                          <FuzzyHighlight
                            text={result.file.name}
                            indices={nameMatches}
                            className="font-medium text-gray-900 dark:text-gray-100"
                          />
                          {result.file.isLocal && (
                            <span className="text-[9px] px-1 py-0.2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded font-medium">
                              Local
                            </span>
                          )}
                          {!result.file.isLocal && !result.file.fileHandle && (
                            <span className="text-[9px] px-1 py-0.2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded font-medium">
                              In-Memory
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          <FuzzyHighlight
                            text={result.file.path}
                            indices={pathMatches}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions on hover or selected */}
                    {isSelected && (
                      <div className="flex items-center gap-1 ml-2 text-gray-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFile(result.file, 'secondary');
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
                          title="Open to Side (Split View)"
                        >
                          <Split className="w-3 h-3" />
                          <span>Side</span>
                        </button>
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-400 px-1 py-0.5">
                          <CornerDownLeft className="w-3 h-3" />
                          <span>Open</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            /* Content Search List */
            <div>
              {isSearchingContent && (
                <div className="flex items-center justify-center py-4 gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching text in files...</span>
                </div>
              )}

              {!isSearchingContent && !query.trim() && (
                <div className="py-10 text-center text-xs text-gray-400">
                  Type words to search inside markdown and code files across the workspace.
                </div>
              )}

              {!isSearchingContent && query.trim() && flatContentItems.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-400">
                  No matches found for "{query}"
                </div>
              )}

              {flatContentItems.length > 0 && (
                <div className="space-y-0.5">
                  {flatContentItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${item.file.id}-${item.match.line}-${item.match.matchIndex}-${idx}`}
                        data-selected={isSelected}
                        onClick={() => handleSelectFile(item.file)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex flex-col px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-l-2 border-blue-500 pl-2.5'
                            : 'hover:bg-gray-100/70 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] truncate">
                            {getFileIcon(item.file.name)}
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                              {item.file.name}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="font-mono text-[10px] text-gray-400 truncate">
                              {item.file.path}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-gray-400 shrink-0">
                            line {item.match.line}
                          </span>
                        </div>
                        <ContentLineSnippet
                          lineText={item.match.text}
                          matchIndex={item.match.matchIndex}
                          matchLength={item.match.matchLength}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-[#12161c] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-300">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-300">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-300">
                Ctrl+↵
              </kbd>
              Open to Side
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-300">
                Tab
              </kbd>
              Switch Mode
            </span>
          </div>

          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[10px] text-gray-600 dark:text-gray-300">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
