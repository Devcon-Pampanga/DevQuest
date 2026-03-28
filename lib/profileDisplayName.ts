export function profileDisplayName(raw: string): string {
  return raw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
