#!/usr/bin/env bash
# Graphical Terminal - macOS / Linux Launch Script

cd "$(dirname "$0")"

echo "========================================================"
echo "  Graphical Terminal (macOS / Linux)"
echo "========================================================"
echo ""
echo "サーバーを起動しています..."

# 既定のブラウザで開く (macOS: open, Linux: xdg-open)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:3456" &
elif which xdg-open > /dev/null 2>&1; then
  xdg-open "http://localhost:3456" &
fi

node server.js
