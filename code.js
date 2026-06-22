/* UDS-TV Screen Generator — Plugin main (Figma Plugin API)
 * 화면 스키마(JSON) → 우리 컴포넌트 인스턴스로 조립.
 * 컴포넌트/프로퍼티는 이름 기반 동적 해석(파일/재생성에도 견고).
 * 스키마 규격: UDS-TV_ScreenSchema.md / 어휘: uds-tv-screen-catalog.json
 */

figma.showUI(__html__, { width: 420, height: 560 });

// 표시이름 → Figma 컴포넌트(셋) 이름 매핑 (셋 이름이 다른 경우만 명시)
const COMPONENT_FIGMA_NAME = {
  Button: "Button",
  Radio: "Radio",
  Toggle: "Toggle",
  PasswordInput: "PasswordInput",
  IconButton: "IconButton",
  Dropdown: "Dropdown",
  AgeRangeBar: "AgeRangeBar",
  PopupCommon: "PopupCommon/Variant A"
};
// content 키 → 컴포넌트 프로퍼티 이름(있으면 property, 없으면 텍스트 override)
const CONTENT_PROP = {
  Radio: { label: "label" },
  IconButton: { label: "label" },
  PopupCommon: { title: "title", body: "body" },
  Button: { label: "__override__" },
  Dropdown: { value: "__override__" }
};
const SPACE = { "space-000": 0, "space-100": 8, "space-250": 20, "space-400": 32, "space-600": 48, "space-900": 72 };

// ---- 검수/교정용 데이터 ----
const COLOR_HEX = {
  "core/soft-white": "#F5F5F5", "core/gray-700": "#CBCBCD", "core/gray-600": "#97979B",
  "core/gray-500": "#6D6D72", "core/gray-400": "#414143", "core/gray-300": "#29292A",
  "core/gray-200": "#19191A", "core/soft-black": "#111111",
  "brand/primary": "#FA057F", "brand/secondary-01": "#F471B2", "brand/secondary-02": "#F6ACCA", "brand/accent-2": "#F0CCCB",
  "utility/kids": "#32A08C", "utility/ai": "#A052FF",
  "age/7": "#32A08C", "age/12": "#E9B630", "age/15": "#D87642", "age/19": "#C34042",
  "etc/border": "#E1E1E8", "etc/text-primary": "#2B2D36"
};
// textStyle 이름 → px
const STYLE_SIZE = (function () {
  const m = {};
  const t = [72, 68, 60, 54, 44, 42, 36, 32], b = [40, 36, 34, 32, 30, 28, 26, 24, 22], l = [30, 28, 26, 24, 22, 20, 18, 16];
  t.forEach((s, i) => (m["font-title-" + (i + 1) + "-700"] = s));
  b.forEach((s, i) => (m["font-body-" + (i + 1) + "-500"] = s));
  l.forEach((s, i) => (m["font-label-" + (i + 1) + "-300"] = s));
  return m;
})();
// G5 용어 사전(축약본 — 전체는 uds-tv-glossary.json)
const GLOSSARY = [
  ["EPG", "편성표"], ["PIP", "작은 화면으로 보기"], ["VOD", "다시보기"], ["OTT", "온라인 영상 서비스"],
  ["OK", "확인"], ["Cancel", "취소"], ["Settings", "설정"], ["Setting", "설정"], ["Menu", "메뉴"],
  ["Search", "검색"], ["Login", "로그인"], ["Logout", "로그아웃"], ["PIN", "비밀번호"], ["키즈", "어린이"]
];

function hexToRgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function relLum(rgb) { const f = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; }
function contrastHex(a, b) { const L1 = relLum(hexToRgb(a)), L2 = relLum(hexToRgb(b)); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return (hi + 0.05) / (lo + 0.05); }
function nearestToken(hex) {
  const t = hexToRgb(hex); let best = null, bd = 1e9;
  for (const k of Object.keys(COLOR_HEX)) { const c = hexToRgb(COLOR_HEX[k]); const d = (c[0] - t[0]) ** 2 + (c[1] - t[1]) ** 2 + (c[2] - t[2]) ** 2; if (d < bd) { bd = d; best = k; } }
  return best;
}
function applyGlossary(s) {
  let out = String(s), hit = null;
  for (const [from, to] of GLOSSARY) {
    const re = /[A-Za-z]/.test(from) ? new RegExp("\\b" + from + "\\b", "gi") : new RegExp(from, "g");
    if (re.test(out)) { out = out.replace(re, to); hit = from + "→" + to; }
  }
  return { out, hit };
}

