# launchmotion

Generate premium **kinetic-typography product-launch videos** from a product
description. Bold type that snaps in, a gradient brand reveal, a UI demo,
glowing benchmark bars, a privacy beat, an end card — cut to a music bed.
1080p H.264 out. Deterministic, dependency-light, license-free.

[▶️ Watch example — Nimbus launch video](examples/nimbus.mp4)

## How to use this with ChatGPT or Claude

This repo is an **AI agent skill** that teaches ChatGPT or Claude how to make
product launch videos for you.

### Usage (one command)

Give your AI the repo URL and ask for a video:

> *"Use the skill at https://github.com/YOUR_USER/launchmotion to create a launch video for [product]. Here's the description: ..."*

The AI will read `SKILL.md` to learn the scene types, write a storyboard
tailored to your product, and render the video.

**No cloning needed.** The AI reads the skill directly from GitHub. You just
need the render dependencies on your machine:

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
