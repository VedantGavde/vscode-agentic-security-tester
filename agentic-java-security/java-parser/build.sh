#!/bin/bash
set -e

SRC_DIR="src/main/java"
BUILD_DIR="build"
LIB_DIR="lib"

mkdir -p "$BUILD_DIR"

echo "Compiling JavaParserCLI..."
javac -cp "$LIB_DIR/*" -d "$BUILD_DIR" "$SRC_DIR/JavaParserCLI.java"

echo "Done. Classes are in $BUILD_DIR"

