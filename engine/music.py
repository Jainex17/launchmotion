#!/usr/bin/env python3
# ============================================================================
# music.py — synthesize a license-free, premium "launch film" music bed.
#
#   python3 music.py <duration_seconds> <out.wav> [mood]
#
# Pure numpy synthesis: an evolving chord PROGRESSION (pad), a plucked
# arpeggio for movement, a sub bass, and a subtle kick/hat groove — all
# automated to follow a product-launch energy arc (intro → build → reveal →
# drive → resolve). No samples, no copyright, fully deterministic.
#
# moods: "uplift" (default, Am–F–C–G), "bold" (Cm–Ab–Eb–Bb), "calm" (slower,
#        no drums), "drive" (busier groove). The skill picks one per product.
# ============================================================================
import sys, numpy as np

SR = 44100

def midi(n):           # midi note -> frequency
    return 440.0 * 2.0 ** ((n - 69) / 12.0)

def env_adsr(n, a, d, s, r, sus_level=0.7):
    """sample-accurate ADSR over n samples."""
    a = max(1, int(a * SR)); d = max(1, int(d * SR)); r = max(1, int(r * SR))
    out = np.zeros(n)
    i = 0
    seg = min(a, n); out[i:i+seg] = np.linspace(0, 1, seg); i += seg
    if i < n:
        seg = min(d, n - i); out[i:i+seg] = np.linspace(1, sus_level, seg); i += seg
    if i < n:
        seg = max(0, n - i - r); out[i:i+seg] = sus_level; i += seg
    if i < n:
        seg = n - i; out[i:i+seg] = np.linspace(out[i-1] if i > 0 else sus_level, 0, seg)
    return out

def pluck_env(n, decay=0.18):
    t = np.arange(n) / SR
    return np.exp(-t / decay)

def tone(freq, n, kind="sine", detune=0.0):
    t = np.arange(n) / SR
    f = freq * (1.0 + detune)
    ph = 2 * np.pi * f * t
    if kind == "sine":
        return np.sin(ph)
    if kind == "tri":
        return 2.0 / np.pi * np.arcsin(np.sin(ph))
    if kind == "saw":
        return 2.0 * (t * f - np.floor(0.5 + t * f))
    return np.sin(ph)

def pad_voice(freq, n):
    """warm pad: stacked detuned sines + soft fifth shimmer."""
    s  = tone(freq, n, "sine", +0.004)
    s += tone(freq, n, "sine", -0.004)
    s += 0.6 * tone(freq, n, "tri", +0.008)
    s += 0.25 * tone(freq * 1.5, n, "sine")       # fifth shimmer
    s += 0.15 * tone(freq * 2.0, n, "sine")       # octave air
    return s / 2.0

def soft_clip(x, drive=1.4):
    return np.tanh(x * drive) / np.tanh(drive)

def one_pole_lp(x, cutoff):
    """cheap one-pole lowpass for warmth."""
    dt = 1.0 / SR
    rc = 1.0 / (2 * np.pi * cutoff)
    a = dt / (rc + dt)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):           # vectorless but fine at this length
        acc += a * (x[i] - acc)
        y[i] = acc
    return y

# ---- moods -----------------------------------------------------------------
MOODS = {
    # progression as lists of chord tones (midi), bass root (midi)
    "uplift": dict(bpm=116, drums=True,
        chords=[[57,60,64,69],[53,57,60,65],[60,64,67,72],[55,59,62,67]],
        bass=[45,41,48,43]),
    "bold": dict(bpm=120, drums=True,
        chords=[[60,63,67,72],[56,60,63,68],[51,55,58,63],[58,62,65,70]],
        bass=[48,44,39,46]),
    "drive": dict(bpm=124, drums=True,
        chords=[[57,60,64,69],[55,59,62,67],[53,57,60,65],[52,55,59,64]],
        bass=[45,43,41,40]),
    "calm": dict(bpm=92, drums=False,
        chords=[[60,64,67,71],[57,60,64,69],[53,57,60,64],[55,59,62,65]],
        bass=[48,45,41,43]),
}

