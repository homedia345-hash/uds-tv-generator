# 패턴: 상세 Bottom Sheet (옵션 진입 설정 시트)

> 피그마에서 직접 읽어온 명세입니다. **구 OTT 토큰은 신 파운데이션 토큰으로 변환**해 기재합니다.
> 출처: `파운데이션 전환 테스트` 파일 — 인스턴스 학습 중:
> · `일일 시청 한도` `32:12453` (드롭다운 + 라디오 N지)
> · `시청 연령 제한` `32:12550` (연령 범위 프로그래스 바 + 라디오 5지)
> 상태: `draft` · 구 토큰 변환(§0) · 서체 Pretendard 고정(§6) · 신규 컨트롤=드롭다운(§3)·연령 범위 바(§3-B) · 포커스 방식 또 다름(§7)

---

## 0. 구 → 신 토큰 변환

| 구 값(피그마) | 신 토큰 | 값 |
|---|---|---|
| 시트 `#0c0c0e` | Soft Black | `#111111` |
| 딤 `black` 80% | Soft Black | `#111` 80% (스크림) |
| 드롭다운 포커스 면 `#282828` / 라디오 포커스 면 위 테두리 `#252525` | Gray300 | `#29292A` |
| `Grayscale/White #EEEEEE` | Soft White | `#F5F5F5` |
| `Accent #EB008B` (라디오 선택) | Primary | `#FA057F` |
| `#A1A1A1` 40% (버튼·테두리) | Gray600 | `#97979B` 40% |
| 포커스 라벨 `#000000` | Soft Black | `#111` |
| 19세 서브 `#777777` | Gray500 | `#6D6D72` |
| 강조 peach `#f0cccb` | **Accent 2** | `#F0CCCB` (파운데이션 §2.3 편입 완료) |

---

## 1. 이게 뭔가 / 언제

설정 항목에서 **옵션을 누르면 떠오르는 상세 설정 시트.** 본 화면을 딤 처리하고 하단에서 올라와, 복합 설정(켜짐 + 시간 + 반복 등)을 한 자리에서 받고 [취소/적용]으로 닫는다.

---

## 2. 구조 (Region)

```
┌──────────────────────────────────────────────┐
│           (상단 120px: 딤 처리된 본 화면)        │  @Dim Soft Black 80%
├──────────────────────────────────────────────┤  ← 시트 상단(상단 옅은 sheen)
│  [타이틀 46]                      [꺼짐 ○ ● 켜짐]│  header
│  설명 24 (70%)                                  │
│  ──────────────────────────────────────────   │  divider
│  시청 가능 시간            [01 ▾] 시간 [30 ▾] 분 │  row: 라벨 + 드롭다운
│  ──────────────────────────────────────────   │  divider
│  반복            ● 오늘만  ○ 매일  ○ 주중  ○ 주말 │  row: 라벨 + 라디오 N지
│                                                │
│        오늘은 01시간 30분 TV를 시청할 수 있습니다.  │  bottom notice (중앙)
│                  [ 취소 ]  [ 적용 ]              │  footer 2btn (중앙)
└──────────────────────────────────────────────┘
```

| 영역 | 스펙 (신 토큰) |
|---|---|
| 딤 | 전면 Soft Black 80% 스크림 (본 화면 위) |
| 시트 | 상단 120 아래 ~960px, 배경 Soft Black `#111`(← `#0c0c0e`), 상단 옅은 화이트 sheen(Soft White 0→14%) |
| 헤더 | left 136, 폭 1648. 타이틀 Pretendard **46px** Bold(행간 60) + 설명 24px(행간 32) **opacity 70%** + 우측 마스터 라디오(꺼짐/켜짐) |
| 구분선 | 폭 1648, Soft White 저투명 라인 |
| 본문 행 | **라벨(좌, 32px) + 컨트롤(우)** 형식. 행 사이 구분선 |
| 하단 요약 | 중앙, 32px. 강조부(예 "오늘은 01시간 30분") = peach 80% Bold, 나머지 Soft White 80% Medium. **현재 설정값을 문장으로 요약** |
| 푸터 | `Btn/Common/Flexible 2btn`(취소/적용), 중앙, 각 310px |

---

## 3. 새 컨트롤: 드롭다운 `Setting/Btn/dropdown` ★

값 + 아래 chevron. 시·분 같은 수치 선택에 사용. *(현재 이 시트에서만 등장 → 추후 독립 컴포넌트 문서로 승격 권장.)*

| 상태 | 면 | 값 | 테두리 |
|---|---|---|---|
| Normal | 투명 | Soft White 28px (표준안: 풀 명도 §8.3) | Soft White 20% 1px |
| Focus | Gray300 `#29292A`(← `#282828`) | Soft White 28px, 100% | **Soft White `#F5F5F5` 4px** (굵은 밝은 테두리) |
| **Open(펼침)** | Gray300 `#29292A` | 선택값(위 ▲ chevron) + 옵션 리스트(02·03·04·04시간·05시간) | 컨테이너 Soft White 20% 1px, 선택 헤더 Soft White 4px |

