/* ============================================================================
 * SCENES — the reusable visual vocabulary. Each scene = a class with
 *   build()              : create DOM once
 *   update(localF, durF) : set styles as a pure function of the local frame
 * Authoring stays declarative; all motion craft lives here.
 * ==========================================================================*/

/* tokenise a line string:  "We **killed it** 🌐"  (accent spans may be multi-word)
 *  → [{t:'We'},{t:'killed',accent:1},{t:'it',accent:1},{t:'🌐',glyph:1}]      */
function tokenize(line) {
  const out = [];
  const isGlyph = w => /\p{Extended_Pictographic}/u.test(w);
  // split into **accent** chunks and plain chunks, preserving order
  line.split(/(\*\*[^*]+\*\*)/g).filter(s => s !== '').forEach(part => {
    const accent = /^\*\*[^*]+\*\*$/.test(part) ? 1 : 0;
    const text = accent ? part.replace(/\*\*/g, '') : part;
    text.split(/\s+/).filter(Boolean).forEach(w => {
      out.push({ t: w, accent, glyph: isGlyph(w) ? 1 : 0 });
    });
  });
  return out;
}

const SCENES = {};

/* ---------------------------------------------------------------- KineticText
 * Lines of bold type. Words reveal with stagger: rise + fade + de-blur.
 * props: { lines:[string], size, light, align, weight, exitUp, hold }         */
SCENES.KineticText = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    if (p.background) this.wrap.style.background = p.background;
    const box = el('div', 'kt');
    box.style.fontSize = (p.size || 96) + 'px';
    box.style.fontWeight = p.weight || 700;
    box.style.maxWidth = (p.maxWidth || 1400) + 'px';
    if (p.font) box.style.fontFamily = p.font;
    this.words = [];
    (p.lines || []).forEach((line, li) => {
      const ln = el('div', 'kt-line');
      tokenize(line).forEach(tok => {
        const w = el('span', 'word' + (tok.accent ? ' accent' : '') + (tok.glyph ? ' glyph' : ''));
        w.textContent = tok.t;
        w.style.marginRight = '0.28em';
        ln.appendChild(w);
        this.words.push({ node: w, line: li });
      });
      box.appendChild(ln);
    });
    this.box = box;
    this.wrap.appendChild(box);
  }
  update(F) {
    const p = this.p;
    const delay = (p.stagger ?? 3);          // frames between words
    const dur = (p.wordDur ?? 18);
    this.words.forEach((w, i) => {
      const pr = stagger(F, i, delay, dur, Ease.outExpo);
      const y = (1 - pr) * 26;
      const bl = (1 - pr) * 7;
      w.node.style.opacity = pr;
      w.node.style.transform = `translateY(${y}px)`;
      w.node.style.filter = bl > 0.2 ? `blur(${bl}px)` : 'none';
    });
    // gentle exit drift
    if (p.exitUp) {
      const out = interp(F, [this.durF - 14, this.durF], [0, -40], { easing: Ease.inQuad });
      const o2 = interp(F, [this.durF - 14, this.durF], [1, 0], { easing: Ease.inQuad });
      this.box.style.transform = `translateY(${out}px)`;
      this.box.style.opacity = o2;
    }
  }
};

/* ---------------------------------------------------------------- SearchType
 * White command bar. Query types in char-by-char with a blinking caret.
 * props: { query, mode('Search'|'Ask AI'), model, badges:[], light }          */
