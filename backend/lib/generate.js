// UDS-TV 화면 생성 핵심 로직 (express·serverless 공유)
// 생성(LLM) → 결정적 자동교정 → 게이트 검수 → 어휘 검증 → (문제 남으면) 재생성 루프
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { autoFix, runGates, COLOR_HEX, STYLE_SIZE } from "../gates.js";

const MODEL = process.env.UDS_MODEL || "claude-opus-4-8";
const MAX_RETRIES = Number(process.env.UDS_MAX_RETRIES ?? 2);

// 카탈로그 어휘 (어휘 검증용 화이트리스트)
const KNOWN_COMPONENTS = new Set(["Button","Radio","Toggle","PasswordInput","IconButton","Dropdown","AgeRangeBar","PopupCommon","Detail/Tooltip"]);
const KNOWN_COLORS = new Set(Object.keys(COLOR_HEX));
const KNOWN_STYLES = new Set(Object.keys(STYLE_SIZE));
const KNOWN_SPACE = new Set(["space-000","space-100","space-250","space-400","space-600","space-900"]);

// 시스템 프롬프트: 로컬은 루트의 풍부한 .md/.json, serverless는 임베드 폴백
function loadSystem() {
  try {
    const __dir = dirname(fileURLToPath(import.meta.url));
    const root = join(__dir, "..", "..", "..");           // backend/lib → 저장소 루트
    const read = (p) => readFileSync(join(root, p), "utf8");
    const CATALOG = read("uds-tv-screen-catalog.json");
    const SCHEMA = read("UDS-TV_ScreenSchema.md");
    const GLOSSARY = read("uds-tv-glossary.json");
    return RULES + "\n\n[컴포넌트 카탈로그]\n" + CATALOG + "\n\n[화면 스키마 문법]\n" + SCHEMA + "\n\n[용어 사전]\n" + GLOSSARY;
  } catch (e) {
    return RULES + "\n\n" + COMPACT_VOCAB;   // 파일 없으면 임베드 어휘 사용(배포 환경)
  }
}

const RULES = `너는 U+tv(UDS-TV) 화면 생성기다. 입력(기능정의서/규격서/자유문장)을 screen JSON 하나로만 변환한다.
규칙(반드시 준수):
- 아래 component 이름 / colors·space·textStyles 토큰만 사용. raw 값(#hex/px) 금지.
- 시니어·리모컨 환경: 핵심 텍스트는 24pt↑(title/body 스타일), 라벨 16↑(18 권장).
- 텍스트 색은 배경 대비 7.1:1↑ 목표(최소 4.5). 어두운 배경엔 soft-white/gray-700 등 밝은 중립.
- 한 가로 그룹의 라디오 선택지는 ≤6(권장 4~5). 약어·외래어 금지(쉬운 한국어). 취소/닫기 등 되돌리기 포함.
- 출력은 \`{ "screen": {...} }\` JSON 단 하나. 설명/마크다운/코드펜스 금지.
- **이미지(규격서/화면 스크린샷)가 주어지면** 그 화면의 구조·항목·문구·선택 상태를 읽어 동일한 화면을 우리 컴포넌트로 재현한다. 화면에 없는 색·서체는 위 토큰으로 매핑한다.
블록 타입: text{style,color,content,align} · component{component,props} · group{direction,gap,align,children} · divider{color,opacity} · spacer{size}. layout: stack|centered.`;

const COMPACT_VOCAB = `[components] Button(Type:Basic|Small|Round,State:Default|Focus|Disabled,label) · Radio(State:Default|Selected|Focus,label) · Toggle(State:On|Off) · PasswordInput(State:Empty|Filled|Focus) · IconButton(State:Normal|Focus,label) · Dropdown(State:Normal|Focus|Open,value) · AgeRangeBar · PopupCommon(title,body)
[colors] core/soft-white,gray-700,gray-600,gray-500,gray-400,gray-300,gray-200,soft-black · brand/primary,secondary-01,secondary-02,accent-2 · utility/kids,ai · age/7,12,15,19 · etc/border,text-primary
[space] space-000,100,250,400,600,900
[textStyles] font-title-1~8-700(72→32) · font-body-1~9-500(40→22) · font-label-1~8-300(30→16)`;

const SYSTEM = loadSystem();

function parseScreen(text) {
  const j = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(j);
}

