import type { RecordedAudio, VoiceRecording } from "./voice-recorder";

export type { RecordedAudio, VoiceRecording } from "./voice-recorder";

/** Limite de uma gravação: uma venda cabe em poucos segundos. */
const MAX_MS = 60_000;

export const voiceRecordingSupported =
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== "undefined";

function preferredMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o áudio."));
    reader.readAsDataURL(blob);
  });
}

/** Começa a gravar pelo microfone do navegador (pede permissão na primeira vez). */
export async function startVoiceRecording(): Promise<VoiceRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = preferredMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const release = () => stream.getTracks().forEach((track) => track.stop());
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => {
      release();
      resolve();
    };
  });
  recorder.start();
  const timer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, MAX_MS);

  return {
    async stop(): Promise<RecordedAudio> {
      clearTimeout(timer);
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      return { data: await blobToBase64(blob), mimeType: type };
    },
    cancel() {
      clearTimeout(timer);
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
  };
}
