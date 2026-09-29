import { requireOptionalNativeModule } from "expo";
import { File } from "expo-file-system";
import { Platform } from "react-native";

/**
 * Gravação de voz no celular (expo-audio, AAC em .m4a). A versão web
 * (`voice-recorder.web.ts`) grava com o MediaRecorder do navegador.
 */
export type RecordedAudio = Readonly<{ data: string; mimeType: string }>;

export type VoiceRecording = Readonly<{
  stop: () => Promise<RecordedAudio>;
  cancel: () => void;
}>;

/** Limite de uma gravação: uma venda cabe em poucos segundos. */
const MAX_MS = 60_000;

/**
 * Builds antigos do app (sem o módulo nativo) quebrariam ao importar expo-audio.
 * Sem o módulo, a gravação fica desligada e o expo-audio nem é carregado.
 */
export const voiceRecordingSupported = requireOptionalNativeModule("ExpoAudio") != null;

type ExpoAudio = typeof import("expo-audio");

function loadExpoAudio(): ExpoAudio {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- carregado só quando o módulo nativo existe
  return require("expo-audio") as ExpoAudio;
}

function recordingOptions({ RecordingPresets }: ExpoAudio) {
  const preset = RecordingPresets.HIGH_QUALITY;
  const common = {
    extension: preset.extension,
    sampleRate: 16_000,
    numberOfChannels: 1,
    bitRate: 64_000,
  };
  return Platform.OS === "ios"
    ? { ...common, ...preset.ios }
    : { ...common, ...preset.android };
}

/** Começa a gravar pelo microfone (pede permissão na primeira vez). */
export async function startVoiceRecording(): Promise<VoiceRecording> {
  if (!voiceRecordingSupported) throw new Error("Gravação indisponível neste aparelho.");
  const audio = loadExpoAudio();
  const { AudioModule, requestRecordingPermissionsAsync, setAudioModeAsync } = audio;
  const permission = await requestRecordingPermissionsAsync();
  if (!permission.granted) throw new Error("Microfone sem permissão.");
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

  const recorder = new AudioModule.AudioRecorder(recordingOptions(audio));
  await recorder.prepareToRecordAsync();
  recorder.record();

  let finished = false;
  const finish = async () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (recorder.isRecording) await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
  };
  const timer = setTimeout(() => void finish(), MAX_MS);

  return {
    async stop(): Promise<RecordedAudio> {
      await finish();
      const uri = recorder.uri;
      recorder.release();
      if (!uri) throw new Error("A gravação não foi salva.");
      const file = new File(uri);
      const data = await file.base64();
      file.delete();
      return { data, mimeType: "audio/mp4" };
    },
    cancel() {
      void finish().finally(() => recorder.release());
    },
  };
}
