import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("./kokoro/kokoro-v1.0.onnx", "./kokoro/voices-v1.0.bin")
lines = {
 "l1": ["Quanto você cobraria por isso?"],
 "l2": ["Primeiro, o material: o prato, as tintas e o verniz."],
 "l3": ["Depois, a pintura.", "Cada nome é feito à mão, com calma."],
 "l4": ["Aí vem a embalagem pra presente: caixa, papel e fita."],
 "l5": ["No fim, foram três horas do seu trabalho."],
 "l6": ["No Lucro Caseiro, tudo isso entra na mesma conta."],
 "l7": ["Dezoito reais de material, seis de embalagem.", "Três horas a vinte reais: sessenta."],
 "l8": ["Com o seu ganho, o preço sugerido fica em cento e dez reais."],
 "l9": ["Seu tempo também faz parte do preço."],
}
out={}
for key,sents in lines.items():
    parts=[]
    for s in sents:
        a, sr = k.create(s, voice="pf_dora", speed=0.95, lang="pt-br")
        idx = np.where(np.abs(a) > 0.01)[0]
        parts += [a[max(idx[0]-600,0):idx[-1]+2400], np.zeros(int(sr*0.3), dtype=a.dtype)]
    a=np.concatenate(parts[:-1]); sf.write(f"longo/voz-{key}.wav", a, sr); out[key]=round(len(a)/sr,2)
json.dump(lines, open("longo/narracao.json","w"), ensure_ascii=False, indent=1)
print(out)
