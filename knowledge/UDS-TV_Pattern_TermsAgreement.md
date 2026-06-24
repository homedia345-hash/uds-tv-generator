# 화면 패턴: 약관 동의 (Terms Agreement)

> 화면(스크린) **패턴**. 여러 컴포넌트를 배치한 한 화면의 레이아웃 규칙.
> 출처: `파운데이션 전환 테스트` `111:18433` (OTT 번들 요금제 약관동의)
> 상태: `draft` · 구 토큰 변환(§0) · ⚠️ 서체 Yoon Gothic → Pretendard

---

## 0. 구 → 신 토큰 변환

| 구 값(피그마) | 신 토큰 | 값 |
|---|---|---|
| `#EEEEEE` (타이틀·라벨·본문) | Soft White | `#F5F5F5` |
| `#252525` @20% (약관 박스 면) | Gray300 @20% | `#29292A` @20% |
| `#EEEEEE` @20% (약관 박스 테두리) | Soft White @20% | `#F5F5F5` @20% |
| `#EB008B` (체크 표시) | Primary | `#FA057F` |
| `#A1A1A1` @40% (전체보기 버튼 테두리) | Gray600 @40% | `#97979B` @40% |
| BG | Livetv 보라 그라디언트 | — |

---

## 1. 언제 쓰나

유료/번들 가입 등에서 **필수 약관에 동의**받는 전체 화면. 약관 항목별로 체크박스 + 본문 + 전체보기, 하단에 이전/전체 동의.

---

## 2. 레이아웃 영역 (좌측 x=200 기준)

| 순서 | 영역 | 내용 |
|---|---|---|
| 1 | 배경 | `Livetv/BG/GRADIENT` |
| 2 | 상단 타이틀 | "필수 약관에 동의해 주세요." (title-4-700) |
| 3 | 약관 블록(×N) | 헤더[**Checkbox** + 라벨(필수) + **전체보기 Button/Line**] + 약관 본문 박스 |
| 4 | 우측 가이드 | `registration_img`(체크 일러스트) |
| 5 | 푸터 | `Button` 2개: 이전 / 전체 동의 |

---

## 3. 핵심 컴포넌트

### 3.1 Checkbox (신규 등록 — `Checkbox` 232:10043)
- 32/28px, `type=able/disable` × `state=nor/sel/foc`.
- **nor**: 빈 박스(Gray 아웃라인). **sel**: **Primary 면+흰 체크**. **foc**: 포커스. **disable**: 디밍.
- 약관 동의 = sel(체크), 미동의 = nor.

