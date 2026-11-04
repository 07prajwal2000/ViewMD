import { pluginRegistry } from './registry';
import { markdownPlugin } from './markdown';
import { pdfPlugin } from './pdf';
import { plaintextPlugin } from './plaintext';
import { presentationPlugin } from './presentation';

export function initializePlugins(): void {
  // Register Presentation plugin for .mdp, .deck
  pluginRegistry.register(presentationPlugin);

  // Register Markdown plugin for .md, .markdown, etc.
  pluginRegistry.register(markdownPlugin);

  // Register PDF plugin for .pdf
  pluginRegistry.register(pdfPlugin);

  // Register Plaintext plugin as default fallback for all non-markdown/non-pdf files
  pluginRegistry.register(plaintextPlugin, true);
}

export { pluginRegistry };

