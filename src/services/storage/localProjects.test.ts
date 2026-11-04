import { describe, it, expect, beforeEach, beforeAll } from 'bun:test';
import {
  createLocalProjectRecord,
  getLocalProject,
  listLocalProjects,
  deleteLocalProject,
  findOrCreateLocalProjectByName,
  saveFileToLocalProject,
  deleteItemFromLocalProject,
  renameItemInLocalProject,
  buildFileTreeFromLocalProject,
  type LocalProjectRecord,
} from './localProjects';

describe('localProjects service', () => {
  const storageMap = new Map<string, string>();

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => storageMap.set(key, String(val)),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
    globalThis.localStorage = mockStorage as unknown as Storage;
  });

  beforeEach(() => {
    storageMap.clear();
  });

  it('creates a project with default README and lists it', () => {
    const project = createLocalProjectRecord('My Notes');

    expect(project.id).toBeDefined();
    expect(project.name).toBe('My Notes');
    expect(project.files['README.md']).toBeDefined();
    expect(project.files['README.md'].content).toContain('My Notes');

    const loaded = getLocalProject(project.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('My Notes');

    const list = listLocalProjects();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(project.id);
    expect(list[0].name).toBe('My Notes');
    expect(list[0].fileCount).toBe(1);
  });

  it('finds existing project by name or creates a new one', () => {
    const p1 = findOrCreateLocalProjectByName('Docs');
    expect(p1.name).toBe('Docs');

    const p2 = findOrCreateLocalProjectByName('docs'); // Case-insensitive match
    expect(p2.id).toBe(p1.id);

    const p3 = findOrCreateLocalProjectByName('Another Workspace');
    expect(p3.id).not.toBe(p1.id);
    expect(listLocalProjects().length).toBe(2);
  });

  it('saves, updates, and reads files in a local project', () => {
    const project = createLocalProjectRecord('Workspace');
    saveFileToLocalProject(project.id, 'docs/guide.md', '# User Guide\nContent here');

    const updated = getLocalProject(project.id);
    expect(updated?.files['docs/guide.md']).toBeDefined();
    expect(updated?.files['docs/guide.md'].content).toBe('# User Guide\nContent here');
    expect(updated?.files['docs/guide.md'].name).toBe('guide.md');

    // Overwrite content
    saveFileToLocalProject(project.id, 'docs/guide.md', '# User Guide V2');
    const v2 = getLocalProject(project.id);
    expect(v2?.files['docs/guide.md'].content).toBe('# User Guide V2');
  });

  it('renames a file and a directory with nested files', () => {
    const project = createLocalProjectRecord('Project');
    saveFileToLocalProject(project.id, 'notes/todo.md', 'Task 1');
    saveFileToLocalProject(project.id, 'notes/archive/old.md', 'Archived');

    // Rename file
    renameItemInLocalProject(project.id, 'notes/todo.md', 'notes/tasks.md', false);
    let current = getLocalProject(project.id);
    expect(current?.files['notes/todo.md']).toBeUndefined();
    expect(current?.files['notes/tasks.md']?.content).toBe('Task 1');

    // Rename directory 'notes' -> 'journal'
    renameItemInLocalProject(project.id, 'notes', 'journal', true);
    current = getLocalProject(project.id);
    expect(current?.files['notes/tasks.md']).toBeUndefined();
    expect(current?.files['notes/archive/old.md']).toBeUndefined();
    expect(current?.files['journal/tasks.md']?.content).toBe('Task 1');
    expect(current?.files['journal/archive/old.md']?.content).toBe('Archived');
  });

  it('deletes a file and deletes a directory recursively', () => {
    const project = createLocalProjectRecord('Project');
    saveFileToLocalProject(project.id, 'temp.md', 'Delete me');
    saveFileToLocalProject(project.id, 'folder/sub1.md', 'Sub 1');
    saveFileToLocalProject(project.id, 'folder/sub2.md', 'Sub 2');

    // Delete single file
    deleteItemFromLocalProject(project.id, 'temp.md', false);
    let current = getLocalProject(project.id);
    expect(current?.files['temp.md']).toBeUndefined();
    expect(current?.files['folder/sub1.md']).toBeDefined();

    // Delete entire folder
    deleteItemFromLocalProject(project.id, 'folder', true);
    current = getLocalProject(project.id);
    expect(current?.files['folder/sub1.md']).toBeUndefined();
    expect(current?.files['folder/sub2.md']).toBeUndefined();
  });

  it('builds a hierarchical FileEntry tree from flat local project files', () => {
    const project: LocalProjectRecord = {
      id: 'test_proj',
      name: 'Tree Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: {
        'README.md': { path: 'README.md', name: 'README.md', content: 'Root file', updatedAt: 1 },
        'presentation.mdp': { path: 'presentation.mdp', name: 'presentation.mdp', content: 'Deck', updatedAt: 1 },
        'docs/architecture.md': { path: 'docs/architecture.md', name: 'architecture.md', content: 'Arch', updatedAt: 1 },
        'docs/api/endpoints.md': { path: 'docs/api/endpoints.md', name: 'endpoints.md', content: 'API', updatedAt: 1 },
        'empty-folder/.viewmdkeep': { path: 'empty-folder/.viewmdkeep', name: '.viewmdkeep', content: '', updatedAt: 1 },
      },
    };

    const tree = buildFileTreeFromLocalProject(project);

    // Folders sorted first, then files alphabetically
    expect(tree.length).toBe(4); // 'docs', 'empty-folder', 'presentation.mdp', 'README.md'
    expect(tree[0].kind).toBe('directory');
    expect(tree[0].name).toBe('docs');
    expect(tree[0].isLocal).toBe(true);

    const docsFolder = tree[0];
    expect(docsFolder.children?.length).toBe(2); // 'api' folder and 'architecture.md'
    expect(docsFolder.children?.[0].kind).toBe('directory');
    expect(docsFolder.children?.[0].name).toBe('api');
    expect(docsFolder.children?.[1].kind).toBe('file');
    expect(docsFolder.children?.[1].name).toBe('architecture.md');

    const apiFolder = docsFolder.children?.[0];
    expect(apiFolder?.children?.length).toBe(1);
    expect(apiFolder?.children?.[0].name).toBe('endpoints.md');

    // Empty folder should not expose .viewmdkeep
    const emptyFolder = tree[1];
    expect(emptyFolder.name).toBe('empty-folder');
    expect(emptyFolder.children?.length).toBe(0);
  });

  it('deletes a local project and removes it from index', () => {
    const project = createLocalProjectRecord('Temp Project');
    expect(listLocalProjects().length).toBe(1);

    deleteLocalProject(project.id);
    expect(getLocalProject(project.id)).toBeNull();
    expect(listLocalProjects().length).toBe(0);
  });
});
