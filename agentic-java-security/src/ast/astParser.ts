import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { exec } from "child_process";

export async function parseJavaAst(
  filePath: string,
  context: vscode.ExtensionContext
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parserFolder = path.join(context.extensionPath, "java-parser");
    const sep = process.platform === "win32" ? ";" : ":";

    // Base output file (Java CLI appends .pretty.json and .min.json)
    const baseOutPath = path.join(context.extensionPath, "ast-output.json");
    const minOutPath = baseOutPath.replace(".json", ".min.json");

    const cmd = `java -cp "build${sep}lib/*" JavaParserCLI "${filePath}" "${baseOutPath}"`;

    exec(cmd, { cwd: parserFolder }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        // Read the minified JSON AST back into memory
        const raw = fs.readFileSync(minOutPath, "utf8");
        const json = JSON.parse(raw);

        console.log(`[AST Parser] AST written to: ${minOutPath}`);
        resolve(json);
      } catch (parseErr) {
        reject(new Error("Failed to parse JSON from JavaParserCLI output"));
      }
    });
  });
}

