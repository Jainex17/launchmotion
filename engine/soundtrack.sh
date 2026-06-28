#!/usr/bin/env bash
# ============================================================================
# soundtrack.sh — render a license-free premium music bed sized to the video.
#   ./soundtrack.sh <duration_seconds> <out.m4a> [mood]
# moods: uplift (default) | bold | drive | calm
# Wraps music.py (numpy synthesis) and encodes to AAC. No samples, no copyright.
# To use your own track instead, skip this and pass --audio yourfile to render.js.
# ============================================================================
set -e
DUR="${1:-60}"
OUT="${2:-soundtrack.m4a}"
MOOD="${3:-uplift}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMPWAV="$(mktemp --suffix=.wav)"
python3 "$HERE/music.py" "$DUR" "$TMPWAV" "$MOOD"
ffmpeg -y -hide_banner -loglevel error -i "$TMPWAV" -c:a aac -b:a 192k "$OUT"
rm -f "$TMPWAV"
echo "✓ wrote $OUT (${DUR}s, mood $MOOD)"
