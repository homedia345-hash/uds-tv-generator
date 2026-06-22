// UDS-TV 공유 게이트/자동교정 모듈 (Figma 비의존 순수 JS, ESM)
// 플러그인 code.js와 백엔드가 동일 기준을 쓰도록 단일 출처로 관리.
// 토큰/스타일/사전 추가 시 여기만 갱신 → 양쪽 반영.

export const COLOR_HEX = {
  "core/soft-white": "#F5F5F5", "core/gray-700": "#CBCBCD", "core/gray-600": "#97979B",
  "core/gray-500": "#6D6D72", "core/gray-400": "#414143", "core/gray-300": "#29292A",
  "core/gray-200": "#19191A", "core/soft-black": "#111111",
  "brand/primary": "#FA057F", "brand/secondary-01": "#F471B2", "brand/secondary-02": "#F6ACCA", "brand/accent-2": "#F0CCCB",
  "utility/kids": "#32A08C", "utility/ai": "#A052FF",
  "age/7": "#32A08C", "age/12": "#E9B630", "age/15": "#D87642", "age/19": "#C34042",
  "etc/border": "#E1E1E8", "etc/text-primary": "#2B2D36"
};
export const STYLE_SIZE = (() => {
  const m = {};
  const t = [72, 68, 60, 54, 44, 42, 36, 32], b = [40, 36, 34, 32, 30, 28, 26, 24, 22], l = [30, 28, 26, 24, 22, 20, 18, 16];
  t.forEach((s, i) => (m["font-title-" + (i + 1) + "-700"] = s));
  b.forEach((s, i) => (m["font-body-" + (i + 1) + "-500"] = s));
  l.forEach((s, i) => (m["font-label-" + (i + 1) + "-300"] = s));
  return m;
})();
export const GLOSSARY = [
  ["EPG", "편성표"], ["PIP", "작은 화면으로 보기"], ["VOD", "다시보기"], ["OTT", "온라인 영상 서비스"],
  ["OK", "확인"], ["Cancel", "취소"], ["Settings", "설정"], ["Setting", "설정"], ["Menu", "메뉴"],
  ["Search", "검색"], ["Login", "로그인"], ["Logout", "로그아웃"], ["PIN", "비밀번호"], ["키즈", "어린이"]
];
const NEUTRALS = ["core/soft-white", "core/gray-700", "core/gray-600", "core/gray-500", "core/gray-400", "core/gray-300", "core/gray-200", "core/soft-black"];
const isNeutral = (t) => NEUTRALS.indexOf(t) >= 0 || t === "etc/text-primary";

export function hexToRgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
export function relLum(rgb) { const f = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; }
export function contrastHex(a, b) { const L1 = relLum(hexToRgb(a)), L2 = relLum(hexToRgb(b)); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return (hi + 0.05) / (lo + 0.05); }
function nearestToken(hex) { const t = hexToRgb(hex); let best = null, bd = 1e9; for (const k of Object.keys(COLOR_HEX)) { const c = hexToRgb(COLOR_HEX[k]); const d = (c[0] - t[0]) ** 2 + (c[1] - t[1]) ** 2 + (c[2] - t[2]) ** 2; if (d < bd) { bd = d; best = k; } } return best; }
function applyGlossary(s) { let out = String(s), hit = null; for (const [from, to] of GLOSSARY) { const re = /[A-Za-z]/.test(from) ? new RegExp("\\b" + from + "\\b", "gi") : new RegExp(from, "g"); if (re.test(out)) { out = out.replace(re, to); hit = from + "→" + to; } } return { out, hit }; }
function bestNeutralFor(bgHex, origToken, target) {
  const oL = relLum(hexToRgb(COLOR_HEX[origToken] || "#F5F5F5"));
  const pass = NEUTRALS.filter(t => contrastHex(COLOR_HEX[t], bgHex) >= target);
  if (pass.length) { pass.sort((a, b) => Math.abs(relLum(hexToRgb(COLOR_HEX[a])) - oL) - Math.abs(relLum(hexToRgb(COLOR_HEX[b])) - oL)); return pass[0]; }
  return NEUTRALS.slice().sort((a, b) => contrastHex(COLOR_HEX[b], bgHex) - contrastHex(COLOR_HEX[a], bgHex))[0];
}

// 결정적 자동교정 (스키마 직접 수정 → fixes 목록 반환)
export function autoFix(SCREEN) {
  const fixes = [];
  const fixColor = (o, k) => { const v = o[k]; if (typeof v === "string" && v.indexOf("#") === 0) { const tk = nearestToken(v); o[k] = tk; fixes.push(`color ${v}→${tk}`); } };
  const fixText = (o, k) => { if (typeof o[k] !== "string") return; const r = applyGlossary(o[k]); if (r.hit) { o[k] = r.out; fixes.push("용어 " + r.hit); } };
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

// 게이트 검수 (교정 후 잔여 경고)
export function runGates(SCREEN) {
  const warns = [];
  const bgToken = SCREEN.screen.bg || "core/soft-black";
  const bgHex = COLOR_HEX[bgToken] || "#111111";
  const walk = (b) => {
    if (!b) return;
    if (b.type === "text") {
      const snip = (b.content || "").slice(0, 14);
      if (!b.style) warns.push("G1/TOKEN: textStyle 없음 → " + snip);
      else {
        const size = STYLE_SIZE[b.style];
        const tier = b.style.indexOf("font-title") === 0 ? "title" : b.style.indexOf("font-body") === 0 ? "body" : "label";
        if (size != null) {
          if (tier !== "label" && size < 24) warns.push(`G1: 핵심 텍스트 ${size}pt < 24 → "${snip}"`);
          if (tier === "label" && size < 16) warns.push(`G1: 라벨 ${size}pt < 16 → "${snip}"`);
        }
      }
      const colTok = b.color || "core/soft-white";
      if (colTok.indexOf("#") === 0) warns.push("TOKEN: raw 색 → " + colTok);
      else if (COLOR_HEX[colTok]) {
        const c = contrastHex(COLOR_HEX[colTok], bgHex);
        if (c < 4.5) warns.push(`G2: 대비 ${c.toFixed(1)}:1 < 4.5 (심각) → "${snip}" (${colTok}/${bgToken})`);
        else if (c < 7.1) warns.push(`§8.3: 대비 ${c.toFixed(1)}:1 < 7.1(권장) → "${snip}"`);
      }
      const g = applyGlossary(b.content || ""); if (g.hit) warns.push("G5: 약어 잔존 " + g.hit);
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
