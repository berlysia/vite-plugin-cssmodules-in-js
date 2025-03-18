import type { SourceLocation } from "@babel/types";

export interface CssTagInfo {
  id: string;
  content: string;
  variableName: string;
  mangledName: string;
  location: SourceLocation;
}

export interface HoistedDeclaration {
  originalName: string;
  mangledName: string;
  cssContent: string;
  moduleId: string;
}

export interface ScopeInfo {
  variableCounters: Map<string, number>;
  mangledNames: Set<string>;
  hoistedDeclarations: HoistedDeclaration[];
}

export interface PluginContext {
  cssTagsMap: Map<string, CssTagInfo[]>;
}

export interface TransformError {
  type:
    | "DYNAMIC_CSS_NOT_ALLOWED"
    | "LOOP_CSS_NOT_ALLOWED"
    | "DUPLICATE_NAME"
    | "INVALID_SCOPE";
  message: string;
  location?: SourceLocation;
}

export interface VirtualModuleManager {
  create(id: string, content: string): void;
  get(id: string): string | undefined;
  update(id: string, content: string): boolean;
  delete(id: string): boolean;
  getAllForFile(sourceFile: string): string[];
}

declare global {
  const css: (
    strings: TemplateStringsArray,
    ...values: Array<string | number>
  ) => { readonly [key: string]: string };
}

declare module "virtual:css-modules$*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
