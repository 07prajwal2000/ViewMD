import { describe, it, expect, mock } from 'bun:test';

export function extractFileNameFromUrl(rawUrl: string): string {
  const cleanUrl = rawUrl.trim();
  let fileName = 'document.md';
  try {
    // Relative or absolute URL resolution
    const dummyBase = 'https://viewmd.local';
    const u = new URL(cleanUrl, dummyBase);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      fileName = decodeURIComponent(parts[parts.length - 1]);
    }
  } catch {
    const parts = cleanUrl.split('?')[0].split('/').filter(Boolean);
    if (parts.length > 0) {
      fileName = decodeURIComponent(parts[parts.length - 1]);
    }
  }
  if (!fileName.includes('.')) {
    fileName += '.md';
  }
  return fileName;
}

export async function fetchMarkdownFromUrl(rawUrl: string): Promise<{ fileName: string; content: string }> {
  const fileName = extractFileNameFromUrl(rawUrl);
  const res = await fetch(rawUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const content = await res.text();
  return { fileName, content };
}

describe('urlLoader utilities', () => {
  it('extracts filename from standard github raw URLs', () => {
    const url = 'https://raw.githubusercontent.com/user/repo/main/docs/guide.md';
    expect(extractFileNameFromUrl(url)).toBe('guide.md');

    const sample1 = 'https://raw.githubusercontent.com/07prajwal2000/ViewMD/refs/heads/main/samples/sample1.md';
    expect(extractFileNameFromUrl(sample1)).toBe('sample1.md');

    const sample2 = 'https://raw.githubusercontent.com/07prajwal2000/ViewMD/refs/heads/main/samples/sample2.mdp';
    expect(extractFileNameFromUrl(sample2)).toBe('sample2.mdp');
  });

  it('extracts presentation.mdp and ignores query params', () => {
    const url = 'https://example.com/presentations/my-deck.mdp?auth=xyz&v=2';
    expect(extractFileNameFromUrl(url)).toBe('my-deck.mdp');
  });

  it('handles relative paths', () => {
    expect(extractFileNameFromUrl('/sample-deck.mdp')).toBe('sample-deck.mdp');
    expect(extractFileNameFromUrl('notes.md')).toBe('notes.md');
  });

  it('appends .md if URL path has no extension', () => {
    expect(extractFileNameFromUrl('https://example.com/blog/hello-world')).toBe('hello-world.md');
  });

  it('fetches markdown text from mock fetch', async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock(async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '# Remote Markdown\n\nFetched successfully!',
      } as unknown as Response;
    });

    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const res = await fetchMarkdownFromUrl('https://example.com/test.md');
      expect(res.fileName).toBe('test.md');
      expect(res.content).toContain('Remote Markdown');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws helpful error on HTTP 404', async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock(async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => '404',
      } as unknown as Response;
    });

    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      expect(fetchMarkdownFromUrl('https://example.com/nonexistent.md')).rejects.toThrow('HTTP 404: Not Found');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
