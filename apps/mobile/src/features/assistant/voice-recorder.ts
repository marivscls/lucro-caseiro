/**
 * Gravação de voz. No celular o app usa o microfone do próprio teclado
 * (ditado), então aqui não há gravação; a versão web (`voice-recorder.web.ts`)
 * grava com o MediaRecorder do navegador.
 */
export type RecordedAudio = Readonly<{ data: string; mimeType: string }>;

export type VoiceRecording = Readonly<{
  stop: () => Promise<RecordedAudio>;
  cancel: () => void;
}>;

export const voiceRecordingSupported = false;

export function startVoiceRecording(): Promise<VoiceRecording> {
  return Promise.reject(new Error("Gravação de voz indisponível neste aparelho."));
}