// 중립 램프(밝음→어두움) — 대비 자동 보정용
const NEUTRALS = ["core/soft-white", "core/gray-700", "core/gray-600", "core/gray-500", "core/gray-400", "core/gray-300", "core/gray-200", "core/soft-black"];
const isNeutral = (t) => NEUTRALS.indexOf(t) >= 0 || t === "etc/text-primary";
// 배경 대비 target 이상을 만족하는 중립 중, 원래 명도와 가장 가까운 것
function bestNeutralFor(bgHex, origToken, target) {
  const origLum = relLum(hexToRgb(COLOR_HEX[origToken] || "#F5F5F5"));
  const pass = NEUTRALS.filter(t => contrastHex(COLOR_HEX[t], bgHex) >= target);
  if (pass.length) { pass.sort((a, b) => Math.abs(relLum(hexToRgb(COLOR_HEX[a])) - origLum) - Math.abs(relLum(hexToRgb(COLOR_HEX[b])) - origLum)); return pass[0]; }
  return NEUTRALS.slice().sort((a, b) => contrastHex(COLOR_HEX[b], bgHex) - contrastHex(COLOR_HEX[a], bgHex))[0];
}

// 자동교정: 비토큰 색→근접 토큰, 약어→쉬운 한국어, 중립 텍스트 대비 미달→상향 (스키마 직접 수정)
function autoFix(SCREEN) {
  const fixes = [];
  const fixColor = (obj, key) => {
    const v = obj[key];
    if (typeof v === "string" && v.indexOf("#") === 0) { const tk = nearestToken(v); obj[key] = tk; fixes.push(`color ${v}→${tk}`); }
  };
  const fixText = (obj, key) => {
    if (typeof obj[key] !== "string") return;
    const r = applyGlossary(obj[key]); if (r.hit) { obj[key] = r.out; fixes.push("용어 " + r.hit); }
  };
  fixColor(SCREEN.screen, "bg");
  const bgHex = COLOR_HEX[SCREEN.screen.bg || "core/soft-black"] || "#111111";
  const walk = (b) => {
    if (!b || typeof b !== "object") return;
    if (b.color) fixColor(b, "color");
    if (b.type === "text") {
      fixText(b, "content");
      const col = b.color || "core/soft-white";
      if (COLOR_HEX[col] && isNeutral(col) && contrastHex(COLOR_HEX[col], bgHex) < 7.1) {
        const up = bestNeutralFor(bgHex, col, 7.1);
        if (up && up !== col) { fixes.push(`대비 ${col}→${up} (${contrastHex(COLOR_HEX[up], bgHex).toFixed(1)}:1)`); b.color = up; }
      }
    }
    if (b.type === "component" && b.props) { for (const k of ["label", "value", "title", "body"]) fixText(b.props, k); }
    (b.children || []).forEach(walk);
  };
  (SCREEN.screen.children || []).forEach(walk);
  return fixes;
}

let _compCache = null, _styleCache = null, _varCache = null;

async function findComponents() {
  if (_compCache) return _compCache;
  await figma.loadAllPagesAsync();
  const nodes = figma.root.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
  _compCache = {};
  for (const n of nodes) _compCache[n.name] = n;
  return _compCache;
}
async function styleByName(name) {
  if (!_styleCache) _styleCache = await figma.getLocalTextStylesAsync();
  const s = _styleCache.find(x => x.name === name);
  return s ? s.id : null;
}
async function varByName(name) {
  if (!_varCache) _varCache = await figma.variables.getLocalVariablesAsync();
  return _varCache.find(v => v.name === name) || null;
}
async function colorPaint(name, op) {
  let p = { type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.96 } };
  const v = await varByName(name);
  if (v) p = figma.variables.setBoundVariableForPaint(p, "color", v);
  if (op != null) p = Object.assign({}, p, { opacity: op });
  return p;
}
// 컴포넌트의 프로퍼티 키(예: 'label#54:0')를 이름으로 동적 조회
function resolvePropKey(node, propName) {
  const defs = node.componentPropertyDefinitions || (node.type === "COMPONENT_SET" ? node.componentPropertyDefinitions : {});
  for (const key of Object.keys(defs || {})) {
    if (key.split("#")[0] === propName) return key;
  }
  return null;
}

