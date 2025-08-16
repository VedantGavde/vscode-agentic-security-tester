import * as net from "net";
import * as vscode from "vscode";
import * as dap from "@vscode/debugadapter";

/**
 * Connects to a DAP server (e.g., Java debugger) and listens for events.
 * Specifically captures "stopped" events when a breakpoint is hit.
 */
export function listenForStateCapture() {
  const port = 4711; // must match the Java DAP server port
  const socket = new net.Socket();

  socket.connect(port, "127.0.0.1", () => {
    vscode.window.showInformationMessage("Connected to DAP server for state capture.");

    const session = new dap.DebugSession();
    session.setRunAsServer(true);
    session.start(<any>socket, socket);

    // Hook into breakpoint "stopped" events
    session.on("event", (event) => {
      if (event.event === "stopped") {
        vscode.window.showInformationMessage("Breakpoint hit! Capturing state...");

        // Request stack trace
        session.sendRequest("stackTrace", { threadId: event.body.threadId }, 1000, (stackResp) => {
          console.log("Stack Trace:", stackResp);

          // Request variables for top frame
          if (stackResp?.body?.stackFrames?.length > 0) {
            const frameId = stackResp.body.stackFrames[0].id;
            session.sendRequest("scopes", { frameId }, 1000, (scopesResp) => {
              console.log("Scopes:", scopesResp);

              if (scopesResp?.body?.scopes?.length > 0) {
                const scopeId = scopesResp.body.scopes[0].variablesReference;
                session.sendRequest("variables", { variablesReference: scopeId }, 1000, (varsResp) => {
                  console.log("Captured Variables:", varsResp);

                  // TODO: integrate with storage/ or ai/ modules
                  vscode.window.showInformationMessage("Program state captured (check console).");
                });
              }
            });
          }
        });
      }
    });
  });

  socket.on("error", (err) => {
    vscode.window.showErrorMessage(`DAP connection error: ${err.message}`);
  });
}

