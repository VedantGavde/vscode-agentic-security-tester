import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface MethodContext {
  name: string;
  signature: string;
  args: Record<string, any>;
  returnType: string;
}

export interface Snapshot {
  timestamp: number;
  threadId: number;
  file: string;
  className: string;
  method?: MethodContext;
  line: number;
  variables: any;
  imports?: string[];
}

export interface AnalysisResult {
  status: "safe" | "unsafe" | "unknown";
  reasoning: string;
  category?: string; // e.g. "SQL Injection", "Hardcoded Secret"
}

/**
 * Ensure `<workspaceFolder>/states/` exists.
 */
function ensureStateDir(workspaceFolder: vscode.WorkspaceFolder): string {
  const dir = path.join(workspaceFolder.uri.fsPath, "states");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

/**
 * Save snapshot and AI analysis to disk with auto-incrementing naming.
 * Filename now includes the analysis status and category if present.
 */
export async function saveSnapshotWithAnalysis(
  snapshot: Snapshot,
  analysis: AnalysisResult,
  workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
  const dir = ensureStateDir(workspaceFolder);
  const baseName = snapshot.className || "Unknown";
  let counter = 1;

  while (true) {
    const suffix = analysis.category
      ? `${analysis.status}_${analysis.category.replace(/\s+/g, "-")}`
      : analysis.status;
    const filename = path.join(
      dir,
      `${baseName}_${String(counter).padStart(4, "0")}_${suffix}.json`
    );

    if (!fs.existsSync(filename)) {
      const payload = { ...snapshot, aiAnalysis: analysis };
      fs.writeFileSync(filename, JSON.stringify(payload, null, 2));
      break;
    }
    counter++;
  }
}

