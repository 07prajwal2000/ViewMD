# ViewMD Presentation Engine (`.mdp`) Reference Guide

The **ViewMD Presentation Engine** transforms standard Markdown and Deckrun-compatible directives into elegant, keynote-grade presentations running 100% client-side in the browser.

---

## 1. Quick Start

### File Extensions
ViewMD automatically activates the Presentation Engine for files ending in:
- `.mdp`
- `.deck`

You can also present any regular `.md` file at any time by switching the view plugin to **Presentation** in the tab header.

### Slide Separation
Slides are separated by three dashes (`---`) on an isolated line:

```markdown
# Slide 1: Welcome
Welcome to our presentation!

---

# Slide 2: Next Steps
- First item
- Second item
```

> **Safe Parsing**: Delimiters (`---`) placed inside fenced code blocks (``` or ~~~) are ignored by the slide parser and will not split your slide.

---

## 2. YAML Frontmatter

You can define deck-wide configurations at the very beginning of your `.mdp` file:

```yaml
---
title: "System Architecture & Performance"
theme: "tokyo-night" # Options: midnight | tokyo-night | mocha | paper | daylight | obsidian
aspectRatio: "16:9"   # Options: 16:9 | 4:3 | 16:10
fontScale: "normal"  # Options: normal | compact | mini | large
transition: "slide"  # Options: slide | fade | zoom | none
author: "Prajwal"
date: "2026-11-04"
---
```

### Supported Themed Palettes

| Theme ID | Style | Background | Accent | Typography |
| :--- | :--- | :--- | :--- | :--- |
| `midnight` | Deep slate developer dark | `#0a0f1d` | Electric Cyan (`#38bdf8`) | Inter + JetBrains Mono |
| `tokyo-night`| Neon cyberpunk dark | `#1a1b26` | Neon Violet & Pink (`#f43f5e`) | Outfit + JetBrains Mono |
| `mocha` | Catppuccin warm espresso | `#1e1e2e` | Mauve & Rosewater (`#cba6f7`)| Plus Jakarta + Fira Code|
| `paper` | Warm editorial newsprint | `#faf8f5` | Charcoal & Amber (`#d97706`) | Serif (Georgia) + Mono |
| `daylight` | Clean Swiss modern light | `#f8fafc` | Deep Slate & Blue (`#2563eb`)| Inter + Roboto Mono |
| `obsidian` | High-contrast OLED pitch | `#000000` | Electric Lime (`#a3e635`) | Geist / Inter + Mono |

---

## 3. Deckrun-Compatible Layout Directives

ViewMD recognizes layout directives directly in Markdown image titles:

### A. Split Right Layout (`"right"`)
Splits the slide into a 58% text column on the left and a 42% media display on the right:

```markdown
# Server Infrastructure
![Server](https://example.com/server.png "right opacity:0.9")

- Distributed storage nodes across 3 regions
- Automatic failover within 150ms
- End-to-end encryption with TLS 1.3
```

### B. Split Left Layout (`"left"`)
Places the media on the left panel with bullet points on the right:

```markdown
# Hardware Architecture
![Cluster](https://example.com/rack.png "left")

- Dual-socket AMD EPYC processors
- 512 GB ECC DDR5 memory
- 4x 100GbE QSFP28 interfaces
```

### C. Fullscreen Background (`"bg"`)
Displays full-bleed background graphics across the 16:9 canvas:

```markdown
![Hero Background](https://example.com/skyline.jpg "bg opacity:0.25")

# Keynote Title Slide
### High-impact presentations powered by ViewMD
```

### D. Centered Layout
Centers content horizontally and vertically:

```markdown
<!-- layout: center -->

# "Simplicity is prerequisite for reliability."
— Edsger W. Dijkstra
```

---

## 4. Text Density & Sizing Directives

When slides contain long lists or large tables, use size directives to prevent vertical clipping:

```markdown
<!-- size: compact -->

# Dense Overview
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5
- Point 6
- Point 7
```

### Size Options
- `<!-- size: normal -->`: Standard keynote size (100%)
- `<!-- size: compact -->`: 80% scale (ideal for 6–10 bullet items)
- `<!-- size: mini -->`: 65% scale (best for wide tables and code)
- `<!-- size: large -->`: 120% scale (ideal for single-line quotes)

---

## 5. Interactive HTML5 & Scripts

Slides can include executable JavaScript, live HTML5 canvases, and responsive DOM buttons:

### Live Particle Canvas

```html
<canvas id="particles" width="1200" height="400" class="w-full h-80 rounded-2xl bg-black block"></canvas>

<script>
  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let x = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc((x += 3) % canvas.width, 200, 16, 0, Math.PI * 2);
      ctx.fill();
      requestAnimationFrame(render);
    }
    render();
  }
</script>
```

### Interactive Click Counter

```html
<button id="demoBtn" class="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white cursor-pointer">
  Clicks: <span id="demoCount">0</span>
</button>

<script>
  let count = 0;
  const btn = document.getElementById('demoBtn');
  const countSpan = document.getElementById('demoCount');
  if (btn && countSpan) {
    btn.addEventListener('click', () => {
      count++;
      countSpan.textContent = count;
    });
  }
</script>
```

*Note: ViewMD automatically scopes `document.getElementById` to the slide container and cancels animation frames and intervals upon navigating to another slide.*

---

## 6. Presenter Tools & Keyboard Shortcuts

| Shortcut | Tool / Action | Description |
| :--- | :--- | :--- |
| <kbd>→</kbd> / <kbd>Space</kbd> / <kbd>PgDn</kbd> | **Next Slide** | Advances presentation forward |
| <kbd>←</kbd> / <kbd>Backspace</kbd> / <kbd>PgUp</kbd> | **Prev Slide** | Returns to previous slide |
| <kbd>Home</kbd> / <kbd>End</kbd> | **First / Last** | Jumps to start or end of presentation |
| <kbd>F</kbd> | **Fullscreen** | Toggles full-screen presentation mode |
| <kbd>L</kbd> | **Laser Pointer** | Glowing neon red trailing laser with auto-fade after 1s |
| <kbd>P</kbd> | **Slide Pen Tool** | Freehand drawing directly on slides (persists in memory) |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> (in Pen) | **Undo Pen Stroke** | Undo last pen sketch on the current slide |
| <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> | **Redo Pen Stroke** | Redo previously undone sketch on the current slide |
| <kbd>W</kbd> | **Slide Whiteboard** | Opens full `tldraw` canvas board (persists per slide) |
| <kbd>O</kbd> / <kbd>Esc</kbd> | **Overview Grid** | Opens thumbnail modal to jump to any slide |
| <kbd>?</kbd> | **Syntax Guide** | Opens interactive in-app documentation modal |

---

## 7. Vector PDF Export

Click **Export PDF** in the toolbar or HUD to generate an export-ready 16:9 PDF.
- Uses `@page { size: 16in 9in; margin: 0; }` for crisp vector output.
- Print media rules ensure every slide renders as a full-bleed 16:9 page with clean margins and no watermarks.
