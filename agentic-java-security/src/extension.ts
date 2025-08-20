import * as vscode from "vscode";
// Load environment variables
import "dotenv/config";
import { parseJavaAst } from "./ast/astParser";
import { addBreakpointsFromAst } from "./debug/breakpointEngine";
import { listenForStateCapture } from "./debug/stateCapture";
import { autoStartDebuggingForFile } from "./debug/launchManager";

export function activate(context: vscode.ExtensionContext) {
  // Register the modular command
  const disposable = vscode.commands.registerCommand("extension.autoBreakpoint", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    if (!filePath.toLowerCase().endsWith(".java")) {
      vscode.window.showErrorMessage("The active file is not a Java file");
      return;
    }

    try {
      // 1: Parse AST
      const astJson = await parseJavaAst(filePath);

      // 2: Inject breakpoints
      await addBreakpointsFromAst(astJson, document.uri);
      vscode.window.showInformationMessage("Breakpoints injected successfully.");

      // 3: Auto-start debugging session for this Java file
      const didStart = await autoStartDebuggingForFile(document);
      if (!didStart) {
        vscode.window.showWarningMessage(
          "Could not auto-start debugging. Please run a debug session manually."
        );
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(err?.message ?? "Unexpected error");
    }
  });

  context.subscriptions.push(disposable);

  // Passive state-capture listener
  listenForStateCapture();
}

export function deactivate() {}

