import { timingSafeEqual, createHash } from "node:crypto";
import { makeToken } from "./_auth.js";

// Username and password live in Vercel environment variables
// (TEACHER_USERNAME, TEACHER_PASSWORD), never in the code.
function same(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const user = process.env.TEACHER_USERNAME;
  const pass = process.env.TEACHER_PASSWORD;

  if (!user || !pass) {
    res.status(500).json({ ok: false, error: "Login is not configured." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  body = body || {};

  const okUser = same(body.username ?? "", user);
  const okPass = same(body.password ?? "", pass);

  if (okUser && okPass) {
    res.status(200).json({ ok: true, token: makeToken(12) });
  } else {
    res.status(401).json({ ok: false });
  }
}
