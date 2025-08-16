import * as vscode from "vscode";
import { buildSnapshot } from "./captureFormatter";
import { saveSnapshot, Snapshot } from "../storage/stateManager";

/**
 * Attach a global debug tracker for Java sessions.
 * Captures a snapshot on every stop, saves it, then auto-continues.
 */
export function listenForStateCapture() {
  const outputChannel = vscode.window.createOutputChannel("State Capture");

  vscode.debug.registerDebugAdapterTrackerFactory("java", {
    createDebugAdapterTracker: (session) => {
      outputChannel.appendLine(`Tracker attached for type=${session.type}`);

      return {
        onDidSendMessage: async (msg) => {
          if (msg.event === "stopped") {
            const threadId = msg.body?.threadId;
            const reason = msg.body?.reason;
            outputChannel.appendLine(`Stopped @ reason=${reason}, thread=${threadId}`);

            if (!threadId) return;

            try {
              const rich = await buildSnapshot(session, threadId, reason);

              // Take only the top frame for our AI logic
              const top = rich.callStack[0];
              const snapshot: Snapshot = {
                timestamp: rich.timestamp,
                threadId: rich.threadId,
                file: top.file,
                className: extractClassName(top.file),
                line: top.line,
                variables: top.variables
              };

              outputChannel.appendLine(`Snapshot: ${JSON.stringify(snapshot)}`);

              // Save to /states
              const wsFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(snapshot.file));
              if (wsFolder) {
                await saveSnapshot(snapshot, wsFolder);
              }

              // continue execution
              await session.customRequest("continue", { threadId });
            } catch (err) {
              outputChannel.appendLine(`error: ${err}`);
            }
          }
        }
      };
    }
  });

  vscode.debug.onDidStartDebugSession((session) => {
    outputChannel.appendLine(`=== Debug Session Started: ${session.name} (type=${session.type}) ===`);
  });

  vscode.debug.onDidTerminateDebugSession((session) => {
    outputChannel.appendLine(`=== Debug Session Ended: ${session.name} ===`);
  });
}

function extractClassName(filePath: string): string {
  return filePath.split(/[\\/]/).pop()?.replace(".java", "") || "Unknown";
}

