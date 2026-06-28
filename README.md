# motion-video

Generate premium **kinetic-typography product-launch videos** from a product
description. Bold type that snaps in, a gradient brand reveal, a UI demo,
glowing benchmark bars, a privacy beat, an end card — cut to a music bed.
1080p H.264 out. Deterministic, dependency-light, license-free.

This is a **Claude Skill**: drop the folder into your skills directory and ask
for a launch video for any product. `SKILL.md` contains the full authoring
guide; this README is the 60-second version.

## Requirements

- Node ≥ 18 with `puppeteer` installed (Chromium)
- `ffmpeg` on PATH
- `python3` + `numpy` + `scipy` (only for the optional music bed)

## Quick start

```bash
# 1. write a storyboard (see SKILL.md schema; copy examples/nimbus.json)
# 2. (optional) make a music bed sized to the film
engine/soundtrack.sh 58 bed.m4a uplift          # moods: uplift|bold|drive|calm

# 3. render
node engine/render.js examples/nimbus.json out.mp4 --audio bed.m4a

# 4. spot-check frames
for t in 3 12 24 36 48; do ffmpeg -v error -ss $t -i out.mp4 -frames:v 1 f_$t.jpg; done
montage f_*.jpg -tile 5x1 -geometry 384x216+3+3 grid.png
```

## How it works

You write the **script + storyboard** (which scenes, in what order, with what
words). All animation craft — easing, spring physics, blur-in reveals, glows,
count-ups — is baked into a fixed library of scene components in
`engine/scenes.js`. You never hand-write animation. Every pixel is a pure
function of the frame index, so renders are fully reproducible.

```
storyboard.json ──► render.js ──► Puppeteer seeks each frame ──► ffmpeg ──► out.mp4
```

## Scene vocabulary

`KineticText` · `BrandReveal` · `SearchType` (command bar) · `ChatThread`
(AI reasoning) · `BenchmarkBars` · `FeatureList` · `IconRow` · `DeviceFrame`
(MacBook) · `EndCard`. Full props and a worked example in **SKILL.md**.

## Customizing the look

Set a `theme` block in the storyboard to match a brand:

```json
"theme": { "accent": "#ff5a36", "accent-2": "#ffb199", "bg": "#0e0e10" }
```

## License

Self-contained and license-free: bundled Inter / Inter Tight fonts (SIL OFL),
synthesized music (no samples), no paid runtime. Use freely.
