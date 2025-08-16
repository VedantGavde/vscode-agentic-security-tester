import * as vscode from "vscode";

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
  // you can enrich with breakpoint category, taint metadata, etc.
}

/**
 * Build a rich snapshot of current runtime state
 */
export async function buildSnapshot(
  session: vscode.DebugSession,
  threadId: number,
  stopReason?: string
): Promise<RuntimeSnapshot> {
  const snapshot: RuntimeSnapshot = {
    timestamp: Date.now(),
    threadId,
    reason: stopReason,
    callStack: [],
  };

  // Walk the full stack
  const stackResponse = await session.customRequest("stackTrace", { threadId });
  const frames = stackResponse?.stackFrames ?? [];

  for (const frame of frames) {
    const scopesResp = await session.customRequest("scopes", { frameId: frame.id });
    const scopes = scopesResp?.scopes ?? [];

    let variables: any = {};
    // Merge variables from all scopes
    for (const scope of scopes) {
      const varsResp = await session.customRequest("variables", {
        variablesReference: scope.variablesReference,
      });
      variables[scope.name] = varsResp.variables;
    }

    snapshot.callStack.push({
      frameName: frame.name,
      file: frame.source?.path ?? "unknown",
      line: frame.line,
      variables,
    });
  }

  return snapshot;
}

