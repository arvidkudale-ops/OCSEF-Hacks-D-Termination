import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./_handler";

export default function status(req: IncomingMessage, res: ServerResponse) {
  req.url = "/api/status";
  handle(req, res);
}
