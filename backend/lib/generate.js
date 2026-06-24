// UDS-TV 화면 생성 핵심 로직 (express·serverless 공유)
// 생성(LLM) → 결정적 자동교정 → 게이트 검수 → 어휘 검증 → (문제 남으면) 재생성 루프
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { autoFix, runGates, COLOR_HEX, STYLE_SIZE } from "../gates.js";

const MODEL = process.env.UDS_MODEL || "claude-opus-4-8";
const MAX_RETRIES = Number(process.env.UDS_MAX_RETRIES ?? 2);

// 지식 루트: 플러그인 내 동기화본(knowledge/) 우선 → 백업 폴더 루트(로컬 소스) 폴백.
// serverless 배포에서도 knowledge/가 번들되면 동작(없으면 임베드 어휘 폴백).
function knowledgeRoots() {
  const __dir = dirname(fileURLToPath(import.meta.url));
  return [
    join(__dir, "..", "..", "knowledge"),   // uds-tv-plugin/knowledge (배포 번들 대상)
    join(__dir, "..", "..", ".."),          // IPTV_UX_표준화_백업 루트 (로컬 소스)
  ];
}
function findRoot() {
  for (const r of knowledgeRoots()) { try { if (existsSync(join(r, "uds-tv-screen-catalog.json"))) return r; } catch {} }
  return null;
}
const KNOWLEDGE_ROOT = findRoot();

// 카탈로그 어휘 (어휘 검증용 화이트리스트) — 컴포넌트는 카탈로그에서 파생(에셋 늘면 카탈로그만 갱신)
function loadKnownComponents() {
  const base = ["Button","Radio","Toggle","PasswordInput","IconButton","Dropdown","AgeRangeBar","PopupCommon","Detail/Tooltip"];
  if (KNOWLEDGE_ROOT) {
    try { const cat = JSON.parse(readFileSync(join(KNOWLEDGE_ROOT, "uds-tv-screen-catalog.json"), "utf8")); Object.keys(cat.components || {}).forEach(k => base.push(k)); } catch {}
  }
  return new Set(base);
}
const KNOWN_COMPONENTS = loadKnownComponents();
const KNOWN_COLORS = new Set(Object.keys(COLOR_HEX));
const KNOWN_STYLES = new Set(Object.keys(STYLE_SIZE));
const KNOWN_SPACE = new Set(["space-000","space-100","space-250","space-400","space-600","space-900"]);

// 패턴 라이브러리: 루트의 UDS-TV_Pattern_*.md 전부 로드(레퍼런스 screen JSON 포함 = few-shot)
function loadPatterns(root) {
  try {
    return readdirSync(root).filter(f => /^UDS-TV_Pattern_.*\.md$/.test(f)).sort()
      .map(f => "### " + f + "\n" + readFileSync(join(root, f), "utf8")).join("\n\n");
  } catch { return ""; }
}

// 시스템 프롬프트: knowledge/(또는 백업 루트)의 카탈로그·스키마·용어·패턴, 없으면 임베드 폴백
function loadSystem() {
  const root = KNOWLEDGE_ROOT;
  if (!root) return RULES + "\n\n" + COMPACT_VOCAB;
  try {
    const read = (p) => readFileSync(join(root, p), "utf8");
    const CATALOG = read("uds-tv-screen-catalog.json");
    const SCHEMA = read("UDS-TV_ScreenSchema.md");
    const GLOSSARY = read("uds-tv-glossary.json");
    const PATTERNS = loadPatterns(root);
    return RULES + "\n\n[컴포넌트 카탈로그]\n" + CATALOG + "\n\n[화면 스키마 문법]\n" + SCHEMA +
           "\n\n[용어 사전]\n" + GLOSSARY + (PATTERNS ? "\n\n[패턴 라이브러리]\n" + PATTERNS : "");
  } catch (e) {
    return RULES + "\n\n" + COMPACT_VOCAB;   // 파일 없으면 임베드 어휘 사용(배포 환경)
  }
}

