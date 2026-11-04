import { parse as parseYaml } from 'yaml';
import type {
  ParsedPresentation,
  ParsedSlide,
  PresentationFrontmatter,
  SlideDirective,
  SplitMedia,
  BackgroundMedia,
} from './types';

// Regex for frontmatter block at the very start of the markdown document
const FRONTMATTER_REGEX =
  /^(?:[ \t]*\r?\n)*---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?(?:---|---)[ \t]*(?:\r?\n|$)/;

// Matches Deckrun image layout directives in Markdown image syntax:
// e.g. ![Alt text](image.png "right") or ![Alt](image.png "bg opacity:0.4")
const IMAGE_DIRECTIVE_REGEX =
  /!\[([^\]]*)\]\(\s*<?([^\s>)]+)>?(?:\s+["']([^"']*)["'])?\s*\)/g;

// Matches HTML comment directives like <!-- note: ... --> or <!-- layout: center --> or <!-- size: compact -->
const COMMENT_DIRECTIVE_REGEX =
  /<!--\s*(note|notes|layout|bg|class|size|font-size|scale):\s*([\s\S]*?)\s*-->/gi;

/**
 * Parses a markdown presentation string into a structured ParsedPresentation object.
 */
export function parsePresentation(markdown: string): ParsedPresentation {
  if (!markdown || !markdown.trim()) {
    return {
      frontmatter: {},
      slides: [
        {
          id: 'slide-0',
          index: 0,
          rawMarkdown: '',
          cleanedMarkdown: '',
          directives: { layout: 'default' },
          notes: '',
          scripts: [],
        },
      ],
      totalSlides: 1,
    };
  }

  // Remove leading UTF-8 BOM if present
  let text = markdown.replace(/^\uFEFF/, '');
  let frontmatter: PresentationFrontmatter = {};

  // 1. Extract and parse frontmatter if present
  const fmMatch = text.match(FRONTMATTER_REGEX);
  if (fmMatch) {
    const rawYaml = fmMatch[1] || '';
    text = text.slice(fmMatch[0].length);

    if (rawYaml.trim()) {
      try {
        const parsed = parseYaml(rawYaml);
        if (parsed && typeof parsed === 'object') {
          frontmatter = parsed as PresentationFrontmatter;
        }
      } catch (err) {
        console.warn('ViewMD: Failed to parse presentation frontmatter YAML:', err);
      }
    }
  }

  // 2. Split slides on `---` that occur on a single line outside of code blocks
  const slideRawChunks = splitBySlideDelimiters(text);

  // 3. Process each slide chunk
  const slides: ParsedSlide[] = slideRawChunks.map((chunk, idx) => {
    return processSlide(chunk, idx);
  });

  // Ensure at least one slide exists
  if (slides.length === 0) {
    slides.push({
      id: 'slide-0',
      index: 0,
      rawMarkdown: '',
      cleanedMarkdown: '',
      directives: { layout: 'default' },
      notes: '',
      scripts: [],
    });
  }

  return {
    frontmatter,
    slides,
    totalSlides: slides.length,
  };
}

/**
 * Splits text by slide delimiter `---` while safely ignoring delimiters
 * that appear inside fenced code blocks (``` ... ``` or ~~~ ... ~~~).
 */
function splitBySlideDelimiters(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const slides: string[] = [];
  let currentSlideLines: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for start or end of code fence
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence;
      currentSlideLines.push(line);
      continue;
    }

    // If outside code fence and line is purely `---` (or `--- `)
    if (!inCodeFence && /^---[ \t]*$/.test(trimmed)) {
      slides.push(currentSlideLines.join('\n'));
      currentSlideLines = [];
    } else {
      currentSlideLines.push(line);
    }
  }

  // Push the final slide
  slides.push(currentSlideLines.join('\n'));

  return slides;
}

/**
 * Masks fenced code blocks (``` or ~~~) and inline code spans (`...`)
 * so directives and markdown tags inside code examples are protected and not mistakenly extracted.
 */
