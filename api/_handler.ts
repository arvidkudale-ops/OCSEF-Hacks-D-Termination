import type { IncomingMessage, ServerResponse } from "node:http";
import { attachRecognition } from "../server/recognize";

/**
 * Shared entry for the deployed serverless functions (Vercel's /api folder).
 * The key is read from the host's environment variables, never from the browser.
 */
export function handle(req: IncomingMessage, res: ServerResponse) {
  const apiKey = process.env.RECOGNITION_API_KEY?.trim() ?? "";
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
  attachRecognition(apiKey, model, req, res, () => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not found." }));
  });
}
