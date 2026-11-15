import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./_handler.js";

export const config = { maxDuration: 30 };

export default function recognize(req: IncomingMessage, res: ServerResponse) {
  req.url = "/api/recognize";
  handle(req, res);
}
