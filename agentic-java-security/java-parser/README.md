# Java Parser Module

This module provides a Java utility used by the **Agentic Java Security VS Code Extension** to parse Java source files into an Abstract Syntax Tree (AST).  
It uses [JavaParser](https://javaparser.org/) and outputs JSON that can be consumed by the extension.

---

## Directory Structure

```
java-parser/
├── src/
│   └── main/
│       └── java/
│           └── JavaParserCLI.java   # CLI wrapper around JavaParser
├── lib/
│   ├── javaparser-core-3.25.8.jar
│   └── gson-2.10.1.jar
├── build/                           # Compiled .class files
├── build.sh                         # Script to build the CLI
└── README.md                        # Documentation
```


---

## Requirements

- Java 11+ (JDK)
- The bundled libraries in `lib/`:
  - javaparser-core-3.25.8.jar
  - gson-2.10.1.jar

---

## Build Instructions

Use the provided build script:

```bash
cd java-parser
./build.sh
```

## Usage

Example test files such as `DummyTest.java` are located under: agentic-java-security/examples

```bash
cd java-parser
java -cp "build:lib/*" JavaParserCLI ../examples/DummyTest.java
```

## Notes

DummyTest.java is provided for demonstration and testing only.
The VS Code extension automatically invokes this parser. Manual builds are only required if JavaParserCLI.java is modified.

