import * as vscode from "vscode";
// Load environment variables
import "dotenv/config";
import { parseJavaAst } from "./ast/astParser";
import { analyzeAndAddBreakpoints } from "./debug/breakpointEngine"; 
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
      // 1: Parse AST once
      const astJson = await parseJavaAst(filePath, context);
      console.log("[Extension] Parsed AST:", astJson);

      // 2: Inject breakpoints (pass AST directly, not filePath)
      await analyzeAndAddBreakpoints(astJson, document.uri);
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
      console.error("[Extension] Error:", err);
    }
  });

  context.subscriptions.push(disposable);

  // Passive state-capture listener
  listenForStateCapture();
}

export function deactivate() {}

