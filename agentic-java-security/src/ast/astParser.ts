import * as path from "path";
import * as cp from "child_process";
import * as vscode from "vscode";

/**
 * Runs JavaParserCLI on a .java file and returns parsed JSON AST.
 */
export async function parseJavaAst(
  filePath: string,
  context: vscode.ExtensionContext
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parserFolder = path.join(context.extensionPath, "java-parser");
    const sep = process.platform === "win32" ? ";" : ":";

    // Use build (for .class) + lib/* (for dependencies)
    const cmd = `java -cp "build${sep}lib/*" JavaParserCLI "${filePath}"`;

    cp.exec(cmd, { cwd: parserFolder }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (parseErr) {
        reject(new Error("Failed to parse JSON from JavaParserCLI"));
      }
    });
  });
}

