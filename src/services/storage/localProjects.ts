import type { FileEntry } from '../../types/fileSystem';

export interface LocalFileRecord {
  path: string;
  name: string;
  content: string;
  updatedAt: number;
}

export interface LocalProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  files: Record<string, LocalFileRecord>;
}

export interface LocalProjectSummary {
  id: string;
  name: string;
  fileCount: number;
  updatedAt: number;
}

const LOCAL_PROJECTS_INDEX_KEY = 'viewmd_local_projects_index';
const LOCAL_PROJECT_PREFIX = 'viewmd_local_proj_';

/**
 * Returns list of all stored local projects.
 */
export function listLocalProjects(): LocalProjectSummary[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalProjectSummary[];
  } catch (err) {
    console.error('Failed to list local projects:', err);
    return [];
  }
}

/**
 * Updates the index summary list for a project.
 */
function updateProjectIndex(summary: LocalProjectSummary, remove = false): void {
  try {
    const existing = listLocalProjects();
    const filtered = existing.filter((p) => p.id !== summary.id);
    const next = remove ? filtered : [summary, ...filtered];
    localStorage.setItem(LOCAL_PROJECTS_INDEX_KEY, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to update project index:', err);
  }
}

/**
 * Loads a full local project by ID.
 */
export function getLocalProject(id: string): LocalProjectRecord | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROJECT_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProjectRecord;
  } catch (err) {
    console.error(`Failed to load local project ${id}:`, err);
    return null;
  }
}

/**
 * Saves or updates a full local project to localStorage.
 */
export function saveLocalProject(project: LocalProjectRecord): void {
  try {
    const now = Date.now();
    project.updatedAt = now;
    localStorage.setItem(`${LOCAL_PROJECT_PREFIX}${project.id}`, JSON.stringify(project));
    updateProjectIndex({
      id: project.id,
      name: project.name,
      fileCount: Object.keys(project.files).length,
      updatedAt: now,
    });
  } catch (err) {
    console.error(`Failed to save local project ${project.id}:`, err);
  }
}

/**
 * Deletes a local project from localStorage.
 */
export function deleteLocalProject(id: string): void {
  try {
    localStorage.removeItem(`${LOCAL_PROJECT_PREFIX}${id}`);
    updateProjectIndex({ id, name: '', fileCount: 0, updatedAt: 0 }, true);
  } catch (err) {
    console.error(`Failed to delete local project ${id}:`, err);
  }
}

/**
 * Creates a brand new local project record and persists it to localStorage.
 */
export function createLocalProjectRecord(
  name: string,
  initialFiles?: Record<string, string>
): LocalProjectRecord {
  const cleanName = name.trim() || 'LocalStorage Project';
  const id = `local_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const files: Record<string, LocalFileRecord> = {};

  if (initialFiles && Object.keys(initialFiles).length > 0) {
    for (const [filePath, content] of Object.entries(initialFiles)) {
      const fileName = filePath.split('/').pop() || filePath;
      files[filePath] = {
        path: filePath,
        name: fileName,
        content,
        updatedAt: now,
      };
    }
  } else {
    // Default starter README file
    files['README.md'] = {
      path: 'README.md',
      name: 'README.md',
      content: `# ${cleanName}\n\nWelcome to your browser-local workspace! 🚀\n\n- **No File System Permissions Required**: All files are stored directly in your browser's LocalStorage.\n- **Offline First**: Works 100% offline.\n- **Full Features**: Markdown editing, presentation slides (\`.mdp\`), live preview, and fast fuzzy search.\n\nUse the sidebar to create new files or folders.`,
      updatedAt: now,
    };
  }

  const project: LocalProjectRecord = {
    id,
    name: cleanName,
    createdAt: now,
    updatedAt: now,
    files,
  };

  saveLocalProject(project);
  return project;
}

/**
 * Finds an existing local project by name or creates a new one.
 */
export function findOrCreateLocalProjectByName(name: string): LocalProjectRecord {
  const cleanName = name.trim() || 'LocalStorage Project';
  const list = listLocalProjects();
  const match = list.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (match) {
    const existing = getLocalProject(match.id);
    if (existing) return existing;
  }
  return createLocalProjectRecord(cleanName);
}

/**
 * Adds or updates a file in a local project and saves it.
 */