def synth(duration, mood="uplift"):
    M = MOODS.get(mood, MOODS["uplift"])
    bpm = M["bpm"]; beat = 60.0 / bpm; bar = 4 * beat
    N = int(duration * SR) + SR
    L = np.zeros(N); R = np.zeros(N)

    nbars = int(np.ceil(duration / bar)) + 1
    # section automation (fractions of total duration)
    def section_gain(t, lo, hi, g0, g1):
        if t < lo: return g0
        if t > hi: return g1
        u = (t - lo) / (hi - lo)
        return g0 + (g1 - g0) * (0.5 - 0.5 * np.cos(np.pi * u))  # smoothstep

    for b in range(nbars):
        t0 = b * bar
        s0 = int(t0 * SR)
        if s0 >= N: break
        ci = b % len(M["chords"])
        chord = M["chords"][ci]
        root = M["bass"][ci]
        barlen = int(bar * SR)
        if s0 + barlen > N: barlen = N - s0

        prog = t0 / max(duration, 1e-6)
        # energy arc: soft intro, lift into reveal ~30%, full drive, ease final 8%
        pad_g  = 0.85
        arp_g  = section_gain(prog, 0.04, 0.22, 0.0, 1.0)
        drum_g = section_gain(prog, 0.30, 0.46, 0.0, 1.0) if M["drums"] else 0.0
        end_g  = section_gain(prog, 0.90, 1.0, 1.0, 0.25)
        pad_g *= end_g; arp_g *= end_g; drum_g *= end_g

        # --- pad (whole bar) ---
        env = env_adsr(barlen, a=0.25, d=0.3, s=0.0, r=0.5, sus_level=0.8)
        for note in chord:
            v = pad_voice(midi(note), barlen) * env * 0.16 * pad_g
            L[s0:s0+barlen] += v; R[s0:s0+barlen] += v
        # --- sub bass (root, soft attack) ---
        be = env_adsr(barlen, a=0.04, d=0.2, s=0.0, r=0.4, sus_level=0.85)
        bsig = tone(midi(root), barlen, "sine") * be * 0.5 * pad_g
        bsig += tone(midi(root), barlen, "tri") * be * 0.06 * pad_g
        L[s0:s0+barlen] += bsig; R[s0:s0+barlen] += bsig

        # --- arpeggio (eighth notes) ---
        if arp_g > 0.001:
            arp_notes = [chord[0]+12, chord[1]+12, chord[2]+12, chord[3]+12,
                         chord[2]+12, chord[1]+12]
            steps = 8
            for k in range(steps):
                st = int((t0 + k * (beat/2)) * SR)
                if st >= N: break
                ln = int((beat/2) * SR)
                if st + ln > N: ln = N - st
                if ln <= 0: break
                note = arp_notes[k % len(arp_notes)]
                pe = pluck_env(ln, decay=0.16)
                a = (tone(midi(note), ln, "tri") * 0.7 +
                     tone(midi(note), ln, "sine") * 0.3) * pe * 0.1 * arp_g
                # light stereo: alternate emphasis
                pan = 0.5 + 0.32 * (1 if k % 2 == 0 else -1)
                L[st:st+ln] += a * (1 - pan + 0.5)
                R[st:st+ln] += a * (pan + 0.0)

        # --- drums ---
        if drum_g > 0.001:
            for k in range(4):  # kick on every beat (four-on-floor, soft)
                st = int((t0 + k * beat) * SR)
                if st >= N: break
                ln = int(0.22 * SR)
                if st + ln > N: ln = N - st
                if ln <= 0: break
                tt = np.arange(ln) / SR
                pitch = 110 * np.exp(-tt / 0.03) + 45
                ph = 2 * np.pi * np.cumsum(pitch) / SR
                ke = np.exp(-tt / 0.12)
                kick = np.sin(ph) * ke * 0.5 * drum_g
                L[st:st+ln] += kick; R[st:st+ln] += kick
            for k in range(8):  # offbeat hat (filtered noise tick)
                if k % 2 == 0: continue
                st = int((t0 + k * (beat/2)) * SR)
                if st >= N: break
                ln = int(0.05 * SR)
                if st + ln > N: ln = N - st
                if ln <= 0: break
                he = np.exp(-(np.arange(ln)/SR) / 0.018)
                rng = np.random.default_rng(1000 + b*8 + k)
                hat = rng.standard_normal(ln) * he * 0.05 * drum_g
                L[st:st+ln] += hat * 0.9; R[st:st+ln] += hat * 1.0

    # trim to exact length
    end = int(duration * SR)
    L = L[:end]; R = R[:end]

    # master bus: gentle warmth + soft clip + fades + normalize
    L = soft_clip(L, 1.3); R = soft_clip(R, 1.3)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)), 1e-6)
    L = L / peak * 0.89; R = R / peak * 0.89

    fade_in = int(2.0 * SR); fade_out = int(3.5 * SR)
    fi = np.linspace(0, 1, fade_in); fo = np.linspace(1, 0, fade_out)
    for ch in (L, R):
        ch[:fade_in] *= fi; ch[-fade_out:] *= fo

    stereo = np.stack([L, R], axis=1)
    return (stereo * 32767).astype(np.int16)

if __name__ == "__main__":
    dur = float(sys.argv[1]) if len(sys.argv) > 1 else 60.0
    out = sys.argv[2] if len(sys.argv) > 2 else "soundtrack.wav"
    mood = sys.argv[3] if len(sys.argv) > 3 else "uplift"
    from scipy.io import wavfile
    data = synth(dur, mood)
    wavfile.write(out, SR, data)
    print(f"wrote {out} ({dur:.1f}s, mood={mood})")
