#!/bin/bash

# Auto-start Chorus server in background if not already running.
# This script is sourced from ~/.bashrc on sandbox shell open.

if ! pgrep -f "server/index.js" > /dev/null 2>&1; then
  # Start the pre-installed version immediately
  nohup chorus start --port 3001 > /tmp/chorus.log 2>&1 &
  disown

  # Check for updates in the background (non-blocking)
  nohup npm update -g @anthropic-ai/chorus > /tmp/chorus-update.log 2>&1 &
  disown

  echo ""
  echo "  Claude Code UI is starting on port 3001..."
  echo ""
  echo "  To access the web UI, forward the port:"
  echo "    sbx ports \$(hostname) --publish 3001:3001"
  echo ""
  echo "  Then open: http://localhost:3001"
  echo ""
fi
