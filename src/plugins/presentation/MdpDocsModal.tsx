import React, { useState, useEffect } from 'react';
import { X, BookOpen, Copy, Check, Sparkles, Layers, Sliders, Presentation, FileCode } from 'lucide-react';
import type { PresentationTheme } from './types';

export interface MdpDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PresentationTheme;
}

type DocCategory = 'getting-started' | 'layouts' | 'interactivity' | 'tools-hotkeys' | 'sizing';

export const MdpDocsModal: React.FC<MdpDocsModalProps> = ({ isOpen, onClose, theme }) => {
  const [activeTab, setActiveTab] = useState<DocCategory>('getting-started');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const CodeBlock: React.FC<{ code: string; id: string; language?: string }> = ({
    code,
    id,
    language = 'markdown',
  }) => (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-white/10 bg-black/60 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-gray-400">
        <span className="uppercase text-[10px] tracking-wider font-semibold">{language}</span>
        <button
          type="button"
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          {copiedKey === id ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-gray-200 leading-relaxed">{code}</pre>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-white/15 overflow-hidden ${
          theme.isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold tracking-tight">ViewMD Presentation Engine (.mdp) Guide</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Complete syntax, directives, interactive widgets, and keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Tabs (Sidebar) */}
          <div className="w-52 border-r border-black/10 dark:border-white/10 p-3 space-y-1 shrink-0 bg-black/5 dark:bg-black/20 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('getting-started')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                activeTab === 'getting-started'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Presentation className="w-4 h-4 shrink-0" />
              <span>Getting Started</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layouts')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                activeTab === 'layouts'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Layout Directives</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('interactivity')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                activeTab === 'interactivity'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              <span>Interactive Slides</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sizing')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                activeTab === 'sizing'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Density & Scaling</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools-hotkeys')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                activeTab === 'tools-hotkeys'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Tools & Hotkeys</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed space-y-6">
            {/* 1. GETTING STARTED */}
            {activeTab === 'getting-started' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">1. File Format & Slide Separation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Save files with the <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">.mdp</code> or{' '}
                  <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">.deck</code> extension. Slides are separated by three dashes{' '}
                  <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">---</code> on an empty line:
                </p>

                <CodeBlock
                  id="slide-sep"
                  code={`# Title Slide
Welcome to the presentation

---

# Second Slide
- Key takeaway one
- Key takeaway two`}
                />

                <h3 className="text-lg font-bold pt-2">2. Deck Frontmatter (Optional)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure deck-wide themes and aspect ratios at the top of your file:
                </p>
                <CodeBlock
                  id="frontmatter"
                  language="yaml"
                  code={`---
title: "Distributed Architecture Deck"
theme: "tokyo-night" # midnight | tokyo-night | mocha | paper | daylight | obsidian
aspectRatio: "16:9"   # 16:9 | 4:3 | 16:10
fontScale: "normal"  # normal | compact | mini | large
author: "Prajwal"
---`}
                />

                <h3 className="text-lg font-bold pt-2">3. Curated Keynote Themes</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                  <li><strong>midnight</strong>: Deep slate developer dark (#0a0f1d) + electric cyan accent</li>
                  <li><strong>tokyo-night</strong>: Neon cyberpunk dark (#1a1b26) + pink/violet accent</li>
                  <li><strong>mocha</strong>: Catppuccin warm espresso (#1e1e2e) + mauve accent</li>
                  <li><strong>paper</strong>: Warm editorial serif newsprint (#faf8f5) + amber accent</li>
                  <li><strong>daylight</strong>: Swiss modern clean light (#f8fafc) + blue accent</li>
                  <li><strong>obsidian</strong>: High-contrast OLED pitch (#000000) + lime accent</li>
                </ul>
              </div>
            )}

            {/* 2. LAYOUT DIRECTIVES */}
            {activeTab === 'layouts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Smart Image Layout Directives</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  ViewMD supports Deckrun-compatible layout directives inside image titles:
                </p>

                <h4 className="font-semibold text-blue-500">A. Split Right Layout (&quot;right&quot;)</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Docks your image on the right (42%) and text bullet points on the left (58%):
                </p>
                <CodeBlock
                  id="split-right"
                  code={`# Split Right Layout
![Architecture Diagram](https://example.com/diagram.png "right")

- Bullet points automatically position on the left
- Media docks cleanly on the right
- Opacity modifier supported: "right opacity:0.85"`}
                />

                <h4 className="font-semibold text-blue-500 pt-2">B. Split Left Layout (&quot;left&quot;)</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Places media on the left panel with text on the right:
                </p>
                <CodeBlock
                  id="split-left"
                  code={`# Split Left Layout
![Hardware Setup](https://example.com/photo.jpg "left")

- Visual content docks on the left
- Explanatory points dock on the right`}
                />

                <h4 className="font-semibold text-blue-500 pt-2">C. Fullscreen Background (&quot;bg&quot;)</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Applies full-bleed background art across the entire 16:9 canvas:
                </p>
                <CodeBlock
                  id="bg-directive"
                  code={`![Hero Graphic](https://example.com/hero.jpg "bg opacity:0.25")

# Big Impact Heading
Subtitle positioned over full-bleed background art`}
                />

                <h4 className="font-semibold text-blue-500 pt-2">D. Centered Layout</h4>
                <CodeBlock
                  id="center-layout"
                  code={`<!-- layout: center -->

# Key Quote
> "Simplicity is prerequisite for reliability." — Edsger Dijkstra`}
                />
              </div>
            )}

            {/* 3. INTERACTIVITY */}
            {activeTab === 'interactivity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Interactive HTML5 Canvas & Live Scripts</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Embed live canvases, interactive click counters, and SVGs inside slides. ViewMD automatically isolates execution, scopes document lookups to the slide container, and cancels animation frames and event listeners upon slide exit.
                </p>

                <h4 className="font-semibold text-blue-500">Live Particle Canvas Animation</h4>
                <CodeBlock
                  id="canvas-code"
                  language="html"
                  code={`<canvas id="starsCanvas" width="1200" height="400" class="w-full h-80 rounded-2xl bg-black block"></canvas>

<script>
  const canvas = document.getElementById('starsCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let x = 0;
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc((x += 2) % canvas.width, 200, 15, 0, Math.PI * 2);
      ctx.fill();
      requestAnimationFrame(loop);
    }
    loop();
  }
</script>`}
                />

                <h4 className="font-semibold text-blue-500 pt-2">Live Click Counter Button</h4>
                <CodeBlock
                  id="btn-code"
                  language="html"
                  code={`<button id="counterBtn" class="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white cursor-pointer">
  Clicks: <span id="counterNum">0</span>
</button>

<script>
  let c = 0;
  const btn = document.getElementById('counterBtn');
  const num = document.getElementById('counterNum');
  if (btn && num) {
    btn.addEventListener('click', () => {
      c++;
      num.textContent = c;
    });
  }
</script>`}
                />
              </div>
            )}

            {/* 4. DENSITY & SCALING */}
            {activeTab === 'sizing' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Text Density & Overflow Protection</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When a slide contains dense information (e.g. 10 bullet points, large tables, or code snippets), use density scaling to prevent content overflow:
                </p>

                <h4 className="font-semibold text-blue-500">A. Slide-Level Size Directives</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Add a comment directive anywhere in a specific slide:
                </p>
                <CodeBlock
                  id="size-directive"
                  code={`<!-- size: compact -->

# Dense Slide Title
- Bullet point 1
- Bullet point 2
- Bullet point 3
- Bullet point 4
- Bullet point 5
- Bullet point 6`}
                />
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <li><code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">&lt;!-- size: compact --&gt;</code>: 80% font scale, compact margins</li>
                  <li><code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">&lt;!-- size: mini --&gt;</code>: 65% font scale, best for deep tables</li>
                  <li><code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">&lt;!-- size: large --&gt;</code>: 120% font scale, punchy single quotes</li>
                </ul>

                <h4 className="font-semibold text-blue-500 pt-2">B. Live Font Scale Switcher</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Use the <strong>Density Dropdown</strong> in the presentation toolbar to globally switch between Default (100%), Compact (80%), and Mini (65%) live during a presentation.
                </p>

                <h4 className="font-semibold text-blue-500 pt-2">C. Smooth Virtual Scrolling</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  All slide containers automatically support overflow scrolling. If content ever exceeds the 1080px canvas, it can be scrolled seamlessly with a mouse wheel or trackpad.
                </p>
              </div>
            )}

            {/* 5. TOOLS & HOTKEYS */}
            {activeTab === 'tools-hotkeys' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Presenter Tools & Keyboard Shortcuts</h3>

                <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 font-bold">
                        <th className="py-2.5 px-3">Hotkey</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 dark:divide-white/10">
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">→ / Space / PgDn</td>
                        <td className="py-2 px-3 font-semibold">Next Slide</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Advance presentation to next slide</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">← / Backspace / PgUp</td>
                        <td className="py-2 px-3 font-semibold">Previous Slide</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Return to previous slide</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">Home / End</td>
                        <td className="py-2 px-3 font-semibold">First / Last Slide</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Jump straight to deck start or conclusion</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">F</td>
                        <td className="py-2 px-3 font-semibold">Toggle Fullscreen</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Enter full display presenter mode</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-rose-400">L</td>
                        <td className="py-2 px-3 font-semibold">Glowing Laser Pointer</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Neon trailing laser-pen with auto-hide after 1s inactivity</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-amber-400">P</td>
                        <td className="py-2 px-3 font-semibold">Persistent Slide Pen</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Draw directly on top of slides; persisted in memory per slide</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-amber-400">Ctrl+Z (in Pen)</td>
                        <td className="py-2 px-3 font-semibold">Undo Pen Stroke</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Undo last pen sketch on the current slide</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-amber-400">Ctrl+Y / Ctrl+Shift+Z</td>
                        <td className="py-2 px-3 font-semibold">Redo Pen Stroke</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Redo previously undone sketch on the current slide</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-400">W</td>
                        <td className="py-2 px-3 font-semibold">Slide Whiteboard</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Opens tldraw whiteboard canvas (drawings saved per slide)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">O / Esc</td>
                        <td className="py-2 px-3 font-semibold">Slide Grid Overview</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">View thumbnail grid of all slides to jump instantly</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-blue-400">?</td>
                        <td className="py-2 px-3 font-semibold">Open Syntax Guide</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">Opens this documentation guide anytime</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">?</kbd> anytime to open this guide.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
