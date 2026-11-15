import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./_handler.js";

export default function status(req: IncomingMessage, res: ServerResponse) {
  req.url = "/api/status";
  handle(req, res);
}
