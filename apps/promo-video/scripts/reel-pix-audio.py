"""Trilha calma do Reel "Pix depois": pad suave + teclas leves, sem batida.

Uso: python3 scripts/reel-pix-audio.py  ->  public/reel-pix/musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 22.0
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)


def note(freq):
    return 440.0 * 2 ** ((freq - 69) / 12)


# Acordes (MIDI) de 5.5 s cada: Fmaj7, Am7, Dm9, Bbmaj7
chords = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 64], [46, 53, 57, 62]]
seg = DUR / len(chords)
for i, chord in enumerate(chords):
    start, end = i * seg, (i + 1) * seg + 1.0
    m = (t >= start) & (t < end)
    local = t[m] - start
    env = np.minimum(1, local / 1.6) * np.minimum(1, np.maximum(0, (end - t[m]) / 1.6))
    for n in chord:
        f = note(n)
        for det in (-0.6, 0.6):
            out[m] += 0.05 * env * np.sin(2 * np.pi * (f + det) * local)

# Teclas leves: uma nota a cada ~0.71 s (84 bpm), decaimento longo
step = 60 / 84
melody = [72, 76, 79, 76, 74, 72, 76, 81, 79, 76, 74, 72]
k = 0
pos = 1.0
while pos < DUR - 2.5:
    f = note(melody[k % len(melody)])
    m = (t >= pos) & (t < pos + 2.5)
    local = t[m] - pos
    env = np.exp(-local * 2.2) * np.minimum(1, local / 0.01)
    out[m] += 0.035 * env * (np.sin(2 * np.pi * f * local) + 0.3 * np.sin(4 * np.pi * f * local))
    pos += step * 2
    k += 1

fade = np.minimum(1, t / 1.5) * np.minimum(1, (DUR - t) / 2.0)
out *= fade
out = out / np.max(np.abs(out)) * 0.6
data = (out * 32767).astype(np.int16)
stereo = np.column_stack([data, data]).ravel()
path = Path(__file__).resolve().parent.parent / "public/reel-pix/musica.wav"
with wave.open(str(path), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(path)