const RULES = `너는 U+tv(UDS-TV) 화면 생성기다. 입력(기능정의서/규격서/자유문장)을 screen JSON 하나로만 변환한다.
규칙(반드시 준수):
- 아래 component 이름 / colors·space·textStyles 토큰만 사용. raw 값(#hex/px) 금지.
- 시니어·리모컨 환경: 핵심 텍스트는 24pt↑(title/body 스타일), 라벨 16↑(18 권장).
- 텍스트 색은 배경 대비 7.1:1↑ 목표(최소 4.5). 어두운 배경엔 soft-white/gray-700 등 밝은 중립.
- 한 가로 그룹의 라디오 선택지는 ≤6(권장 4~5). 약어·외래어 금지(쉬운 한국어). 취소/닫기/이전 등 되돌리기 경로 1개 포함(이미 "이전"/"뒤로"가 있으면 "취소"를 따로 추가하지 말 것 — 푸터 버튼을 불필요하게 늘리지 않는다).
- 출력은 \`{ "screen": {...} }\` JSON 단 하나. 설명/마크다운/코드펜스 금지.
- **모든 블록은 반드시 \`type\` 필드를 가진다**(text|component|group|card|lnb|breadcrumb|list|divider|spacer). 텍스트=\`{"type":"text",...}\`, 컴포넌트=\`{"type":"component","component":"Radio","props":{...}}\`, 그룹=\`{"type":"group","direction":"horizontal|vertical","children":[...]}\`. \`"component":"text"\`처럼 쓰거나 type 누락 금지. 화면 배경 키는 \`bg\`(background 아님).
- **이미지(규격서/화면 스크린샷)가 주어지면** 그 화면의 구조·항목·문구·선택 상태를 읽어 동일한 화면을 우리 컴포넌트로 재현한다. 화면에 없는 색·서체는 위 토큰으로 매핑한다.
- **사진·일러스트·썸네일·미리보기 등 그래픽 자리**는 \`{"type":"component","component":"Image","props":{"ratio":"16:9"}}\`로 표현한다(ratio: 16:9|1:1|4:3). 임의 이미지를 그리지 말고 Image 자리표시자를 둔다.
- **[패턴 라이브러리]가 주어지면 우선 활용**: 입력 의도에 맞는 패턴을 골라 그 패턴 MD의 "생성기 레퍼런스" screen JSON 형식·레이아웃을 그대로 따른다(라벨/개수/선택상태만 입력에 맞게 교체). 임의로 더 단순한 형태로 바꾸지 말 것.
- **설정 화면**(좌측 LNB + 우측 콘텐츠)은 반드시 \`layout:"settingScreen"\` + 블록 \`lnb\`·\`breadcrumb\`·\`card\`를 사용한다(일반 리스트/스택으로 떨어뜨리지 말 것). "왼쪽에 LNB", "좌측 메뉴", "설정 … 화면"이면 settingScreen 패턴.
블록 타입:
- text{style,color,content,align}
- component{component,props}
- group{direction:horizontal|vertical, gap, align:center|spaceBetween, children[]}
- divider{color,opacity} · spacer{size}
- card{children[]} — 설정 묶음(면+radius 카드). 안에 제목/설명 text + 컨트롤.
- lnb{items:[{label,selected?}]} — 좌측 세로 메뉴(현재 항목 selected:true)
- breadcrumb{items:[문자열...]} — 우상단 경로
- list{items:[{label,selected?,focus?}]} — 포커스 가능한 세로 목록(우측 패널 항목 등). focus=면 반전, selected=Primary 마커
layout: stack | centered | settingScreen | bottomSheet | rightPanel.
- settingScreen = 좌측 lnb + (우측: breadcrumb + 나머지 children 스택). lnb·breadcrumb를 children 최상위에 둔다.
- bottomSheet = 본 화면 딤 + 하단 시트(children = 시트 내용). 행은 group(spaceBetween)[라벨·컨트롤].
- rightPanel = 영상 유지 + 우측 패널(children = 헤더 text + list). 첫 항목 focus, 항목 ≤6.`;

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
