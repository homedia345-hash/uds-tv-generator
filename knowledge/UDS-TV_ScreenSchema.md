# UDS-TV 화면 스키마 (Screen Schema v1)

> **자유문장/기능정의서 → 화면**을 자동 생성하기 위한 **중간 계약(JSON)**.
> LLM은 입력을 이 스키마로만 번역하고, 조립기(Plugin/`use_figma`)는 이 스키마를 결정적으로 인스턴스화한다.
> 컴포넌트·토큰 어휘는 `uds-tv-screen-catalog.json` 참조.

---

## 0. 왜 중간 계약인가
- LLM은 **자연어 → 우리 컴포넌트 어휘** 번역만 담당(환각 최소화).
- 조립은 **결정적 코드**가 담당(레이아웃·바인딩·검수).
- 같은 스키마를 **플러그인·웹앱·에이전트**가 공유 → 출력 채널만 갈아끼움.

---

## 1. 최상위 구조

```jsonc
{
  "screen": {
    "name": "시청 연령 제한",
    "size": [1920, 1080],
    "bg": "core/soft-black",          // colors 토큰
    "sheen": true,                     // 상단 화이트 sheen(0→14%)
    "padding": "space-900",            // 외곽 패딩(space 토큰)
    "layout": "stack",                 // stack | centered | settingScreen
    "children": [ <block>, ... ]
  }
}
```

| layout | 의미 |
|---|---|
| `stack` | 좌상단부터 세로 스택(설정/상세 본문) |
| `centered` | 화면 중앙 정렬(팝업·PIN·확인 화면) |
| `settingScreen` | [Back][LNB][브레드크럼][모듈 스택] 골격(패턴 문서 §1) |

---

## 2. 블록 타입 (children 요소)

```jsonc
// 텍스트 — 반드시 textStyle + color 토큰 사용
{ "type":"text", "style":"font-title-5-700", "color":"core/soft-white",
  "content":"시청 연령 제한", "align":"left" }

// 컴포넌트 인스턴스 — catalog의 component 이름 + props
{ "type":"component", "component":"Radio",
  "props": { "State":"Selected", "label":"15세 관람가" } }

// 그룹(레이아웃 컨테이너)
{ "type":"group", "direction":"horizontal", "gap":"space-400",
  "align":"center", "wrap":false, "children":[ ... ] }

// 구분선
{ "type":"divider", "color":"core/soft-white", "opacity":0.1, "length":1648 }

// 간격(명시적 공백)
{ "type":"spacer", "size":"space-600" }
```

- `style`/`color`/`gap`/`size`는 **토큰명만**(raw 값 금지).
- `props`의 키는 catalog `variantProps` + `content` 키.
- 그룹은 중첩 가능(행/열 조합).

---

## 3. 예시 — "시청 연령 제한" (자유문장 → 스키마)

입력 문장: *"자녀보호에서 시청 연령을 고르는 화면. 제목과 안내문, 연령 범위 바, 전체~19세 라디오 5개(15세 선택, 19세 포커스), 하단에 결과 안내랑 취소/적용."*

```jsonc
{ "screen": {
  "name": "시청 연령 제한",
  "size": [1920,1080], "bg":"core/soft-black", "sheen":true,
  "padding":"space-900", "layout":"stack",
  "children": [
    { "type":"text", "style":"font-title-5-700", "color":"core/soft-white", "content":"시청 연령 제한" },
    { "type":"text", "style":"font-label-4-300", "color":"core/soft-white", "content":"시청이 허용되지 않은 시청 등급의 콘텐츠에 시청하려면 U+tv 비밀번호 확인이 필요합니다." },
    { "type":"divider", "color":"core/soft-white", "opacity":0.1 },
    { "type":"text", "style":"font-title-8-700", "color":"core/soft-white", "content":"시청을 허용할 범위를 선택해 주세요" },
    { "type":"component", "component":"AgeRangeBar", "props":{} },
    { "type":"group", "direction":"horizontal", "gap":"space-400", "children":[
      { "type":"component", "component":"Radio", "props":{"State":"Default","label":"전체 관람가"} },
      { "type":"component", "component":"Radio", "props":{"State":"Default","label":"7세 관람가"} },
      { "type":"component", "component":"Radio", "props":{"State":"Default","label":"12세 관람가"} },
      { "type":"component", "component":"Radio", "props":{"State":"Selected","label":"15세 관람가"} },
      { "type":"component", "component":"Radio", "props":{"State":"Focus","label":"19세 관람가"} }
    ]},
    { "type":"group", "direction":"horizontal", "gap":"space-100", "align":"center", "children":[
      { "type":"text", "style":"font-body-4-500", "color":"brand/accent-2", "content":"15세 관람가" },
      { "type":"text", "style":"font-body-4-500", "color":"core/soft-white", "content":" 까지 시청할 수 있어요." }
    ]},
    { "type":"group", "direction":"horizontal", "gap":"space-100", "children":[
      { "type":"component", "component":"Button", "props":{"Type":"Basic","State":"Default","label":"취소"} },
      { "type":"component", "component":"Button", "props":{"Type":"Basic","State":"Default","label":"적용"} }
    ]}
  ]
}}
```

