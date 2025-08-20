import * as vscode from "vscode";

/**
 * Uses VS Code's built-in documentSymbolProvider (from the Java language server)
 * to obtain a lightweight AST-like structure for the Java file.
 *
 * Each symbol includes: name, kind (Class/Method/Field/etc.) and source range.
 */
export async function parseJavaAst(filePath: string): Promise<vscode.DocumentSymbol[]> {
  const uri = vscode.Uri.file(filePath);

  try {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      uri
    );

    if (!symbols) {
      throw new Error("No symbol information returned");
    }
    return symbols;
  } catch (err) {
    vscode.window.showErrorMessage(
      `Could not retrieve Java symbols for ${filePath}: ${String(err)}`
    );
    throw err;
  }
}

