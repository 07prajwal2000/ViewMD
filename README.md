# ViewMD

A fast, bloat-free, client-side Markdown viewer and editor running directly in the browser with true native performance.

ViewMD connects directly to your local file system using the **File System Access API**, allowing you to open folders, edit Markdown files, and save changes straight back to disk without servers, cloud accounts, or Electron bloat.

---

## ✨ Features

- **📂 Native Folder & File Access**: Open local project directories and edit files with direct disk read/write (like Draw.io and VS Code for Web).
- **⏱️ Recent Workspaces**: Automatically caches previously opened folders in IndexedDB so you can reopen your projects with one click.
- **🔄 3-Switch View Mode**: Easily toggle between **Edit Only**, **Split View** (resizable divider), and **Preview Only**.
- **🌲 Collapsible File Tree Sidebar**: Full recursive directory hierarchy with file creation, folder creation, and `Ctrl+B` toggle.
- **📑 Tabbed Browsing**: Multi-file editing with dirty indicators (`●`) and middle-click to close.
- **📝 Standard & Global Markdown (GFM)**:
  - Tables, task lists / checkboxes, strikethrough, autolinks, and blockquotes.
  - Syntax highlighting for 100+ programming languages.
- **📄 Native PDF Viewer**: Open `.pdf` documents directly in tabs using the browser's built-in, hardware-accelerated PDF engine.
- **🌗 Theme Support**: Light, Dark, and System (auto-syncs with OS settings, CodeMirror editor, and markdown typography).
- **🔌 Modular Plugin Architecture**: Clean plugin registry pattern designed to easily add new file handlers (such as `.mdp` Markdown Presentations).
- **🚀 100% Client-Side & GitHub Pages Ready**: Zero backend, zero tracking, static deployment.

---

## ⌨️ Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` / `Cmd + S` | Save active file directly to disk |
| `Ctrl + B` / `Cmd + B` | Toggle left file explorer sidebar |

---

## 🛠️ Development

This project is built with **Bun**, **Vite**, **React**, **TypeScript**, **Tailwind CSS v4**, and **CodeMirror 6**.

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)

### Install Dependencies
```bash
bun install
```

### Start Local Development Server
```bash
bun run dev
```

### Build for Production
```bash
bun run build
```

The output will be placed in `./dist` with relative paths (`base: './'`), ready to be hosted on GitHub Pages, Cloudflare Pages, Vercel, or any static file server.

---

## 🧩 Architecture & Extensibility

ViewMD uses a decoupled **Viewer Plugin Registry** (`src/plugins/registry.ts`).

To extend ViewMD with a new format (e.g. `.mdp` for Markdown Presentations):
1. Create a component in `src/plugins/mdp/PresentationViewer.tsx`.
2. Define a `ViewerPlugin` registering `.mdp` extensions.
3. Call `pluginRegistry.register(presentationPlugin)` in `src/plugins/index.ts`.

---

## 📄 License
MIT
