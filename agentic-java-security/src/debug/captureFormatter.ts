import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Snapshot, MethodContext } from "../storage/stateManager";

export interface RuntimeSnapshot {
  timestamp: number;
  threadId: number;
  reason: string | undefined;
  callStack: Array<{
    frameName: string;
    file: string;
    line: number;
    variables: any;
  }>;
}

/**
 * Extract method signature + args.
 */
function extractMethodContext(frameName: string, variables: any): MethodContext {
  const args: Record<string, any> = {};
  if (variables["Local"]) {
    for (const v of variables["Local"]) {
      args[v.name] = v.value;
    }
  }

  return {
    name: frameName,
    signature: `${frameName}(${Object.keys(args).join(", ")})`,
    args,
    returnType: "unknown",
  };
}

/**
 * Try to collect imports from the source file.
 */
function extractImports(filePath: string): string[] {
  try {
    const src = fs.readFileSync(filePath, "utf-8");
    return src
      .split("\n")
      .filter((line) => line.startsWith("import "))
      .map((line) => line.replace("import", "").replace(";", "").trim());
  } catch {
    return [];
  }
}

/**
 * Build a rich snapshot of current runtime state.
 */
export async function buildSnapshot(
  session: vscode.DebugSession,
  threadId: number,
  stopReason?: string
): Promise<Snapshot> {
  const stackResponse = await session.customRequest("stackTrace", { threadId });
  const frames = stackResponse?.stackFrames ?? [];
  const topFrame = frames[0]; // focus on top-most frame

  if (!topFrame) {
    throw new Error("No stack frame found.");
  }

  const scopesResp = await session.customRequest("scopes", { frameId: topFrame.id });
  const scopes = scopesResp?.scopes ?? [];

  let variables: any = {};
  for (const scope of scopes) {
    const varsResp = await session.customRequest("variables", {
      variablesReference: scope.variablesReference,
    });
    variables[scope.name] = varsResp.variables;
  }

  const methodCtx = extractMethodContext(topFrame.name, variables);
  const imports = extractImports(topFrame.source?.path ?? "");

  const snapshot: Snapshot = {
    timestamp: Date.now(),
    threadId,
    file: topFrame.source?.path ?? "unknown",
    className: path.basename(topFrame.source?.path ?? "UnknownClass.java", ".java"),
    method: methodCtx,
    line: topFrame.line,
    variables,
    imports,
  };

  return snapshot;
}

