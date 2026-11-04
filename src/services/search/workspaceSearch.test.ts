import { describe, it, expect } from 'bun:test';
import {
  flattenFileTree,
  searchFilesFuzzy,
  isSearchableTextFile,
  searchContentInWorkspace,
} from './workspaceSearch';
import type { FileEntry } from '../../types/fileSystem';

describe('workspaceSearch service', () => {
  const dummyFileHandle = {
    kind: 'file' as const,
    name: 'README.md',
    getFile: async () => ({
      text: async () => '# ViewMD\nA modern markdown editor.\nFuzzy search works wonders!',
    }),
  } as unknown as FileSystemFileHandle;

  const mockTree: FileEntry[] = [
    {
      id: 'src',
      name: 'src',
      path: 'src',
      kind: 'directory',
      handle: {} as FileSystemDirectoryHandle,
      children: [
        {
          id: 'src/App.tsx',
          name: 'App.tsx',
          path: 'src/App.tsx',
          kind: 'file',
          handle: dummyFileHandle,
          fileHandle: dummyFileHandle,
        },
        {
          id: 'src/components',
          name: 'components',
          path: 'src/components',
          kind: 'directory',
          handle: {} as FileSystemDirectoryHandle,
          children: [
            {
              id: 'src/components/AppHeader.tsx',
              name: 'AppHeader.tsx',
              path: 'src/components/AppHeader.tsx',
              kind: 'file',
              handle: dummyFileHandle,
              fileHandle: dummyFileHandle,
            },
          ],
        },
      ],
    },
    {
      id: 'README.md',
      name: 'README.md',
      path: 'README.md',
      kind: 'file',
      handle: dummyFileHandle,
      fileHandle: dummyFileHandle,
    },
    {
      id: 'document.pdf',
      name: 'document.pdf',
      path: 'document.pdf',
      kind: 'file',
      handle: {} as FileSystemFileHandle,
      fileHandle: {} as FileSystemFileHandle,
    },
  ];

  it('flattenFileTree flattens nested folder hierarchies', () => {
    const files = flattenFileTree(mockTree);
    expect(files.length).toBe(4);
    expect(files.map((f) => f.name)).toEqual([
      'App.tsx',
      'AppHeader.tsx',
      'README.md',
      'document.pdf',
    ]);
  });

  it('isSearchableTextFile recognizes text files vs binary files', () => {
    expect(isSearchableTextFile('README.md')).toBe(true);
    expect(isSearchableTextFile('App.tsx')).toBe(true);
    expect(isSearchableTextFile('config.json')).toBe(true);
    expect(isSearchableTextFile('document.pdf')).toBe(false);
    expect(isSearchableTextFile('image.png')).toBe(false);
  });

  it('searchFilesFuzzy finds exact and fuzzy file matches', () => {
    const files = flattenFileTree(mockTree);

    // Fuzzy query matching "AppHeader"
    const headerResults = searchFilesFuzzy(files, 'head');
    expect(headerResults.length).toBeGreaterThan(0);
    expect(headerResults[0].file.name).toBe('AppHeader.tsx');

    // Fuzzy query matching "README"
    const readmeResults = searchFilesFuzzy(files, 'rdme');
    expect(readmeResults.length).toBeGreaterThan(0);
    expect(readmeResults[0].file.name).toBe('README.md');
  });

  it('searchContentInWorkspace finds matching lines in text files', async () => {
    const files = flattenFileTree(mockTree);
    const results = await searchContentInWorkspace(files, 'markdown');

    expect(results.length).toBeGreaterThan(0);
    const readmeResult = results.find((r) => r.file.name === 'README.md');
    expect(readmeResult).toBeDefined();
    expect(readmeResult!.matches[0].line).toBe(2);
    expect(readmeResult!.matches[0].text).toContain('markdown');
  });

  it('searchContentInWorkspace respects in-memory tab overrides', async () => {
    const files = flattenFileTree(mockTree);
    const openTabsContent = new Map<string, string>();
    openTabsContent.set('src/App.tsx', 'const customDynamicToken = 42;');

    const results = await searchContentInWorkspace(
      files,
      'customDynamicToken',
      openTabsContent
    );
    expect(results.length).toBe(1);
    expect(results[0].file.name).toBe('App.tsx');
    expect(results[0].matches[0].text).toContain('customDynamicToken');
  });

  it('searches inside local project files without fileHandle', async () => {
    const localFiles: FileEntry[] = [
      {
        id: 'notes/local-ideas.md',
        name: 'local-ideas.md',
        path: 'notes/local-ideas.md',
        kind: 'file',
        isLocal: true,
        content: '# Ideas\nBrainstorming quantum-algorithms and offline sync.',
      },
      {
        id: 'notes/tasks.md',
        name: 'tasks.md',
        path: 'notes/tasks.md',
        kind: 'file',
        isLocal: true,
        content: '# Tasks\n- [ ] Ship ViewMD localstorage release',
      },
    ];

    // Search keyword in local file content
    const results = await searchContentInWorkspace(localFiles, 'quantum-algorithms');
    expect(results.length).toBe(1);
    expect(results[0].file.name).toBe('local-ideas.md');
    expect(results[0].matches[0].line).toBe(2);
    expect(results[0].matches[0].text).toContain('quantum-algorithms');

    // Fuzzy search file name
    const fuzzyMatches = searchFilesFuzzy(localFiles, 'ideas');
    expect(fuzzyMatches.length).toBe(1);
    expect(fuzzyMatches[0].file.name).toBe('local-ideas.md');
  });

  it('searches inside in-memory tab content matching by path', async () => {
    const inMemoryFiles: FileEntry[] = [
      {
        id: 'inmemory:Untitled-1.md:173000000000',
        name: 'Untitled-1.md',
        path: 'Untitled-1.md',
        kind: 'file',
        content: '# Draft\nInitial draft text',
      },
    ];

    const openTabsContent = new Map<string, string>();
    // Open tab mapped by tab.path
    openTabsContent.set('Untitled-1.md', '# Draft\nUpdated with superSecretKeyword in memory');

    const results = await searchContentInWorkspace(
      inMemoryFiles,
      'superSecretKeyword',
      openTabsContent
    );
    expect(results.length).toBe(1);
    expect(results[0].file.name).toBe('Untitled-1.md');
    expect(results[0].matches[0].text).toContain('superSecretKeyword');
  });
});
