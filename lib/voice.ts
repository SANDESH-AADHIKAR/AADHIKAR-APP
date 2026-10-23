import { Platform } from "react-native";

/**
 * Voice helpers shared by speech-to-text (recognition) and text-to-speech (TTS).
 *
 * `expo-speech-recognition` wraps the native iOS/Android recognizers and the
 * browser Web Speech API, so a single API works across every platform. It is a
 * native module, which means it is not bundled with Expo Go — the loader below
 * fails soft so the rest of the app keeps working when the module is missing.
 */

export type SpeechRecognitionPackage = typeof import("expo-speech-recognition");

/** UI language → BCP-47 locale understood by the speech engines. */
const SPEECH_LOCALES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

const FALLBACK_LOCALE = "en-IN";

export function getSpeechLocale(language?: string | null): string {
  const base = (language ?? "en").split(/[-_]/)[0].toLowerCase();
  return SPEECH_LOCALES[base] ?? FALLBACK_LOCALE;
}

let cachedPackage: SpeechRecognitionPackage | null | undefined;

/**
 * Loads the module lazily and returns `null` when it cannot be resolved.
 * In Expo Go the import throws because the native module is not compiled in;
 * on web Metro resolves the Web Speech API implementation instead.
 */
export function loadSpeechRecognition(): SpeechRecognitionPackage | null {
  if (cachedPackage !== undefined) return cachedPackage;

  try {
    cachedPackage =
      require("expo-speech-recognition") as SpeechRecognitionPackage;
  } catch {
    cachedPackage = null;
  }

  return cachedPackage;
}

export function isSpeechRecognitionSupported(): boolean {
  const speech = loadSpeechRecognition();
  if (!speech) return false;

  try {
    return speech.ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export type VoiceErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "busy"
  | "client"
  | "interrupted"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed"
  | "speech-timeout"
  | "unknown"
  | (string & {});

/** Maps a recognition error code to a translation key. */
export function getVoiceErrorKey(code?: VoiceErrorCode): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "voice_err_permission";
    case "no-speech":
    case "speech-timeout":
      return "voice_err_no_speech";
    case "network":
      return "voice_err_network";
    case "language-not-supported":
    case "bad-grammar":
      return "voice_err_language";
    case "audio-capture":
    case "interrupted":
      return "voice_err_audio";
    case "busy":
      return "voice_err_busy";
    case "aborted":
      return "voice_err_aborted";
    default:
      return "voice_err_generic";
  }
}

/** Joins non-empty fragments with a single space. */
export function joinSpeechParts(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

/** Web Speech API needs HTTPS (or localhost) to access the microphone. */
export function isWebSecureContext(): boolean {
  if (Platform.OS !== "web") return true;
  if (typeof window === "undefined") return false;

  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}
