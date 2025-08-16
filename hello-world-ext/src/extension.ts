import * as dap from "@vscode/debugadapter";
import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import * as net from "net";


/**
 * ------ CATEGORY MATCHING FUNCTIONS ------
 * Here we're doing basic "string-based" checks (statements containing specific patterns).
 * You can replace/extend each one with better AST heuristics later.
 */

function isMethodEntry(methodName: string): boolean {
  // all method entries are considered by default
  return true;
}

function isExternalCall(code: string): boolean {
  // naive detection of external/dependency calls (e.g. not java.lang.*)
  return /\w+\.\w+\(/.test(code) && !code.startsWith("System.");
}

function isUserInputSource(code: string): boolean {
  return /(Scanner|BufferedReader|getParameter)/.test(code);
}

function isCriticalSink(code: string): boolean {
  return /(Runtime\.exec|Statement|File|ObjectInputStream|PreparedStatement)/.test(code);
}

function isVariableMutation(code: string): boolean {
  return /=/.test(code);
}

function isCatchBlock(code: string): boolean {
  return code.startsWith("catch");
}

/**
 * Parses JSON AST & extracts line numbers matching the 6 categories.
 */
function extractBreakpointLines(ast: any): number[] {
  const lines: Set<number> = new Set();

  for (const method of ast.methods || []) {
    const methodName: string = method.name;

    if (isMethodEntry(methodName) && method.line !== undefined) {
      lines.add(method.line);
    }

    for (const stmt of method.body || []) {
      const code: string = stmt.code;
      const line: number = stmt.line;

      if (
        isExternalCall(code) ||
        isUserInputSource(code) ||
        isCriticalSink(code) ||
        isVariableMutation(code) ||
        isCatchBlock(code)
      ) {
        lines.add(line);
      }
    }
  }
  return Array.from(lines);
}

/**
 * Starts a DAP connection to the running Java debugger and adds breakpoints.
 */
function addBreakpointsDAP(lines: number[], documentUri: vscode.Uri) {
  const port = 4711; // this assumes a localhost DAP debugger running (Java debugger uses this by default if attached)
  const socket = new net.Socket();
  socket.connect(port, "127.0.0.1", () => {
    const session = new dap.DebugSession();
    session.setRunAsServer(true);
    session.start(<any>socket, socket);

    const bps = lines.map((l) => ({
      source: { path: documentUri.fsPath },
      line: l,
    }));

    session.sendRequest(
  "setBreakpoints",
  {
    source: { path: documentUri.fsPath },
    breakpoints: bps,
  },
  1000, // timeout in ms
  (response) => {
    console.log("DAP response to setBreakpoints:", response);
  }
);

  });
}

export function activate(context: vscode.ExtensionContext) {
  /**
   * 1. run JavaParserCLI → get JSON AST
   * 2. extract lines
   * 3. connect via DAP → add breakpoints
   */
  const disposable = vscode.commands.registerCommand("extension.secTest", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor");
      return;
    }

    const filePath = editor.document.fileName;
    if (!filePath.endsWith(".java")) {
      vscode.window.showErrorMessage("The active file is not a Java file");
      return;
    }

    // Path to JavaParserCLI + JARs
    const parserFolder = path.join(context.extensionPath, "java-parser");
    const cmd = `java -cp ".:${path.join(
      parserFolder,
      "*"
    )}" JavaParserCLI "${filePath}"`;

    cp.exec(cmd, { cwd: parserFolder }, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage(stderr || err.message);
        return;
      }

      let astJson: any;
      try {
        astJson = JSON.parse(stdout);
      } catch (e) {
        vscode.window.showErrorMessage("Bad JSON from JavaParserCLI");
        return;
      }

      // ---- Extract breakpoint categories ----
      const lines = extractBreakpointLines(astJson);

      vscode.window.showInformationMessage(
        `Placing breakpoints at: ${lines.join(", ")}`
      );

      addBreakpointsDAP(lines, editor.document.uri);
    });
  });

  context.subscriptions.push(disposable);

  /**
   * Listen for BREAKS → Day-4 will capture variables here
   */
  vscode.debug.onDidStartDebugSession((session: vscode.DebugSession) => {
    console.log("Breakpoint hit; Day-4 logic goes here.");
    // Next day: session.customRequest('stackTrace') etc.
  });
}

export function deactivate() {}

