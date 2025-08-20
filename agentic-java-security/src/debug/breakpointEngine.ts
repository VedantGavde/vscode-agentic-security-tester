// src/debug/breakpointEngine.ts

import * as vscode from "vscode";
import { planBreakpoints } from "../ai/aiBreakpointPlanner";

/**
 * Adds breakpoints via VS Code Debug API.
 */
function addBreakpoints(planned: Array<{ line: number; reason: string }>, documentUri: vscode.Uri) {
  const bps: vscode.SourceBreakpoint[] = planned.map((p) => {
    const loc = new vscode.Location(documentUri, new vscode.Position(p.line - 1, 0));
    return new vscode.SourceBreakpoint(loc, true);
  });

  vscode.debug.addBreakpoints(bps);
  console.log("[BreakpointEngine] Added breakpoints:", bps);
}

/**
 * New AI-driven version, called from extension.ts.
 * Feeds the AST into the AI planner which decides *where* to inject breakpoints.
 */
export async function addBreakpointsFromAst(ast: any, uri: vscode.Uri): Promise<void> {
  try {
    const planned = await planBreakpoints(ast); // [{line, reason}, ...]
    if (!planned.length) {
      vscode.window.showInformationMessage("AI planner returned zero breakpoints.");
      return;
    }
    vscode.window.showInformationMessage(
      `AI injecting breakpoints at: ${planned.map((p) => p.line).join(", ")}`
    );
    addBreakpoints(planned, uri);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to use AI breakpoint planner: ${String(err)}`);
  }
}