> **Open 상태**: Focus에서 `OK` 누르면 펼쳐짐. 헤더=현재 선택값+▲, 아래로 옵션 리스트(각 항목 padding pl40 py24, 항목 사이 구분선). 리스트 값은 표준안에서 **풀 명도 Soft White**(원본 50% 디밍은 §8.3 미달이라 상향). 컴포넌트: `Dropdown` variant `State=Open`.

- 패딩 pl-40 pr-16 py-24, radius 12, chevron 36px.
- ⚠️ **포커스 = "굵은 흰 테두리 + 어두운 면"** — 버튼/라디오의 면 반전과 또 다른 방식(§7). Focus 값/테두리 대비는 13~17:1로 충분.
- ⚠️ Normal **50% 디밍 = 5:1** → 비활성 아닌데 흐림(분 드롭다운). 디밍 최소 대비 검토.

---

## 3-B. 새 컨트롤: 연령 범위 프로그래스 바 (Age Range Bar) ★ (등급고지 도메인)

시청 허용 연령을 **누적 범위**로 고르는 컨트롤. 가로 트랙 위 **5개 노드**(전체 / 7세 / 12세 / 15세 / 19세)가 등간격, 각 노드 아래 라디오가 붙는다. 등급을 고르면 바가 **좌→선택 등급까지 채워져** "여기까지 허용"을 시각화.

| 부분 | 스펙(신 토큰) |
|---|---|
| 트랙 | 폭 1648 × 24px, 노드 5개(10px 원), 등간격 ≈348px |
| 채움(fill) | 선택 등급까지 누적. **중립 색 채움**(연령색 미사용) |
| 노드↔라디오 | 각 노드 아래 Setting 라디오(전체/7/12/15/19세) 정렬. 라디오 선택 = 바 채움 위치 결정 |
| 19세 | 라벨 2줄: "19세 관람가" + 서브 "(제한 없음)" 22px |

- **동작**: 라디오 선택 = 누적 허용 범위(예 15세 = 15세 이하 전부 허용). 바·라디오·하단 요약이 연동.
- 연령 등급 5단계 = 파운데이션 Age Rating(7/12/19…) + 전체. 단 **바 채움은 연령색(녹/황/주/적)이 아닌 중립** — "범위"는 위치/채움으로, 색은 태그에만(§6.2 색 의존 최소화와 정합). 연령색을 바에 넣을지는 결정 사항.
- ⚠️ 19세 포커스 서브 "(제한 없음)" #777→Gray500 on 흰 면 = **4.7:1**(미달). 하단 caveat "단, 넷플릭스…" 50% = **5.0:1**(미달). 보조 문구지만 시니어 기준 상향 검토.

---

## 3-C. 본문 컨트롤 변형 (인스턴스에서 학습)

| 변형 | 구성 | 출처 |
|---|---|---|
| 드롭다운(시·분) | §3 | 일일 시청 한도 |
| 라디오 N지(가로) | `UDS-TV_Component_Radio.md` | 양쪽 |
| **연령 범위 바 + 라디오** | §3-B | 시청 연령 제한 |

---

## 4. 컴포넌트 조립표

| 슬롯 | 컴포넌트 |
|---|---|
| 마스터 켜짐/꺼짐, 반복(오늘만/매일/주중/주말) | `UDS-TV_Component_Radio.md` (2지·N지, 가로 gap 32) |
| 시·분 선택 | 드롭다운(§3, 신규) |
| 취소/적용 | `Btn/Common/Flexible 2btn` (팝업 문서와 동일 — `UDS-TV_Component_PopupCommon.md` §4 참조) |

---

## 5. 사용 색 토큰 — 신 토큰 기준
`soft-black #111` (시트·딤) · `soft-white #F5F5F5` (텍스트·드롭다운 포커스 테두리) · `gray300 #29292A` (드롭다운 포커스 면) · `gray600 #97979B` 40% (푸터 버튼 면) · `primary #FA057F` (라디오 선택) · peach `#f0cccb`(요약 강조, 토큰 미정).

---

## 6. 서체 — Pretendard 고정
- 타이틀 46 / 설명 24 / 라벨 32 / 값 28. 피그마 `Yoon Gothic` → Pretendard로 교체.

---

## 7. 표준화 체크 + 플래그

| 게이트 | 결과 |
|---|---|
| G1 글자 (≥24pt) | ✅ 타이틀 46·라벨 32·값 28·설명 24 |
| G2 대비 (7.1:1) | ✅ 타이틀 17.3 · 설명 70% 8.8 · 요약 8.5~11 · 드롭다운 Focus 13~17 / ⚠️ **드롭다운 Normal 50% 5.0** |
| G3 포커스 | ✅ 드롭다운 굵은 흰 테두리 + 라디오 면 반전 — 단 방식 불일치(아래) |
| G5 용어 | ✅ "시청 가능 시간 / 반복 / 오늘만·매일·주중·주말" 쉬운 한국어 |
| 서체 | ⚠️ Yoon Gothic → Pretendard |

