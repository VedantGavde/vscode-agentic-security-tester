# Agentic Java Security VS Code Extension

The **Agentic Java Security Tester** is a Visual Studio Code extension that helps Java developers identify **unsafe code patterns** while debugging. 

It automatically:
- Parses your Java file to find key method entry points.
- Inserts breakpoints automatically.
- Captures program state when a breakpoint is hit.
- Analyzes variables and execution context for potential security issues.
- Saves results in structured JSON files for review.

---

## Features

-  **Auto Breakpoints** – No need to manually add breakpoints. 
-  **State Capture** – Local variables, arguments, imports, and return values are recorded. 
-  **AI Analysis** – Captured states are analyzed as:
  -  Safe
  -  Unsafe
  -  Unknown 
-  **Organized Results** – States are stored per Java file under a `states/` folder. 

---

## Installation

1. Clone or download this repository. 
2. Open the folder in **Visual Studio Code**. 
3. Run `npm install` inside the `agentic-java-security` folder. 


---

## Usage

1. Open a Java file in VS Code (e.g., `DummyTest.java`). 
2. Press **F5** in VS Code to start the extension in a new debug window.
3. Press **Ctrl+Shift+P** and search for **Run Java Security Test**.
3. The extension will: 
   - Parse the Java AST. 
   - Insert breakpoints automatically. 
   - Start debugging (if possible). 
   - Save captured states + analysis. 

---

### Example output

For `DummyTest.java`, captured states are saved under 'examples/states/DummyTest/' as:
- DummyTest_line14_unsafe_HardcodedCredentials.json
- DummyTest_line27_safe.json
- DummyTest_line42_unknown.json

Each file contains:
- Snapshot of variables, arguments, imports 
- Thread ID + timestamp 
- AI analysis with reasoning and category

---

# Requirements

- [Visual Studio Code](https://code.visualstudio.com/) (latest) 
- [Node.js](https://nodejs.org/) v18+ 
- Java JDK 11+ (used for parsing Java source files) 

---

## Notes

- Example test files are available in `agentic-java-security/examples/`. 
- Generated `states/` folders are automatically ignored from Git (`.gitignore`). 
- No manual breakpoint setup required — everything is automated. 
