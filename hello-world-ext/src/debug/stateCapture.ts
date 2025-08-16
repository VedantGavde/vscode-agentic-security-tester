import * as vscode from "vscode";

/**
 * Logs and captures program state when breakpoints are hit,
 * and automatically continues until the program terminates.
 */
export function listenForStateCapture() {
  const outputChannel = vscode.window.createOutputChannel("State Capture");

  // Attach tracker **globally** for Java debug sessions
  vscode.debug.registerDebugAdapterTrackerFactory("java", {
    createDebugAdapterTracker: (session) => {
      outputChannel.appendLine(`✅ Tracker attached for type=${session.type}`);

      return {
        onDidSendMessage: async (msg) => {
          outputChannel.appendLine(`--> onDidSendMessage: ${JSON.stringify(msg)}`);

          if (msg.event === "stopped") {
            const threadId = msg.body?.threadId;
            outputChannel.appendLine(`⚠️ stopped, thread=${threadId}, reason=${msg.body?.reason}`);

            if (!threadId) return;

            try {
              const stack = await session.customRequest("stackTrace", { threadId });
              outputChannel.appendLine(`STACK: ${JSON.stringify(stack.stackFrames)}`);

              if (stack?.stackFrames?.length > 0) {
                const frameId = stack.stackFrames[0].id;
                const scopes = await session.customRequest("scopes", { frameId });
                if (scopes?.scopes?.length > 0) {
                  const vars = await session.customRequest("variables", {
                    variablesReference: scopes.scopes[0].variablesReference,
                  });
                  outputChannel.appendLine(`VARS: ${JSON.stringify(vars.variables)}`);
                }
              }

              await session.customRequest("continue", { threadId });
              outputChannel.appendLine(`▶️ continued thread ${threadId}`);
            } catch (err) {
              outputChannel.appendLine(`🚫 error: ${err}`);
            }
          }
        },
      };
    },
  });

  vscode.debug.onDidStartDebugSession((session) => {
    outputChannel.appendLine(`=== Debug Session Started: ${session.name} (type=${session.type}) ===`);
  });

  vscode.debug.onDidTerminateDebugSession((session) => {
    outputChannel.appendLine(`=== Debug Session Ended: ${session.name} ===`);
  });
}

