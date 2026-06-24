// 지식 동기화: 백업 폴더의 카탈로그·스키마·용어·패턴 MD → uds-tv-plugin/knowledge/
// 에셋(컴포넌트/모듈/패턴)이 늘면 MD를 갱신한 뒤 이 스크립트를 다시 실행하면 생성기가 학습한다.
//   실행: node sync-knowledge.mjs
import { readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, "..");            // IPTV_UX_표준화_백업 (이 폴더의 부모)
const OUT = join(__dir, "knowledge");
mkdirSync(OUT, { recursive: true });

const core = ["uds-tv-screen-catalog.json", "UDS-TV_ScreenSchema.md", "uds-tv-glossary.json"];
const patterns = (() => { try { return readdirSync(SRC).filter(f => /^UDS-TV_Pattern_.*\.md$/.test(f)); } catch { return []; } })();

let n = 0, miss = [];
for (const f of [...core, ...patterns]) {
  const s = join(SRC, f);
  if (existsSync(s)) { copyFileSync(s, join(OUT, f)); n++; console.log("  ✓", f); }
  else miss.push(f);
}
if (miss.length) console.warn("  ⚠ 누락:", miss.join(", "));
console.log(`\n✅ knowledge 동기화 완료: ${n}개 파일 → ${OUT}`);
console.log(`   (패턴 ${patterns.length}개 포함). 배포 시 knowledge/가 번들되는지 vercel.json 확인.`);
