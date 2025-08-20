// src/ai/aiBreakpointPlanner.ts

import * as vscode from "vscode";

/**
 * Recursively walk the DocumentSymbol tree to extract method entry lines.
 */
function extractMethodEntries(symbols: vscode.DocumentSymbol[]): Array<{ line: number; reason: string }> {
  const result: Array<{ line: number; reason: string }> = [];

  for (const sym of symbols) {
    if (sym.kind === vscode.SymbolKind.Method) {
      // VS Code line numbers are 0-based, but our breakpoint code adjusts it.
      result.push({
        line: (sym.selectionRange?.start.line ?? sym.range.start.line) + 1, // convert to 1-based
        reason: "methodEntry",
      });
    }

    if (sym.children && sym.children.length > 0) {
      result.push(...extractMethodEntries(sym.children));
    }
  }

  return result;
}

/**
 * Eventually this will call GPT-4o with the AST to decide *where* to break.
 * For day-1 we fallback to "break at all method entries".
 */
export async function planBreakpoints(astSymbols: vscode.DocumentSymbol[]): Promise<Array<{ line: number; reason: string }>> {
  const fallback = extractMethodEntries(astSymbols);
  console.log("[AI-Planner fallback] Planning breakpoints at method entries:", fallback);
  return fallback;
}

