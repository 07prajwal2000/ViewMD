import { pluginRegistry } from './registry';
import { markdownPlugin } from './markdown';
import { pdfPlugin } from './pdf';

export function initializePlugins(): void {
  // Register Markdown as default plugin
  pluginRegistry.register(markdownPlugin, true);

  // Register PDF plugin
  pluginRegistry.register(pdfPlugin);
}

export { pluginRegistry };
