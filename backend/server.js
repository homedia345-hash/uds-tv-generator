// UDS-TV 화면 생성 백엔드 (로컬 실행)
// 실행: ANTHROPIC_API_KEY=... node server.js  (Node 18+, "type":"module")
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateScreen, lintScreen, MODEL, MAX_RETRIES } from "./lib/generate.js";

const __dir = dirname(fileURLToPath(import.meta.url));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("⚠️  ANTHROPIC_API_KEY 환경변수가 없습니다. 자유문장 생성(/generate)이 실패합니다. (검수 /lint·웹앱은 동작)");
}

const app = express();
app.use(express.json({ limit: "12mb" }));   // 이미지(base64) 수용
app.use((req, res, next) => {                       // CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.static(join(__dir, "..", "web")));  // 웹앱 → http://localhost:8787/

app.get("/health", (req, res) => res.json({ ok: true, model: MODEL, retries: MAX_RETRIES, hasKey: !!process.env.ANTHROPIC_API_KEY }));

app.post("/generate", async (req, res) => {
  const spec = String(req.body?.spec ?? "").trim();
  const image = req.body?.image || null;            // dataURL | {data, mediaType}
  if (!spec && !image) return res.status(400).json({ error: "spec 또는 image 필요" });
  if (spec.length > 4000) return res.status(400).json({ error: "spec too long (max 4000 chars)" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY 미설정" });
  try {
    const out = await generateScreen(spec, image);
    res.json({ screen: out.screen, _meta: { fixes: out.fixes, warns: out.warns, vocabErrors: out.vocabErrors, attempts: out.attempts } });
  } catch (e) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

app.post("/lint", (req, res) => {
  try {
    const schema = req.body?.screen ? req.body : { screen: req.body };
    res.json(lintScreen(schema));
  } catch (e) { res.status(400).json({ error: e?.message ?? String(e) }); }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`UDS-TV backend on http://localhost:${PORT}  (model ${MODEL}, retries ${MAX_RETRIES})`));
