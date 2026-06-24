# 화면 패턴: 구매 비밀번호 인증 (Purchase Auth)

> 화면(스크린) **패턴** 명세. 단일 컴포넌트가 아니라 여러 컴포넌트를 배치한 한 화면의 레이아웃 규칙을 학습/문서화.
> 출처: `파운데이션 전환 테스트` `111:18018` (실시간TV_미가입 채널(요금제 변경)_구매 인증 화면)
> 상태: `draft` · 구 토큰 변환(§0) · ⚠️ 서체 Yoon Gothic → Pretendard(가격 숫자 Roboto 예외 §8.6)

---

## 0. 구 → 신 토큰 변환

| 구 값(피그마) | 신 토큰 | 값 |
|---|---|---|
| `#EEEEEE` (타이틀·본문·숫자) | Soft White | `#F5F5F5` |
| `#EEEEEE` @10% (입력칸 테두리) | Soft White @10% | `#F5F5F5` @10% |
| `#EEEEEE` @20% (Price 카드 테두리) | Soft White @20% | `#F5F5F5` @20% |
| `#A1A1A1` @40% (입력칸 면) | Gray600 @40% | `#97979B` @40% |
| `#252525` @40% (Price 카드 면) | Gray300 @40% | `#29292A` @40% |
| `#DB6EAE` (플랜명 강조) | **brand/secondary-01** | `#F471B2` (최근접 로즈 토큰) |

---

## 1. 언제 쓰나

유료 액션(요금제 변경·콘텐츠 구매 등) **실행 직전 구매 비밀번호로 본인 확인**하는 전체 화면. 좌측에 안내+입력+요약, 우측에 리모컨 입력 가이드.

---

## 2. 레이아웃 영역 (좌측 정렬, x=200 기준)

| 순서 | 영역 | 내용 | y |
|---|---|---|---|
| 1 | **배경** | `Livetv/BG/GRADIENT` (보라 그라디언트) | 0 |
| 2 | **상단 안내** | 타이틀 2줄 (예: "선택한 요금제로 변경하시려면 / 구매 비밀번호를 입력하세요.") | 180 |
| 3 | **비밀번호 입력** | `Input_number` 4자리 (PasswordInput) | 386 |
| 4 | **Price 카드** | 변경 요금제(플랜명) + 이용 요금(숫자+원/월) | 526 |
| 5 | **서브 안내** | 요금/약정 안내 2줄(디밍) | 706 |
| 6 | **푸터** | `Flexible 3btn`: 비밀번호 초기화 / 이전 / 확인 | 826 |
| 7 | **우측 가이드** | 리모컨 이미지 `registration_img` + "최초 인증번호는 0000" | 280 / 998 |
| 8 | **우하단** | "가입/변경 문의 : 080-850-400(무료)" | 998 |

---

## 3. 핵심 컴포넌트 스펙

### 3.1 비밀번호 입력 (Input_number)
- 4칸, 96×96, radius. 면 Gray600 @40%, 테두리 Soft White @10%.
- **첫 칸**: key(열쇠) 아이콘 placeholder.
- **포커스 칸**: Soft White 면으로 반전 + **110×110 확대**(PIN 확대 예외 §8.2) + 입력 커서.
- 마스킹: **별표(`*`)** (PasswordInput 규칙과 동일).

### 3.2 Price 카드
- 632×160, 면 Gray300 @40%, 테두리 Soft White @20%, radius.
- 행1: `변경 요금제`(라벨 22) + 플랜명(28, **강조 로즈**).
- 행2: `이용 요금`(라벨 22) + **숫자 `18,600` Roboto Medium 44** + `원/월`(24).

### 3.3 타이틀
- Pretendard Bold 52, 2줄, Soft White.

### 3.4 서브 안내
- Pretendard 22, Soft White(디밍), 2줄. 약정·환불 조건 고지.

### 3.5 푸터
- `Btn/Common/Flexible 3btn`: 비밀번호 초기화 / 이전 / **확인**(주동작).

---

## 4. 사용 색 토큰

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `soft-white` | `#F5F5F5` | 타이틀·본문·숫자 |
| `soft-white` @10% / @20% | `#F5F5F5` | 입력칸 / Price 카드 테두리 |
| `gray-600` @40% | `#97979B` | 입력칸 면 |
| `gray-300` @40% | `#29292A` | Price 카드 면 |
| 강조 로즈 | `#DB6EAE` | 플랜명 (⚠️ §5) |
| BG | Livetv 보라 그라디언트 | 배경 |

---

## 5. 표준화 체크 / 결정거리

