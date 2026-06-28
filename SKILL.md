---
name: motion-video
description: "Use this skill whenever the user wants to create a kinetic-typography product-launch video, promo film, animated teaser, product trailer, hype reel, or 'motion graphics video' from a product or feature description. Triggers include: any request to 'make a launch video', 'product trailer', 'animated promo', 'hype video', 'teaser', 'sizzle reel', 'motion video', or to turn a product description / landing-page copy / pitch into a polished animated MP4. Produces a 1080p H.264 video with kinetic text, brand reveal, command-bar demo, benchmark bars, chat threads, feature reels, device shots, and an end card, plus an optional synthesized music bed. Do NOT use for live-action editing, slideshows of supplied photos, or simple GIFs."
---

# Motion Video — premium kinetic product-launch films from a description

## What this skill does

Turns a product description into a **deterministic, broadcast-quality kinetic-typography launch video** (the genre used by AI-product trailers: bold type that snaps in, a gradient brand reveal, a UI demo, glowing benchmark bars, a privacy beat, an end card — cut fast to a music bed).

Every frame is a pure function of the frame index, rendered headless via Puppeteer and encoded with ffmpeg. There is **no timeline software, no screen recording, no paid dependency, and nothing non-deterministic** — the same storyboard always produces the same video.

## The core principle (read this first)

**You write the *script* and *storyboard*. You never write animation code.**

All motion craft — easing, spring physics, blur-in reveals, staggers, glows, count-ups — is already baked into a fixed library of tested **scene components**. Your job for each product is only to:

1. Write punchy, specific **copy** tailored to *this* product.
2. Choose which **scene types** tell its story, in what order.
3. Fill each scene's **content props** (the words, the bars, the chat lines).
4. Run the renderer.

This is what makes output reliably "crazy good" across wildly different products: the craft is constant; only the words change. **Resist the urge to hand-tune animation numbers.** If a scene needs to feel different, change its content or pick a different scene type.

Because the script is authored fresh each time, **every video is different** — the skill is a vocabulary, not a template.

---

## Workflow

```
1. Read the product description. Extract: name, one-line promise, the pain it
   removes, 3–6 capabilities, the “proof” (benchmark / metric / before-after),
   any differentiator (privacy, speed, price), the URL, the vibe.
2. Write the script as a beat sheet (see “Narrative arc” below). Keep lines SHORT.
3. Translate the beat sheet into a storyboard JSON (schema below).
4. (optional) Pick a music mood and synthesize a bed.
5. Render:  node engine/render.js my.json out.mp4 --audio bed.m4a
6. Spot-check a few frames (montage), fix copy if needed, re-render, present.
```

Build and render from a writable dir (e.g. `/home/claude`); copy the skill's
`engine/` next to your storyboard, or point `render.js` at it.

---

## Narrative arc (the proven 9 beats)

This arc is reverse-engineered from top-tier AI launch films. Adapt it — **skip, reorder, or merge beats to fit the product** — but it’s a reliable spine. Aim for **45–75 seconds**.

| # | Beat | Purpose | Scene types that fit |
|---|------|---------|----------------------|
| 1 | **Hook / problem** | Name the old painful way. Provocative, 3–5 words. | `KineticText` |
| 2 | **Agitate** | Twist the knife — what today's tools *fail* at. | `KineticText`, `IconRow` (toss competitors), `ChatThread` (show the failure) |
| 3 | **Introduce** | "Introducing" → the brand, revealed. | `KineticText` ("Introducing") → `BrandReveal` |
| 4 | **Position** | One sentence: what it is and where it works. | `KineticText` |
| 5 | **Demo** | Show it working. Type a real command; show it reason. | `SearchType` → `ChatThread` |
| 6 | **Proof** | The number that wins. Benchmarks, glowing winner. | `BenchmarkBars` |
| 7 | **Capabilities** | "Anything you'd…" + a reel of verbs. | `KineticText` → `FeatureList` |
| 8 | **Differentiator** | The thing only you have (often privacy / local / your keys). | `KineticText` → `DeviceFrame` |
| 9 | **CTA** | Logo, name, URL. The closer. | `KineticText` (optional) → `EndCard` |

Interleave short 1.8–2.8s `KineticText` "title cards" between heavier scenes — they’re the connective tissue that sets the rhythm.

---

## Copywriting rules (this is 80% of the quality)

