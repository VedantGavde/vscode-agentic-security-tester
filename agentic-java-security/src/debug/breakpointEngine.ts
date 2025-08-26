// src/debug/breakpointEngine.ts

import * as vscode from "vscode";
import { planBreakpoints } from "../ai/aiBreakpointPlanner";

/**
 * Adds breakpoints via VS Code Debug API.
 */
function addBreakpoints(
  planned: Array<{ line: number; reason: string }>,
  documentUri: vscode.Uri
) {
  const bps: vscode.SourceBreakpoint[] = planned.map((p) => {
    const loc = new vscode.Location(documentUri, new vscode.Position(p.line - 1, 0));
    return new vscode.SourceBreakpoint(loc, true);
  });

  vscode.debug.addBreakpoints(bps);

  // Detailed logs
  console.log("[BreakpointEngine] Injected breakpoints:");
  for (const p of planned) {
    console.log(`  - line ${p.line}: ${p.reason}`);
  }
}

/**
 * Takes parsed AST, sends it to AI planner, and injects breakpoints.
 */
export async function analyzeAndAddBreakpoints(
  ast: any,
  uri: vscode.Uri
): Promise<void> {
  try {
    console.log("[BreakpointEngine] Received AST, passing to AI...");
    const planned = await planBreakpoints(ast); // [{line, reason}, ...]

    if (!planned.length) {
      vscode.window.showInformationMessage("AI planner returned zero breakpoints.");
      console.warn("[BreakpointEngine] No breakpoints returned by planner.");
      return;
    }

    vscode.window.showInformationMessage(
      `AI injecting breakpoints at lines: ${planned.map((p) => p.line).join(", ")}`
    );
    addBreakpoints(planned, uri);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to generate breakpoints: ${String(err)}`);
    console.error("[BreakpointEngine] Error:", err);
  }
}

