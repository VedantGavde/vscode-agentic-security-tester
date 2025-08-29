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

    const prettyOutPath = path.join(context.extensionPath, "ast-output-pretty.json");
    const minOutPath = path.join(context.extensionPath, "ast-output-min.json");

    // Run Java CLI to produce pretty JSON
    const cmd = `java -cp "build${sep}lib/*" JavaParserCLI "${filePath}" "${prettyOutPath}"`;

    exec(cmd, { cwd: parserFolder }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }

      try {
        // Read prettified JSON written by JavaParserCLI
        const prettyRaw = fs.readFileSync(prettyOutPath, "utf8");
        const astObj = JSON.parse(prettyRaw);

        // Save a minified version (just for inspection)
        fs.writeFileSync(minOutPath, JSON.stringify(astObj), "utf8");

        console.log(`[AST Parser] Prettified AST: ${prettyOutPath}`);
        console.log(`[AST Parser] Minified AST:   ${minOutPath}`);

        resolve(astObj); // return object (already minifiable in memory)
      } catch (parseErr) {
        reject(new Error("Failed to parse JSON from JavaParserCLI output"));
      }
    });
  });
}

