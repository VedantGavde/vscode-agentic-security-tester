import * as vscode from "vscode";
import { parseJavaAst } from "./ast/astParser";
import { addBreakpointsFromAst } from "./breakpoint/breakpointEngine";
import { listenForStateCapture } from "./debug/stateCapture";

export function activate(context: vscode.ExtensionContext) {
  // Register the new modular command
  const disposable = vscode.commands.registerCommand("extension.autoBreakpoint", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    if (!filePath.endsWith(".java")) {
      vscode.window.showErrorMessage("The active file is not a Java file");
      return;
    }

    try {
      // 1) Run JavaParserCLI and get AST JSON
      const astJson = await parseJavaAst(filePath, context);

      // 2) Feed into our breakpoint engine
      await addBreakpointsFromAst(astJson, document.uri);

      vscode.window.showInformationMessage("Breakpoints injected successfully.");
    } catch (err: any) {
      vscode.window.showErrorMessage(err?.message ?? "Unexpected error");
    }
  });

  context.subscriptions.push(disposable);

  // Passively start listening for breakpoint-hit (Day-4 work)
  listenForStateCapture();
}

export function deactivate() {}

