// Vercel 서버리스 함수 — POST /api/lint { screen } → 자동교정·게이트·어휘 검수 (LLM 없이)
import { lintScreen } from "../backend/lib/generate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const schema = req.body?.screen ? req.body : { screen: req.body };
    res.json(lintScreen(schema));
  } catch (e) {
    res.status(400).json({ error: e?.message ?? String(e) });
  }
}