- **Short lines.** 2–5 words per line, 1–2 lines per card. The motion does the drama; long sentences kill it.
- **Specific, not generic.** "6 replies sent · 4 hours freed" beats "saves you time." Use real nouns, real numbers, real verbs.
- **One idea per card.** If a card has two ideas, split it into two cards.
- **Accent the payload word** with `**double asterisks**` — it renders in the brand accent color. Accent the *surprising* word, not the filler: `We deleted the **inbox**`, not `**We** deleted the inbox`. Multi-word spans work: `**clears itself**`.
- **Emoji become icon glyphs** automatically inside text (use sparingly).
- **Voice:** confident, declarative, a little cocky. Present tense. No hedging.
- **Vary it per product.** A dev tool, a kitchen gadget, and a fintech app should read nothing alike. Match the customer’s vocabulary.

Good mini-script (fictional "Nimbus" inbox):
```
We deleted / the **inbox**            (hook)
Then they **stop** / when it gets real (agitate)
Introducing → NIMBUS                   (introduce)
An inbox that / **clears itself**      (position)
[command bar] “decline all meetings next week and propose async”  (demo)
6 replies sent · 4 hours freed         (demo payoff, in a ChatThread 'ok' line)
Nimbus 98 / vs the field               (proof)
Anything you'd do / in your **inbox**  (capabilities)
And it's **private**                   (differentiator)
NIMBUS / nimbus.email                  (CTA)
```

---

## Storyboard JSON schema

Top-level:

```jsonc
{
  "fps": 30,                 // 30 is plenty; 60 doubles render time
  "crossfade": 0.35,         // seconds of overlap between scenes (0.25–0.5 good)
  "background": "#1a1a1a",   // film-wide bg (body). Dark charcoal is the default look
  "theme": {                 // OPTIONAL — override any :root token (no leading --)
    "accent": "#4c9bff",     // brand color (the **accent** word color, glows, winner)
    "accent-2": "#63d2ff",   // secondary glow / cyan
    "bg": "#1a1a1a",
    "ink": "#f4f4f5"
  },
  "scenes": [ { "type": "...", "duration": 2.6, "props": { ... } }, ... ]
}
```

Each scene: `{ "type": <SceneType>, "duration": <seconds>, "props": { ... } }`.
Typical durations: title cards **1.8–2.8s**, demo/chat/benchmark **3.5–5.5s**, brand reveal **3s**, end card **3.5s**.

### Scene catalog (exact props)

**KineticText** — bold type; words rise + fade + de-blur with stagger. The workhorse.
```jsonc
{ "type":"KineticText", "duration":2.6, "props":{
  "lines": ["We deleted", "the **inbox**"],   // each string is a line; **..**=accent
  "size": 120,            // px, default 96
  "exitUp": true,         // drift up & fade on the way out (use on most cards)
  "light": false,         // true = dark text (pair with a light background)
  "background": null,     // optional per-scene bg, e.g. "#fff"
  "weight": 700, "align":"center", "maxWidth":1400,
  "stagger": 3, "wordDur": 18   // animation feel — rarely change
}}
```

**BrandReveal** — gradient + light-rays; the name emerges blur→sharp with a push-in. Use once.
```jsonc
{ "type":"BrandReveal", "duration":3.0, "props":{ "name":"NIMBUS", "size":150 } }
```

**SearchType** — white command bar; query types in char-by-char with a blinking caret, model dropdown, Local/Guard chips. The demo opener.
```jsonc
{ "type":"SearchType", "duration":4.2, "props":{
  "query": "decline all meetings next week and propose async",
  "mode": "Ask AI",          // or "Search"
  "model": "Nimbus 1.5",     // shown in the right dropdown
  "mark": "✉",               // optional faint watermark glyph behind the bar
  "background": "#ffffff"
}}
```

**ChatThread** — AI working: a user bubble, sequential reasoning steps, sub-agent rows, a success line. The demo payoff.
```jsonc
{ "type":"ChatThread", "duration":5.2, "props":{
  "items": [
    {"kind":"me",   "text":"decline all meetings next week and propose async"},
    {"kind":"step", "text":"Scanning 14 threads", "icon":"›"},
    {"kind":"sub",  "text":"spawning 3 subagents in parallel", "icon":"⛁"},
    {"kind":"step", "text":"Drafting context-aware replies"},
    {"kind":"ok",   "text":"6 replies sent · 4 hours freed"}   // green check line
  ],
  "itemDelay": 12   // frames between items
}}
```

**BenchmarkBars** — horizontal comparison; winner row glows; bars grow; values count up. The proof.
```jsonc
{ "type":"BenchmarkBars", "duration":4.2, "props":{
  "title":"Inbox-clearing accuracy", "sub":"vs leading assistants",
  "unit":"%",
  "rows":[
    {"label":"Nimbus", "value":98, "win":true},   // win=true → glowing winner
    {"label":"Superhuman AI", "value":91},
    {"label":"Copilot", "dim":"M365", "value":84}, // dim=grey sublabel
    {"label":"Gmail Smart", "value":73}
  ]
}}
```

