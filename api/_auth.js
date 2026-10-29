import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, expiring teacher token. It is only valid while TEACHER_USERNAME and
// TEACHER_PASSWORD stay the same, so changing the password logs everyone out.
function secret() {
  return (
    (process.env.SESSION_SECRET || "") +
    "|" +
    (process.env.TEACHER_USERNAME || "") +
    "|" +
    (process.env.TEACHER_PASSWORD || "")
  );
}

export function makeToken(hours = 12) {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + hours * 3600 * 1000 })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return payload + "." + sig;
}

export function verifyToken(token) {
  if (!process.env.TEACHER_USERNAME || !process.env.TEACHER_PASSWORD) return false;
  if (typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
