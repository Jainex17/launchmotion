/* ============================================================================
 * MOTION ENGINE — deterministic, frame-driven animation core
 * Every visual is a pure function of time, so frames are reproducible whether
 * rendered in 1ms or captured by a headless browser. No real-time CSS anims.
 * ==========================================================================*/

const FPS = window.__FPS__ || 30;

/* ---------- easing curves -------------------------------------------------*/
const Ease = {
  linear:      t => t,
  inQuad:      t => t * t,
  outQuad:     t => 1 - (1 - t) * (1 - t),
  inOutQuad:   t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic:    t => 1 - Math.pow(1 - t, 3),
  inOutCubic:  t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // expo-out: the apple-y "fast then gently settle"
  outExpo:     t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo:   t => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? Math.pow(2, 20 * t - 10) / 2
                    : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack:     (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outQuint:    t => 1 - Math.pow(1 - t, 5),
};

/* ---------- interpolate ----------------------------------------------------
 * interp(t, [i0,i1,...], [o0,o1,...], {easing, clamp})
 * maps an input value across piecewise ranges with per-segment easing.        */
function interp(t, inR, outR, opts = {}) {
  const easing = opts.easing || Ease.linear;
  const clamp = opts.clamp !== false;
  if (t <= inR[0]) return clamp ? outR[0] : outR[0];
  const last = inR.length - 1;
  if (t >= inR[last]) return clamp ? outR[last] : outR[last];
  let i = 0;
  while (t > inR[i + 1]) i++;
  const span = inR[i + 1] - inR[i];
  const local = span === 0 ? 0 : (t - inR[i]) / span;
  const eased = easing(local);
  return outR[i] + (outR[i + 1] - outR[i]) * eased;
}

/* ---------- spring ---------------------------------------------------------
 * Closed-form damped harmonic oscillator → natural overshoot/settle.
 * Returns 0..~1 (may overshoot >1) as a function of elapsed seconds.          */
function spring(tSec, cfg = {}) {
  const stiffness = cfg.stiffness ?? 170;
  const damping   = cfg.damping   ?? 18;
  const mass      = cfg.mass      ?? 1;
  if (tSec <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);            // natural freq
  const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // damping ratio
  if (zeta < 1) {                                    // under-damped (bouncy)
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * tSec) *
      (Math.cos(wd * tSec) + (zeta * w0 / wd) * Math.sin(wd * tSec));
  }
  // critically / over-damped (no bounce)
  return 1 - Math.exp(-w0 * tSec) * (1 + w0 * tSec);
}

/* frame helpers */
const f2s = f => f / FPS;                 // frames → seconds
const s2f = s => Math.round(s * FPS);     // seconds → frames

/* stagger: returns the local progress (0..1) for item `idx` given a global
 * local frame, a per-item delay (frames) and a per-item duration (frames).    */
function stagger(localFrame, idx, delayF, durF, easing = Ease.outExpo) {
  const start = idx * delayF;
  const p = interp(localFrame, [start, start + durF], [0, 1], { easing });
  return p;
}

/* small dom helper */
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

/* ============================================================================
 * STAGE / SEQUENCER
 * Mounts every scene once. Each frame: decides which scenes are active (with
 * crossfade overlap), sets their wrapper opacity, calls scene.update(localF).
 * ==========================================================================*/
class Stage {
  constructor(root, storyboard) {
    this.root = root;
    this.fade = s2f((storyboard.crossfade ?? 0.35)); // overlap fade in frames
    this.scenes = [];
    let cursor = 0;
    storyboard.scenes.forEach((spec, i) => {
      const durF = s2f(spec.duration);
      const wrap = el('div', 'scene');
      wrap.style.zIndex = i + 1;
      root.appendChild(wrap);
      const Comp = SCENES[spec.type];
      if (!Comp) throw new Error('Unknown scene type: ' + spec.type);
      const inst = new Comp(wrap, spec.props || {}, durF);
      inst.build();
      this.scenes.push({ inst, wrap, start: cursor, end: cursor + durF, durF });
      cursor += durF;
    });
    this.totalFrames = cursor;
    this.bg = storyboard.background || null;
  }

  renderFrame(F) {
    for (const s of this.scenes) {
      const inStart = s.start - this.fade;
      const inEnd = s.end + this.fade;
      if (F < inStart || F > inEnd) { s.wrap.classList.add('is-hidden'); continue; }
      s.wrap.classList.remove('is-hidden');
      // crossfade envelope
      const op = Math.min(
        interp(F, [s.start - this.fade, s.start], [0, 1], { easing: Ease.inOutQuad }),
        interp(F, [s.end, s.end + this.fade], [1, 0], { easing: Ease.inOutQuad })
      );
      s.wrap.style.opacity = op;
      s.inst.update(F - s.start, s.durF);
    }
  }
}

/* boot: called by render driver after DOM + fonts ready */
let __stage = null;
async function __boot(storyboard) {
  document.body.style.background = storyboard.background || '#111111';
  const root = document.getElementById('stage');
  __stage = new Stage(root, storyboard);
  // expose total for the driver
  window.__TOTAL_FRAMES__ = __stage.totalFrames;
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
  __stage.renderFrame(0);
  window.__READY__ = true;
}
window.__seek = (F) => __stage && __stage.renderFrame(F);
