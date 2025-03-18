import type { Plugin, ModuleNode, HmrContext } from "vite";
import { transform } from "./transform.ts";
import type { PluginContext, VirtualModuleManager } from "./types.d.ts";

class VirtualModuleManagerImpl implements VirtualModuleManager {
  private modules = new Map<string, string>();
  private fileModules = new Map<string, Set<string>>();

  create(id: string, content: string): void {
    this.modules.set(id, content);
  }

  get(id: string): string | undefined {
    return this.modules.get(id);
  }

  update(id: string, content: string): boolean {
    if (!this.modules.has(id)) return false;
    this.modules.set(id, content);
    return true;
  }

  delete(id: string): boolean {
    return this.modules.delete(id);
  }

  getAllForFile(sourceFile: string): string[] {
    return Array.from(this.fileModules.get(sourceFile) || []);
  }

  trackFileModule(sourceFile: string, moduleId: string): void {
    if (!this.fileModules.has(sourceFile)) {
      this.fileModules.set(sourceFile, new Set());
    }
    this.fileModules.get(sourceFile)!.add(moduleId);
  }

  clearFileModules(sourceFile: string): void {
    const modules = this.fileModules.get(sourceFile);
    if (modules) {
      modules.forEach((id) => this.modules.delete(id));
      this.fileModules.delete(sourceFile);
    }
  }
}

export default function cssModulesInJs(): Plugin {
  const context: PluginContext = {
    cssTagsMap: new Map(),
  };
  const virtualModules = new VirtualModuleManagerImpl();

  return {
    name: "vite-plugin-cssmodules-in-js",

    transform(code: string, id: string) {
      if (!id.match(/\.[jt]sx?$/)) return null;

      try {
        // Clear existing virtual modules for this file
        virtualModules.clearFileModules(id);

        // Transform the code
        const { cssTagInfos, code: transformedCode } = transform(code, id);

        // Store CSS tag info for HMR
        context.cssTagsMap.set(id, cssTagInfos);

        // Create virtual modules
        cssTagInfos.forEach((info) => {
          virtualModules.create(info.id, info.content);
          virtualModules.trackFileModule(id, info.id);
        });

        return {
          code: transformedCode,
          map: { mappings: "" }, // Empty source map for now
        };
      } catch (error) {
        this.error(error instanceof Error ? error.message : String(error));
      }
    },

    resolveId(id: string) {
      // Add \0 prefix to avoid Vite's built-in handling
      if (id.startsWith("virtual:css-modules$")) {
        return "\0" + id;
      }
      return null;
    },

    load(id: string) {
      // Handle \0 prefixed ids
      if (id.startsWith("\0virtual:css-modules$")) {
        const virtualId = id.slice(1); // Remove \0 prefix
        const css = virtualModules.get(virtualId);
        if (css === undefined) {
          throw new Error(`Virtual module not found: ${virtualId}`);
        }
        return css;
      }
      return null;
    },

    handleHotUpdate({ file, server }: HmrContext) {
      const cssTagInfos = context.cssTagsMap.get(file);
      if (!cssTagInfos) return;

      // Get the modules that need to be updated
      const modulesToUpdate = virtualModules.getAllForFile(file);
      if (modulesToUpdate.length === 0) return;

      // Update the modules and their dependencies
      const updates = modulesToUpdate
        .map((id) => server.moduleGraph.getModuleById("\0" + id))
        .filter((mod): mod is ModuleNode => mod !== undefined);

      return updates;
    },
  };
}
