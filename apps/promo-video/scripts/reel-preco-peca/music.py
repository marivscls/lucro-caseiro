# Trilha calma sintetizada: pad suave + notas de piano leve, sem batida.
import numpy as np, soundfile as sf
sr=44100; dur=21.0; n=int(sr*dur); t=np.arange(n)/sr
def hz(m): return 440*2**((m-69)/12)
chords=[[57,60,64,67],[53,57,60,64],[48,52,55,60],[55,59,62,65]]  # Am7 Fmaj7 C G7-ish
bar=60/84*4
out=np.zeros(n)
for i in range(int(dur/bar)+1):
    s=int(i*bar*sr); e=min(n,int((i+1)*bar*sr)+sr)
    if s>=n: break
    tt=np.arange(e-s)/sr; env=np.minimum(1,tt/1.2)*np.exp(-np.maximum(0,tt-bar)*2.5)
    for m in chords[i%4]:
        f=hz(m)
        out[s:e]+=0.05*env*(np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*f*2.003*tt)+0.2*np.sin(2*np.pi*f*0.5*tt))
    # soft keys: 4 notes per bar
    for j in range(4):
        ks=s+int(j*bar/4*sr); 
        if ks>=n: break
        m=chords[i%4][[0,2,1,3][j]]+12
        kt=np.arange(min(int(1.6*sr),n-ks))/sr
        kenv=np.exp(-kt*3)*np.minimum(1,kt/0.01)
        out[ks:ks+len(kt)]+=0.035*kenv*(np.sin(2*np.pi*hz(m)*kt)+0.25*np.sin(2*np.pi*hz(m)*2*kt))
# light echo
d=int(0.35*sr); out[d:]+=0.25*out[:-d]
fade=np.minimum(1,t/1.5)*np.minimum(1,(dur-t)/2.0)
out*=fade; out/=np.abs(out).max(); out*=0.5
sf.write("trilha.wav", np.stack([out,out],1).astype(np.float32), sr)
