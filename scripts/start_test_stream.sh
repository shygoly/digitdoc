#!/usr/bin/env bash

set -euo pipefail

if ! command -v mediamtx >/dev/null 2>&1; then
  echo "mediamtx is not installed. Install with: brew install mediamtx"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. Install with: brew install ffmpeg"
  exit 1
fi

echo "Starting mediamtx in background (RTSP on :8554)..."
nohup mediamtx >/tmp/mediamtx.log 2>&1 &
MEDIAMTX_PID=$!
echo "$MEDIAMTX_PID" > /tmp/mediamtx.pid
echo "mediamtx PID: $MEDIAMTX_PID (logs: /tmp/mediamtx.log)"

DEMO_FILE=${1:-demo.mp4}
if [ ! -f "$DEMO_FILE" ]; then
  echo "Demo file '$DEMO_FILE' not found. Provide a file, e.g.:"
  echo "  ./scripts/start_test_stream.sh /path/to/demo.mp4"
  exit 1
fi

echo "Loop-pushing '$DEMO_FILE' to rtsp://localhost:8554/test ..."
nohup ffmpeg -re -stream_loop -1 -i "$DEMO_FILE" -c:v libx264 -f rtsp rtsp://localhost:8554/test \
  >/tmp/ffmpeg_rtsp_test.log 2>&1 &
FFMPEG_PID=$!
echo "$FFMPEG_PID" > /tmp/ffmpeg_rtsp_test.pid
echo "ffmpeg PID: $FFMPEG_PID (logs: /tmp/ffmpeg_rtsp_test.log)"
echo "\nStream is live at rtsp://localhost:8554/test"
echo "To stop: kill $(cat /tmp/ffmpeg_rtsp_test.pid 2>/dev/null || echo $FFMPEG_PID); kill $(cat /tmp/mediamtx.pid 2>/dev/null || echo $MEDIAMTX_PID)"


