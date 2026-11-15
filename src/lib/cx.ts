/** Joins class names and drops empty ones, so conditional classes stay in one call. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
