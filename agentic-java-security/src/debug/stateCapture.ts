// src/debug/stateCapture.ts

import * as vscode from "vscode";
import { buildSnapshot } from "./captureFormatter";
import { Snapshot, saveSnapshotWithAnalysis } from "../storage/stateManager";
import { analyzeWithLLM } from "../ai/llmAnalyzer";
import { decideNextAction, DebugAction } from "../ai/aiDebuggerBrain";

/**
 * Attach a global debug tracker for Java sessions.
 * Captures a snapshot on every stop, analyzes it, saves it, then asks AI what to do next.
 */
export function listenForStateCapture() {
  const output = vscode.window.createOutputChannel("State Capture");

  vscode.debug.registerDebugAdapterTrackerFactory("java", {
    createDebugAdapterTracker: (session) => {
      output.appendLine(`[Debug Tracker Attached] type=${session.type}`);

      return {
        onDidSendMessage: async (msg) => {
          // only interested in genuine break events
          if (msg.event !== "stopped") return;

          const threadId = msg.body?.threadId;
          const reason = msg.body?.reason;
          if (!threadId) return;

          let snapshot: Snapshot | null = null;

          try {
            // build runtime snapshot
            snapshot = await buildSnapshot(session, threadId, reason);

            // provide code context for LLM
            const codeSlice = await getCodeContext(snapshot.file, snapshot.line);

            // let LLM analyze
            const analysis = await analyzeWithLLM(snapshot, codeSlice);

            output.appendLine(
              `[Snapshot] ${snapshot.className}:${snapshot.line} | ${snapshot.method?.signature ?? "?"} | vars=${summarizeLocals(snapshot)}`
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
            // ask AI which debug action to take next
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
                // insert breakpoint mid-debug
                const bp = new vscode.SourceBreakpoint(
                  new vscode.Location(
                    vscode.Uri.file(snapshot?.file || ""),
                    new vscode.Position(action.line - 1, 0)
                  ),
                  true
                );
                vscode.debug.addBreakpoints([bp]);
                // then resume
                await session.customRequest("continue", { threadId });
              }
            } catch {
              // failsafe, just resume
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

function summarizeLocals(s: Snapshot): string {
  const locals = Array.isArray((s as any).variables?.Local) ? (s as any).variables.Local : [];
  return locals.map((v: any) => `${v.name}:${v.type || typeof v.value || "?"}`).join(", ");
}

async function getCodeContext(filePath: string, line: number): Promise<string> {
  try {
    const doc = await vscode.workspace.openTextDocument(filePath);
    const before = 40, after = 40;
    const start = Math.max(0, line - before);
    const end = Math.min(doc.lineCount, line + after);
    const lines: string[] = [];
    for (let i = start; i < end; i++) lines.push(doc.lineAt(i).text);
    return lines.join("\n");
  } catch {
    return "";
  }
}

