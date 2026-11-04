---
title: ViewMD Markdown Sample 📝
author: Prajwal
date: 2026-11-04
version: 1.2.0
tags:
  - guide
  - markdown
  - documentation
  - sample
status: published
featured: true
github: https://github.com/07prajwal2000/ViewMD
---

# ViewMD Markdown Showcase 🚀

Welcome to **sample1.md** loaded directly into memory from GitHub Raw Content!

ViewMD is a 100% client-side, zero-backend Markdown viewer and editor running with native performance directly in your browser.

---

## ⚡ Highlights & Capabilities

- [x] **URL Document Loader**: Directly open Markdown files with `?url=<raw_url>`
- [x] **Zero-FS In-Memory Mode**: Create documents and local projects stored in `localStorage`
- [x] **Interactive Frontmatter Inspector**: Formatted metadata table with YAML code toggle
- [x] **Dual Split-Pane View**: Independent side-by-side editing and previewing
- [x] **Fuzzy & Content Search**: Fast indexing powered by Fuse.js

---

## 📊 Feature Comparison Table

| Feature | ViewMD | Desktop Editors (Obsidian) | Web Editors (StackEdit) |
| :--- | :---: | :---: | :---: |
| **No Server / 100% Client-Side** | ✅ Yes | ⚠️ Electron Desktop App | ❌ Backend / Cloud Accounts |
| **Zero Setup / Install-Free** | 🚀 Instant | ❌ 150MB+ Installer | ⚠️ Requires Sign-in |
| **Direct Local Disk Access** | ✅ Native File API | ✅ Yes | ❌ No |
| **PWA Default File Association** | ✅ `.md` & `.mdp` | N/A | ❌ No |
| **Presentation Slide Deck Mode** | 🎭 Native `.mdp` | ⚠️ Plugins Required | ❌ No |

---

## 💻 Code Highlighting

### TypeScript
```typescript
interface DocumentMetadata {
  title: string;
  author: string;
  tags: string[];
  isPinned: boolean;
}

export function parseHeader(rawText: string): DocumentMetadata {
  return {
    title: "ViewMD Showcase",
    author: "Prajwal",
    tags: ["markdown", "pwa", "offline"],
    isPinned: true,
  };
}
```

### Python
```python
def generate_summary(text: str, max_words: int = 50) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."

print(generate_summary("ViewMD runs 100% offline in any modern browser!"))
```

---

## 💡 Callouts & Blockquotes

> **Pro-Tip**: You can save this remote file directly into a browser LocalStorage project using <kbd>Ctrl</kbd> + <kbd>S</kbd> or the **Save** button in the header toolbar!
> Once saved, it will show up in your **Recent Workspaces** list for instant access anytime.