**FeatureList** — slot-reel of capabilities; the focused item is bright, others dim. The "it does everything" beat.
```jsonc
{ "type":"FeatureList", "duration":4.4, "props":{
  "prefix": "Reply,",                       // optional fixed word on the left
  "items": ["schedule","unsubscribe","summarize","follow up","negotiate"],
  "perItem": 14                             // frames each item holds focus
}}
```

**IconRow** — tiles spring in with stagger; optional caption. Good for "we replaced X, Y, Z".
```jsonc
{ "type":"IconRow", "duration":2.8, "props":{
  "icons":[
    {"glyph":"📧","bg":"linear-gradient(160deg,#3a3a3f,#1c1c1f)"},
    {"glyph":"📅"}, {"glyph":"☎"}
  ],
  "caption":"all in one place", "size":118
}}
```

**DeviceFrame** — a MacBook scales in, optional caption + screen content. The privacy/local beat.
```jsonc
{ "type":"DeviceFrame", "duration":3.6, "props":{
  "caption":"Runs on your Mac.<br>Your mail never leaves.",  // inline HTML ok
  "screenBg":"linear-gradient(135deg,#1b3a5c,#0b1c30)",      // or "screen": "<html>"
  "light": false
}}
```

**EndCard** — logo mark + wordmark + URL + tagline. The closer.
```jsonc
{ "type":"EndCard", "duration":3.6, "props":{
  "mark":"✉",                 // glyph in the rounded logo tile (defaults to name[0])
  "name":"Nimbus",
  "url":"nimbus.email",
  "tagline":"Inbox zero, on autopilot"
}}
```

> A complete, working storyboard is in `examples/nimbus.json` (a fictional product in a *different* domain from any reference — copy its structure, replace the words).

---

## Music bed (optional but recommended)

License-free, synthesized fresh to the exact video length:

```bash
engine/soundtrack.sh <duration_seconds> bed.m4a <mood>
#   moods: uplift (default) · bold · drive · calm
```

Then mux at render time: `node engine/render.js my.json out.mp4 --audio bed.m4a`.
Match duration to the film (the renderer prints total seconds; `--shortest` trims).
Pick `bold`/`drive` for energetic products, `calm` for serious/enterprise ones.
To use a licensed track instead, skip `soundtrack.sh` and pass your own file to `--audio`.

---

## Rendering

```bash
# fonts/engine are self-contained; just run from a writable dir
node engine/render.js storyboard.json out.mp4 [--audio bed.m4a] [--fps 30] [--scale 1]
```

- `--scale 2` renders at 2× (crisper, ~4× slower) — use only for hero deliverables.
- Output is 1920×1080 H.264, `yuv420p`, `+faststart` (web/social ready).
- Render is ~real-time-ish at 30fps/1080p; a 60s film is a few minutes.

**Always spot-check** before presenting: extract a grid of frames and eyeball them.
```bash
for t in 3 9 16 24 31 38 45 52; do ffmpeg -v error -ss $t -i out.mp4 -frames:v 1 f_$t.jpg; done
montage f_*.jpg -tile 4x2 -geometry 480x270+4+4 grid.png   # then view grid.png
```
Look for: literal `**asterisks**` (a copy typo), text overflowing the frame
(shorten the line or lower `size`), or a beat that drags (trim its `duration`).

---

## Quality checklist (before delivering)

- [ ] Hook lands in the first 3 seconds and names a real pain.
- [ ] Brand reveal happens once, and the name is the product’s actual name.
- [ ] The demo shows a *specific* command and a *specific* result, not vague claims.
- [ ] Benchmark has the product winning with a believable margin (not 100 vs 10).
- [ ] Every accent word is the surprising/payload word, not filler.
- [ ] No line wraps awkwardly or clips the frame edge.
- [ ] Total length 45–75s; no single card overstays (title cards ≤ 2.8s).
- [ ] Music mood matches the product’s seriousness.
- [ ] Colors: set `theme.accent` to the product’s real brand color when known.

## Common pitfalls

- **Writing animation math.** Don’t. Change content or scene type instead.
- **Long lines.** The #1 quality killer. Cut every card to the bone.
- **Over-accenting.** One accent per card, max two.
- **Generic copy.** "Powerful. Simple. Fast." is dead on arrival — be concrete.
- **Too many heavy scenes back-to-back.** Alternate heavy (demo/benchmark) with light title cards for rhythm.
- **Light scenes without a light background.** If you set `light:true`, give that scene a light `background` (e.g. `#fff`) or the text disappears.

## Files

```
engine/    render.js  engine.js  scenes.js  tokens.css  soundtrack.sh  music.py  fonts/
examples/  nimbus.json (flagship demo)   test.json (4-scene smoke test)
README.md  quick usage
```
