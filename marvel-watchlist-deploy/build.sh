#!/usr/bin/env bash
set -e
rm -rf out
mkdir -p out
javac -d out $(find src/main/java -name "*.java")
cp -r src/main/resources/public out/public
