"""Trilha calma do Reel dos 80 cadernos (pad + teclas suaves, 84 bpm, sem batida).

Uso: python3 scripts/cadernos-audio.py  ->  public/reel-cadernos/musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DURATION = 41.0
BPM = 84
BAR = 4 * 60 / BPM
OUT = Path(__file__).resolve().parent.parent / "public" / "reel-cadernos" / "musica.wav"

# Cmaj7, Am7, Fmaj7, G6 (quatro voltas), graves em oitava baixa.
CHORDS = [
    (48, [60, 64, 67, 71]),
    (45, [57, 60, 64, 67]),
    (41, [57, 60, 64, 65]),
    (43, [59, 62, 64, 67]),
] * 4


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


t = np.arange(int(SR * DURATION)) / SR
mix = np.zeros_like(t)

for index, (bass, notes) in enumerate(CHORDS):
    start = index * BAR
    length = BAR + 1.2
    mask = (t >= start) & (t < start + length)
    local = t[mask] - start
    env = np.minimum(local / 1.1, 1.0) * np.clip((start + length - t[mask]) / 1.2, 0, 1)
    pad = np.zeros_like(local)
    for note in notes:
        for detune in (-0.12, 0.0, 0.12):
            f = hz(note + detune)
            pad += np.sin(2 * np.pi * f * local) + 0.18 * np.sin(4 * np.pi * f * local)
    pad += 1.6 * np.sin(2 * np.pi * hz(bass) * local)
    mix[mask] += 0.035 * env * pad

    # Teclas suaves: uma nota do acorde nos tempos 1 e 3.
    for beat, note in ((0, notes[-1] + 12), (2, notes[1] + 12)):
        onset = start + beat * 60 / BPM
        kmask = (t >= onset) & (t < onset + 2.4)
        kl = t[kmask] - onset
        f = hz(note)
        key = (np.sin(2 * np.pi * f * kl) + 0.25 * np.sin(4 * np.pi * f * kl)) * np.exp(-kl * 2.2)
        mix[kmask] += 0.05 * np.minimum(kl / 0.01, 1) * key

# Suaviza agudos com uma média móvel curta e aplica fade in/out.
kernel = np.ones(6) / 6
mix = np.convolve(mix, kernel, mode="same")
fade = np.minimum(t / 1.5, 1) * np.clip((DURATION - t) / 2.5, 0, 1)
mix *= fade
mix = mix / np.max(np.abs(mix)) * 0.5

stereo = np.stack([mix, np.roll(mix, int(SR * 0.012))], axis=1)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print(OUT)