async function instantiate(displayName, props) {
  const comps = await findComponents();
  const figName = COMPONENT_FIGMA_NAME[displayName] || displayName;
  const node = comps[figName];
  if (!node) throw new Error("컴포넌트를 찾을 수 없음: " + figName);
  const inst = node.type === "COMPONENT_SET" ? node.defaultVariant.createInstance() : node.createInstance();

  const setProps = {};
  // variant props: definitions 중 VARIANT 타입
  const defs = node.componentPropertyDefinitions || {};
  const variantNames = Object.keys(defs).filter(k => defs[k].type === "VARIANT");
  for (const vk of variantNames) { if (props[vk] != null) setProps[vk] = String(props[vk]); }

  // content: property or text override
  const map = CONTENT_PROP[displayName] || {};
  const overrides = [];
  for (const ck of Object.keys(map)) {
    if (props[ck] == null) continue;
    if (map[ck] === "__override__") { overrides.push(props[ck]); }
    else { const key = resolvePropKey(node, map[ck]); if (key) setProps[key] = String(props[ck]); }
  }
  if (Object.keys(setProps).length) { try { inst.setProperties(setProps); } catch (e) {} }
  for (const val of overrides) { const t = inst.findOne(n => n.type === "TEXT"); if (t) { await ensureFont(t); t.characters = String(val); } }
  return inst;
}

async function ensureFont(textNode) {
  const fn = textNode.fontName;
  if (fn === figma.mixed) return;
  try { await figma.loadFontAsync(fn); } catch (e) { await figma.loadFontAsync({ family: "Pretendard", style: "Regular" }); }
}

async function build(b, parent) {
  let node;
  if (b.type === "text") {
    node = figma.createText();
    await figma.loadFontAsync({ family: "Pretendard", style: "Regular" });
    node.characters = b.content || "";
    const id = await styleByName("UDS-TV/" + b.style);
    if (id) await node.setTextStyleIdAsync(id);
    node.fills = [await colorPaint(b.color || "core/soft-white")];
    if (b.align === "center") node.textAlignHorizontal = "CENTER";
    parent.appendChild(node);
    if (parent.layoutMode === "VERTICAL") node.layoutSizingHorizontal = "FILL";
  } else if (b.type === "component") {
    node = await instantiate(b.component, b.props || {});
    parent.appendChild(node);
  } else if (b.type === "divider") {
    node = figma.createRectangle(); node.resize(b.length || 1648, 1);
    node.fills = [await colorPaint(b.color || "core/soft-white", b.opacity != null ? b.opacity : 0.1)];
    parent.appendChild(node);
    if (parent.layoutMode === "VERTICAL") node.layoutSizingHorizontal = "FILL";
    node.layoutSizingVertical = "FIXED";
  } else if (b.type === "spacer") {
    node = figma.createFrame(); node.resize(1, SPACE[b.size] || 8); node.fills = []; parent.appendChild(node);
  } else if (b.type === "group") {
    node = figma.createFrame();
    node.layoutMode = b.direction === "horizontal" ? "HORIZONTAL" : "VERTICAL";
    node.primaryAxisSizingMode = "AUTO"; node.counterAxisSizingMode = "AUTO";
    node.itemSpacing = SPACE[b.gap] || 0; node.fills = [];
    node.counterAxisAlignItems = b.align === "center" ? "CENTER" : "MIN";
    if (b.align === "center") node.primaryAxisAlignItems = "CENTER";
    if (b.align === "spaceBetween") node.primaryAxisAlignItems = "SPACE_BETWEEN";
    if (b.wrap) node.layoutWrap = "WRAP";
    parent.appendChild(node);
    const fill = b.align === "center" || b.align === "spaceBetween" || b.fill;
    if (parent.layoutMode === "VERTICAL" && fill) node.layoutSizingHorizontal = "FILL";
    for (const ch of (b.children || [])) await build(ch, node);
  }
  return node;
}

