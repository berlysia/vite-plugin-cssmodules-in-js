import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import type { Node, File } from "@babel/types";
import type {
  CssTagInfo,
  ScopeInfo,
  TransformError,
  HoistedDeclaration,
} from "./types.d.ts";

const traverse = (
  typeof traverseModule === "function"
    ? traverseModule
    : // @ts-expect-error -- cjs
      traverseModule.default
) as typeof traverseModule;
const generate = (
  typeof generateModule === "function"
    ? generateModule
    : // @ts-expect-error -- cjs
      generateModule.default
) as typeof generateModule;

interface TransformResult {
  cssTagInfos: CssTagInfo[];
  code: string;
}

const errorMessages: Record<TransformError["type"], string> = {
  DYNAMIC_CSS_NOT_ALLOWED: "cssタグは静的な内容のみサポートしています",
  LOOP_CSS_NOT_ALLOWED: "ループ内でのcssタグの使用はサポートしていません",
  DUPLICATE_NAME: "変数名が重複しています",
  INVALID_SCOPE: "不正なスコープでcssタグが使用されています",
};

function createScopeInfo(): ScopeInfo {
  return {
    variableCounters: new Map(),
    mangledNames: new Set(),
    hoistedDeclarations: [],
  };
}

function mangleVariableName(originalName: string, scope: ScopeInfo): string {
  const count = scope.variableCounters.get(originalName) || 0;
  const mangledName = `${originalName}_${count}`;
  scope.variableCounters.set(originalName, count + 1);
  scope.mangledNames.add(mangledName);
  return mangledName;
}

export function transform(code: string, id: string): TransformResult {
  const cssTagInfos: CssTagInfo[] = [];
  const scope = createScopeInfo();

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  // Find css tagged template literals
  traverse(ast, {
    TaggedTemplateExpression(path) {
      const { node } = path;

      // Only process css tagged template literals
      if (!t.isIdentifier(node.tag, { name: "css" })) {
        return;
      }

      // Check for invalid usage in loops
      if (path.findParent((p) => p.isForStatement() || p.isWhileStatement())) {
        throw new Error(errorMessages.LOOP_CSS_NOT_ALLOWED);
      }

      // Get the variable name that the styles are assigned to
      const parent = path.parent;
      if (!t.isVariableDeclarator(parent)) {
        throw new Error(
          "css tagged template literals must be assigned to a variable"
        );
      }

      const originalName = t.isIdentifier(parent.id)
        ? parent.id.name
        : "styles";
      const mangledName = mangleVariableName(originalName, scope);

      // Extract the CSS content from the template literal
      const quasis = node.quasi.quasis.map((q) => q.value.raw);
      const expressions = node.quasi.expressions.map((expr) => {
        if (!t.isStringLiteral(expr) && !t.isNumericLiteral(expr)) {
          throw new Error(errorMessages.DYNAMIC_CSS_NOT_ALLOWED);
        }
        return expr.type === "StringLiteral" ? expr.value : String(expr.value);
      });

      // Interleave the quasis and expressions to get the full CSS content
      let content = quasis[0];
      for (let i = 0; i < expressions.length; i++) {
        content += expressions[i] + quasis[i + 1];
      }

      // Create a unique ID for this CSS module
      const moduleId = `virtual:css-modules$${id.replace(/\.[jt]sx?$/, "")}-${
        scope.hoistedDeclarations.length
      }.module.css`;

      // Store the hoisted declaration
      const declaration: HoistedDeclaration = {
        originalName,
        mangledName,
        cssContent: content,
        moduleId,
      };
      scope.hoistedDeclarations.push(declaration);

      // Store the CSS tag info
      cssTagInfos.push({
        id: moduleId,
        content,
        variableName: originalName,
        mangledName,
        location: node.loc!,
      });

      // Replace all references to the variable
      const binding = path.scope.getBinding(originalName);
      if (binding) {
        binding.referencePaths.forEach((refPath) => {
          (refPath.node as t.Identifier).name = mangledName;
        });
      }

      // Remove the variable declaration
      const varDecl = path.findParent((p) => p.isVariableDeclaration());
      if (!varDecl) {
        throw new Error("Failed to find parent variable declaration");
      }
      varDecl.remove();
    },
  });

  // Add imports at the top of the file
  const importDeclarations = scope.hoistedDeclarations.map((decl) =>
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier(decl.mangledName))],
      t.stringLiteral(decl.moduleId)
    )
  );

  // Find the program body
  const program = ast.program;
  program.body.unshift(...importDeclarations);

  // Generate the transformed code
  const result = traverse.removeProperties(ast as Node);
  const output = generate(result as File);

  return {
    cssTagInfos,
    code: output.code,
  };
}
