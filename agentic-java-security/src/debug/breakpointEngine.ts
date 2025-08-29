// src/debug/breakpointEngine.ts

import * as vscode from "vscode";
import { planBreakpoints } from "../ai/aiBreakpointPlanner";

// In-memory map: breakpoint ID -> metadata
const breakpointMetadata = new Map<string, { reason: string; requestedState?: string[] }>();

// Adds breakpoints via VS Code Debug API.

function addBreakpoints(
  planned: Array<{ line: number; reason: string; requestedState?: string[] }>,
  documentUri: vscode.Uri
) {
  const bps: vscode.SourceBreakpoint[] = planned.map((p) => {
    const loc = new vscode.Location(documentUri, new vscode.Position(p.line - 1, 0));
    const bp = new vscode.SourceBreakpoint(loc, true);

    // Store metadata keyed by breakpoint ID
    breakpointMetadata.set(bp.id, {
      reason: p.reason,
      requestedState: p.requestedState ?? [],
    });

    return bp;
  });

  vscode.debug.addBreakpoints(bps);

  // Detailed logs
  console.log("[BreakpointEngine] Injected breakpoints:");
  for (const p of planned) {
    console.log(`  - line ${p.line}: ${p.reason} (requestedState=${p.requestedState?.join(", ") ?? "none"})`);
  }
}

//Takes parsed AST, sends it to AI planner, and injects breakpoints.
export async function analyzeAndAddBreakpoints(
  ast: any,
  uri: vscode.Uri
): Promise<void> {
  try {
    console.log("[BreakpointEngine] Received AST, passing to AI...");
    const planned = await planBreakpoints(ast); 
    // [{line, reason, requestedState?}, ...]

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

//Lookup helper: get metadata for a breakpoint
 
export function getBreakpointMetadata(bpId: string) {
  return breakpointMetadata.get(bpId);
}

