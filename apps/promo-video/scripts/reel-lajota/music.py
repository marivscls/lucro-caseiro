# Trilha calma sintetizada (pad + teclas suaves, sem batida). Uso: python3 music.py <segundos>
import sys, numpy as np, soundfile as sf
sr=44100; dur=float(sys.argv[1]) if len(sys.argv)>1 else 34.0; n=int(sr*dur); t=np.arange(n)/sr
def hz(m): return 440*2**((m-69)/12)
chords=[[53,57,60,64],[55,59,62,67],[52,55,59,64],[57,60,64,67]]  # Fmaj7 G Em7 Am
bar=60/80*4
out=np.zeros(n)
for i in range(int(dur/bar)+1):
    s=int(i*bar*sr); e=min(n,int((i+1)*bar*sr)+sr)
    if s>=n: break
    tt=np.arange(e-s)/sr; env=np.minimum(1,tt/1.5)*np.exp(-np.maximum(0,tt-bar)*2.5)
    for m in chords[i%4]:
        f=hz(m)
        out[s:e]+=0.05*env*(np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*f*2.003*tt)+0.2*np.sin(2*np.pi*f*0.5*tt))
    for j in range(2):
        ks=s+int(j*bar/2*sr)
        if ks>=n: break
        m=chords[i%4][[0,2][j]]+12
        kt=np.arange(min(int(2.0*sr),n-ks))/sr
        kenv=np.exp(-kt*2.5)*np.minimum(1,kt/0.01)
        out[ks:ks+len(kt)]+=0.03*kenv*(np.sin(2*np.pi*hz(m)*kt)+0.2*np.sin(2*np.pi*hz(m)*2*kt))
d=int(0.4*sr); out[d:]+=0.25*out[:-d]
fade=np.minimum(1,t/1.0)*np.minimum(1,(dur-t)/2.5)
out*=fade; out/=np.abs(out).max(); out*=0.5
sf.write("trilha.wav", np.stack([out,out],1).astype(np.float32), sr)
