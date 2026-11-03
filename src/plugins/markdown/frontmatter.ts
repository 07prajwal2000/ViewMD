import yaml from 'yaml';

export interface FrontmatterResult {
  hasFrontmatter: boolean;
  data: Record<string, unknown> | null;
  raw: string;
  error: string | null;
  body: string;
}

// Matches opening `---` on the first line (or after empty lines),
// optional YAML content, and closing `---` or `...` on its own line.
const FRONTMATTER_REGEX = /^(?:[ \t]*\r?\n)*---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

/**
 * Extracts and parses YAML frontmatter from markdown text.
 * Returns parsed object, raw YAML string, error if any, and the remaining body text.
 */
export function parseFrontmatter(markdownText: string): FrontmatterResult {
  if (!markdownText) {
    return {
      hasFrontmatter: false,
      data: null,
      raw: '',
      error: null,
      body: markdownText || '',
    };
  }

  // Remove leading UTF-8 BOM if present
  const clean = markdownText.replace(/^\uFEFF/, '');
  const match = clean.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      hasFrontmatter: false,
      data: null,
      raw: '',
      error: null,
      body: clean,
    };
  }

  const raw = match[1] || '';
  const body = clean.slice(match[0].length);

  // If the frontmatter content is empty or only whitespace/comments that parse to null
  if (!raw.trim()) {
    return {
      hasFrontmatter: false,
      data: null,
      raw: '',
      error: null,
      body,
    };
  }

  try {
    const parsed = yaml.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        hasFrontmatter: true,
        data: parsed as Record<string, unknown>,
        raw,
        error: null,
        body,
      };
    }

    if (parsed !== null && parsed !== undefined) {
      return {
        hasFrontmatter: true,
        data: { value: parsed },
        raw,
        error: null,
        body,
      };
    }

    return {
      hasFrontmatter: false,
      data: null,
      raw,
      error: null,
      body,
    };
  } catch (err) {
    return {
      hasFrontmatter: true,
      data: null,
      raw,
      error: err instanceof Error ? err.message : String(err),
      body,
    };
  }
}