export function saveFileToLocalProject(
  projectId: string,
  filePath: string,
  content: string
): LocalProjectRecord | null {
  const project = getLocalProject(projectId);
  if (!project) return null;

  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const fileName = normalized.split('/').pop() || normalized;

  project.files[normalized] = {
    path: normalized,
    name: fileName,
    content,
    updatedAt: Date.now(),
  };

  saveLocalProject(project);
  return project;
}

/**
 * Deletes a file or directory path from a local project.
 */
export function deleteItemFromLocalProject(
  projectId: string,
  targetPath: string,
  isDirectory: boolean
): LocalProjectRecord | null {
  const project = getLocalProject(projectId);
  if (!project) return null;

  const normalized = targetPath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (isDirectory) {
    const prefix = `${normalized}/`;
    for (const key of Object.keys(project.files)) {
      if (key === normalized || key.startsWith(prefix)) {
        delete project.files[key];
      }
    }
  } else {
    delete project.files[normalized];
  }

  saveLocalProject(project);
  return project;
}

/**
 * Renames a file or directory path in a local project.
 */
export function renameItemInLocalProject(
  projectId: string,
  oldPath: string,
  newPath: string,
  isDirectory: boolean
): LocalProjectRecord | null {
  const project = getLocalProject(projectId);
  if (!project) return null;

  const normOld = oldPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const normNew = newPath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (normOld === normNew) return project;

  if (isDirectory) {
    const oldPrefix = `${normOld}/`;
    const newPrefix = `${normNew}/`;

    const updatedFiles: Record<string, LocalFileRecord> = {};
    for (const [key, val] of Object.entries(project.files)) {
      if (key === normOld) {
        // Exact match
        updatedFiles[normNew] = {
          ...val,
          path: normNew,
          name: normNew.split('/').pop() || normNew,
        };
      } else if (key.startsWith(oldPrefix)) {
        const sub = key.substring(oldPrefix.length);
        const replacedKey = `${newPrefix}${sub}`;
        updatedFiles[replacedKey] = {
          ...val,
          path: replacedKey,
          name: replacedKey.split('/').pop() || replacedKey,
        };
      } else {
        updatedFiles[key] = val;
      }
    }
    project.files = updatedFiles;
  } else {
    const file = project.files[normOld];
    if (file) {
      delete project.files[normOld];
      project.files[normNew] = {
        ...file,
        path: normNew,
        name: normNew.split('/').pop() || normNew,
        updatedAt: Date.now(),
      };
    }
  }

  saveLocalProject(project);
  return project;
}

/**
 * Builds a hierarchical FileEntry[] tree from a local project record.
 */
export function buildFileTreeFromLocalProject(project: LocalProjectRecord): FileEntry[] {
  interface DirMapNode {
    name: string;
    path: string;
    dirs: Map<string, DirMapNode>;
    files: Map<string, LocalFileRecord>;
  }

  const root: DirMapNode = {
    name: '',
    path: '',
    dirs: new Map(),
    files: new Map(),
  };

  for (const [pathStr, fileRecord] of Object.entries(project.files)) {
    // Ignore internal placeholder keys if any
    const normalized = pathStr.replace(/\\/g, '/').replace(/^\/+/, '');
    const segments = normalized.split('/').filter(Boolean);
    if (segments.length === 0) continue;

    let current = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const curPath = current.path ? `${current.path}/${seg}` : seg;
      if (!current.dirs.has(seg)) {
        current.dirs.set(seg, {
          name: seg,
          path: curPath,
          dirs: new Map(),
          files: new Map(),
        });
      }
      current = current.dirs.get(seg)!;
    }

    const fileName = segments[segments.length - 1];
    // If it's a directory placeholder (like .viewmdkeep), we don't need to display it as a file
    if (fileName === '.viewmdkeep') continue;

    current.files.set(fileName, fileRecord);
  }

  function convertNode(node: DirMapNode): FileEntry[] {
    const entries: FileEntry[] = [];

    // Add subdirectories
    for (const [dirName, subNode] of node.dirs.entries()) {
      const children = convertNode(subNode);
      entries.push({
        id: subNode.path,
        name: dirName,
        path: subNode.path,
        kind: 'directory',
        children,
        isOpen: false,
        isLocal: true,
      });
    }

    // Add files
    for (const [fileName, fileRec] of node.files.entries()) {
      entries.push({
        id: fileRec.path,
        name: fileName,
        path: fileRec.path,
        kind: 'file',
        content: fileRec.content,
        isLocal: true,
      });
    }

    return entries.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  return convertNode(root);
}
