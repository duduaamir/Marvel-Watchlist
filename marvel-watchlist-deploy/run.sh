#!/usr/bin/env bash
# Builds (if needed) and runs the Marvel Watchlist Command Center.
# Usage: ./run.sh [port]     (defaults to 8080)
set -e
cd "$(dirname "$0")"

PORT="${1:-8080}"
OUT="out"

echo "Compiling..."
mkdir -p "$OUT"
javac -d "$OUT" $(find src/main/java -name "*.java")

# keep the served frontend in sync with source
rm -rf "$OUT/public"
cp -r src/main/resources/public "$OUT/public"

echo "Starting server on http://localhost:$PORT ..."
cd "$OUT"
java com.marvelwatchlist.server.Main "$PORT"
