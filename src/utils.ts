export function detectKind(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("zoom.us")) return "Zoom";
  if (u.includes("meet.google.com")) return "Meet";
  if (u.includes("teams.microsoft.com") || u.includes("teams.live.com")) return "Teams";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("drive.google.com") || u.includes("docs.google.com")) return "Drive";
  if (u.split("?")[0].endsWith(".pdf")) return "PDF";
  return "Link";
}

export function cleanText(value: string, label: string, max: number): string {
  const text = value.trim();
  if (!text) throw new Error(`${label} can't be empty.`);
  if (text.length > max) throw new Error(`${label} is too long (maximum ${max} characters).`);
  return text;
}

export function normalizeUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new Error("Please add a link.");
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a valid link: " + input.trim());
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https links are allowed.");
  }
  if (raw.length > 2000) throw new Error("That link is too long.");
  return parsed.toString();
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}
