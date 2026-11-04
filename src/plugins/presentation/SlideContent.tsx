import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { ParsedSlide, PresentationTheme, SlideFontScale } from './types';

export interface SlideContentProps {
  slide?: ParsedSlide;
  content?: string;
  theme: PresentationTheme;
  fontScale?: SlideFontScale;
  className?: string;
  style?: React.CSSProperties;
}

const SCALE_STYLES: Record<
  SlideFontScale,
  {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    p: string;
    ul: string;
    ol: string;
    blockquote: string;
    pre: string;
    code: string;
    table: string;
  }
> = {
  normal: {
    h1: 'text-6xl sm:text-7xl font-black tracking-tight leading-[1.1] mb-8',
    h2: 'text-4xl sm:text-5xl font-extrabold tracking-tight leading-snug mb-6',
    h3: 'text-2xl sm:text-3xl font-bold leading-snug mb-5',
    h4: 'text-xl sm:text-2xl font-semibold mb-4',
    h5: 'text-lg sm:text-xl font-medium leading-normal mb-3 opacity-80',
    h6: 'text-base sm:text-lg font-medium leading-normal mb-2 opacity-70 uppercase tracking-wider',
    p: 'text-2xl sm:text-3xl leading-relaxed mb-6 font-normal',
    ul: 'list-disc list-outside text-2xl sm:text-3xl leading-relaxed space-y-4 mb-8 pl-8',
    ol: 'list-decimal list-outside text-2xl sm:text-3xl leading-relaxed space-y-4 mb-8 pl-8',
    blockquote:
      'border-l-4 pl-6 py-2 my-6 text-2xl italic rounded-r-xl bg-black/5 dark:bg-white/5 backdrop-blur-xs leading-relaxed',
    pre: 'text-lg sm:text-xl font-mono leading-relaxed p-6 my-6 rounded-2xl overflow-x-auto shadow-lg border',
    code: 'text-xl font-mono px-2 py-0.5 rounded-md',
    table: 'text-xl w-full my-6 border-collapse text-left',
  },
  compact: {
    h1: 'text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6',
    h2: 'text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug mb-4',
    h3: 'text-xl sm:text-2xl font-bold leading-snug mb-3',
    h4: 'text-lg sm:text-xl font-semibold mb-3',
    h5: 'text-base sm:text-lg font-medium leading-normal mb-2 opacity-80',
    h6: 'text-sm sm:text-base font-medium leading-normal mb-2 opacity-70 uppercase tracking-wider',
    p: 'text-xl sm:text-2xl leading-relaxed mb-4 font-normal',
    ul: 'list-disc list-outside text-xl sm:text-2xl leading-relaxed space-y-2.5 mb-6 pl-8',
    ol: 'list-decimal list-outside text-xl sm:text-2xl leading-relaxed space-y-2.5 mb-6 pl-8',
    blockquote:
      'border-l-4 pl-5 py-2 my-4 text-xl italic rounded-r-xl bg-black/5 dark:bg-white/5 backdrop-blur-xs leading-relaxed',
    pre: 'text-base sm:text-lg font-mono leading-relaxed p-5 my-4 rounded-xl overflow-x-auto shadow-md border',
    code: 'text-lg font-mono px-1.5 py-0.5 rounded-md',
    table: 'text-lg w-full my-4 border-collapse text-left',
  },
  mini: {
    h1: 'text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4',
    h2: 'text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-3',
    h3: 'text-lg sm:text-xl font-bold leading-snug mb-2.5',
    h4: 'text-base sm:text-lg font-semibold mb-2',
    h5: 'text-sm sm:text-base font-medium leading-normal mb-2 opacity-80',
    h6: 'text-xs sm:text-sm font-medium leading-normal mb-1.5 opacity-70 uppercase tracking-wider',
    p: 'text-lg sm:text-xl leading-normal mb-3 font-normal',
    ul: 'list-disc list-outside text-lg sm:text-xl leading-normal space-y-1.5 mb-4 pl-7',
    ol: 'list-decimal list-outside text-lg sm:text-xl leading-normal space-y-1.5 mb-4 pl-7',
    blockquote:
      'border-l-4 pl-4 py-1.5 my-3 text-lg italic rounded-r-lg bg-black/5 dark:bg-white/5 backdrop-blur-xs leading-normal',
    pre: 'text-sm sm:text-base font-mono leading-normal p-4 my-3 rounded-lg overflow-x-auto shadow-xs border',
    code: 'text-base font-mono px-1.5 py-0.5 rounded-sm',
    table: 'text-base w-full my-3 border-collapse text-left',
  },
  large: {
    h1: 'text-7xl sm:text-8xl font-black tracking-tight leading-[1.05] mb-10',
    h2: 'text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-8',
    h3: 'text-3xl sm:text-4xl font-bold leading-snug mb-6',
    h4: 'text-2xl sm:text-3xl font-semibold mb-5',
    h5: 'text-xl sm:text-2xl font-medium leading-normal mb-4 opacity-80',
    h6: 'text-lg sm:text-xl font-medium leading-normal mb-3 opacity-70 uppercase tracking-wider',
    p: 'text-3xl sm:text-4xl leading-relaxed mb-8 font-normal',
    ul: 'list-disc list-outside text-3xl sm:text-4xl leading-relaxed space-y-5 mb-10 pl-10',
    ol: 'list-decimal list-outside text-3xl sm:text-4xl leading-relaxed space-y-5 mb-10 pl-10',
    blockquote:
      'border-l-6 pl-8 py-3 my-8 text-3xl italic rounded-r-2xl bg-black/5 dark:bg-white/5 backdrop-blur-xs leading-relaxed',
    pre: 'text-xl sm:text-2xl font-mono leading-relaxed p-8 my-8 rounded-2xl overflow-x-auto shadow-xl border',
    code: 'text-2xl font-mono px-2.5 py-1 rounded-md',
    table: 'text-2xl w-full my-8 border-collapse text-left',
  },
};