// 어휘 검증: 카탈로그 밖의 컴포넌트/토큰 사용 시 오류 목록(조립 불가 위험)
function validateVocab(SCREEN) {
  const errs = [];
  const ck = (cond, msg) => { if (cond) errs.push(msg); };
  if (SCREEN.screen && SCREEN.screen.bg && !KNOWN_COLORS.has(SCREEN.screen.bg)) errs.push("미정의 bg 토큰: " + SCREEN.screen.bg);
  const walk = (b) => {
    if (!b || typeof b !== "object") return;
    if (b.type === "text") { if (b.style && !KNOWN_STYLES.has(b.style)) errs.push("미정의 textStyle: " + b.style); if (b.color && !KNOWN_COLORS.has(b.color) && b.color.indexOf("#") !== 0) errs.push("미정의 color: " + b.color); }
    if (b.type === "component" && !KNOWN_COMPONENTS.has(b.component)) errs.push("미정의 component: " + b.component);
    if (b.gap && !KNOWN_SPACE.has(b.gap)) errs.push("미정의 space: " + b.gap);
    (b.children || []).forEach(walk);
  };
  (SCREEN.screen && SCREEN.screen.children || []).forEach(walk);
  return errs;
}

let _client;
function client() { if (!_client) _client = new Anthropic(); return _client; }

// 이미지 입력 정규화: dataURL 문자열 | {data, mediaType} → Anthropic image 블록
function imageBlock(image) {
  if (!image) return null;
  let data = image, mediaType = "image/png";
  if (typeof image === "object") { data = image.data; mediaType = image.mediaType || mediaType; }
  if (typeof data === "string" && data.startsWith("data:")) { const m = data.match(/^data:([^;]+);base64,(.*)$/s); if (m) { mediaType = m[1]; data = m[2]; } }
  if (!data) return null;
  return { type: "image", source: { type: "base64", media_type: mediaType, data } };
}

// 메인: (spec, image?) → { screen, fixes, warns, vocabErrors, attempts }
export async function generateScreen(spec, image) {
  const img = imageBlock(image);
  const first = img
    ? [img, { type: "text", text: spec || "이 규격서/화면을 우리 컴포넌트로 동일하게 재현해줘." }]
    : spec;
  const messages = [{ role: "user", content: first }];
  const attempts = [];
  let best = null;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const resp = await client().messages.create({ model: MODEL, max_tokens: 16000, system: SYSTEM, messages });
    const raw = resp.content.find(b => b.type === "text")?.text ?? "";
    let schema;
    try { schema = parseScreen(raw); }
    catch (e) {
      attempts.push({ iter: i, error: "parse_failed" });
      messages.push({ role: "assistant", content: raw }, { role: "user", content: "유효한 JSON이 아니다. screen JSON 하나만 다시 출력해줘." });
      continue;
    }
    const fixes = autoFix(schema);
    const vocabErrors = validateVocab(schema);
    const warns = runGates(schema);
    attempts.push({ iter: i, fixes, warns, vocabErrors });
    best = { screen: schema.screen, fixes, warns, vocabErrors };
    if (warns.length === 0 && vocabErrors.length === 0) break;
    if (i === MAX_RETRIES) break;
    messages.push({ role: "assistant", content: JSON.stringify(schema) });
    messages.push({ role: "user", content:
      "방금 출력의 문제를 모두 해소해서 screen JSON을 다시 출력해줘. 색·용어·중립대비는 이미 자동보정되니, 너는 아래를 고쳐라. JSON만.\n" +
      (vocabErrors.length ? "어휘 오류(카탈로그 밖 사용 금지):\n- " + vocabErrors.join("\n- ") + "\n" : "") +
      (warns.length ? "게이트 경고(구조 수정: 글자 크기 상향·가로 선택지 6개 이하 분할·취소 추가·brand 저대비 대체):\n- " + warns.join("\n- ") : "") });
  }
  return { ...best, attempts };
}

// 검수만(이미 만든 스키마 점검)
export function lintScreen(SCREEN) {
  const fixes = autoFix(SCREEN);
  const vocabErrors = validateVocab(SCREEN);
  const warns = runGates(SCREEN);
  return { screen: SCREEN.screen, fixes, warns, vocabErrors };
}

export { MODEL, MAX_RETRIES };
