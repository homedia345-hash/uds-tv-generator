# 패턴 모드 레지스트리 (생성기 — 복제+치환) ★ 최우선

> 입력(이미지/문장)이 아래 패턴 중 하나와 **본질적으로 같은 화면**이면, screen을 새로 조립하지 말고
> `{ "usePattern": "<이름>", "fields": { "@슬롯": 값, ... } }` **만** 출력한다.
> 플러그인이 완성된 원본 패턴을 복제하고 `@슬롯`만 치환하므로 **레이아웃·박스·여백·일러스트가 원본 그대로** 보존된다(품질 최고).
> `@..._check`/`@toggle` 슬롯은 boolean(true/false). `@selected`는 **선택된 라디오의 라벨 문자열 배열**(예 `["2시간"]`, 여러 그룹이면 각 그룹의 선택 라벨을 모두 `["켜짐","매일"]`). 그 외 슬롯은 문자열. 슬롯에 없는 요소(버튼 라벨 등)는 원본 유지.
> 값은 입력에서 읽은 실제 문구·상태로 채운다. 슬롯 목록에 없는 키는 넣지 않는다.

| usePattern | 화면 | 슬롯 |
|---|---|---|
| **TermsAgreement** | 약관 동의 | `@title`, `@term1_label`, `@term1_body`, `@term1_check`(bool), `@term2_label`, `@term2_body`, `@term2_check`(bool) |
| **PurchaseAuth** | 구매 비밀번호 인증(요금제 변경) | `@title1`, `@title2`, `@plan`(요금제명), `@price`(숫자), `@notice1`, `@notice2` |
| **PasswordConfirm** | U+tv 비밀번호 확인(자녀보호·잠금 PIN) | `@title`, `@desc1`, `@desc2`, `@bottom_notice` |
| **AgeRestriction** | 시청 연령 제한 | `@title`, `@desc`, `@result_age`(예 "15세 관람가"), `@caveat`, `@selected`(선택 라디오 라벨 배열) |
| **DailyWatchLimit** | 일일 시청 한도(바텀시트) | `@title`, `@desc`, `@summary1`, `@summary2`, `@hour`(시 값), `@min`(분 값), `@selected`(선택 라디오 라벨 배열) |
| **ChannelInfoDisplay** | 채널 정보 표시 설정 | `@card1_title`, `@card1_desc`, `@card2_title`, `@card2_desc`, `@selected`(선택 라디오 라벨 배열) |
| **ScreenSetting** | 화면 설정 | `@title`, `@desc`, `@toggle_title`, `@radio_title`, `@toggle`(bool), `@selected`(선택 라디오 라벨 배열) |
| **AutoPowerOff** | 자동 전원 끄기 설정 | `@card1_title`, `@card1_desc`, `@card2_title`, `@card2_desc`, `@toggle`(bool), `@selected`(선택 라디오 라벨 배열) |
| **LivetvOption** | 실시간TV 옵션 패널 | `@section1`, `@ch_num`, `@ch_name`, `@section2`, `@section3` |

## 출력 예시

```json
{ "usePattern": "AutoPowerOff",
  "fields": {
    "@card1_title": "전원 자동 켜기",
    "@card1_desc": "설정한 시각이 되면 TV가 자동으로 켜져요.",
    "@card2_title": "켜질 시각",
    "@card2_desc": "TV가 켜질 시각을 선택해 주세요.",
    "@toggle": true
  }
}
```

> ※ `@selected`로 라디오 **선택 항목**은 바꿀 수 있으나, 라디오 **개수**는 원본 유지(예 끄는 시간 5개 고정). 항목 수가 다르면 원본과 가장 가까운 것으로.
> ※ 위 8개 중 매칭되는 패턴이 없으면 일반 화면 스키마(screen JSON)로 조립한다(폴백).