export const SlideContent: React.FC<SlideContentProps> = ({
  slide,
  content,
  theme,
  fontScale,
  className = '',
  style,
}) => {
  const markdown = content ?? slide?.cleanedMarkdown ?? slide?.rawMarkdown ?? '';

  if (!markdown.trim()) {
    return null;
  }

  const effectiveScale: SlideFontScale =
    fontScale ?? slide?.directives.fontScale ?? 'normal';
  const s = SCALE_STYLES[effectiveScale] || SCALE_STYLES.normal;

  return (
    <div
      className={`slide-content ${theme.textClass} ${className}`}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 {...props} className={`${s.h1} ${theme.headingClass}`}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className={`${s.h2} ${theme.headingClass}`}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className={`${s.h3} ${theme.headingClass}`}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 {...props} className={`${s.h4} ${theme.headingClass}`}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 {...props} className={`${s.h5} ${theme.headingClass}`}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 {...props} className={`${s.h6} ${theme.headingClass}`}>
              {children}
            </h6>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className={`${s.p} ${theme.textClass}`}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className={`${s.ul} ${theme.textClass}`}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className={`${s.ol} ${theme.textClass}`}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="pl-1.5 leading-relaxed marker:opacity-75">
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className={s.blockquote}
              style={{ borderColor: theme.accentColor }}
            >
              {children}
            </blockquote>
          ),
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className={`${s.pre} ${
                theme.isDark
                  ? 'bg-slate-900/90 border-slate-700/60 text-slate-100'
                  : 'bg-slate-100/95 border-slate-300 text-slate-900'
              }`}
            >
              {children}
            </pre>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isCodeBlock = codeClassName?.includes('hljs') || codeClassName?.includes('language-');
            if (!isCodeBlock) {
              return (
                <code
                  {...props}
                  className={`${s.code} ${
                    theme.isDark
                      ? 'bg-white/10 text-pink-300'
                      : 'bg-black/5 text-pink-600'
                  }`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className={codeClassName}>
                {children}
              </code>
            );
          },
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-gray-300/80 dark:border-gray-700/80 shadow-xs">
              <table {...props} className={s.table}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead
              {...props}
              className="bg-gray-100/80 dark:bg-gray-800/80 font-bold border-b border-gray-300 dark:border-gray-700"
            >
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th {...props} className="px-6 py-4 font-bold tracking-wide">
              {children}
            </th>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props} className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr
              {...props}
              className="even:bg-gray-50/50 dark:even:bg-gray-800/20 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors"
            >
              {children}
            </tr>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="px-6 py-4 leading-normal">
              {children}
            </td>
          ),
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-2 hover:opacity-80 transition-opacity font-medium"
              style={{ color: theme.accentColor }}
            >
              {children}
            </a>
          ),
          hr: ({ ...props }) => (
            <hr
              {...props}
              className="my-8 border-0 h-px bg-gray-300 dark:bg-gray-700/80"
            />
          ),
          canvas: ({ ...props }) => (
            <canvas
              {...props}
              className="max-w-full rounded-xl shadow-md my-4 block"
            />
          ),
          svg: ({ children, ...props }) => (
            <svg {...props} className="max-w-full inline-block">
              {children}
            </svg>
          ),
          video: ({ ...props }) => (
            <video
              {...props}
              controls
              className="max-w-full rounded-2xl shadow-xl my-4 object-contain"
            />
          ),
          button: ({ children, style: btnStyle, ...props }) => (
            <button
              {...props}
              type="button"
              className="px-6 py-3 rounded-xl font-medium shadow-md transition-all cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.accentColor,
                color: '#ffffff',
                ...btnStyle,
              }}
            >
              {children}
            </button>
          ),
          img: ({ src, alt, ...props }) => (
            <img
              {...props}
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-xl shadow-md my-4 object-contain"
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
