import Fuse, { type FuseResultMatch } from 'fuse.js';
import type { FileEntry } from '../../types/fileSystem';
import { readFileAsText } from '../fileSystem/fileAccess';

export interface FuzzyFileMatch {
  file: FileEntry;
  score: number;
  matches?: readonly FuseResultMatch[];
}

export interface ContentMatch {
  line: number;
  text: string;
  matchIndex: number;
  matchLength: number;
}

export interface FileContentSearchResult {
  file: FileEntry;
  matches: ContentMatch[];
}

export interface ContentSearchOptions {
  caseSensitive?: boolean;
  isRegex?: boolean;
  maxResults?: number;
}

const BINARY_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'bmp',
  'svgz',
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',
  'zip',
  'tar',
  'gz',
  '7z',
  'rar',
  'exe',
  'dll',
  'so',
  'dylib',
  'bin',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'class',
  'pyc',
  'iso',
  'dmg',
]);

/**
 * Recursively flattens the file tree into a list of searchable files.
 */
export function flattenFileTree(tree: FileEntry[]): FileEntry[] {
  const result: FileEntry[] = [];
  const traverse = (entries: FileEntry[]) => {
    for (const entry of entries) {
      if (entry.kind === 'file') {
        result.push(entry);
      } else if (entry.kind === 'directory' && entry.children) {
        traverse(entry.children);
      }
    }
  };
  traverse(tree);
  return result;
}

/**
 * Checks if a file is likely a text file that can be searched for content.
 */
export function isSearchableTextFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || ext === fileName.toLowerCase()) {
    // Files without extension (e.g. Dockerfile, Makefile, LICENSE) are typically text
    return true;
  }
  return !BINARY_EXTENSIONS.has(ext);
}

/**
 * Fuzzy search across workspace files by name and relative path using Fuse.js.
 */
export function searchFilesFuzzy(
  files: FileEntry[],
  query: string,
  limit: number = 50
): FuzzyFileMatch[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return files.slice(0, limit).map((file) => ({
      file,
      score: 1,
    }));
  }

  const fuse = new Fuse(files, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'path', weight: 0.3 },
    ],
    threshold: 0.45,
    distance: 120,
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });

  const results = fuse.search(cleanQuery, { limit });
  return results.map((res) => ({
    file: res.item,
    score: res.score ?? 1,
    matches: res.matches,
  }));
}

// In-memory cache for file contents to accelerate repeated queries
const fileContentCache = new Map<string, string>();

/**
 * Clears or refreshes the content cache for a given path, or clears all.
 */
export function clearContentCache(path?: string) {
  if (path) {
    fileContentCache.delete(path);
  } else {
    fileContentCache.clear();
  }
}

/**
 * Full-text search across all text files in the workspace.
 * Reads content via FileSystemAccess and respects live in-memory open tabs content.
 */
export async function searchContentInWorkspace(
  files: FileEntry[],
  query: string,
  openTabsContent?: Map<string, string>,
  options: ContentSearchOptions = {}
): Promise<FileContentSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const { caseSensitive = false, isRegex = false, maxResults = 100 } = options;

  let regex: RegExp | null = null;
  if (isRegex) {
    try {
      regex = new RegExp(cleanQuery, caseSensitive ? 'g' : 'gi');
    } catch {
      // Invalid regular expression, fallback to literal search
      regex = null;
    }
  }

  const targetQuery = caseSensitive ? cleanQuery : cleanQuery.toLowerCase();
  const results: FileContentSearchResult[] = [];
  let totalMatches = 0;

  for (const file of files) {
    if (totalMatches >= maxResults) break;
    if (!file.fileHandle || !isSearchableTextFile(file.name)) continue;

    let content: string | undefined;

    // 1. Check if the file is currently open with unsaved changes
    if (openTabsContent && openTabsContent.has(file.id)) {
      content = openTabsContent.get(file.id);
    }

    // 2. Check in-memory cache
    if (content === undefined && fileContentCache.has(file.id)) {
      content = fileContentCache.get(file.id);
    }

    // 3. Read from disk if not yet cached
    if (content === undefined) {
      try {
        content = await readFileAsText(file.fileHandle);
        fileContentCache.set(file.id, content);
      } catch {
        // Skip unreadable files (e.g. locked or binary read failure)
        continue;
      }
    }

    if (!content) continue;

    const lines = content.split(/\r?\n/);
    const fileMatches: ContentMatch[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (totalMatches >= maxResults) break;

      const line = lines[i];
      if (!line) continue;

      if (regex) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(line)) !== null && totalMatches < maxResults) {
          fileMatches.push({
            line: i + 1,
            text: line,
            matchIndex: match.index,
            matchLength: match[0].length || 1,
          });
          totalMatches++;
          if (!regex.global) break;
        }
      } else {
        const searchLine = caseSensitive ? line : line.toLowerCase();
        let startIndex = 0;
        while (startIndex < searchLine.length && totalMatches < maxResults) {
          const foundIndex = searchLine.indexOf(targetQuery, startIndex);
          if (foundIndex === -1) break;

          fileMatches.push({
            line: i + 1,
            text: line,
            matchIndex: foundIndex,
            matchLength: cleanQuery.length,
          });
          totalMatches++;
          startIndex = foundIndex + Math.max(1, cleanQuery.length);
        }
      }
    }

    if (fileMatches.length > 0) {
      results.push({
        file,
        matches: fileMatches,
      });
    }
  }

  return results;
}
