import type { IncomingMessage, ServerResponse } from "node:http";
import { WASTE_ITEMS } from "../src/data/items.js";

const MAX_BODY_BYTES = 4_500_000;
const CONFIDENT = 0.72;

export interface RecognitionStatus {
  recognitionConfigured: boolean;
  acceptsImages: boolean;
  provider: "gemini" | "none";
  reason: string;
}

interface CatalogItem {
  id: string;
  name: string;
}

const CATEGORIES = ["recycle", "compost", "reuse", "trash", "special"] as const;
type GuessCategory = (typeof CATEGORIES)[number];

/** An unverified AI guess for an object that is not in the local database. */
export interface OutsideGuess {
  name: string;
  category: GuessCategory;
  advice: string;
}

interface GeminiDecision {
  itemId: string | null;
  confidence: number | null;
  uncertain: boolean;
  note: string;
  outside: OutsideGuess | null;
}

/** Id and name pairs sent to Gemini. Imported directly so a renamed field cannot drop items. */
function catalog(): CatalogItem[] {
  return WASTE_ITEMS.map((item) => ({ id: item.id, name: item.name }));
}

/** Tells the settings page whether Identify will send photos to Gemini. */
export function statusFor(apiKey: string): RecognitionStatus {
  if (!apiKey) {
    return {
      recognitionConfigured: false,
      acceptsImages: false,
      provider: "none",
      reason:
        "No recognition service is configured. Demo mode is available, and photos are not uploaded.",
    };
  }
  return {
    recognitionConfigured: true,
    acceptsImages: true,
    provider: "gemini",
    reason:
      "Gemini is configured on this server. Identify sends the photo to Google to match an item in the database. D-Trashify does not store the photo.",
  };
}

function redact(message: string, apiKey: string) {
  return apiKey ? message.split(apiKey).join("[redacted]") : message;
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(
          Object.assign(new Error("Image is too large."), { status: 413 }),
        );
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function parseImage(image: unknown) {
  if (typeof image !== "string") return null;
  const match = image.match(
    /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/,
  );
  if (!match) return null;
  const data = match[2].replace(/\s/g, "");
  if (!data || data.length < 32) return null;
  return { mimeType: match[1], data };
}

function decisionFromModel(text: string, items: CatalogItem[]): GeminiDecision {
  const parsed = JSON.parse(text) as {
    itemId?: unknown;
    confidence?: unknown;
    note?: unknown;
    outsideName?: unknown;
    outsideCategory?: unknown;
    outsideAdvice?: unknown;
  };
  const rawId = typeof parsed.itemId === "string" ? parsed.itemId.trim() : "";
  const known = items.some((item) => item.id === rawId);
  let confidence =
    typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
      ? parsed.confidence
      : null;
  if (confidence !== null && confidence > 1 && confidence <= 100) {
    confidence = confidence / 100;
  }
  if (confidence !== null) confidence = Math.min(1, Math.max(0, confidence));
  const note =
    typeof parsed.note === "string" && parsed.note.trim()
      ? parsed.note.trim().slice(0, 280)
      : "Gemini returned a match without an extra note.";
  const itemId = known ? rawId : null;
  const uncertain = !itemId || confidence === null || confidence < CONFIDENT;
  const outsideName =
    typeof parsed.outsideName === "string" ? parsed.outsideName.trim() : "";
  const outsideCategory = CATEGORIES.find(
    (category) => category === parsed.outsideCategory,
  );
  const outside: OutsideGuess | null =
    !itemId && outsideName && outsideCategory
      ? {
          name: outsideName.slice(0, 80),
          category: outsideCategory,
          advice:
            typeof parsed.outsideAdvice === "string"
              ? parsed.outsideAdvice.trim().slice(0, 280)
              : "",
        }
      : null;
  return { itemId, confidence, uncertain, note, outside };
}

function modelText(payload: {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  error?: { message?: string };
}) {
  if (payload.error?.message) throw new Error(payload.error.message);
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => part.text && !part.thought)
    .map((part) => part.text)
    .join("")
    .trim();
}

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

function modelOrder(preferred: string) {
  return [...new Set([preferred, ...FALLBACK_MODELS].filter(Boolean))];
}

function shouldTryAnotherModel(status: number, detail: string) {
  const text = detail.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    text.includes("high demand") ||
    text.includes("no longer available") ||
    text.includes("overloaded") ||
    text.includes("unavailable")
  );
}