SCENES.SearchType = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    this.wrap.style.background = p.background || '#fff';
    if (p.mark) { // faint watermark logo above bar
      const m = el('div', '');
      m.style.cssText = 'position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);font-size:70px;opacity:.08;font-weight:800;';
      m.textContent = p.mark; this.wrap.appendChild(m);
    }
    const cmd = el('div', 'cmd');
    const r1 = el('div', 'row1');
    this.q = el('span', 'qtext'); this.q.textContent = '';
    this.caret = el('span', 'caret');
    const sp = el('span', 'spacer');
    const hint = el('span', 'hint'); hint.textContent = 'Tab';
    const hint2 = el('span', 'hint'); hint2.textContent = 'to switch'; hint2.style.marginRight = '8px';
    const c1 = el('span', 'chip' + (p.mode === 'Search' ? ' on' : '')); c1.textContent = 'Search';
    const c2 = el('span', 'chip' + (p.mode !== 'Search' ? ' on' : '')); c2.textContent = p.mode === 'Search' ? 'Ask AI' : (p.mode || 'Ask AI');
    r1.append(this.q, this.caret, sp, hint, hint2, c1, c2);
    const r2 = el('div', 'row2');
    const left = el('span', ''); left.style.cssText = 'display:flex;align-items:center;gap:22px;';
    left.innerHTML =
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`
      + `<span style="display:flex;align-items:center;gap:9px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8" stroke-linecap="round"/></svg>Local</span>`
      + `<span style="display:flex;align-items:center;gap:9px"><svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>Guard</span>`;
    const right = el('span', 'right');
    const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px"><path d="M6 9l6 6 6-6"/></svg>`;
    right.innerHTML = `<span style="display:flex;align-items:center">${p.model || 'GPT-5.5'}${chev}</span><span style="display:flex;align-items:center">High${chev}</span>`;
    r2.append(left, right);
    cmd.append(r1, r2);
    this.cmd = cmd;
    this.wrap.appendChild(cmd);
    this.full = p.query || '';
  }
  update(F) {
    const p = this.p;
    // entrance
    const inS = spring(f2s(F), { stiffness: 150, damping: 20 });
    this.cmd.style.transform = `translateY(${(1 - inS) * 30}px) scale(${0.96 + 0.04 * Math.min(inS,1)})`;
    this.cmd.style.opacity = Math.min(1, inS * 1.4);
    // typewriter
    const startF = p.typeStart ?? 8;
    const cps = p.cps ?? 38;                       // chars per second
    const n = Math.max(0, Math.floor((f2s(F) - f2s(startF)) * cps));
    this.q.textContent = this.full.slice(0, Math.min(n, this.full.length));
    const typing = n < this.full.length;
    // blink caret when idle, solid while typing
    const blink = typing ? 1 : (Math.floor(f2s(F) * 2) % 2 ? 0.15 : 1);
    this.caret.style.opacity = F > startF - 2 ? blink : 0;
  }
};

/* ---------------------------------------------------------------- BrandReveal
 * Gradient + light-rays. Name emerges from blur → sharp with a slow push-in.
 * props: { name, sub }                                                        */
SCENES.BrandReveal = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const rev = el('div', 'reveal');
    rev.append(el('div', 'grad'), el('div', 'rays'));
    const name = el('div', 'name');
    const span = el('span', ''); span.textContent = this.p.name || 'Brand';
    span.style.fontSize = (this.p.size || 150) + 'px';
    name.appendChild(span);
    rev.appendChild(name);
    this.name = span; this.rays = rev.querySelector('.rays'); this.grad = rev.querySelector('.grad');
    this.wrap.appendChild(rev);
  }
  update(F) {
    const p = this.p;
    const sec = f2s(F);
    const rise = interp(sec, [0, 1.4], [0, 1], { easing: Ease.outExpo });
    const blur = (1 - rise) * 26;
    const scale = interp(sec, [0, this.durF / FPS], [1.18, 1.0], { easing: Ease.outExpo });
    this.name.style.filter = blur > 0.3 ? `blur(${blur}px)` : 'none';
    this.name.style.opacity = interp(sec, [0, 0.5, 1.2], [0, 0.4, 1], { easing: Ease.outQuad });
    this.name.style.transform = `scale(${scale})`;
    this.name.style.letterSpacing = interp(rise, [0, 1], [0.18, -0.02], {}) + 'em';
    // slow ray drift + grad breathe
    this.rays.style.transform = `translateX(${(sec * 16) % 64}px)`;
    this.grad.style.transform = `scale(${1 + 0.04 * rise})`;
  }
};

/* ----------------------------------------------------------------- IconRow
 * App/brand tiles spring in with stagger. Optional caption beneath.
 * props: { icons:[{glyph,bg,color}], caption, size }                          */
SCENES.IconRow = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    const col = el('div', ''); col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:46px;';
    const row = el('div', ''); row.style.cssText = 'display:flex;gap:34px;';
    this.tiles = [];
    (p.icons || []).forEach(ic => {
      const tile = el('div', 'icontile');
      const sz = p.size || 118;
      tile.style.width = tile.style.height = sz + 'px';
      tile.style.borderRadius = (sz * 0.23) + 'px';
      tile.style.fontSize = (sz * 0.52) + 'px';
      tile.style.background = ic.bg || 'linear-gradient(160deg,#2a2a2e,#161618)';
      if (ic.color) tile.style.color = ic.color;
      tile.textContent = ic.glyph || '◆';
      row.appendChild(tile);
      this.tiles.push(tile);
    });
    col.appendChild(row);
    if (p.caption) {
      const cap = el('div', 'kt'); cap.style.cssText = 'font-size:84px;font-weight:700;';
      cap.textContent = p.caption; col.appendChild(cap); this.cap = cap;
    }
    this.wrap.appendChild(col);
  }
  update(F) {
    this.tiles.forEach((t, i) => {
      const local = f2s(Math.max(0, F - i * 4));
      const s = spring(local, { stiffness: 220, damping: 16 });
      t.style.opacity = Math.min(1, s * 2);
      t.style.transform = `scale(${0.4 + 0.6 * Math.min(s, 1.12)}) translateY(${(1 - Math.min(s,1)) * 18}px)`;
    });
    if (this.cap) {
      const pr = interp(F, [10, 28], [0, 1], { easing: Ease.outExpo });
      this.cap.style.opacity = pr; this.cap.style.transform = `translateY(${(1 - pr) * 18}px)`;
    }
  }
};

