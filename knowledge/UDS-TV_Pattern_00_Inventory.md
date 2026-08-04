# UDS-TV 카탈로그 인벤토리 + 생성 스캔 순서 ★★ 최우선 (2026-08)

> **화면을 만들 때는 항상 패턴 → 모듈 → 컴포넌트 순서로 훑고, 요청과 유사한 것을 먼저(先) 적용한다.**
> 1. **패턴** — 요청 화면과 본질적으로 같은/유사한 패턴이 있으면 그걸 **복제 + 슬롯 치환**(패턴 모드, `UDS-TV_Pattern_Registry.md` 참고). 최우선. 레이아웃·박스·여백·일러스트가 원본 그대로 보존됨.
> 2. **모듈** — 유사 패턴이 없으면, 유사 **모듈**(LNB·팝업·그리드·패널 등 조립물)을 이어붙여 화면을 구성.
> 3. **컴포넌트** — 그래도 없는 낱개 요소만 표준 **컴포넌트** 인스턴스로 채운다.
> ※ 처음부터 raw로 새로 그리지 말 것. 유사한 것을 복제·다듬는 게 원칙.

fileKey `zrtugqYc19aXqpqWUaYErv`, page "컴포넌트 재정리"(240:10747). 인스턴스화는 setId(모듈·컴포넌트) / nodeId(패턴 복제).

> ★ **재사용 정합성 규칙(2026-08 감사 반영):** 화면/패턴 안의 요소는 반드시 표준 컴포넌트 **인스턴스**를 참조해야 한다. raw 사각형 스크롤바·구버전 LNB항목·raw 브레드크럼·bespoke 버튼 금지.
> - 스크롤바 = **Scrollbar 276:10124**(position 변형, 트랙 높이에 맞춰 resize) · LNB 항목 = **LNB/MenuItem 1241:22121**(Normal/Selected+아이콘) · 상단 경로/뒤로 = **Setting/Nav 1216:18731** · 버튼 = **Button 253:10146**.
> - 예외(구조상 표준과 안 맞아 bespoke 허용): 폭 좁은 설정카테고리형 2-depth LNB(자녀보호), absolute 대형 스크롤탑 버튼(맨위로), 포스터 타일 **Module/Thumbnail 571:18266**(정상 컴포넌트, Thumbnail/Item과 용도 다름).

## 패턴 33 (nodeId — 유사 화면이면 복제·치환)

> **언제 쓰나:** 요청 화면이 아래 중 하나와 본질적으로 같으면 그 nodeId를 복제 후 문구·상태 슬롯만 치환. 거버넌스 14종은 슬롯 정의가 `UDS-TV_Pattern_Registry.md`에 있음. 나머지 카탈로그 화면은 해당 도메인 화면을 복제해 문구만 교체.

- **거버넌스(구매·인증·약관·설정 플로우)**: PurchaseAuth 182:11146 · PurchaseOption 524:14152 · BillPayment 515:14947 · FreePassSelect 524:14128 · TermsAgreement 236:10104 · PasswordConfirm 415:14033 · AgeRestriction 55:6907 · AgeViewingUnlock 437:14033 · DailyWatchLimit 184:11149 · ChannelInfoDisplay 95:7184 · ScreenSetting 80:7130 · AutoPowerOff 89:7108 · ChangeProgress 523:14126 · LivetvOption 200:10043
- **실시간TV(편성표·채널·EPG·팝업)**: 전체채널편성표 1011:15800 · 선호채널편집 1012:16078 · 미니EPG 1012:16190 · 편성표_인기채널 1015:16870 · 예약알림팝업 1015:16980 · 자녀보호_성인제한 1015:17054 · 모아보기tv_전체채널 1024:20574
- **플레이어(재생 컨트롤·토스트)**: 플레이어바 1024:21243 · 재생속도 1024:21327 · 장면이동 1024:21479 · 오프닝건너뛰기토스트 1024:21188
- **마이앱/구독/메뉴**: 마이앱 1024:20851 · 마이다운로드_편집 1024:20978 · 마이메뉴/기본 1024:21596 · 나의구독/진입 1024:21118
- **설정/고객지원**: 오디오출력 1024:21829 · 블루투스이어폰 1024:22101 · 고객지원/고객센터안내 1024:21902
- **홈갤러리**: **Google로그인(QR 로그인 안내 팝업) 1344:22369** — 앱/서비스를 휴대폰 **QR·링크·코드**로 로그인 유도하는 안내 팝업이면 이걸 복제. 구조=좌(타이틀 "홈갤러리 with Google Photos" + "Google 로그인" 헤딩 + 안내문 + 닫기 Button) / 우(QR 코드 + 링크 카드 + 코드입력 카드). 슬롯은 Registry의 HomeGalleryGoogleLogin 참고.

