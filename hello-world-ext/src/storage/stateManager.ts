import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface Snapshot {
  timestamp: number;
  threadId: number;
  file: string;
  className: string;
  line: number;
  category?: string;
  variables: any;
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
 * Save a snapshot to disk with auto-incrementing naming.
 */
export async function saveSnapshot(
  snapshot: Snapshot,
  workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
  const dir = ensureStateDir(workspaceFolder);
  const baseName = snapshot.className || "Unknown";
  let counter = 1;

  // find next available number
  while (true) {
    const filename = path.join(dir, `${baseName}_${String(counter).padStart(4, "0")}.json`);
    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
      break;
    }
    counter++;
  }
}

