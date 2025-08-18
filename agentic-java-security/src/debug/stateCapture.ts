// src/debug/stateCapture.ts

import * as vscode from "vscode";
import { buildSnapshot } from "./captureFormatter";
import { Snapshot, saveSnapshotWithAnalysis } from "../storage/stateManager";
import { analyzeWithLLM } from "../ai/llmAnalyzer";

/**
 * Attach a global debug tracker for Java sessions.
 * Captures a snapshot on every stop, analyzes, saves it, then continues.
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

          try {
            const snapshot: Snapshot = await buildSnapshot(session, threadId, reason);

            const codeSlice = await getCodeContext(snapshot.file, snapshot.line);
            const analysis = await analyzeWithLLM(snapshot, codeSlice);

            output.appendLine(
              `[Snapshot] ${snapshot.className}:${snapshot.line} | method=${snapshot.method?.signature ?? "?"} | vars=${summarizeLocals(snapshot)}`
            );
            output.appendLine(
              `[Analysis] status=${analysis.status} | category=${analysis.category ?? "N/A"}`
            );

            // ⬇️ No more passing workspace folder (stateManager decides)
            await saveSnapshotWithAnalysis(snapshot, analysis);
          } catch (e: any) {
            const msgText = String(e?.message ?? e);
            if (!/No stack frame found/i.test(msgText)) {
              output.appendLine(`[Error] ${msgText}`);
            }
          } finally {
            try {
              await session.customRequest("continue", { threadId });
            } catch {
              /* ignore */
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
  const pairs = locals.map((v: any) => `${v.name}:${v.type || typeof v.value || "?"}`);
  return pairs.join(", ");
}

async function getCodeContext(filePath: string, line: number): Promise<string> {
  try {
    const doc = await vscode.workspace.openTextDocument(filePath);
    const before = 40;
    const after = 40;
    const start = Math.max(0, line - before);
    const end = Math.min(doc.lineCount, line + after);
    const out: string[] = [];
    for (let i = start; i < end; i++) out.push(doc.lineAt(i).text);
    return out.join("\n");
  } catch {
    return "";
  }
}

