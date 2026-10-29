import { verifyToken } from "./_auth.js";

// Shared storage in Upstash Redis (connected from the Vercel Storage tab).
// Vercel adds KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) for you.
const KEY = "class-links-data";
const MAX_BYTES = 900 * 1024;

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cfg, command) {
  const r = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cfg.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error("Redis error " + r.status);
  return (await r.json()).result;
}

function valid(d) {
  return (
    d &&
    Array.isArray(d.subjects) &&
    Array.isArray(d.chapters) &&
    Array.isArray(d.links) &&
    d.subjects.length <= 100 &&
    d.chapters.length <= 2000 &&
    d.links.length <= 10000
  );
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const cfg = redisConfig();
  if (!cfg) {
    res.status(500).json({ ok: false, error: "Storage is not connected." });
    return;
  }

  try {
    if (req.method === "GET") {
      const raw = await redis(cfg, ["GET", KEY]);
      res.status(200).json({ data: raw ? JSON.parse(raw) : null });
      return;
    }

    if (req.method === "POST") {
      const auth = req.headers["authorization"] || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!verifyToken(token)) {
        res.status(401).json({ ok: false });
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
      const data = body && body.data;
      if (!valid(data)) {
        res.status(400).json({ ok: false, error: "Invalid data." });
        return;
      }

      const str = JSON.stringify(data);
      if (str.length > MAX_BYTES) {
        res.status(413).json({ ok: false, error: "Too much data." });
        return;
      }

      await redis(cfg, ["SET", KEY, str]);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ ok: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Storage error." });
  }
}
