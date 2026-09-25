import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("./kokoro/kokoro-v1.0.onnx", "./kokoro/voices-v1.0.bin")
lines = {
 "a1": ["A história viralizou."],
 "a2": ["Mas quem vende por encomenda conhece o problema:", "entregar, e ficar esperando o pagamento."],
 "b1": ["No Lucro Caseiro, você registra o que ficou pendente,"],
 "b2": ["e acompanha quem ainda precisa pagar,", "com o valor organizado no mesmo lugar."],
 "c1": ["Venda feita não é dinheiro recebido."],
 "c2": ["Organize suas cobranças com o Lucro Caseiro."],
 "c3": ["Comente fiado, que eu te mando o link."],
}
out={}
for key,parts in lines.items():
    segs=[]
    for s in parts:
        a, sr = k.create(s, voice="pf_dora", speed=0.95, lang="pt-br")
        idx = np.where(np.abs(a) > 0.01)[0]
        segs.append(a[max(idx[0]-600,0):idx[-1]+2400]); segs.append(np.zeros(int(0.3*sr)))
    a=np.concatenate(segs[:-1])
    sf.write(f"voz-{key}.wav", a, sr); out[key]=round(len(a)/sr,2)
json.dump(lines, open("narracao.json","w"), ensure_ascii=False, indent=1)
print(out)
