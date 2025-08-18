// src/storage/stateManager.ts

import * as fs from "fs";
import * as path from "path";

export interface MethodContext {
  name: string;
  signature: string;
  args: Record<string, any>;
  returnType: string;
}

export interface Snapshot {
  timestamp: number;
  threadId: number;
  file: string;       // Full path to .java file
  className: string;  // Java class name
  method?: MethodContext;
  line: number;       // Line number where breakpoint stopped
  variables: any;
  imports?: string[];
}

export interface AnalysisResult {
  status: "safe" | "unsafe" | "unknown";
  reasoning: string;
  category?: string; // e.g. "SQL Injection", "Hardcoded Secret"
}

/**
 * Save snapshot + AI analysis in a structured folder layout:
 *
 *   <JavaFileDir>/states/<JavaFileNameWithoutExt>/<FileBase>_line<LineNumber>_<Status>[_<Category>].json
 *
 * Examples:
 *   .../DummyTest.java
 *   .../states/DummyTest/DummyTest_line14_unsafe_HardcodedCredentials.json
 *   .../states/DummyTest/DummyTest_line27_safe.json
 */
export async function saveSnapshotWithAnalysis(
  snapshot: Snapshot,
  analysis: AnalysisResult
): Promise<void> {
  // Parent folder = same directory as the .java file
  const javaFolder = path.dirname(snapshot.file);

  // Strip extension from Java filename
  const baseName = path.basename(snapshot.file, ".java");

  // Create states/<JavaFileNameWithoutExt>/ folder
  const statesFolder = path.join(javaFolder, "states", baseName);
  if (!fs.existsSync(statesFolder)) {
    fs.mkdirSync(statesFolder, { recursive: true });
  }

  // Normalize category (remove spaces if present)
  const categoryPart = analysis.category
    ? "_" + analysis.category.replace(/\s+/g, "")
    : "";

  // Construct filename
  const filename = `${baseName}_line${snapshot.line}_${analysis.status}${categoryPart}.json`;

  // Full path to file
  const fullPath = path.join(statesFolder, filename);

  // Payload: snapshot + analysis
  const payload = { ...snapshot, aiAnalysis: analysis };

  // Write JSON to disk (pretty-printed)
  fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
}