function maskCodeSpans(text: string): { maskedText: string; restore: (str: string) => string } {
  const codeSnippets: string[] = [];
  const CODE_REGEX = /(```[\s\S]*?```|~~~[\s\S]*?~~~|``[\s\S]*?``|`[^`\r\n]*`)/g;

  const maskedText = text.replace(CODE_REGEX, (match) => {
    const placeholder = `@@@VIEWMD_CODE_${codeSnippets.length}@@@`;
    codeSnippets.push(match);
    return placeholder;
  });

  const restore = (str: string): string => {
    return str.replace(/@@@VIEWMD_CODE_(\d+)@@@/g, (_, idxStr) => {
      const idx = parseInt(idxStr, 10);
      return codeSnippets[idx] ?? '';
    });
  };

  return { maskedText, restore };
}

/**
 * Processes an individual slide chunk:
 * Extracts directives, speaker notes, and image layout modifiers.
 */
function processSlide(rawMarkdown: string, index: number): ParsedSlide {
  // 1. Mask code blocks and inline code spans so code examples are protected
  const { maskedText, restore } = maskCodeSpans(rawMarkdown);
  let cleanedMarkdown = maskedText;

  const directives: SlideDirective = { layout: 'default' };
  const notesList: string[] = [];
  let splitMedia: SplitMedia | undefined;
  let backgroundMedia: BackgroundMedia | undefined;

  // 2. Extract comment directives <!-- note: ... -->, <!-- layout: ... -->, etc.
  cleanedMarkdown = cleanedMarkdown.replace(
    COMMENT_DIRECTIVE_REGEX,
    (_, directiveType: string, content: string) => {
      const type = directiveType.toLowerCase();
      const val = content.trim();

      if (type === 'note' || type === 'notes') {
        notesList.push(val);
      } else if (type === 'layout') {
        if (
          val === 'split-right' ||
          val === 'split-left' ||
          val === 'center' ||
          val === 'fullscreen-bg'
        ) {
          directives.layout = val;
        } else if (val === 'default') {
          directives.layout = 'default';
        }
      } else if (type === 'bg') {
        directives.bgColor = val;
      } else if (type === 'class') {
        directives.className = val;
      } else if (type === 'size' || type === 'font-size' || type === 'scale') {
        const lower = val.toLowerCase().trim();
        if (lower === 'compact' || lower === 'sm' || lower === 'small') {
          directives.fontScale = 'compact';
        } else if (lower === 'mini' || lower === 'xs') {
          directives.fontScale = 'mini';
        } else if (lower === 'large' || lower === 'lg') {
          directives.fontScale = 'large';
        } else {
          directives.fontScale = 'normal';
        }
      }

      return ''; // Strip comment from cleaned markdown
    }
  );

  // 3. Extract Deckrun image directives
  // e.g. ![alt](url "right") or ![alt](url "bg opacity:0.3")
  cleanedMarkdown = cleanedMarkdown.replace(
    IMAGE_DIRECTIVE_REGEX,
    (match, alt: string, src: string, title?: string) => {
      if (!title) return match;

      const titleLower = title.toLowerCase().trim();

      // Opacity helper: extract `opacity:0.X`
      const opacityMatch = titleLower.match(/opacity:([0-9.]+)/);
      const opacity = opacityMatch ? parseFloat(opacityMatch[1]) : undefined;

      if (titleLower.includes('right')) {
        if (!splitMedia) {
          splitMedia = {
            alt: alt.trim(),
            src: src.trim(),
            position: 'right',
            opacity,
          };
          directives.layout = 'split-right';
        }
        return ''; // Strip from body to render in split column
      }

      if (titleLower.includes('left')) {
        if (!splitMedia) {
          splitMedia = {
            alt: alt.trim(),
            src: src.trim(),
            position: 'left',
            opacity,
          };
          directives.layout = 'split-left';
        }
        return ''; // Strip from body to render in split column
      }

      if (titleLower.includes('bg')) {
        if (!backgroundMedia) {
          backgroundMedia = {
            alt: alt.trim(),
            src: src.trim(),
            opacity: opacity ?? 0.3,
          };
          directives.layout = 'fullscreen-bg';
        }
        return ''; // Strip from body to render as full background
      }

      return match;
    }
  );

  // 4. Extract executable <script>...</script> blocks
  const scripts: string[] = [];
  cleanedMarkdown = cleanedMarkdown.replace(
    /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi,
    (_, scriptCode: string) => {
      if (scriptCode.trim()) {
        scripts.push(scriptCode.trim());
      }
      return ''; // Strip script from body so it doesn't break React DOM rendering
    }
  );

  // 5. Restore protected code blocks and inline code
  cleanedMarkdown = restore(cleanedMarkdown);

  return {
    id: `slide-${index}`,
    index,
    rawMarkdown,
    cleanedMarkdown: cleanedMarkdown.trim(),
    directives,
    notes: notesList.join('\n\n'),
    scripts,
    splitMedia,
    backgroundMedia,
  };
}
