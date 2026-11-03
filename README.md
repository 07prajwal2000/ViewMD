<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="ViewMD Logo" />
</p>

<h1 align="center">ViewMD</h1>

<p align="center">
  <strong>Fast, bloat-free, 100% client-side Markdown viewer and editor running natively in your browser.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Client--Side-100%25-brightgreen" alt="100% Client-Side" />
  <img src="https://img.shields.io/badge/Backend-Zero-blue" alt="Zero Backend" />
  <img src="https://img.shields.io/badge/Built%20With-Bun-FBF0DF?logo=bun&logoColor=black" alt="Bun" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
</p>

---

## 💡 Why ViewMD?

Most modern Markdown editors come with significant trade-offs:
- **Desktop Apps** (Obsidian, VS Code) consume 150MB–500MB of RAM through Electron runtimes.
- **Web-based Editors** often require cloud accounts, transmit your private notes to third-party servers, or lack direct local folder access.

**ViewMD** provides a zero-compromise alternative:
- **No Servers & No APIs**: Runs entirely client-side as a static web application.
- **Direct Disk Read & Write**: Opens local folders directly and saves changes straight back to disk using the modern **File System Access API**.
- **Blazing Fast**: Boots instantly with a tiny client bundle (< 1.5 MB uncompressed, ~480 kB gzipped).
- **GitHub Pages Ready**: Can be deployed to any static host with zero configuration.

---

## ✨ Features

### 📂 Native Local File System Access
- Open entire local project directories with full read/write capabilities (supported on Chromium browsers: Chrome, Edge, Brave, Opera).
- Automatic recursive folder creation: entering `folder/subfolder/document.md` creates all missing parent directories.
- Move files and folders via drag-and-drop directly in the sidebar tree.
- Context menu (3-dot icon) for instant renaming and deletion.
- Workspace history persisted in **IndexedDB** for one-click reopening.

### 🪟 Independent Dual-Pane Split Editor
- True independent **Editor Groups**: view and edit two different documents simultaneously side-by-side.
- Drag-and-drop tabs between panes or use the dedicated transfer buttons (`→` / `←`).
- Closing or modifying tabs in one pane never affects the other.
- Resizable divider with custom minimum/maximum pane bounds.

### 🔄 3-Switch Markdown View Mode
- **Edit Only**: Pure CodeMirror 6 code editor with line numbers, fold markers, and active line highlighting.
- **Split View**: Resizable dual pane with live editor on the left and rendered GFM preview on the right.
- **Preview Only**: Distraction-free rendered Markdown preview using GitHub Markdown styling.

### 🔍 Fuzzy Workspace Search & Find in Files
- **Quick Open (`Ctrl+P` / `Cmd+P`)**: Instant fuzzy file search across all filenames and directory paths powered by **Fuse.js**, with match character highlighting.
- **Find in Files (`Ctrl+Shift+F` / `Cmd+Shift+F`)**: Full-text workspace search across all text documents with real-time indexing of unsaved tabs, line numbers, and preview snippets.
- Supports Case Sensitivity (`Aa`) and Regular Expressions (`.*`).

### 📑 Tab Management & Session Persistence
- Pinned tabs support (pinned tabs stay locked to the left).
- Middle-click tab closing.
- Unsaved dirty indicators (`●`).
- Drag-and-drop tab reordering.
- Workspace sessions (open tabs, split states, active tabs) automatically saved to `localStorage` and restored on next launch.

### 📜 Word Wrap & Theme Synchronization
- **Word Wrap Toggle**: Header button toggles CodeMirror soft line wrapping globally.
- **Plaintext Buffer Mode**: Dedicated plain text viewer/editor for all non-markdown/non-pdf files, strictly preserving newline breakpoints without formatting artifacts.
- **PDF Viewer**: Embedded hardware-accelerated PDF viewing using native browser engines.
- **Themes**: Light, Dark, and System synced across UI, CodeMirror, and GitHub Markdown typography.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Save active file directly to local disk |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> / <kbd>Cmd</kbd> + <kbd>B</kbd> | Toggle left file tree sidebar |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> / <kbd>Cmd</kbd> + <kbd>P</kbd> | Open Fuzzy File Search (Quick Open) |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Open Find in Files (Content Search) |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | In search modal: Open file in split side pane |
| <kbd>Middle Click</kbd> | Close tab |
| <kbd>Esc</kbd> | Dismiss modals and context menus |

---

## 🧩 Modular Plugin Architecture

ViewMD decouples file format handlers via a clean plugin interface (`src/types/plugin.ts`):

```typescript
export interface ViewerPlugin {
  id: string;
  name: string;
  extensions: string[];
  icon?: LucideIcon;
  supportsEditing: boolean;
  component: React.ComponentType<ViewerProps>;
  headerActions?: React.ComponentType<ViewerHeaderActionProps>;
}
```

### Adding a New Plugin (e.g. `.mdp` Markdown Presentations)
1. Create your component in `src/plugins/mdp/PresentationViewer.tsx`.
2. Define the plugin config in `src/plugins/mdp/index.ts`:
   ```typescript
   export const mdpPlugin: ViewerPlugin = {
     id: 'mdp',
     name: 'Presentation',
     extensions: ['.mdp'],
     supportsEditing: true,
     component: PresentationViewer,
   };
   ```
3. Register it in `src/plugins/index.ts`:
   ```typescript
   pluginRegistry.register(mdpPlugin);
   ```

---

## 🛠️ Local Development

ViewMD is built using **[Bun](https://bun.sh/)** for rapid package resolution, bundling, and testing.

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)

### Setup
```bash
# Clone repository
git clone https://github.com/username/viewmd.git
cd viewmd

# Install dependencies
bun install

# Start development server
bun run dev
```

### Testing
```bash
# Run unit & integration tests
bun test
```

### Production Build
```bash
# Typecheck and build static bundle
bun run build
```
The output bundle will be generated in `./dist`, ready for static deployment to GitHub Pages, Cloudflare Pages, or Vercel.

---

## 🔒 Privacy & Local-First Guarantee

- **No Remote Telemetry**: Zero analytics, zero third-party tracking scripts.
- **Local Storage Only**: File handles remain in your browser's private IndexedDB instance.
- **Direct Disk Access**: Data is read directly from and written directly to your machine's file system through official browser standards.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