/** Sends one photo to Gemini and turns the JSON reply into a match or an outside guess. */
export async function recognizeImage(
  apiKey: string,
  model: string,
  image: string,
): Promise<GeminiDecision> {
  const items = catalog();
  if (items.length === 0) {
    throw Object.assign(new Error("The waste catalog could not be loaded."), {
      status: 500,
    });
  }
  const parsed = parseImage(image);
  if (!parsed) {
    throw Object.assign(new Error("Send a JPG, PNG, WEBP, or GIF data URL."), {
      status: 400,
    });
  }
  const prompt = [
    "Match the main object in this photo to one household-waste item.",
    "Use only an id from the catalog. If the photo is unclear, not waste, or you would be guessing, return an empty itemId and a confidence below 0.4.",
    "If several items are visible, choose the most prominent one.",
    "If the object is clearly household waste but no catalog item fits, return an empty itemId and fill outsideName (a short common name), outsideCategory (one of recycle, compost, reuse, trash, special), and outsideAdvice (one or two sentences on how to prepare or dispose of it, noting that local rules vary). Use reuse for an item someone should keep and use again instead of throwing away. Otherwise leave the outside fields empty.",
    "Catalog:",
    ...items.map((item) => `- ${item.id}: ${item.name}`),
  ].join("\n");

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: parsed.mimeType, data: parsed.data } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          itemId: { type: "STRING" },
          confidence: { type: "NUMBER" },
          note: { type: "STRING" },
          outsideName: { type: "STRING" },
          outsideCategory: { type: "STRING" },
          outsideAdvice: { type: "STRING" },
        },
        required: ["itemId", "confidence", "note"],
      },
    },
  });

  let lastError = "Gemini could not identify this photo.";
  const models = modelOrder(model);
  for (let index = 0; index < models.length; index += 1) {
    const current = models[index];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(current)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: requestBody,
      },
    );
    const raw = await response.text();
    const safe = redact(raw, apiKey);
    if (!response.ok) {
      let detail = `Gemini returned ${response.status}.`;
      try {
        const parsedError = JSON.parse(safe) as {
          error?: { message?: string };
        };
        if (parsedError.error?.message) detail = parsedError.error.message;
      } catch {
        if (safe) detail = safe.slice(0, 240);
      }
      lastError = redact(detail, apiKey).slice(0, 280);
      const retry =
        index < models.length - 1 &&
        shouldTryAnotherModel(response.status, lastError);
      if (retry) continue;
      throw Object.assign(new Error(lastError), {
        status: response.status === 429 ? 429 : 502,
      });
    }

    let payload: {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
      error?: { message?: string };
    };
    try {
      payload = JSON.parse(safe) as typeof payload;
    } catch {
      throw Object.assign(
        new Error("Gemini returned a response that was not JSON."),
        {
          status: 502,
        },
      );
    }
    const text = modelText(payload);
    if (!text) {
      throw Object.assign(new Error("Gemini did not return a match."), {
        status: 502,
      });
    }
    try {
      return decisionFromModel(text, items);
    } catch {
      throw Object.assign(
        new Error("Gemini returned a match this app could not read."),
        {
          status: 502,
        },
      );
    }
  }
  throw Object.assign(new Error(lastError), { status: 502 });
}

/** Handles GET /api/status and POST /api/recognize on the dev server and on Vercel. */
export function attachRecognition(
  apiKey: string,
  model: string,
  req: IncomingMessage,
  res: ServerResponse,
  next: (error?: unknown) => void,
) {
  const url = req.url?.split("?")[0];
  if (url === "/api/status" && req.method === "GET") {
    sendJson(res, 200, statusFor(apiKey));
    return;
  }
  if (url !== "/api/recognize") {
    next();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST to identify a photo." });
    return;
  }
  if (!apiKey) {
    sendJson(res, 501, {
      error:
        "Image recognition is not available in this build. Use demo mode. This server does not accept photos.",
    });
    return;
  }

  void (async () => {
    try {
      // Some hosts (Vercel) may hand over an already-parsed JSON body.
      const preParsed = (req as IncomingMessage & { body?: unknown }).body;
      const body = (
        preParsed && typeof preParsed === "object"
          ? preParsed
          : JSON.parse(await readBody(req))
      ) as { image?: unknown };
      const decision = await recognizeImage(
        apiKey,
        model,
        String(body.image ?? ""),
      );
      sendJson(res, 200, decision);
    } catch (error) {
      const status =
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : 502;
      const message =
        error instanceof Error
          ? redact(error.message, apiKey)
          : "Gemini could not identify this photo.";
      sendJson(res, status, { error: message });
    }
  })();
}