### ⚠️ 포커스 방식 3종으로 분기 (시스템 일관성)
지금까지 발견된 포커스 표현이 셋이다:
1. **면 반전**(Soft White 면 + Soft Black 글자) — 버튼·라디오·토글·팝업.
2. **그라디언트 sheen + 좌측 바** — LNB.
3. **굵은 흰 테두리(4px) + 어두운 면** — 드롭다운.
→ 맥락별로 합리적이나, **"언제 어느 포커스 방식을 쓰는가"를 파운데이션에 1회 규정**해야 들쭉날쭉을 막는다.

### 따뜻한 강조색 토큰 공백
하단 요약 강조 peach `#f0cccb`가 파운데이션에 없음. 상세화면 네이비·툴팁 보라·LNB 알림 보라와 함께 **그래픽/강조 컬러 토큰 세트**로 묶어 정리.

---

## 7-B. 화면 스키마 (생성기 레퍼런스) ★ LLM few-shot

> 입력 예: *"일일 시청 한도 설정 시트. 켜짐/꺼짐, 시청 가능 시간(시·분 드롭다운), 반복(오늘만/매일/주중/주말), 취소/적용."*
> `layout:"bottomSheet"` = 본 화면 딤 + 하단 시트. 행 = `group(spaceBetween)`[라벨 · 컨트롤].

```json
{ "screen": {
  "name": "일일 시청 한도 설정",
  "size": [1920, 1080], "bg": "core/soft-black", "layout": "bottomSheet",
  "children": [
    { "type": "group", "direction": "horizontal", "align": "spaceBetween", "children": [
      { "type": "text", "style": "font-title-5-700", "color": "core/soft-white", "content": "일일 시청 한도 설정" },
      { "type": "group", "direction": "horizontal", "gap": "space-400", "children": [
        { "type": "component", "component": "Radio", "props": { "State": "Default", "label": "꺼짐" } },
        { "type": "component", "component": "Radio", "props": { "State": "Selected", "label": "켜짐" } }
      ]}
    ]},
    { "type": "text", "style": "font-label-4-300", "color": "core/gray-600", "content": "일일 시청 한도를 넘기면 시청이 제한되며, 계속 시청하려면 U+tv 비밀번호 확인이 필요합니다." },
    { "type": "divider", "color": "core/soft-white", "opacity": 0.1 },
    { "type": "group", "direction": "horizontal", "align": "spaceBetween", "children": [
      { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "시청 가능 시간" },
      { "type": "group", "direction": "horizontal", "gap": "space-250", "align": "center", "children": [
        { "type": "component", "component": "Dropdown", "props": { "State": "Normal", "value": "01" } },
        { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "시간" },
        { "type": "component", "component": "Dropdown", "props": { "State": "Normal", "value": "30" } },
        { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "분" }
      ]}
    ]},
    { "type": "divider", "color": "core/soft-white", "opacity": 0.1 },
    { "type": "group", "direction": "horizontal", "align": "spaceBetween", "children": [
      { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "content": "반복" },
      { "type": "group", "direction": "horizontal", "gap": "space-400", "children": [
        { "type": "component", "component": "Radio", "props": { "State": "Selected", "label": "오늘만" } },
        { "type": "component", "component": "Radio", "props": { "State": "Default", "label": "매일" } },
        { "type": "component", "component": "Radio", "props": { "State": "Default", "label": "주중" } },
        { "type": "component", "component": "Radio", "props": { "State": "Default", "label": "주말" } }
      ]}
    ]},
    { "type": "spacer", "size": "space-400" },
    { "type": "text", "style": "font-body-6-500", "color": "core/soft-white", "align": "center", "content": "오늘은 01시간 30분 TV를 시청할 수 있습니다." },
    { "type": "group", "direction": "horizontal", "gap": "space-100", "align": "center", "children": [
      { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Default", "label": "취소" } },
      { "type": "component", "component": "Button", "props": { "Type": "Basic", "State": "Focus", "label": "적용" } }
    ]}
  ]
}}
```

---

## 8. 동작
- 딤 영역 또는 `뒤로`로 닫기(= 취소). `←`/`→`로 컨트롤 간 포커스 이동, 포커스 트랩(시트 밖으로 안 나감).
- **적용** 시 값 확정 후 닫힘. 하단 요약 문구는 현재 입력값에 따라 실시간 갱신.

> **요약**: 옵션 진입 상세 시트 = 딤 + (Soft Black 시트) + [헤더(타이틀46+설명+마스터 라디오)] + [라벨+컨트롤 행들(드롭다운·라디오)] + [요약 문구] + [취소/적용]. 신규 컨트롤=드롭다운. 최우선 정리 = 포커스 방식 3종 규정.
