import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("./kokoro/kokoro-v1.0.onnx", "./kokoro/voices-v1.0.bin")
lines = {
 "v1": "Quanto você cobraria por isso?",
 "v2": "Tem o prato, as tintas e a pintura com o nome.",
 "v3": "A caixa pra presente.",
 "v4": "E três horas do seu trabalho.",
 "v5": "No Lucro Caseiro, material, embalagem e tempo entram na conta.",
 "v6": "Seu tempo também faz parte do preço.",
}
out={}
for key,s in lines.items():
    a, sr = k.create(s, voice="pf_dora", speed=0.95, lang="pt-br")
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(idx[0]-600,0):idx[-1]+2400]
    sf.write(f"voz-{key}.wav", a, sr); out[key]=round(len(a)/sr,3)
json.dump(lines, open("narracao.json","w"), ensure_ascii=False, indent=1)
print(out)