---

## 4. 게이트 — 자동 검수 (생성 후 통과해야 함)

기존 이양 테스트 게이트(G1~G8) + 파운데이션 §8 규정 + **공통 룰(C1~C3)**을 **생성물 자동 검사**로 재사용.

> ★ **공통 룰(C1~C3) — 항상 최우선**
> - **C1 이탈 금지**: 모든 컴포넌트·텍스트·이미지는 1920×1080 안에 완전히 들어와야 한다(잘림·경계 밖 금지). 넘치면 Image 자리표시자(상단 ≤ 화면 1/3≈360px)·spacer부터 축소.
> - **C2 누락 금지**: 입력 화면/규격서의 모든 요소를 빠짐없이 재현 — 하단 **고객센터/문의번호·각주·아이콘+시간** 등 보조 문구 포함. 임의로 빼지 말 것.
> - **C3 유사 패턴 기준**: 유사 패턴/화면이 있으면(정확히 같지 않아도) 그 패턴의 textStyle(폰트 크기)·color 토큰·여백/정렬을 그대로 따르고 내용만 교체. 폰트·색을 임의로 다르게 만들지 말 것. (예: "19세 이상 시청 가능"·시청 잠금/성인 인증 = PasswordConfirm 형제, centered.)

| # | 검사 | 통과 조건 | 자동 판정법 |
|---|---|---|---|
| C1 | 이탈 | 모든 요소가 1920×1080 안 | 세로 합·Image 크기 점검(넘치면 축소) |
| C2 | 누락 | 입력의 모든 요소 재현(하단 고객센터 등) | 입력 대비 누락 점검(LLM 자기검수) |
| C3 | 유사패턴 | 유사 패턴의 폰트·색·여백 일치 | 형제 패턴 textStyle/color 대조 |
| G1 | 글자 | 핵심 텍스트 ≥ 24px (라벨류 ≥ 16, 18 권장) | 적용된 textStyle 크기 검사 |
| G2 | 대비 | 텍스트/배경 대비 ≥ 7.1:1 (최소 4.5) | color 토큰 쌍 대비 계산 |
| G3 | 포커스 | 포커스 표현이 §8.1 3방식 중 하나 | 컴포넌트 State=Focus 사용 검사 |
| G4 | 항목 수 | 한 화면 첫 노출 선택지 ≤ 6 (권장 4~5) | group 내 component 수 카운트 |
| G5 | 용어 | 약어·외래어 금지(쉬운 한국어) | 라벨 사전 대조(EPG/PIP/VOD 등 차단) |
| G6 | 음성안내 | 모든 라벨에 TTS 텍스트 존재 | content 비어있지 않음 검사 |
| G7 | 깊이 | 화면 진입 depth ≤ 2 | 내비 트리 검사(앱 레벨) |
| G8 | 되돌리기 | stack/설정 흐름만 되돌리기 경로 점검. **centered(PIN/확인/인증)·bottomSheet·rightPanel은 리모컨 '뒤로'가 취소 → 검사 제외.** 입력에 없는 되돌리기 버튼 임의 추가 금지 | layout 확인 후 stack 한정 검사 |
| §8.3 | 디밍 | opacity 디밍 후에도 ≥ 4.5:1 | color+opacity 대비 계산 |
| §8.6 | 서체 | 전부 Pretendard(숫자 Roboto 예외) | textStyle/폰트 변수 검사 |
| TOKEN | 토큰화 | 모든 색/간격/서체가 토큰 참조 | raw 값(#hex/px) 존재 시 실패 |

> 실패 항목은 경고로 표면화하고, 가능한 건 자동 교정(예: 디밍 미달 색 → 풀명도, 비토큰 색 → 가장 가까운 토큰).

---

## 5. 파이프라인

```
입력(기능정의서/규격서/자유문장)
  → [LLM] 화면 스키마(JSON) 생성  (이 문서 + catalog를 시스템 프롬프트로)
  → [조립기] 스키마 → Figma Plugin API 인스턴스화
  → [게이트] G1~G8 + §8 자동 검수 → 통과/경고(+자동교정)
  → 산출(편집 가능한 Figma 화면)
```

- LLM 시스템 프롬프트 = `uds-tv-screen-catalog.json`(어휘) + 본 스키마(문법) + 게이트(제약).
- 조립기 = 플러그인 `code.js`(§③) 또는 `use_figma` PoC(§②)가 동일 인터프리터 로직 공유.

---

> 버전 v1 · 최종 2026-06-22 · 카탈로그: `uds-tv-screen-catalog.json`