async function render(SCREEN) {
  const S = SCREEN.screen;
  const f = figma.createFrame(); f.name = (S.name || "screen") + " [자동생성]";
  f.resize(S.size ? S.size[0] : 1920, S.size ? S.size[1] : 1080);
  f.fills = [await colorPaint(S.bg || "core/soft-black", 1)]; f.clipsContent = true;
  f.layoutMode = "VERTICAL"; f.primaryAxisSizingMode = "FIXED"; f.counterAxisSizingMode = "FIXED";
  const pad = SPACE[S.padding] || 72;
  f.paddingTop = pad; f.paddingBottom = pad; f.paddingLeft = pad; f.paddingRight = pad;
  f.itemSpacing = SPACE["space-600"];
  if (S.layout === "centered") { f.primaryAxisAlignItems = "CENTER"; f.counterAxisAlignItems = "CENTER"; }
  // 빈 캔버스 위치 잡기
  const xs = figma.currentPage.children.map(n => n.x + n.width);
  f.x = (xs.length ? Math.max.apply(null, xs) : 0) + 200; f.y = 0;
  for (const ch of (S.children || [])) await build(ch, f);
  return f;
}

// ---- 게이트 검수: G1 글자 / G2·§8.3 대비 / G4 항목수 / G5 용어 / G8 되돌리기 / TOKEN ----
function runGates(SCREEN) {
  const warns = [];
  const bgToken = SCREEN.screen.bg || "core/soft-black";
  const bgHex = COLOR_HEX[bgToken] || "#111111";
  const walk = (b) => {
    if (!b) return;
    if (b.type === "text") {
      const snip = (b.content || "").slice(0, 14);
      if (!b.style) { warns.push("G1/TOKEN: textStyle 없음 → " + snip); }
      else {
        const size = STYLE_SIZE[b.style];
        const tier = b.style.indexOf("font-title") === 0 ? "title" : b.style.indexOf("font-body") === 0 ? "body" : "label";
        if (size != null) {
          if (tier !== "label" && size < 24) warns.push(`G1: 핵심 텍스트 ${size}pt < 24 → "${snip}"`);
          if (tier === "label" && size < 16) warns.push(`G1: 라벨 ${size}pt < 16 → "${snip}"`);
        }
      }
      // G2 / §8.3 대비
      const colTok = b.color || "core/soft-white";
      if (colTok.indexOf("#") === 0) warns.push("TOKEN: raw 색 → " + colTok);
      else if (COLOR_HEX[colTok]) {
        const c = contrastHex(COLOR_HEX[colTok], bgHex);
        if (c < 4.5) warns.push(`G2: 대비 ${c.toFixed(1)}:1 < 4.5 (심각) → "${snip}" (${colTok} / ${bgToken})`);
        else if (c < 7.1) warns.push(`§8.3: 대비 ${c.toFixed(1)}:1 < 7.1(권장) → "${snip}"`);
      }
      // G5 용어 잔존 검사
      const g = applyGlossary(b.content || ""); if (g.hit) warns.push("G5: 약어 잔존 " + g.hit + " → \"" + snip + "\"");
    }
    if (b.type === "group" && b.direction === "horizontal" && Array.isArray(b.children)) {
      const radios = b.children.filter(c => c.type === "component" && c.component === "Radio").length;
      if (radios > 6) warns.push("G4: 가로 선택지 " + radios + "개 > 6 (권장 4~5)");
    }
    (b.children || []).forEach(walk);
  };
  (SCREEN.screen.children || []).forEach(walk);
  if (!JSON.stringify(SCREEN).match(/취소|닫기|뒤로/)) warns.push("G8: 되돌리기(취소/닫기) 버튼 미발견");
  return warns;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "build") {
    try {
      const schema = typeof msg.schema === "string" ? JSON.parse(msg.schema) : msg.schema;
      const fixes = autoFix(schema);              // 1) 자동교정(색 토큰화·용어)
      const warns = runGates(schema);             // 2) 검수(교정 후 잔여 경고)
      const frame = await render(schema);         // 3) 조립
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.ui.postMessage({ type: "done", id: frame.id, warns, fixes });
    } catch (e) {
      figma.ui.postMessage({ type: "error", message: String(e.message || e) });
    }
  }
};