/* -------------------------------------------------------------- BenchmarkBars
 * Horizontal comparison; winner row glows; bars grow; values count up.
 * props: { title, sub, rows:[{label, dim, value, win}] }                      */
SCENES.BenchmarkBars = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    const box = el('div', 'bench');
    box.append(el('h3', '', p.title || 'Benchmark'));
    if (p.sub) box.append(el('div', 'sub', p.sub));
    this.rows = [];
    const max = Math.max(...(p.rows || []).map(r => r.value), 1);
    (p.rows || []).forEach(r => {
      const row = el('div', 'barrow' + (r.win ? ' win' : ''));
      const track = el('div', 'track');
      const fill = el('div', 'fill');
      const label = el('div', 'label');
      label.innerHTML = `<b>${r.label}</b>${r.dim ? ` <span class="dim">${r.dim}</span>` : ''}`;
      track.append(fill, label);
      const pct = el('div', 'pct');
      row.append(track, pct);
      box.appendChild(row);
      this.rows.push({ fill, pct, target: r.value, max, win: r.win });
    });
    this.box = box; this.wrap.appendChild(box);
  }
  update(F) {
    // header in
    const head = interp(F, [0, 14], [0, 1], { easing: Ease.outExpo });
    this.box.style.opacity = Math.min(1, head + 0.0);
    this.rows.forEach((r, i) => {
      const start = 8 + i * 6;
      const pr = interp(F, [start, start + 26], [0, 1], { easing: Ease.outExpo });
      r.fill.style.width = (pr * (r.target / r.max) * 100) + '%';
      const val = Math.round(pr * r.target);
      r.pct.textContent = val + (this.p.unit || '%');
    });
  }
};

/* ----------------------------------------------------------------- ChatThread
 * AI working: user bubble + reasoning steps appear sequentially, optional
 * sub-agent rows + final success line.
 * props: { items:[{kind:'me'|'step'|'sub'|'ok', text, icon}] }                */
SCENES.ChatThread = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    const box = el('div', 'chat');
    box.style.maxWidth = (p.width || 1000) + 'px';
    this.items = [];
    (p.items || []).forEach(it => {
      let node;
      if (it.kind === 'me') { node = el('div', 'me'); node.textContent = it.text; }
      else if (it.kind === 'sub') { node = el('div', 'sub'); node.innerHTML = `<span>${it.icon || '⛁'}</span><span>${it.text}</span>`; }
      else if (it.kind === 'ok') { node = el('div', 'step done'); node.innerHTML = `<span class="ic ok">✓</span><span class="ok">${it.text}</span>`; }
      else { node = el('div', 'step'); node.innerHTML = `<span class="ic">${it.icon || '›'}</span><span>${it.text}</span>`; }
      box.appendChild(node);
      this.items.push(node);
    });
    this.box = box; this.wrap.appendChild(box);
  }
  update(F) {
    const step = this.p.itemDelay ?? 12;
    this.items.forEach((n, i) => {
      const pr = interp(F, [i * step, i * step + 16], [0, 1], { easing: Ease.outExpo });
      n.style.opacity = pr;
      n.style.transform = `translateY(${(1 - pr) * 16}px)`;
    });
  }
};

/* ----------------------------------------------------------------- FeatureList
 * A vertical stack where the focused item is bright and neighbours dim —
 * like a slot reel of capabilities scrolling past.
 * props: { items:[string], light }                                           */
