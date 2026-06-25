# UDS-TV Screen Generator — 플러그인

기능정의서/규격서/자유문장 → **우리 컴포넌트로 조립된 Figma 화면**.

<!-- 패턴 복제+치환 모드(9개) + 취소 금지 + 라디오 선택 슬롯 반영. redeploy. -->>

```
[플러그인 UI(ui.html)] 스펙/JSON 입력
   → (자유문장이면) [LLM 백엔드] 스펙 → 화면 스키마(JSON)
   → [플러그인 code.js] 스키마 → Plugin API 인스턴스 조립
   → [게이트] G1~G8/§8 요약 검수 → 경고
```

- 스키마 규격: `../UDS-TV_ScreenSchema.md` · 어휘: `../uds-tv-screen-catalog.json`

---

## 설치 (개발 모드)
1. Figma 데스크톱 → 메뉴 **Plugins → Development → Import plugin from manifest…**
2. 이 폴더의 `manifest.json` 선택.
3. 컴포넌트 라이브러리가 있는 파일(`테스트 파일` 페이지)에서 플러그인 실행.

> `code.js`는 컴포넌트를 **이름으로 동적 해석**(Button/Radio/… , PopupCommon은 `PopupCommon/Variant A`)하고, 프로퍼티 키(`label#…` 등)도 `componentPropertyDefinitions`에서 런타임 조회 → 파일/ID가 달라도 동작.

---

## MVP — 백엔드 없이 바로 쓰기
1. UI 하단 **②** 텍스트영역에 `../UDS-TV_ScreenSchema.md` 예시 같은 화면 스키마 JSON 붙여넣기.
2. **JSON → 화면 생성** 클릭 → 인스턴스 조립 + 게이트 경고 표시.

자유문장(**①**)은 백엔드 엔드포인트를 넣어야 동작.

---

## LLM 백엔드 계약
- **요청**: `POST {endpoint}` body `{ "spec": "<자유문장/기능정의서>" }`
- **응답**: `{ "screen": { ... } }` (= 화면 스키마. `code.js`가 그대로 조립)

### 시스템 프롬프트 구성
`uds-tv-screen-catalog.json`(어휘) + `UDS-TV_ScreenSchema.md`(문법·게이트)를 시스템 프롬프트로 넣고, **"이 어휘 밖의 컴포넌트/토큰/raw값 금지, 출력은 screen JSON 하나만"** 을 강제.

> 화면 스키마는 재귀(group→children)라 **strict 구조화출력(output_config.format)은 부적합**(재귀 스키마 미지원). 일반 JSON 출력 → 파싱 → 검증 방식 사용.

### 백엔드 예시 (TypeScript / Node, Anthropic SDK)
```ts
// npm i @anthropic-ai/sdk express
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수
const CATALOG = readFileSync("./uds-tv-screen-catalog.json", "utf8");
const SCHEMA_DOC = readFileSync("./UDS-TV_ScreenSchema.md", "utf8");

const SYSTEM = `너는 U+tv(UDS-TV) 화면 생성기다. 입력(기능정의서/규격서/자유문장)을
아래 "컴포넌트 카탈로그"와 "화면 스키마" 문법에 따라 screen JSON 하나로만 변환한다.

규칙:
- 카탈로그에 있는 component 이름 / colors·space·textStyles 토큰만 사용. raw 값(#hex/px) 금지.
- 시니어·리모컨 환경: 핵심 텍스트 24pt↑, 선택지는 한 그룹 ≤6, 약어 금지(쉬운 한국어), 되돌리기(취소/닫기) 포함.
- 출력은 \`{ "screen": {...} }\` JSON 단 하나. 설명/마크다운 금지.

[컴포넌트 카탈로그]
${CATALOG}

[화면 스키마 문법·게이트]
${SCHEMA_DOC}`;

const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const spec = String(req.body?.spec ?? "");
  if (!spec) return res.status(400).json({ error: "spec required" });
  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: spec }],
    });
    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    // 모델이 코드펜스를 붙일 수 있으니 첫 '{' ~ 마지막 '}'만 추출
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const screen = JSON.parse(json);
    res.json(screen);                 // { screen: {...} }
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

app.listen(8787, () => console.log("UDS-TV backend on :8787"));
```

> 모델은 `claude-opus-4-8` 기본. 복잡한 규격서면 `thinking: { type: "adaptive" }`(GA) 추가로 품질↑. 대량/장문이면 streaming 권장.
> 검증 강화: 응답 JSON을 `code.js`의 어휘(컴포넌트/토큰 이름)로 화이트리스트 검사 후 조립.

---

## 파일
| 파일 | 역할 |
|---|---|
| `manifest.json` | 플러그인 매니페스트(`networkAccess`로 백엔드 호출 허용) |
| `code.js` | 메인 — 스키마 → Plugin API 조립 + 게이트 검수 |
| `ui.html` | 입력 UI(① 문장+엔드포인트 / ② JSON 직접) |

## 게이트 검수 + 자동교정 (구현됨)
조립 전 `autoFix` → `runGates` 순으로 동작하며 결과를 UI에 표시.

**자동교정 (`autoFix`)** — 스키마를 직접 보정:
- **비토큰 색 → 근접 토큰**: raw `#hex`를 RGB 거리 최단 Color 토큰으로 치환 (예: `#3a3a3a`→`core/gray-400`).
- **약어 → 쉬운 한국어 (G5)**: `uds-tv-glossary.json` 규칙으로 라벨·문구 치환 (예: `EPG`→편성표, `VOD`→다시보기, `PIN`→비밀번호). 고유명사(U+tv·넷플릭스·유튜브)는 제외.
- **대비 미달 중립색 → 자동 상향 (§8.3)**: 텍스트의 **중립(gray) 색이 배경 대비 7.1 미달**이면, 원래 명도에 가장 가까우면서 7.1을 통과하는 중립으로 상향 (예: 다크 배경에서 `gray-500`(3.7:1)→`gray-700`(11.7:1)). 최소 변경 원칙 — soft-white로 과상향하지 않아 "흐리지만 읽히는" 위계 유지. **brand/utility/age 색은 의미가 있어 자동변경하지 않고 경고만** (raw→토큰 치환 후 chain 적용).

**게이트 검수 (`runGates`)** — 교정 후 잔여 경고:
- **G1 글자**: textStyle 크기 검사 — 핵심(title/body) <24pt, 라벨 <16pt 경고.
- **G2 / §8.3 대비**: 텍스트색↔배경 토큰의 **WCAG 대비 계산** — <4.5 심각, <7.1 권장미달.
- **G4 항목수**: 가로 그룹 라디오 >6 경고(권장 4~5).
- **G5 용어**: 치환 후에도 약어 잔존 시 경고.
- **G8 되돌리기**: 취소/닫기/뒤로 부재 경고.
- **TOKEN**: raw 색 잔존 경고.

> 색·크기 데이터(`COLOR_HEX`/`STYLE_SIZE`)와 사전(`GLOSSARY`)은 `code.js`에 임베드. 토큰/스타일 추가 시 카탈로그와 함께 갱신.

## 다음 개선
- 컴포넌트 추가 시 카탈로그만 갱신하면 확장
- 생성 결과를 다시 LLM에 보내 "완성도 비평→재생성" 루프(선택)
- 게이트 잔여 경고(brand 색 저대비 등)를 LLM에 피드백해 자동 재설계
