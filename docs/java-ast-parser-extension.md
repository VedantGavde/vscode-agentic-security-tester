# Java AST Viewer – VS Code Extension

## Purpose
This Visual Studio Code extension parses Java source files into an **Abstract Syntax Tree (AST)** using a Java-based parser and displays the output in JSON format inside VS Code. It is designed to help developers and security researchers analyze Java code structure directly from within the editor.

---

## System Environment
- **OS**: Ubuntu 24.04 LTS (dual boot with Windows 11)
- **Node.js**: v22.18.0 (LTS)
- **npm**: Installed with Node.js
- **Java**: OpenJDK 21 (installed via apt)
- **Git**: Latest stable release
- **Visual Studio Code**: Latest stable release
- **TypeScript**: 5.9.2 (installed as a dev dependency in this project)
- **JavaParser**: 3.25.8 (via Maven Central, included as a local JAR)
- **Gson**: 2.10.1 (included as a local JAR)

---

## Installation

### 1. Install Java
Java is required to run the backend parser.
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```

## Running the extension
1. Open the project folder in Visual Studio Code.
2. Press F5 — this will launch a new Extension Development Host window.
3. In the new window, open any .java file.
4. Open the Command Palette (Ctrl+Shift+P on Linux/Windows, Cmd+Shift+P on macOS).
5. Search for and run: Parse Java File (AST)
6. The AST will appear in the Java AST Output panel.
