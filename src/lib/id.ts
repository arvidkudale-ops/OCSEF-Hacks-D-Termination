/** New id for a scan or a logged disposal. Unique in this browser, not a server id. */
export function uid() {
  return crypto.randomUUID();
}
