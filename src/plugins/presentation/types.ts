import React from 'react';

export type PresentationThemeId =
  | 'midnight'
  | 'paper'
  | 'tokyo-night'
  | 'mocha'
  | 'daylight'
  | 'obsidian';

export type AspectRatio = '16:9' | '4:3' | '16:10';
export type SlideTransition = 'slide' | 'fade' | 'zoom' | 'none';
export type SlideFontScale = 'normal' | 'compact' | 'mini' | 'large';

export interface PresentationFrontmatter {
  title?: string;
  theme?: PresentationThemeId;
  aspectRatio?: AspectRatio;
  transition?: SlideTransition;
  fontScale?: SlideFontScale;
  author?: string;
  date?: string;
  [key: string]: unknown;
}

export interface SlideDirective {
  layout?: 'default' | 'split-right' | 'split-left' | 'center' | 'fullscreen-bg';
  bgImage?: string;
  bgOpacity?: number;
  bgColor?: string;
  notes?: string;
  className?: string;
  fontScale?: SlideFontScale;
}

export interface SplitMedia {
  alt: string;
  src: string;
  position: 'left' | 'right';
  opacity?: number;
}

export interface BackgroundMedia {
  alt: string;
  src: string;
  opacity: number;
}

export interface ParsedSlide {
  id: string;
  index: number;
  rawMarkdown: string;
  cleanedMarkdown: string;
  directives: SlideDirective;
  notes: string;
  scripts: string[];
  splitMedia?: SplitMedia;
  backgroundMedia?: BackgroundMedia;
}

export interface ParsedPresentation {
  frontmatter: PresentationFrontmatter;
  slides: ParsedSlide[];
  totalSlides: number;
}

export interface PresentationTheme {
  id: PresentationThemeId;
  name: string;
  isDark: boolean;
  bgClass: string;
  textClass: string;
  headingClass: string;
  accentColor: string;
  codeTheme: 'dark' | 'light';
  containerStyle: React.CSSProperties;
  slideStyle?: React.CSSProperties;
}
