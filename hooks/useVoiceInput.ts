import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  getSpeechLocale,
  getVoiceErrorKey,
  isSpeechRecognitionSupported,
  isWebSecureContext,
  joinSpeechParts,
  loadSpeechRecognition,
} from "@/lib/voice";

type UseVoiceInputOptions = {
  /** Current UI language (`en`, `hi`, `mr` …). Drives the recognition locale. */
  language: string;
  /** Receives the full composer text: existing text + transcript so far. */
  onText: (text: string) => void;
};

export type VoiceInputController = {
  isListening: boolean;
  isStarting: boolean;
  isSupported: boolean;
  /** Translation key for the current error, or `null`. */
  errorKey: string | null;
  start: (options?: { baseText?: string }) => Promise<void>;
  stop: () => void;
  cancel: () => void;
  clearError: () => void;
};

const END_FALLBACK_MS = 1500;

export function useVoiceInput({
  language,
  onText,
}: UseVoiceInputOptions): VoiceInputController {
  const speech = useRef(loadSpeechRecognition()).current;
  const module = speech?.ExpoSpeechRecognitionModule ?? null;

  const [isSupported] = useState(isSpeechRecognitionSupported);
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const languageRef = useRef(language);
  languageRef.current = language;

  /** Text that was already in the composer when recording began. */
  const baseTextRef = useRef("");
  /** Finalised transcript chunks (Android/Web can return several per session). */
  const finalTextRef = useRef("");
  /** Latest non-final transcript chunk. */
  const interimTextRef = useRef("");
  const hasTextRef = useRef(false);
  const endFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearEndFallback = useCallback(() => {
    if (endFallbackRef.current) {
      clearTimeout(endFallbackRef.current);
      endFallbackRef.current = null;
    }
  }, []);

  const emitText = useCallback(() => {
    const transcript = joinSpeechParts(
      finalTextRef.current,
      interimTextRef.current,
    );
    onTextRef.current(joinSpeechParts(baseTextRef.current, transcript));
  }, []);

  const commitInterim = useCallback(() => {
    if (!interimTextRef.current) return;
    finalTextRef.current = joinSpeechParts(
      finalTextRef.current,
      interimTextRef.current,
    );
    interimTextRef.current = "";
    emitText();
  }, [emitText]);

  const resetSession = useCallback(() => {
    baseTextRef.current = "";
    finalTextRef.current = "";
    interimTextRef.current = "";
    hasTextRef.current = false;
  }, []);

  useEffect(() => {
    if (!module) return;

    const subscriptions = [
      module.addListener("start", () => {
        clearEndFallback();
        setIsStarting(false);
        setIsListening(true);
      }),
      module.addListener("end", () => {
        // A final result should already have arrived; keep a stray interim
        // transcript so dictated text is never silently dropped.
        commitInterim();
        clearEndFallback();
        setIsStarting(false);
        setIsListening(false);
      }),
      module.addListener("result", (event: ExpoSpeechRecognitionResultEvent) => {
        const transcript = event.results?.[0]?.transcript?.trim() ?? "";
        if (!transcript) return;

        hasTextRef.current = true;

        if (event.isFinal) {
          finalTextRef.current = joinSpeechParts(
            finalTextRef.current,
            transcript,
          );
          interimTextRef.current = "";
        } else {
          interimTextRef.current = transcript;
        }

        emitText();
      }),
      module.addListener(
        "error",
        (event: ExpoSpeechRecognitionErrorEvent) => {
          clearEndFallback();
          setIsStarting(false);
          setIsListening(false);

          // Aborting is deliberate (unmount, sending, language change).
          if (event.error === "aborted") return;

          // "no-speech" after the user already dictated something is noise.
          if (event.error === "no-speech" && hasTextRef.current) {
            commitInterim();
            return;
          }

          commitInterim();
          setErrorKey(getVoiceErrorKey(event.error));
        },
      ),
      module.addListener("nomatch", () => {
        commitInterim();
        if (!hasTextRef.current) setErrorKey("voice_err_no_speech");
      }),
    ];

    return () => {
      clearEndFallback();
      subscriptions.forEach((subscription) => {
        try {
          subscription.remove();
        } catch {
          // Listener already removed — nothing to do.
        }
      });

      try {
        module.abort();
      } catch {
        // Recognition was not running.
      }
    };
  }, [module, clearEndFallback, commitInterim, emitText]);

  // Stop listening when the user switches language mid-dictation.
  useEffect(() => {
    if (!module || !isListening) return;

    try {
      module.stop();
    } catch {
      // Recognition already stopped.
    }
    // Only react to language changes, not to isListening transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const start = useCallback(
    async (options?: { baseText?: string }) => {
      setErrorKey(null);

      if (!module || !isSupported) {
        setErrorKey("voice_err_unsupported");
        return;
      }

      if (Platform.OS === "web" && !isWebSecureContext()) {
        setErrorKey("voice_err_insecure");
        return;
      }

      setIsStarting(true);
      resetSession();

      try {
        if (Platform.OS !== "web") {
          const permission = await module.requestPermissionsAsync();
          if (!permission.granted) {
            setIsStarting(false);
            setErrorKey("voice_err_permission");
            return;
          }
        }

        baseTextRef.current = options?.baseText?.trim() ?? "";

        module.start({
          lang: getSpeechLocale(languageRef.current),
          interimResults: true,
          continuous: true,
          maxAlternatives: 1,
          addsPunctuation: true,
          iosTaskHint: "dictation",
        });
      } catch {
        setIsStarting(false);
        setErrorKey("voice_err_generic");
      }
      // `isStarting` is cleared by the "start" event (or the error handler).
    },
    [module, isSupported, resetSession],
  );

  const stop = useCallback(() => {
    if (!module) return;

    try {
      module.stop();
    } catch {
      setIsListening(false);
      return;
    }

    // Some Android recognizers do not emit "end" reliably when stopped.
    clearEndFallback();
    endFallbackRef.current = setTimeout(() => {
      setIsListening(false);
      setIsStarting(false);
    }, END_FALLBACK_MS);
  }, [module, clearEndFallback]);

  const cancel = useCallback(() => {
    if (!module) return;

    clearEndFallback();
    resetSession();
    setIsListening(false);
    setIsStarting(false);

    try {
      module.abort();
    } catch {
      // Recognition was not running.
    }
  }, [module, clearEndFallback, resetSession]);

  const clearError = useCallback(() => setErrorKey(null), []);

  return {
    isListening,
    isStarting,
    isSupported,
    errorKey,
    start,
    stop,
    cancel,
    clearError,
  };
}
