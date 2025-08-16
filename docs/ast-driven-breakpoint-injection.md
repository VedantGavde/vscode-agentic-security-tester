# AST-Driven Breakpoint Injection – VS Code Extension (Day-3 Milestone)

## Purpose

The goal of this milestone is to move beyond static AST display and begin *actively interacting with the running program*. Using the parsed AST, this extension now intelligently inserts debugger breakpoints at security-relevant locations in Java code. This enables us to observe runtime behavior (e.g., variable values, flow into dependencies, and unsafe states) — laying the foundation for autonomous security testing inside VS Code.

---

## System Environment

- **OS**: Ubuntu 24.04 LTS  
- **Node.js**: v22.18.0 (LTS)  
- **npm**: Installed with Node.js  
- **Java**: OpenJDK 21  
- **VS Code**: Latest Stable (with *Debugger for Java* extension installed)  
- **Debug Adapter**: `@vscode/debugadapter` (DAP)  
- **JavaParser**: 3.25.8  
- **Gson**: 2.10.1  

---

## Functionality

- Parses the Java AST using `JavaParserCLI` (enhanced to include line-number metadata)
- Determines security-relevant lines of code using **6 heuristic categories**:
  1. Method entry points  
  2. Calls to external/dependency methods  
  3. User-input source functions  
  4. Critical sink calls (`Runtime.exec`, SQL, File I/O, reflection, deserialization)  
  5. Variable mutation/assignment  
  6. `catch(...) {}` blocks
- Uses the **Debug Adapter Protocol (DAP)** to place debugger breakpoints automatically at those lines
- Adds new VS Code command:  
  **Security Test Extension** → `extension.secTest`

---

## How to Run

1. Ensure a `.java` file is open and *being debugged* in VS Code.
2. Press `Ctrl+Shift+P` and run **Security Test Extension**.
3. Breakpoints will automatically be injected at relevant lines.
4. VS Code will pause execution whenever those breakpoints are hit.

