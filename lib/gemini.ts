import type { SchemeInfo } from "@/constants/types";
import { fetch as expoFetch } from "expo/fetch";

/**
 * Minimal Gemini REST client for Aadhikar AI.
 *
 * Defaults to Gemini 3.5 Flash-Lite with minimal thinking — the fastest
 * combination for short, grounded chat answers. Replies are streamed over SSE
 * so the first words appear almost immediately.
 *
 * The API key is read from `EXPO_PUBLIC_GEMINI_API_KEY` (see `.env.example`).
 * EXPO_PUBLIC_* values are inlined into the app bundle, which is fine for
 * local development and demos. For a public deployment, proxy these requests
 * through a server or edge function so the key is never shipped to clients.
 */

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

type ThinkingLevel = "MINIMAL" | "LOW" | "MEDIUM" | "HIGH";

const THINKING_LEVELS: ThinkingLevel[] = ["MINIMAL", "LOW", "MEDIUM", "HIGH"];

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? "";
const MODEL = (
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite"
).replace(/^models\//, "");

const requestedThinkingLevel =
  (process.env.EXPO_PUBLIC_GEMINI_THINKING_LEVEL?.trim().toUpperCase() ??
    "") as ThinkingLevel;

/**
 * Lite models support MINIMAL thinking; other models may not, so they get LOW
 * (still fast, and accepted by every current Gemini 3 thinking model).
 */
const DEFAULT_THINKING_LEVEL: ThinkingLevel = MODEL.toLowerCase().includes(
  "lite",
)
  ? "MINIMAL"
  : "LOW";

const THINKING_LEVEL = THINKING_LEVELS.includes(requestedThinkingLevel)
  ? requestedThinkingLevel
  : DEFAULT_THINKING_LEVEL;

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_TURNS = 12;

/** True when a Gemini API key was available at build time. */
export const hasGeminiKey = API_KEY.length > 0;

export type GeminiErrorKind =
  | "missing-key"
  | "network"
  | "api"
  | "blocked"
  | "empty";

export class GeminiError extends Error {
  kind: GeminiErrorKind;

  constructor(kind: GeminiErrorKind, message: string) {
    super(message);
    this.name = "GeminiError";
    this.kind = kind;
  }
}

const EMPTY_SCHEME_CONTEXT =
  "The live scheme catalog is not available right now. Do not invent scheme details; direct the user to official government portals and say when you are unsure.";

/** Builds the grounding block from the current Supabase scheme catalog. */
export function buildSchemeContext(schemes: SchemeInfo[]) {
  if (schemes.length === 0) return EMPTY_SCHEME_CONTEXT;

  return schemes
    .map(
      (scheme) =>
        `• ${scheme.name} — ${scheme.category}\n  Benefits: ${scheme.benefits}\n  Eligibility: ${scheme.eligibility}\n  Official link: ${scheme.link}`,
    )
    .join("\n");
}

const SYSTEM_INSTRUCTION = `You are Aadhikar AI, the assistant inside the Aadhikar app — a civic voice portal that helps Indian citizens discover government schemes and benefits.
────────────────────────
🏛️ CORE RESPONSIBILITIES
────────────────────────
1. Understand and respond to queries about:
   - Government scheme recommendations (Central & State, especially Maharashtra state schemes like Majhi Ladki Bahin Yojana, Mahatma Jyotirao Phule Jan Arogya Yojana, etc.)
   - Eligibility checking & Document requirements
   - Application process guidance (Online/Offline)
   - Troubleshooting issues (Aadhaar linking, certificate rejections, portal errors, bank issues)
   - Verification of suspicious schemes (Warn if fake)

2. Scheme Details to Provide:
   - Purpose, Eligibility, Benefits, Required Documents, and Step-by-step application process.

────────────────────────
🗣️ LANGUAGE & TONE
────────────────────────
- Detect or follow user language preference.
- Respond FULLY in the same language as the user: English, Hindi, Marathi, or Hinglish.
- Current language context: English.
- Use simple, everyday language. Avoid technical or legal jargon.
- Tone: Respectful, supportive, empathetic, and citizen-first.
- For Marathi and Hindi, use clear, spoken-style language (bolchal ki bhasha) that is easy to understand when spoken via text-to-speech.

────────────────────────
🔄 CONVERSATION FLOW
────────────────────────
- Identify the user's category (e.g., student, farmer, woman, senior citizen, artisan).
- Provide numbered, step-by-step instructions for processes.
- Ask only necessary follow-up questions to understand their eligibility.
- Maintain context awareness throughout the conversation.

────────────────────────
🔒 SAFETY & PRIVACY RULES
────────────────────────
- NEVER ask for sensitive data (Aadhaar, Bank AC, OTP, Passwords).
- If user shares sensitive data, warn them politely and ask to remove/hide it.
- Never invent details. If unsure, direct to official portals (e.g., https://www.india.gov.in).
- If a scheme is suspicious, warn the user clearly and suggest official alternatives.

────────────────────────
📌 OUTPUT FORMATTING
────────────────────────
- Use light markdown — the app renders it in the chat bubble: **bold** for scheme names, hyphen or numbered lists for steps/documents, and [short link text](https://full-url) for links.
- Do not use headings (#) or tables; this is a small mobile chat bubble.
- Always format official links as markdown links with the full https:// URL so they are tappable.
- Keep responses concise but complete.
- Highlight important warnings or notes clearly.

IMPORTANT: Help the user troubleshoot error messages if an image is provided.`;

function buildSystemInstruction(schemeContext: string) {
  return `${SYSTEM_INSTRUCTION}

Schemes in the database:
${schemeContext || EMPTY_SCHEME_CONTEXT}`;
}

type GeminiPart = { text?: string; thought?: boolean };

type GeminiCandidate = {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

function buildRequestBody(history: ChatTurn[], schemeContext: string) {
  const contents = history.slice(-MAX_TURNS).map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.text }],
  }));

  return {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction(schemeContext) }],
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 800,
      thinkingConfig: { thinkingLevel: THINKING_LEVEL },
    },
  };
}

