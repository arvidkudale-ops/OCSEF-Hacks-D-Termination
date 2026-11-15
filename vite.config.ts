import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import { attachRecognition } from "./server/recognize.ts";

/**
 * Recognition stays on the server. The browser never receives the Gemini key.
 * With no key, the scanner stays in demo mode and photos are not uploaded.
 */
function recognitionApi(apiKey: string, model: string): Plugin {
  const handle = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    attachRecognition(apiKey, model, req, res, next);
  };

  return {
    name: "recognition-api",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      recognitionApi(
        env.RECOGNITION_API_KEY?.trim() ?? "",
        env.GEMINI_MODEL?.trim() || "gemini-3.5-flash",
      ),
    ],
  };
});
