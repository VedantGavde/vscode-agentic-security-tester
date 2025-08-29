// src/debug/stateCapture.ts

import * as vscode from "vscode";
import { buildSnapshot } from "./captureFormatter";
import { Snapshot, saveSnapshotWithAnalysis } from "../storage/stateManager";
import { analyzeWithLLM } from "../ai/llmAnalyzer";
import { decideNextAction, DebugAction } from "../ai/aiDebuggerBrain";
import { getBreakpointMetadata } from "./breakpointEngine";

/**
 * Attach a global debug tracker for Java sessions.
 */
export function listenForStateCapture() {
  const output = vscode.window.createOutputChannel("State Capture");

  vscode.debug.registerDebugAdapterTrackerFactory("java", {
    createDebugAdapterTracker: (session) => {
      output.appendLine(`[Debug Tracker Attached] type=${session.type}`);

      return {
        onDidSendMessage: async (msg) => {
          if (msg.event !== "stopped") return;

          const threadId = msg.body?.threadId;
          const reason = msg.body?.reason;
          if (!threadId) return;

          let snapshot: Snapshot | null = null;

          try {
            snapshot = await buildSnapshot(session, threadId, reason);

            // Find which breakpoint triggered this stop
            const triggered = vscode.debug.breakpoints.find(
              (bp) =>
                bp instanceof vscode.SourceBreakpoint &&
                bp.location.uri.fsPath === snapshot?.file &&
                bp.location.range.start.line === (snapshot?.line ?? 0) - 1
            ) as vscode.SourceBreakpoint | undefined;

            let requestedState: string[] = [];
            if (triggered) {
              const meta = getBreakpointMetadata(triggered.id);
              requestedState = meta?.requestedState ?? [];
            }

            // Just send the snapshot (no code context)
            const analysis = await analyzeWithLLM(snapshot);

            output.appendLine(
              `[Snapshot] ${snapshot.className}:${snapshot.line} | requestedState=${requestedState.join(", ") || "none"}`
            );
            output.appendLine(
              `[Analysis] status=${analysis.status} | category=${analysis.category ?? "N/A"}`
            );

            await saveSnapshotWithAnalysis(snapshot, analysis);
          } catch (err: any) {
            const msgText = String(err?.message ?? err);
            if (!/No stack frame found/i.test(msgText)) {
              output.appendLine(`[Error] ${msgText}`);
            }
          } finally {
            try {
              const action: DebugAction = await decideNextAction(snapshot);
              if (action === "continue") {
                await session.customRequest("continue", { threadId });
              } else if (action === "stepOver") {
                await session.customRequest("next", { threadId });
              } else if (action === "stepInto") {
                await session.customRequest("stepIn", { threadId });
              } else if (action === "stepOut") {
                await session.customRequest("stepOut", { threadId });
              } else if (action === "stop") {
                await session.customRequest("terminate");
              } else if (typeof action === "object" && action.action === "addBreakpoint") {
                const bp = new vscode.SourceBreakpoint(
                  new vscode.Location(
                    vscode.Uri.file(snapshot?.file || ""),
                    new vscode.Position(action.line - 1, 0)
                  ),
                  true
                );
                vscode.debug.addBreakpoints([bp]);
                await session.customRequest("continue", { threadId });
              }
            } catch {
              await session.customRequest("continue", { threadId });
            }
          }
        },
      };
    },
  });

  vscode.debug.onDidStartDebugSession((s) => {
    output.appendLine(`=== Debug Session Started: ${s.name} (${s.type}) ===`);
  });
  vscode.debug.onDidTerminateDebugSession((s) => {
    output.appendLine(`=== Debug Session Ended: ${s.name} ===`);
  });
}

