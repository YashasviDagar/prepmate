/**
 * Thin wrappers around the browser Web Speech APIs.
 *
 * Nothing here records audio: speech recognition runs in the browser and we
 * only ever keep the resulting transcript. Audio is never uploaded or stored.
 */

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = { error: string; message?: string };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getConstructor() != null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  const Constructor = getConstructor();
  if (!Constructor) return null;

  const recognition = new Constructor();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  return recognition;
}

export function extractTranscript(event: SpeechRecognitionEventLike): {
  finalText: string;
  interimText: string;
} {
  let finalText = "";
  let interimText = "";

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (!result) continue;
    const transcript = result[0]?.transcript ?? "";
    if (result.isFinal) finalText += transcript;
    else interimText += transcript;
  }

  return { finalText, interimText };
}

export function speak(text: string): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow microphone access and try again.";
    case "no-speech":
      return "No speech was detected. Try again and speak clearly.";
    case "audio-capture":
      return "No microphone was found. Check your audio devices.";
    case "network":
      return "Speech recognition needs a network connection and it failed.";
    default:
      return "Speech recognition failed. You can type your answer instead.";
  }
}
