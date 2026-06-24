// Vercel 서버리스 함수 — POST /api/generate { spec } → { screen, _meta }
import { generateScreen } from "../backend/lib/generate.js";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };  // 이미지 수용

export default async function handler(req, res) {
  // CORS — Figma 플러그인(외부 origin)에서 호출 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const spec = String(req.body?.spec ?? "").trim();
  const image = req.body?.image || null;
  if (!spec && !image) return res.status(400).json({ error: "spec 또는 image 필요" });
  if (spec.length > 4000) return res.status(400).json({ error: "spec too long (max 4000)" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY 미설정 (Vercel 환경변수)" });
  try {
    const out = await generateScreen(spec, image);
    res.json({ screen: out.screen, _meta: { fixes: out.fixes, warns: out.warns, vocabErrors: out.vocabErrors, attempts: out.attempts } });
  } catch (e) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
}