### 3.2 전체보기 라인 버튼 (Button의 `variant=Line` — 표준판 `Button` 253:10146)
- 작은 아웃라인 버튼(텍스트 20 + `+` 아이콘), 테두리 Gray600@40, radius 8.
- `variant=Line` × `state`=default/focused/**selected**("전체보기" 토글 선택), `label` 텍스트 속성.
- ※ 별도 `Button/Line` 컴포넌트(구 232:10110)는 Button의 `variant=Line` 변형으로 **통합**됨. 이 패턴도 `Button`(variant=Line) 인스턴스로 조립.

### 3.3 약관 본문 박스
- 960×가변, 면 Gray300@20, 테두리 Soft White@20, radius 12, 패딩.
- 본문 label-4-300(24), Soft White(디밍). 불릿형 고지 문구.

### 3.4 푸터
- `Button`: 이전(Default) / 전체 동의(주동작).

---

## 4. 표준화 체크

| 게이트 | 결과 |
|---|---|
| G1 글자 | ✅ 타이틀 52→54, 라벨 28, 본문 24 |
| G2 대비 | ✅ Soft White on 그라디언트/박스 |
| G3 포커스 | ✅ Checkbox foc / Button focus |
| 색 의존 | ✅ 체크 = 형태(체크표시)+Primary |
| 서체 | ⚠️ Yoon→Pretendard |

---

## 5. 피그마

- 패턴 `Pattern/TermsAgreement` (`236:10104`, 1920×1080) — `Checkbox` + `Button`(variant=Line) + `Button` + 텍스트 스타일/컬러 변수로 조립. BG·일러스트는 그래픽 유지.
- 약관 본문 박스는 **내용 높이에 hug**(primaryAxisSizingMode AUTO), 블록은 박스 하단 기준으로 동적 스택(겹침 방지). ⚠️ resize 후 AUTO 재설정 필수.
- 신규 정규 컴포넌트: `Checkbox`(232:10043). 전체보기 라인버튼은 `Button`의 `variant=Line`(253:10146)으로 통합.

---

## 5-A. 패턴 모드 (복제+치환) ★ 최우선

> 입력이 **약관 동의 화면**이면, screen을 새로 조립하지 말고 아래 형식으로 출력한다. 플러그인이 완성된 원본 패턴(`236:10104`)을 복제하고 슬롯만 치환 → 레이아웃·본문 박스·여백·일러스트가 원본 그대로 보존된다.

```json
{ "usePattern": "TermsAgreement",
  "fields": {
    "@title": "필수 약관에 동의해 주세요.",
    "@term1_label": "제3자 개인정보 제공 동의 (필수)",
    "@term1_body": "• 제공하는 항목: 가입 번호 …",
    "@term1_check": true,
    "@term2_label": "서비스 이용 약관 동의 (필수)",
    "@term2_body": "• 본 상품은 월정액 요금제이나 …",
    "@term2_check": false
  }
}
```

- 슬롯: `@title`, `@term1_label`/`@term1_body`/`@term1_check`, `@term2_label`/`@term2_body`/`@term2_check`. (약관 2개 고정)
- 값은 입력 이미지/문장에서 읽은 실제 문구·체크 상태로 채운다. 슬롯에 없는 건 원본 유지(전체보기/이전/전체 동의 버튼·일러스트).

> ※ 아래 §6은 패턴이 **없을 때**(조합 폴백)용 레퍼런스. 약관은 위 §5-A 패턴 모드를 우선한다.

## 6. 화면 스키마 (생성기 레퍼런스, 조합 폴백) ★ LLM few-shot

> 입력 예: *"OTT 번들 요금제 약관 동의 화면. 필수 약관 2개(체크박스 + 전체보기), 이전/전체 동의 버튼."*

> **레이아웃 = 좌우 2단**(최상위 group horizontal): 좌측 = 약관 컬럼(체크박스+전체보기 행들 + 본문 + 푸터), 우측 = 안내 일러스트 `Image`. 세로로만 쌓지 말 것(1080 넘침 방지).

```json
{ "screen": {
  "name": "약관 동의",
  "size": [1920, 1080], "bg": "core/soft-black", "layout": "stack",
  "children": [
    { "type": "text", "style": "font-title-4-700", "color": "core/soft-white", "content": "필수 약관에 동의해 주세요." },
    { "type": "spacer", "size": "space-400" },
    { "type": "group", "direction": "horizontal", "gap": "space-600", "align": "spaceBetween", "children": [
      { "type": "group", "direction": "vertical", "gap": "space-250", "grow": true, "children": [
        { "type": "group", "direction": "horizontal", "align": "spaceBetween", "children": [
          { "type": "group", "direction": "horizontal", "gap": "space-250", "align": "center", "children": [
            { "type": "component", "component": "Checkbox", "props": { "State": "Selected" } },
            { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "[필수] 제3자 개인정보 제공 동의" }
          ]},
          { "type": "component", "component": "Button", "props": { "Type": "Small", "State": "Default", "label": "전체보기" } }
        ]},
        { "type": "text", "style": "font-label-5-300", "color": "core/gray-600", "content": "제공 항목: 가입 번호 · 제공 받는 자: 주식회사 티빙 …" },
        { "type": "group", "direction": "horizontal", "align": "spaceBetween", "children": [
          { "type": "group", "direction": "horizontal", "gap": "space-250", "align": "center", "children": [
            { "type": "component", "component": "Checkbox", "props": { "State": "Default" } },
            { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "[필수] 서비스 이용약관 동의" }
          ]},
          { "type": "component", "component": "Button", "props": { "Type": "Small", "State": "Default", "label": "전체보기" } }
        ]},
        { "type": "text", "style": "font-label-5-300", "color": "core/gray-600", "content": "본 상품은 월정액 요금제이나 추가 요금이 부과될 수 있습니다 …" },
        { "type": "spacer", "size": "space-400" },
        { "type": "group", "direction": "horizontal", "gap": "space-100", "children": [
          { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Default", "label": "이전" } },
          { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Focus", "label": "전체 동의" } }
        ]}
      ]},
      { "type": "component", "component": "Image", "props": { "ratio": "4:3" } }
    ]}
  ]
}}
```

> ※ **Checkbox는 박스만**(라벨 슬롯 없음) → 체크박스 라벨은 **항상 별도 `text` 블록**으로 둔다(`group[Checkbox, text]`). Checkbox props에 label을 넣지 말 것.
> ※ "전체보기" = Button `variant=Line`(라인 버튼). 우측 안내 일러스트는 **`Image`(ratio 4:3)** 자리표시자로 반드시 포함.
> ⚠️ **푸터는 [이전] / [전체 동의] 2개만**. "취소" 버튼을 추가하지 말 것 — 약관 화면에서는 **"이전"이 되돌리기(G8)** 역할을 한다. 버튼 3개로 만들지 않는다.
> ⚠️ **세로 합이 1080을 넘지 않게** — 약관은 좌우 2단으로 배치하고 spacer를 과하게 넣지 않는다(푸터가 화면 밖으로 나가지 않도록).

---

## 패턴 학습 순서 (재사용)
1. 화면 URL. 2. 영역 분해→§2. 3. 변수 §0 변환→§0. 4. 컴포넌트(체크박스/라인버튼/버튼) 정규화→§3. 5. 게이트→§4.
