import { describe, expect, it } from 'bun:test';
import { parseFrontmatter } from './frontmatter';

describe('frontmatter parser', () => {
  it('handles markdown without frontmatter', () => {
    const md = '# Hello World\nThis is a test.';
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(false);
    expect(result.data).toBeNull();
    expect(result.body).toBe(md);
  });

  it('parses valid YAML frontmatter with various data types', () => {
    const md = `---
title: Welcome to ViewMD
description: Fast markdown viewer
author: Prajwal
draft: false
rating: 5
tags:
  - markdown
  - react
meta:
  views: 120
---

# Main Content
Here is the rest.`;

    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      title: 'Welcome to ViewMD',
      description: 'Fast markdown viewer',
      author: 'Prajwal',
      draft: false,
      rating: 5,
      tags: ['markdown', 'react'],
      meta: { views: 120 },
    });
    expect(result.body.trim()).toBe('# Main Content\nHere is the rest.');
  });

  it('handles CRLF line endings', () => {
    const md = "---\r\ntitle: Windows Test\r\ncount: 42\r\n---\r\n\r\n# Hello CRLF";
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.data?.title).toBe('Windows Test');
    expect(result.data?.count).toBe(42);
    expect(result.body.trim()).toBe('# Hello CRLF');
  });

  it('handles frontmatter closed with ...', () => {
    const md = `---
title: Ellipsis Terminator
...

# Body`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.data?.title).toBe('Ellipsis Terminator');
    expect(result.body.trim()).toBe('# Body');
  });

  it('does not treat horizontal rules in body as frontmatter', () => {
    const md = `# First Header

---

Some content after hr
---
Another section`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(false);
    expect(result.data).toBeNull();
    expect(result.body).toBe(md);
  });

  it('handles invalid YAML gracefully with error message', () => {
    const md = `---
title: "Unclosed string
date: 2026-11-03
---

# Content`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.body.trim()).toBe('# Content');
  });

  it('handles empty frontmatter delimiters', () => {
    const md = `---\n---\n\n# Real Content`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(false);
    expect(result.body.trim()).toBe('# Real Content');
  });

  it('handles BOM character at start of file', () => {
    const md = `\uFEFF---\ntitle: BOM Test\n---\n# Body`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.data?.title).toBe('BOM Test');
  });

  it('handles document with frontmatter only and no body', () => {
    const md = `---
title: Only Frontmatter
status: draft
---`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(result.data?.title).toBe('Only Frontmatter');
    expect(result.data?.status).toBe('draft');
    expect(result.body).toBe('');
  });

  it('handles multiline YAML strings and nested objects', () => {
    const md = `---
summary: >
  This is a multiline
  summary text.
config:
  theme: auto
  features:
    - search
    - split
---

# Content`;
    const result = parseFrontmatter(md);
    expect(result.hasFrontmatter).toBe(true);
    expect(typeof result.data?.summary).toBe('string');
    expect((result.data?.config as any)?.features).toEqual(['search', 'split']);
  });
});
