"""Trilha original do vídeo de lançamento (LucroCaseiroLancamento).

Tudo é sintetizado aqui, sem amostras de terceiros, então a trilha pode ser
publicada comercialmente. Gera public/launch/trilha.wav; o render usa o MP3
convertido por ffmpeg (veja o README).

Uso: python3 scripts/launch-audio.py
"""

from pathlib import Path
import wave

import numpy as np

SR = 44100
FPS = 30
BPM = 100
BEAT = 60 / BPM
DURATION_FRAMES = 1335
LENGTH = DURATION_FRAMES / FPS
N = int(LENGTH * SR)
OUT = Path(__file__).resolve().parent.parent / "public" / "launch" / "trilha.wav"

rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(buf: np.ndarray, start_s: float, gain: float = 1.0, pan: float = 0.0) -> None:
    start = int(start_s * SR)
    if start >= N:
        return
    end = min(N, start + len(buf))
    seg = buf[: end - start] * gain
    mix[start:end, 0] += seg * (1 - pan) * 0.5 * 2 ** 0.5
    mix[start:end, 1] += seg * (1 + pan) * 0.5 * 2 ** 0.5


def env(n: int, attack: float, release: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.exp(-t / release)
    return a * r


def pluck(midi: float, dur: float = 0.9) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return tone * env(n, 0.004, 0.28)


def pad(midis: list[int], dur: float) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in midis:
        f = hz(m)
        for detune in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (detune / 12)
            out += np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(2 * np.pi * 2 * ff * t)
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.8).clip(0))
    return out / (len(midis) * 3) * fade


def bass(midi: int, dur: float) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * env(n, 0.01, 0.5)


def kick() -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    freq = 50 + 90 * np.exp(-t / 0.04)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-t / 0.12)


def shaker() -> np.ndarray:
    n = int(0.09 * SR)
    noise = rng.standard_normal(n)
    noise = np.diff(noise, prepend=0)  # tilt toward highs
    return noise * env(n, 0.006, 0.025)


def whoosh(dur: float = 0.55) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # simple one-pole low-pass whose cutoff sweeps up then down
    cutoff = 400 + 3600 * np.sin(np.pi * t / dur) ** 2
    alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += alpha[i] * (noise[i] - acc)
        out[i] = acc
    return out * np.sin(np.pi * t / dur) ** 1.5


def click() -> np.ndarray:
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2200 * t) * 0.6 + rng.standard_normal(n) * 0.4) * np.exp(-t / 0.008)


def chime(midis: list[int]) -> np.ndarray:
    dur = 3.5
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, m in enumerate(midis):
        f = hz(m)
        d = int(i * 0.06 * SR)
        tone = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)) * env(n, 0.003, 1.1)
        out[d:] += tone[: n - d]
    return out / len(midis)


# Harmony: D - Bm - G - A (two bars each), warm and optimistic.
progression = [
    (62, [62, 66, 69, 74], 38),  # D
    (59, [59, 62, 66, 71], 35),  # Bm
    (55, [55, 59, 62, 67], 31),  # G
    (57, [57, 61, 64, 69], 33),  # A
]
bar = 4 * BEAT
chord_len = 2 * bar
final_s = 1185 / FPS  # end card

t0 = 0.0
idx = 0
while t0 < final_s:
    root, chord, bass_note = progression[idx % 4]
    length = min(chord_len, final_s - t0)
    add(pad(chord, length + 0.4), t0, 0.16)
    for beat_i in range(int(length / BEAT)):
        bt = t0 + beat_i * BEAT
        if bt > 1.2:
            if beat_i % 2 == 0:
                add(kick(), bt, 0.55)
            add(bass(bass_note, BEAT * 0.95), bt, 0.22)
            add(shaker(), bt + BEAT / 2, 0.05, pan=0.3)
        # eighth-note arpeggio, enters after the hook
        if bt > 4.8:
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            for e in range(2):
                note = chord[pattern[(beat_i * 2 + e) % 8]] + 12
                add(pluck(note), bt + e * BEAT / 2, 0.09, pan=-0.25 if e else 0.25)
    t0 += chord_len
    idx += 1

# Final resolution on D with a chime.
add(pad([50, 62, 66, 69, 74], LENGTH - final_s + 0.2), final_s, 0.2)
add(bass(38, 3.0), final_s, 0.3)
add(kick(), final_s, 0.5)
add(chime([74, 78, 81, 86]), final_s + 0.05, 0.22)

# Sound effects synced to the picture (frames at 30 fps).
for f in (14, 22, 30, 38):
    add(pluck(81 + (f - 14) // 8 * 2, 0.4), f / FPS, 0.14)
for f in (80, 150, 537, 735, 975, 1040, 1105):
    add(whoosh(), f / FPS - 0.2, 0.09)
for f in (115, 232, 300, 398, 773, 890):
    add(pluck(86, 0.3), f / FPS, 0.1)
for f in (535, 865):
    add(click(), f / FPS, 0.25)

# Master: gentle fade in/out, soft limiting.
t = np.arange(N) / SR
fade = np.clip(t / 0.4, 0, 1) * np.clip((LENGTH - t) / 1.2, 0, 1)
mix *= fade[:, None]
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.2) * 0.8

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"{OUT} {LENGTH:.2f}s")