| 게이트 | 결과 |
|---|---|
| G1 글자 | ✅ 타이틀 52 / 본문 22~24 |
| G2 대비 | ✅ Soft White on 그라디언트 / 카드 |
| G3 포커스 | ✅ 입력 포커스 칸 면 반전 + 확대(이중 신호) |
| 서체 | ⚠️ Yoon→Pretendard, 가격 숫자 Roboto 유지(§8.6 예외) |
| 숫자 | 가격 `18,600` = Roboto (가격/요금 예외) |

> ✅ **플랜명 강조색 결정**: 구 `#DB6EAE` → **brand/secondary-01 (`#F471B2`)** 으로 확정(가장 근접한 로즈 토큰). Primary는 더 진함, Accent2는 더 연함.
> 마스킹은 **별표** 사용(PasswordInput 표준과 통일).

---

## 6. 피그마

- 패턴 화면 `Pattern/PurchaseAuth` (`182:11146`, 1920×1080) — **내 컴포넌트 인스턴스 + 파운데이션 변수/텍스트 스타일로 조립**. Components 섹션 `46:6905`.
  - 비밀번호 = `PasswordInput`(47:6915) 4개, 버튼 = `Button`(44:6923) 3개(확인=Disabled).
  - 텍스트 = UDS-TV 텍스트 스타일 + 컬러 변수 바인딩(raw hex 미사용). 가격 숫자만 Roboto(§8.6).
  - 플랜명 강조색 = `brand/secondary-01`(#f471b2, 구 #DB6EAE 최근접 토큰으로 확정).
  - BG 보라 그라디언트·리모컨 일러스트는 그래픽으로 유지.
- 재사용: 좌측 안내/입력/카드 + 우측 가이드 구조를 다른 구매·인증 화면에 동일 적용.

---

## 7. 화면 스키마 (생성기 레퍼런스) ★ LLM few-shot

> 입력 예: *"요금제 변경 구매 비밀번호 인증 화면. PIN 4칸(2번째 포커스), 변경 요금제·이용 요금 카드, 비밀번호 초기화/이전/확인 버튼."*

```json
{ "screen": {
  "name": "구매 비밀번호 인증",
  "size": [1920, 1080], "bg": "core/soft-black", "layout": "stack",
  "children": [
    { "type": "text", "style": "font-title-4-700", "color": "core/soft-white", "content": "선택한 요금제로 변경하시려면" },
    { "type": "text", "style": "font-title-4-700", "color": "core/soft-white", "content": "구매 비밀번호를 입력하세요." },
    { "type": "spacer", "size": "space-400" },
    { "type": "group", "direction": "horizontal", "gap": "space-250", "children": [
      { "type": "component", "component": "PasswordInput", "props": { "State": "Filled" } },
      { "type": "component", "component": "PasswordInput", "props": { "State": "Focus" } },
      { "type": "component", "component": "PasswordInput", "props": { "State": "Empty" } },
      { "type": "component", "component": "PasswordInput", "props": { "State": "Empty" } }
    ]},
    { "type": "spacer", "size": "space-400" },
    { "type": "card", "children": [
      { "type": "group", "direction": "horizontal", "gap": "space-250", "align": "center", "children": [
        { "type": "text", "style": "font-label-4-300", "color": "core/gray-600", "content": "변경 요금제" },
        { "type": "text", "style": "font-body-6-500", "color": "brand/secondary-01", "content": "인터넷+IPTV 베이직" }
      ]},
      { "type": "group", "direction": "horizontal", "gap": "space-250", "align": "center", "children": [
        { "type": "text", "style": "font-label-4-300", "color": "core/gray-600", "content": "이용 요금" },
        { "type": "text", "style": "font-title-5-700", "color": "core/soft-white", "content": "18,600원/월" }
      ]}
    ]},
    { "type": "spacer", "size": "space-250" },
    { "type": "text", "style": "font-label-6-300", "color": "core/gray-600", "content": "요금제 변경 후 1개월 내 요금제를 다시 변경할 수 없습니다." },
    { "type": "spacer", "size": "space-400" },
    { "type": "group", "direction": "horizontal", "gap": "space-100", "children": [
      { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Default", "label": "비밀번호 초기화" } },
      { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Default", "label": "이전" } },
      { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Disabled", "label": "확인" } }
    ]}
  ]
}}
```

> ※ 배경 보라 그라디언트·우측 리모컨 일러스트는 그래픽(렌더러 미표현). 구조·입력·요약·푸터만 컴포넌트로 재현.

---

## 패턴 학습 순서 (재사용)
1. 화면 프레임 URL. 2. 영역 분해(배경/안내/입력/요약/서브/푸터/가이드)→§2. 3. 변수 §0 변환→§4. 4. 핵심 컴포넌트 스펙→§3. 5. 결정거리(강조색·마스킹·숫자서체)→§5.
