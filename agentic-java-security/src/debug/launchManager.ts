import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

export async function autoStartDebuggingForFile(document: vscode.TextDocument): Promise<boolean> {
  const filePath = document.fileName;
  const className = extractClassNameFromJavaFile(document.getText());
  if (!className) {
    vscode.window.showWarningMessage(`Could not determine class name inside ${path.basename(filePath)}.`);
    return false;
  }

  // --- Workspace resolution with fallbacks ---
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!workspaceFolder) {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      workspaceFolder = folders[0];
    }
  }

  if (!workspaceFolder) {
    // last resort: fake workspace from file's directory
    workspaceFolder = {
      uri: vscode.Uri.file(path.dirname(filePath)),
      name: path.basename(path.dirname(filePath)),
      index: 0,
    } as vscode.WorkspaceFolder;
  }

  // Step 1: Compile the Java file into examples/build
  const examplesBuild = path.join(path.dirname(filePath), "build");

  if (!fs.existsSync(examplesBuild)) {
    fs.mkdirSync(examplesBuild, { recursive: true });
  }

  try {
    cp.execSync(`javac -d "${examplesBuild}" "${filePath}"`, {
      cwd: path.dirname(filePath),
    });
    vscode.window.showInformationMessage(`Compiled ${className}.java successfully.`);
  } catch (err: any) {
    vscode.window.showErrorMessage(`Compilation failed: ${err.message}`);
    return false;
  }

  // Step 2: Launch debugger with inline config
  const config = {
    type: "java",
    name: `Run ${className}`,
    request: "launch",
    mainClass: className,
    classPaths: [examplesBuild],
  };

  try {
    const success = await vscode.debug.startDebugging(workspaceFolder, config);
    if (!success) {
      vscode.window.showWarningMessage(`Failed to start Java debug session.`);
      return false;
    }
    vscode.window.showInformationMessage(`Started Java debug session for ${className}.`);
    return true;
  } catch (err: any) {
    vscode.window.showErrorMessage(`Error starting debugger: ${err.message}`);
    return false;
  }
}

function extractClassNameFromJavaFile(text: string): string | null {
  const match = /public\s+class\s+(\w+)/.exec(text);
  return match ? match[1] : null;
}

