import * as vscode from "vscode";
import * as net from "net";
import * as dap from "@vscode/debugadapter";

/**
 * ------ CATEGORY MATCHING FUNCTIONS ------
 * Simple heuristics; can be expanded later.
 */
function isMethodEntry(methodName: string): boolean {
  return true;
}
function isExternalCall(code: string): boolean {
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
 * Parses AST and returns a list of line numbers that match any of the 6 rule categories.
 */
function extractBreakpointLines(ast: any): number[] {
  const lines: Set<number> = new Set();

  for (const method of ast.methods || []) {
    const methodName: string = method.name;
    if (isMethodEntry(methodName) && Number.isInteger(method.line)) {
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
 * Opens a raw DAP socket and sends a setBreakpoints request
 */
function sendBreakpointsViaDAP(lines: number[], documentUri: vscode.Uri) {
  // Assuming Java debugger is listening on localhost:4711
  const port = 4711;
  const socket = new net.Socket();

  socket.connect(port, "127.0.0.1", () => {
    const session = new dap.DebugSession();
    session.setRunAsServer(true);
    session.start(<any>socket, socket);

    const dapBreakpoints = lines.map((l) => ({
      source: { path: documentUri.fsPath },
      line: l,
    }));

    session.sendRequest(
      "setBreakpoints",
      {
        source: { path: documentUri.fsPath },
        breakpoints: dapBreakpoints,
      },
      1000,
      (response) => {
        console.log("DAP response:", response);
      }
    );
  });
}

/**
 * Public function to call from extension.ts
 */
export async function addBreakpointsFromAst(ast: any, uri: vscode.Uri): Promise<void> {
  const lines = extractBreakpointLines(ast);
  vscode.window.showInformationMessage(`Injecting breakpoints at: ${lines.join(", ")}`);
  sendBreakpointsViaDAP(lines, uri);
}

