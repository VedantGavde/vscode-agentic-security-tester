import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Automatically tries to start a debug session for the given Java file.
 *   1. Detect class name from the file itself
 *   2. Find .vscode/launch.json in that file's workspace
 *   3. Look for a config with matching "mainClass"
 *   4. Call vscode.debug.startDebugging()
 *
 * Returns true if a debug session was successfully started, false otherwise.
 */
export async function autoStartDebuggingForFile(document: vscode.TextDocument): Promise<boolean> {
  const filePath = document.fileName;
  const className = extractClassNameFromJavaFile(document.getText());
  if (!className) {
    vscode.window.showWarningMessage(`Could not determine class name inside ${path.basename(filePath)}.`);
    return false;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage(`File is not inside a workspace folder.`);
    return false;
  }

  const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
  if (!fs.existsSync(launchJsonPath)) {
    vscode.window.showWarningMessage(`No .vscode/launch.json found in workspace.`);
    return false;
  }

  try {
    const launchContent = fs.readFileSync(launchJsonPath, 'utf8');
    const parsed = JSON.parse(launchContent);
    const configs: any[] = parsed.configurations ?? [];

    // Find a config with type=java and matching mainClass
    const matching = configs.find(cfg => cfg.type === 'java' && cfg.mainClass === className);
    if (!matching) {
      vscode.window.showWarningMessage(`No launch.json configuration found for mainClass="${className}".`);
      return false;
    }

    // Kick off the debugger
    const success = await vscode.debug.startDebugging(workspaceFolder, matching);
    if (!success) {
      vscode.window.showWarningMessage(`Failed to start Java debug session.`);
      return false;
    }

    vscode.window.showInformationMessage(`Started Java debug session for ${className}.`);
    return true;

  } catch (err) {
    vscode.window.showErrorMessage(`Error reading/parsing launch.json: ${err}`);
    return false;
  }
}

function extractClassNameFromJavaFile(text: string): string | null {
  const match = /public\s+class\s+(\w+)/.exec(text);
  return match ? match[1] : null;
}

