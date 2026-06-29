# launchmotion

Generate premium **kinetic-typography product-launch videos** from a product
description. Bold type that snaps in, a gradient brand reveal, a UI demo,
glowing benchmark bars, a privacy beat, an end card — cut to a music bed.
1080p H.264 out. Deterministic, dependency-light, license-free.

[▶️ Watch example — Nimbus launch video](examples/nimbus.mp4)

## How to use this with ChatGPT or Claude

This repo is an **AI agent skill** that teaches ChatGPT or Claude how to make
product launch videos for you.

### Setup

1. Clone this repo (or download it as a folder)
2. Copy/symlink the folder into your AI's skills directory
3. Install dependencies:

```bash
npm install                    # installs puppeteer + Chromium
# (optional) brew install ffmpeg   # for video encoding
```

### Usage

Just tell your AI something like:

> *"Create a launch video for [my product name]. Here's the description: ..."*

The AI will:
1. Read `SKILL.md` to learn the scene types and narrative arc
2. Write a script and storyboard JSON tailored to your product
3. Render the video using `engine/render.js`

Example output: [`examples/nimbus.mp4`](examples/nimbus.mp4)
(that video was generated entirely by AI using this skill)

### Requirements

- Node ≥ 18
- `ffmpeg` on PATH
- `python3` + `numpy` + `scipy` (only for optional music bed)

### Customizing the look

Set a `theme` block in the storyboard to match your brand:

```json
"theme": { "accent": "#ff5a36", "accent-2": "#ffb199", "bg": "#0e0e10" }
```

## License

Self-contained and license-free: bundled Inter / Inter Tight fonts (SIL OFL),
synthesized music (no samples), no paid runtime. Use freely.