## 모듈 18 (setId — 조립 블록)

> **언제 쓰나:** 유사 패턴이 없을 때, 화면의 큰 덩어리(LNB·팝업·그리드·패널)를 이 모듈로 채운다.

공통: MultiTextBox 279:10111 · AgeRangeBar 278:10171 · PopupCommon 544:15145 · Popup/Toast 260:10619 · Popup/List 260:10651 · BottomSheet/Template 260:10699
LNB(배경+헤더+항목): Live/EPGLNB 1105:21022 · Live/CollectLNB 1107:21460 · Setting/LNB 1111:22300(설정 좌측 메뉴, 항목 고정) · Sub/LNBmenu 1109:22109(마이/구독 좌측, 접힘/펼침) · SettingLNB 1189:22483
실시간 패널/그리드/팝업: Live/EPGGrid 1105:21513 · Live/ReservePopup 1107:22105 · Live/NowPlayingDetail 1101:20687 · Live/Preview 1101:20736 · Live/OSD 1104:21048 · Live/MiniEPGInfo 1104:20933 · Live/MiniEPGChannel 1104:21026

## 컴포넌트 52 (setId — 낱개 요소)

> **언제 쓰나:** 패턴·모듈로 못 채운 낱개 컨트롤. 상태(state)·선택(isSelected)·비활성(isDisabled)은 변형 prop으로 설정.

기본 UI: **Button 253:10146**(variant=Basic/Small/Round/Line/Download × state=**default/focused**(+isDisabled). **selected 제거됨**. `hasIcon-start`(bool)+`icon-start`(instance-swap) 아이콘 슬롯 有 → 아이콘색이 `Button/Content` 변수(모드 onDark/onLight)에 물려 **focus 시 흰버튼+어두운 아이콘 자동 반전**, 어떤 아이콘을 swap해도 대응. 스왑 소스 아이콘=Button/ic/delete·top·mobile·skip·connect) · Radio 253:10171 · Toggle 253:10187 · ToggleButton 307:10570 · Checkbox 253:10224 · Dropdown 254:10127 · Stepper 302:10474 · **Scrollbar 276:10124**(position 변형) · Tab 492:15126 · Tag 495:14870 · Text Field 491:14870 · PasswordInput 254:10150 · Image 369:14039 · Indicator 496:14947 · Loading 538:15089 · Primitives 496:14870 · Tooltip/Guide 256:10394 · Detail/Reaction 255:10263 · Detail/Tooltip 256:10290 · RadioRow 257:10466 · IconButton 259:10501 · Thumbnail/Item 255:10172 · Popup/List Item 259:10551
실시간/편성: Live/ChannelEditRow 1103:20881(셀렉=Checkbox) · Live/EPGChannelRow 1167:23623 · Live/EPGProgramRow 1168:23840 · Live/EPGLnbItem 1169:23724 · Live/CollectLnbItem 1169:23852 · Live/GenreBtn 1103:21092 · Live/KeyGuide 1101:20764(=Keynotice 키고지 7키) · Live/TimeAxis 1105:21771 · Livetv/Channel 257:10373 · Livetv/ChannelView 257:10414 · Livetv/Icon 258:10585(arrow/channel setting/mode/player, focus검정·normal흰색) · Livetv/List 258:10464 · Livetv/Mode 257:10330
플레이어: Player/PlayBtn 1040:22840 · Player/ControlTab 1083:22882(focus 아이콘 검정) · Player/SpeedBtn 1057:22944 · Player/SceneCard 1060:22935 · Player/ProgressBar 1040:22846 · Player/Icon 1083:22870
마이앱/구독/설정/메뉴: App/Favorite 1289:22355(Normal검정/Selected노랑 별) · App/Logo 1080:23016 · App/Thumbnail 1080:23080 · Setting/DeviceRow 1131:22318(State=Default/Selected) · **Setting/Nav 1216:18731**(type=Breadcrumb/Back, **포커스 없음** — 상단 경로/뒤로 표시용) · Sub/ProductBtn 1127:22545(prod 5종 × **state=default/focused**, 구독상품 버튼) · Sub/Title 1109:22390(**포커스 없음**, 나의구독 섹션 타이틀) · MyMenu/MenuBtn 1126:22673(btn 5종 × **state=default/focused**, 마이메뉴 상단 버튼) · ProductCard 551:15394(**state=default/focused**, 구독 상품 카드) · LNB/MenuItem 1241:22121(State=Normal/Selected + 아이콘 슬롯, LNB 메뉴 한 줄)

Foundation: Color(`UDS-TV/Color`)/Typography/Spacing + **Button/Content**(icon 색 onDark/onLight 모드). 변수·텍스트스타일은 uds-tv-screen-catalog.json tokens 참고.
