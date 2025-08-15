import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.parseJava', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const filePath = editor.document.fileName;
        if (!filePath.endsWith('.java')) {
            vscode.window.showErrorMessage('The active file is not a Java file.');
            return;
        }

        // Path to the java-parser folder where JavaParserCLI.class and jars exist
        const parserFolder = path.join(context.extensionPath, 'java-parser');

        // Build the java command to run your CLI
        const cmd = `java -cp ".:${path.join(parserFolder, '*')}" JavaParserCLI "${filePath}"`;

        // Run the java command
        cp.exec(cmd, { cwd: parserFolder }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(`Error: ${stderr || err.message}`);
                return;
            }

            // Show AST in Output panel
            const outputChannel = vscode.window.createOutputChannel('Java AST');
            outputChannel.clear();
            outputChannel.append(stdout);
            outputChannel.show();
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

