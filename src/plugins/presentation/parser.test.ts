import { describe, expect, it } from 'bun:test';
import { parsePresentation } from './parser';

describe('presentation parser', () => {
  it('handles empty input gracefully', () => {
    const result = parsePresentation('');
    expect(result.totalSlides).toBe(1);
    expect(result.slides[0].id).toBe('slide-0');
    expect(result.slides[0].cleanedMarkdown).toBe('');
  });

  it('parses frontmatter metadata properly', () => {
    const md = `---
title: ViewMD Deck
theme: tokyo-night
aspectRatio: 16:9
transition: fade
author: Prajwal
---

# Welcome to Slide 1
First slide content.`;

    const result = parsePresentation(md);
    expect(result.frontmatter.title).toBe('ViewMD Deck');
    expect(result.frontmatter.theme).toBe('tokyo-night');
    expect(result.frontmatter.aspectRatio).toBe('16:9');
    expect(result.frontmatter.transition).toBe('fade');
    expect(result.frontmatter.author).toBe('Prajwal');
    expect(result.totalSlides).toBe(1);
    expect(result.slides[0].cleanedMarkdown).toContain('# Welcome to Slide 1');
  });

  it('splits slides separated by ---', () => {
    const md = `# Slide 1
Intro

---

# Slide 2
Body

---

# Slide 3
Conclusion`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(3);
    expect(result.slides[0].cleanedMarkdown).toContain('# Slide 1');
    expect(result.slides[1].cleanedMarkdown).toContain('# Slide 2');
    expect(result.slides[2].cleanedMarkdown).toContain('# Slide 3');
  });

  it('does NOT split on --- inside fenced code blocks', () => {
    const md = `# Slide 1

\`\`\`yaml
---
name: config
---
\`\`\`

Still slide 1

---

# Slide 2
This is slide 2.`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(2);
    expect(result.slides[0].cleanedMarkdown).toContain('name: config');
    expect(result.slides[1].cleanedMarkdown).toContain('# Slide 2');
  });

  it('extracts speaker notes and removes them from cleaned body', () => {
    const md = `# Presentation
<!-- note: Remember to introduce yourself clearly! -->
Welcome everyone.

<!-- notes: Mention ViewMD's PWA capabilities here -->`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(1);
    expect(result.slides[0].notes).toContain('Remember to introduce yourself clearly!');
    expect(result.slides[0].notes).toContain("Mention ViewMD's PWA capabilities here");
    expect(result.slides[0].cleanedMarkdown).not.toContain('<!-- note:');
    expect(result.slides[0].cleanedMarkdown).toContain('Welcome everyone.');
  });

  it('parses Deckrun image layout directives: right, left, bg with opacity', () => {
    const md = `# Split Slide
Some description
![Architecture](https://example.com/arch.png "right opacity:0.8")

---

# Left Image Slide
![Workflow](https://example.com/work.png "left")
Details on the right

---

# Background Art Slide
![Hero](https://example.com/hero.jpg "bg opacity:0.25")
# Title Over Background`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(3);

    // Slide 1: right split
    expect(result.slides[0].directives.layout).toBe('split-right');
    expect(result.slides[0].splitMedia?.position).toBe('right');
    expect(result.slides[0].splitMedia?.src).toBe('https://example.com/arch.png');
    expect(result.slides[0].splitMedia?.opacity).toBe(0.8);
    expect(result.slides[0].cleanedMarkdown).not.toContain('https://example.com/arch.png');

    // Slide 2: left split
    expect(result.slides[1].directives.layout).toBe('split-left');
    expect(result.slides[1].splitMedia?.position).toBe('left');
    expect(result.slides[1].splitMedia?.src).toBe('https://example.com/work.png');

    // Slide 3: background
    expect(result.slides[2].directives.layout).toBe('fullscreen-bg');
    expect(result.slides[2].backgroundMedia?.src).toBe('https://example.com/hero.jpg');
    expect(result.slides[2].backgroundMedia?.opacity).toBe(0.25);
  });

  it('extracts script tags from slide markdown into slide.scripts', () => {
    const md = `# Canvas Slide
<canvas id="testCanvas" width="400" height="200"></canvas>
<script>
  const c = document.getElementById('testCanvas');
  c.getContext('2d').fillRect(0, 0, 50, 50);
</script>`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(1);
    expect(result.slides[0].scripts.length).toBe(1);
    expect(result.slides[0].scripts[0]).toContain("c.getContext('2d').fillRect");
    expect(result.slides[0].cleanedMarkdown).not.toContain('<script>');
  });

  it('parses size and fontScale directives correctly', () => {
    const md = `# Slide 1
<!-- size: compact -->
- Item 1

---

# Slide 2
<!-- font-size: mini -->
- Deep nested item`;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(2);
    expect(result.slides[0].directives.fontScale).toBe('compact');
    expect(result.slides[1].directives.fontScale).toBe('mini');
  });

  it('protects inline code and code blocks from directive extraction', () => {
    const md = `# Split Directive Guide
![Real Image](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800 "right opacity:0.9")

- Example code: \`![Alt](url "right")\`
- Do not extract: \`<!-- note: secret -->\`
- Example script: \`<script>alert(1)</script>\`

\`\`\`markdown
![Block Image](https://example.com/blocked.png "left")
\`\`\``;

    const result = parsePresentation(md);
    expect(result.totalSlides).toBe(1);
    // Real image is correctly extracted
    expect(result.slides[0].directives.layout).toBe('split-right');
    expect(result.slides[0].splitMedia?.src).toBe('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800');
    expect(result.slides[0].splitMedia?.opacity).toBe(0.9);

    // Code examples are preserved in body
    expect(result.slides[0].cleanedMarkdown).toContain('`![Alt](url "right")`');
    expect(result.slides[0].cleanedMarkdown).toContain('`<!-- note: secret -->`');
    expect(result.slides[0].cleanedMarkdown).toContain('![Block Image](https://example.com/blocked.png "left")');
    expect(result.slides[0].scripts.length).toBe(0);
  });
});