async function postGemini(
  method: "generateContent" | "streamGenerateContent",
  history: ChatTurn[],
  schemeContext: string,
  signal?: AbortSignal,
): Promise<Response> {
  if (!hasGeminiKey) {
    throw new GeminiError(
      "missing-key",
      "EXPO_PUBLIC_GEMINI_API_KEY is not set",
    );
  }

  const suffix =
    method === "streamGenerateContent"
      ? ":streamGenerateContent?alt=sse"
      : ":generateContent";

  try {
    return await expoFetch(`${BASE_URL}/${MODEL}${suffix}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(buildRequestBody(history, schemeContext)),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new GeminiError("network", "Could not reach the Gemini API");
  }
}

async function throwApiError(response: Response): Promise<never> {
  const data = (await response
    .json()
    .catch(() => null)) as GeminiResponse | null;

  throw new GeminiError(
    "api",
    data?.error?.message ?? `Gemini returned HTTP ${response.status}`,
  );
}

export type AadhikarOptions = {
  signal?: AbortSignal;
  /** Grounding context built from the current scheme catalog. */
  schemeContext?: string;
};

/**
 * Non-streaming request. Used as a fallback when the runtime does not expose
 * a readable response body.
 */
export async function askAadhikar(
  history: ChatTurn[],
  options: AadhikarOptions = {},
): Promise<string> {
  const response = await postGemini(
    "generateContent",
    history,
    options.schemeContext ?? "",
    options.signal,
  );

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = (await response
    .json()
    .catch(() => null)) as GeminiResponse | null;

  const candidate = data?.candidates?.[0];
  const text =
    candidate?.content?.parts
      ?.filter((part) => part.thought !== true)
      .map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
      throw new GeminiError(
        "blocked",
        `Gemini stopped with reason ${candidate.finishReason}`,
      );
    }
    throw new GeminiError("empty", "Gemini returned an empty reply");
  }

  return text;
}

/**
 * Streams a reply from Gemini. `onDelta` is called with each text fragment as
 * it arrives; the complete reply is returned when the stream finishes.
 */
export async function streamAadhikar(
  history: ChatTurn[],
  onDelta: (text: string) => void,
  options: AadhikarOptions = {},
): Promise<string> {
  const response = await postGemini(
    "streamGenerateContent",
    history,
    options.schemeContext ?? "",
    options.signal,
  );

  if (!response.ok) {
    await throwApiError(response);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    const fallback = await askAadhikar(history, options);
    onDelta(fallback);
    return fallback;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let finishReason: string | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        let chunk: GeminiResponse;
        try {
          chunk = JSON.parse(payload) as GeminiResponse;
        } catch {
          continue;
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.finishReason) finishReason = candidate.finishReason;

        for (const part of candidate?.content?.parts ?? []) {
          if (part.thought === true) continue;
          if (typeof part.text === "string" && part.text.length > 0) {
            fullText += part.text;
            onDelta(part.text);
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new GeminiError("network", "The Gemini response was interrupted");
  }

  if (!fullText.trim()) {
    if (finishReason && finishReason !== "STOP") {
      throw new GeminiError(
        "blocked",
        `Gemini stopped with reason ${finishReason}`,
      );
    }
    throw new GeminiError("empty", "Gemini returned an empty reply");
  }

  return fullText;
}

/** Turns any thrown value into a short, user-facing chat message. */
export function describeGeminiError(error: unknown): string {
  if (error instanceof GeminiError) {
    switch (error.kind) {
      case "missing-key":
        return "I'm not connected to Gemini yet. Add EXPO_PUBLIC_GEMINI_API_KEY to the .env file in the project root, restart the dev server, and ask me again.";
      case "network":
      case "api":
        return `I couldn't reach Gemini just now. Please check your connection and API key, then try again. (${error.message})`;
      case "blocked":
        return "I can't help with that particular request. Try asking about a government scheme and I'll do my best.";
      case "empty":
      default:
        return "Gemini didn't send a reply that time. Please ask again.";
    }
  }

  return "Something went wrong on my side. Please try again in a moment.";
}
