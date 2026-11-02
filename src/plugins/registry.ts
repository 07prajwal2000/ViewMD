import type { ViewerPlugin } from '../types/plugin';

class PluginRegistry {
  private plugins = new Map<string, ViewerPlugin>();
  private extensionMap = new Map<string, string>(); // extension -> pluginId
  private defaultPluginId: string | null = null;

  register(plugin: ViewerPlugin, isDefault = false): void {
    this.plugins.set(plugin.id, plugin);

    for (const ext of plugin.extensions) {
      const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
      this.extensionMap.set(normalizedExt, plugin.id);
    }

    if (isDefault || !this.defaultPluginId) {
      this.defaultPluginId = plugin.id;
    }
  }

  get(pluginId: string): ViewerPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getForFile(fileName: string): ViewerPlugin {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const ext = fileName.slice(lastDotIndex).toLowerCase();
      const pluginId = this.extensionMap.get(ext);
      if (pluginId && this.plugins.has(pluginId)) {
        return this.plugins.get(pluginId)!;
      }
    }

    // Fallback to default plugin
    if (this.defaultPluginId && this.plugins.has(this.defaultPluginId)) {
      return this.plugins.get(this.defaultPluginId)!;
    }

    throw new Error(`No viewer plugin registered for file: ${fileName}`);
  }

  getAll(): ViewerPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
