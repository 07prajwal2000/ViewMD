import { Presentation } from 'lucide-react';
import type { ViewerPlugin } from '../../types/plugin';
import { PresentationViewer } from './PresentationViewer';
import { PresentationToolbar } from './PresentationToolbar';

export const presentationPlugin: ViewerPlugin = {
  id: 'presentation',
  name: 'Presentation',
  extensions: ['.mdp', '.deck'],
  icon: Presentation,
  supportsEditing: true,
  component: PresentationViewer,
  headerActions: PresentationToolbar,
};

export * from './types';
export * from './parser';
export * from './themes';
export * from './Slide';
export * from './SlideContent';
export * from './InteractiveRunner';
export * from './PresentationToolbar';
export * from './PresentationViewer';
export * from './PrintSlides';
export * from './LaserPointer';
export * from './SlideWhiteboard';
export * from './SlidePenCanvas';
export * from './SlidePenToolbar';
export * from './MdpDocsModal';