SCENES.FeatureList = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    if (p.prefix) {
      const pre = el('div', 'kt'); pre.style.cssText = 'font-size:64px;font-weight:700;margin-right:28px;';
      pre.textContent = p.prefix; this.pre = pre;
    }
    const wrapRow = el('div', ''); wrapRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;';
    const list = el('div', 'flist');
    this.items = [];
    (p.items || []).forEach(t => { const n = el('div', 'item'); n.textContent = t; list.appendChild(n); this.items.push(n); });
    if (this.pre) wrapRow.appendChild(this.pre);
    wrapRow.appendChild(list);
    this.list = list; this.wrap.appendChild(wrapRow);
  }
  update(F) {
    const hold = this.p.perItem ?? 14;
    const focus = Math.min(this.items.length - 1, Math.floor(F / hold));
    this.items.forEach((n, i) => {
      const enter = interp(F, [i * 3, i * 3 + 14], [0, 1], { easing: Ease.outExpo });
      const isFocus = i === focus;
      n.style.opacity = enter * (isFocus ? 1 : 0.22);
      n.style.transform = `translateX(${(1 - enter) * 22}px)`;
      n.style.color = isFocus ? '' : (this.p.light ? 'var(--muted-light)' : 'var(--muted)');
    });
    if (this.pre) this.pre.style.opacity = interp(F, [0, 12], [0, 1], { easing: Ease.outExpo });
  }
};

/* ----------------------------------------------------------------- DeviceFrame
 * A MacBook that scales in, optionally containing a mockup screen + caption.
 * props: { caption, screen(html), light }                                     */
SCENES.DeviceFrame = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    const col = el('div', ''); col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:54px;';
    if (p.caption) { const c = el('div', 'kt'); c.style.cssText = 'font-size:80px;font-weight:700;'; c.innerHTML = p.caption; col.appendChild(c); this.cap = c; }
    const mb = el('div', 'macbook');
    const screen = el('div', 'screen');
    if (p.screen) screen.innerHTML = p.screen; else screen.style.background = p.screenBg || 'linear-gradient(135deg,#1b3a5c,#0b1c30)';
    const base = el('div', 'base'); base.appendChild(el('div', 'notch'));
    mb.append(screen, base);
    col.appendChild(mb);
    this.mb = mb; this.wrap.appendChild(col);
  }
  update(F) {
    const s = spring(f2s(F), { stiffness: 160, damping: 20 });
    this.mb.style.opacity = Math.min(1, s * 1.6);
    this.mb.style.transform = `translateY(${(1 - Math.min(s,1)) * 40}px) scale(${0.9 + 0.1 * Math.min(s, 1.05)})`;
    if (this.cap) { const c = interp(F, [6, 22], [0, 1], { easing: Ease.outExpo }); this.cap.style.opacity = c; this.cap.style.transform = `translateY(${(1 - c) * 18}px)`; }
  }
};

/* ------------------------------------------------------------------- EndCard
 * Logo mark + wordmark + URL. The closer.
 * props: { mark, name, url, tagline, light }                                  */
SCENES.EndCard = class {
  constructor(wrap, p, durF) { this.wrap = wrap; this.p = p; this.durF = durF; }
  build() {
    const p = this.p;
    if (p.light) this.wrap.classList.add('light');
    const col = el('div', ''); col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:30px;';
    const lock = el('div', ''); lock.style.cssText = 'display:flex;align-items:center;gap:26px;';
    const mark = el('div', 'logomark');
    mark.style.cssText += 'width:96px;height:96px;font-size:46px;';
    mark.textContent = p.mark || (p.name ? p.name[0] : '◆');
    const name = el('div', ''); name.style.cssText = 'font-family:var(--font);font-weight:800;font-size:100px;letter-spacing:-.02em;';
    name.textContent = p.name || 'Brand';
    lock.append(mark, name);
    col.appendChild(lock);
    if (p.tagline) { const tg = el('div', 'caption'); tg.style.fontSize = '40px'; tg.textContent = p.tagline; col.appendChild(tg); this.tg = tg; }
    if (p.url) { const u = el('div', ''); u.style.cssText = 'font-family:var(--font);font-weight:600;font-size:54px;opacity:.85;margin-top:10px;'; u.textContent = p.url; col.appendChild(u); this.u = u; }
    this.mark = mark; this.name = name; this.lock = lock; this.wrap.appendChild(col);
  }
  update(F) {
    const s = spring(f2s(F), { stiffness: 180, damping: 18 });
    this.lock.style.opacity = Math.min(1, s * 1.6);
    this.lock.style.transform = `scale(${0.86 + 0.14 * Math.min(s, 1.05)})`;
    this.mark.style.transform = `rotate(${interp(f2s(F), [0, 1.2], [-90, 0], { easing: Ease.outExpo })}deg)`;
    if (this.tg) this.tg.style.opacity = interp(F, [12, 28], [0, 1], { easing: Ease.outExpo });
    if (this.u) this.u.style.opacity = interp(F, [18, 34], [0, 1], { easing: Ease.outExpo });
  }
};
