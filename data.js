// ===== 놀자! 먼작귀 설정 파일 =====
// 숫자, 이름, 대사, 아이템 목록을 여기서 바꾸면 게임에 바로 반영돼요.
// 그림 파일은 assets 폴더의 PNG (README 참고).
window.HP_DATA = {
  // ===== 캐릭터 목록 =====
  // name: 이름 (마음대로 바꾸세요), img: assets/pets 안의 그림 (배경 투명 정사각형 PNG, 512x512 추천)
  // 아래 숫자는 그림(512x512) 안의 위치예요. 그림을 바꾸면 위치도 맞춰 주세요 (README 참고).
  //  headTop: 머리 꼭대기 y (모자가 앉는 곳), cx: 머리 가운데 x, headW: 머리 폭
  //  eyes: 두 눈 [x, y], eyeR: 눈 크기 (잘 때 눈 감는 그림에 씀)
  //  neckY: 목 위치 y (옷 윗부분), bodyL/bodyR: 몸 왼쪽/오른쪽 x, bottom: 발바닥 y
  //  color: 몸 색 (잘 때 눈을 덮는 색)
  pets: [
    { id: 'chiikawa', name: '치이카와', avatar: 'chars/chiikawa/avatar.png', poses: [
      { id: 'stand', img: 'chars/chiikawa/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 58, cx: 256, headW: 410, eyes: [[190, 196], [318, 196]], eyeR: 30, neckY: 292, bodyL: 62, bodyR: 452, bottom: 470, footY: 463, color: '#faf8f5', hatTop: 53, earY: 49 },
      { id: 'cheer', img: 'chars/chiikawa/cheer.png', tags: ['mission', 'shop', 'play', 'tap', 'levelup'], outfit: true, closeEyes: true, headTop: 55, cx: 256, headW: 420, eyes: [[205, 198], [318, 196]], eyeR: 29, neckY: 292, bodyL: 62, bodyR: 455, bottom: 470, footY: 480, color: '#ffffff', hatTop: 50, earY: 46 },
      { id: 'happy', img: 'chars/chiikawa/happy.png', tags: ['happy', 'pet', 'greet', 'dress', 'levelup', 'tap'], outfit: true, closeEyes: false, headTop: 46, cx: 256, headW: 373, eyes: [[190, 198], [312, 190]], eyeR: 22, neckY: 334, bodyL: 53, bodyR: 459, bottom: 498, footY: 448, color: '#ffffff', hatTop: 51, earY: 46 },
      { id: 'sit', img: 'chars/chiikawa/sit.png', tags: ['idle', 'eat', 'hungry', 'sad', 'tap'], outfit: true, closeEyes: true, headTop: 44, cx: 256, headW: 437, eyes: [[166, 230], [298, 233]], eyeR: 25, neckY: 332, bodyL: 18, bodyR: 494, bottom: 498, footY: 448, color: '#fefefe', hatTop: 49, earY: 44 },
      { id: 'lie', img: 'chars/chiikawa/lie.png', tags: ['sleep', 'pet', 'sad'], outfit: false, closeEyes: false, headTop: 52, cx: 256, headW: 387, eyes: [[184, 199], [259, 220]], eyeR: 16, neckY: 319, bodyL: 46, bodyR: 467, bottom: 498, footY: 448, color: '#fdfdfd', hatTop: 76, earY: 70 },
    ] },
    { id: 'hachiware', name: '하치와레', avatar: 'chars/hachiware/avatar.png', poses: [
      { id: 'stand', img: 'chars/hachiware/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 28, cx: 255, headW: 357, eyes: [[188, 217], [303, 229]], eyeR: 25, neckY: 327, bodyL: 61, bodyR: 450, bottom: 498, footY: 455, color: '#ffffff', hatTop: 67, earY: 58 },
      { id: 'cheer', img: 'chars/hachiware/cheer.png', tags: ['mission', 'shop', 'play', 'tap', 'levelup'], outfit: true, closeEyes: true, headTop: 72, cx: 262, headW: 400, eyes: [[195, 222], [318, 230]], eyeR: 27, neckY: 302, bodyL: 72, bodyR: 455, bottom: 470, footY: 470, color: '#fdfdfd', hatTop: 70, earY: 65 },
      { id: 'sit', img: 'chars/hachiware/sit.png', tags: ['idle', 'eat', 'hungry', 'sad', 'tap'], outfit: true, closeEyes: true, headTop: 33, cx: 256, headW: 412, eyes: [[169, 251], [290, 255]], eyeR: 25, neckY: 346, bodyL: 32, bodyR: 480, bottom: 498, footY: 446, color: '#fefefe', hatTop: 67, earY: 53 },
      { id: 'lie', img: 'chars/hachiware/lie.png', tags: ['sleep', 'pet', 'sad'], outfit: false, closeEyes: false, headTop: 39, cx: 263, headW: 401, eyes: [[143, 122], [366, 126]], eyeR: 29, neckY: 266, bodyL: 45, bodyR: 481, bottom: 498, footY: 447, color: '#ffffff', hatTop: 94, earY: 68 },
    ] },
    { id: 'usagi', name: '우사기', avatar: 'chars/usagi/avatar.png', poses: [
      { id: 'stand', img: 'chars/usagi/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 34, cx: 255, headW: 296, eyes: [[210, 265], [300, 258]], eyeR: 16, neckY: 324, bodyL: 94, bodyR: 416, bottom: 498, footY: 466, color: '#f9ecc9', hatTop: 158, earY: 149 },
      { id: 'sit', img: 'chars/usagi/sit.png', tags: ['idle', 'eat', 'hungry', 'sad', 'tap'], outfit: true, closeEyes: true, headTop: 70, cx: 256, headW: 329, eyes: [[188, 300], [283, 300]], eyeR: 16, neckY: 350, bodyL: 77, bodyR: 435, bottom: 498, footY: 450, color: '#fdefcc', hatTop: 181, earY: 173 },
      { id: 'lie', img: 'chars/usagi/lie.png', tags: ['sleep', 'pet', 'sad'], outfit: false, closeEyes: false, headTop: 169, cx: 247, headW: 270, eyes: [[224, 250], [294, 290]], eyeR: 14, neckY: 374, bodyL: 100, bodyR: 394, bottom: 498, footY: 461, color: '#fff7d1', hatTop: 169, earY: 107 },
    ] },
    { id: 'momonga', name: '모몽가', avatar: 'chars/momonga/avatar.png', poses: [
      { id: 'stand', img: 'chars/momonga/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 130, cx: 212, headW: 300, eyes: [[156, 232], [270, 232]], eyeR: 30, neckY: 312, bodyL: 72, bodyR: 345, bottom: 470, footY: 456, color: '#fbfaf8', hatTop: 125, earY: 121 },
      { id: 'lie', img: 'chars/momonga/lie.png', tags: ['sleep', 'pet', 'sad', 'hungry'], outfit: false, closeEyes: false, headTop: 48, cx: 268, headW: 370, eyes: [[188, 350], [308, 380]], eyeR: 24, neckY: 331, bodyL: 67, bodyR: 470, bottom: 498, footY: 448, color: '#ffffff', hatTop: 134, earY: 105 },
    ] },
    { id: 'kurimanju', name: '쿠리만쥬', avatar: 'chars/kurimanju/avatar.png', poses: [
      { id: 'stand', img: 'chars/kurimanju/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 29, cx: 229, headW: 386, eyes: [[195, 222], [298, 212]], eyeR: 16, neckY: 341, bodyL: 19, bodyR: 439, bottom: 498, footY: 477, color: '#ffdfb8', hatTop: 56, earY: 41 },
    ] },
    { id: 'rakko', name: '랏코', avatar: 'chars/rakko/avatar.png', poses: [
      { id: 'stand', img: 'chars/rakko/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 181, cx: 256, headW: 408, eyes: [[200, 205], [290, 200]], eyeR: 16, neckY: 372, bodyL: 34, bodyR: 478, bottom: 498, footY: 468, color: '#fff2d8', hatTop: 203, earY: 197 },
    ] },
    { id: 'shisa', name: '시사', avatar: 'chars/shisa/avatar.png', poses: [
      { id: 'stand', img: 'chars/shisa/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 84, cx: 258, headW: 417, eyes: [[188, 260], [308, 250]], eyeR: 26, neckY: 352, bodyL: 31, bodyR: 485, bottom: 498, footY: 480, color: '#fef7da', hatTop: 95, earY: 90 },
    ] },
    { id: 'furuhonya', name: '후루혼야', avatar: 'chars/furuhonya/avatar.png', poses: [
      { id: 'stand', img: 'chars/furuhonya/stand.png', tags: ['walk', 'idle', 'greet', 'tap'], outfit: true, closeEyes: true, headTop: 95, cx: 279, headW: 324, eyes: [[212, 306], [306, 286]], eyeR: 17, neckY: 372, bodyL: 103, bodyR: 456, bottom: 498, footY: 482, color: '#fdeae3', hatTop: 106, earY: 85 },
    ] },
  ],

  pet: {
    walkSpeed: 0.28,          // 1초에 놀이 공간 폭의 몇 배만큼 걷는지
    sizeRatio: 0.58,          // 놀이 공간 대비 캐릭터 크기
    hungerDecayPerHour: 6,    // 배부름이 1시간에 줄어드는 양 (0~100)
    moodDecayPerHour: 4,      // 기분이 1시간에 줄어드는 양 (배고프면 2배)
    offlineDecayMultiplier: 0.5, // 앱이 꺼져 있을 때는 절반 속도
    maxOfflineHours: 48,      // 아무리 오래 꺼 둬도 최대 48시간까지만 계산
    levelThresholds: [0, 20, 60, 120, 200, 320, 480, 700],
    levelNames: ['처음 만남', '아는 사이', '친구', '좋은 친구', '단짝', '베스트 프렌드', '소울메이트', '영원한 짝꿍'],
    levelUpRewardPerLevel: 20, // 레벨업 보상 코인 = 이 값 x 새 레벨
    dailyPetAffectionCap: 30,  // 쓰다듬기로 하루에 얻는 호감도 최대
    sleepStartHour: 23,
    sleepEndHour: 7,
  },
  startingCoins: 50,
  startingCookies: 2,
  // 옷 입은 모습 그림 (참고 그림에서 잘라 냄): 이 캐릭터가 이 옷(+모자)을 입으면 이 그림을 통째로 써요
  dress: [
    { char: 'hachiware', clothes: 'co_raincoat', hat: null, img: 'chars/hachiware/dress_co_raincoat.png', headTop: 24, hatTop: 75, earY: 50, cx: 244, headW: 438, eyes: [[188,  258],  [300,  262]], eyeR: 22, neckY: 374, bodyL: 91, bodyR: 458, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_apron', hat: 'hat_chefhat', img: 'chars/chiikawa/dress_cl_apron.png', headTop: 24, hatTop: 67, earY: 45, cx: 233, headW: 379, eyes: [[182,  275],  [284,  277]], eyeR: 20, neckY: 405, bodyL: 119, bodyR: 411, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_pajamas', hat: null, img: 'chars/usagi/dress_cl_pajamas.png', headTop: 23, hatTop: 173, earY: 166, cx: 236, headW: 342, eyes: [[190,  288],  [282,  290]], eyeR: 17, neckY: 360, bodyL: 103, bodyR: 412, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_hanbok', hat: null, img: 'chars/hachiware/dress_cl_hanbok.png', headTop: 24, hatTop: 60, earY: 46, cx: 234, headW: 387, eyes: [[182,  220],  [286,  223]], eyeR: 21, neckY: 321, bodyL: 93, bodyR: 434, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_kimono', hat: null, img: 'chars/chiikawa/dress_cl_kimono.png', headTop: 24, hatTop: 41, earY: 36, cx: 230, headW: 425, eyes: [[173,  206],  [288,  208]], eyeR: 22, neckY: 309, bodyL: 81, bodyR: 431, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_sundress', hat: 'hat_strawhat', img: 'chars/usagi/dress_cl_sundress.png', headTop: 23, hatTop: 124, earY: 114, cx: 212, headW: 366, eyes: [[169,  267],  [255,  269]], eyeR: 16, neckY: 357, bodyL: 90, bodyR: 367, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_reindeer', hat: null, img: 'chars/hachiware/dress_cl_reindeer.png', headTop: 24, hatTop: 61, earY: 47, cx: 232, headW: 397, eyes: [[179,  224],  [286,  228]], eyeR: 21, neckY: 328, bodyL: 104, bodyR: 439, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_santa', hat: null, img: 'chars/chiikawa/dress_cl_santa.png', headTop: 24, hatTop: 40, earY: 36, cx: 230, headW: 425, eyes: [[173,  206],  [288,  208]], eyeR: 22, neckY: 310, bodyL: 86, bodyR: 430, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_elf', hat: null, img: 'chars/usagi/dress_cl_elf.png', headTop: 23, hatTop: 163, earY: 156, cx: 238, headW: 325, eyes: [[194,  271],  [282,  273]], eyeR: 16, neckY: 339, bodyL: 114, bodyR: 404, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_wizardrobe', hat: 'hat_wizardhat', img: 'chars/hachiware/dress_cl_wizardrobe.png', headTop: 24, hatTop: 72, earY: 49, cx: 240, headW: 361, eyes: [[190,  286],  [291,  289]], eyeR: 20, neckY: 421, bodyL: 80, bodyR: 436, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'co_ghost', hat: null, img: 'chars/chiikawa/dress_co_ghost.png', headTop: 24, hatTop: 40, earY: 35, cx: 240, headW: 480, eyes: [[177,  227],  [304,  230]], eyeR: 24, neckY: 345, bodyL: 16, bodyR: 495, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'co_pumpkin', hat: null, img: 'chars/usagi/dress_co_pumpkin.png', headTop: 23, hatTop: 108, earY: 88, cx: 224, headW: 355, eyes: [[177,  294],  [272,  296]], eyeR: 18, neckY: 410, bodyL: 62, bodyR: 421, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_swimsuit', hat: null, img: 'chars/hachiware/dress_cl_swimsuit.png', headTop: 24, hatTop: 64, earY: 49, cx: 232, headW: 409, eyes: [[177,  233],  [287,  237]], eyeR: 22, neckY: 341, bodyL: 83, bodyR: 446, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_beachshirt', hat: null, img: 'chars/chiikawa/dress_cl_beachshirt.png', headTop: 24, hatTop: 41, earY: 37, cx: 230, headW: 441, eyes: [[170,  213],  [289,  215]], eyeR: 22, neckY: 321, bodyL: 72, bodyR: 438, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_duckshorts', hat: null, img: 'chars/usagi/dress_cl_duckshorts.png', headTop: 23, hatTop: 168, earY: 160, cx: 237, headW: 331, eyes: [[192,  278],  [282,  281]], eyeR: 17, neckY: 348, bodyL: 108, bodyR: 404, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_police', hat: 'hat_policehat', img: 'chars/hachiware/dress_cl_police.png', headTop: 24, hatTop: 53, earY: 41, cx: 233, headW: 413, eyes: [[178,  248],  [288,  252]], eyeR: 22, neckY: 372, bodyL: 117, bodyR: 443, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_doctor', hat: null, img: 'chars/chiikawa/dress_cl_doctor.png', headTop: 24, hatTop: 43, earY: 39, cx: 229, headW: 457, eyes: [[167,  221],  [291,  223]], eyeR: 23, neckY: 332, bodyL: 64, bodyR: 443, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_firefighter', hat: 'hat_firehat', img: 'chars/usagi/dress_cl_firefighter.png', headTop: 23, hatTop: 152, earY: 141, cx: 231, headW: 357, eyes: [[184,  288],  [278,  290]], eyeR: 17, neckY: 373, bodyL: 107, bodyR: 399, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_kingrobe', hat: 'hat_crown', img: 'chars/hachiware/dress_cl_kingrobe.png', headTop: 24, hatTop: 64, earY: 61, cx: 234, headW: 378, eyes: [[183,  261],  [285,  265]], eyeR: 20, neckY: 386, bodyL: 76, bodyR: 435, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_princess', hat: 'hat_tiara', img: 'chars/chiikawa/dress_cl_princess.png', headTop: 24, hatTop: 86, earY: 78, cx: 232, headW: 388, eyes: [[180,  250],  [285,  252]], eyeR: 20, neckY: 353, bodyL: 87, bodyR: 428, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_knight', hat: null, img: 'chars/usagi/dress_cl_knight.png', headTop: 23, hatTop: 170, earY: 163, cx: 236, headW: 335, eyes: [[191,  281],  [282,  284]], eyeR: 17, neckY: 352, bodyL: 107, bodyR: 404, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'co_cathood', hat: null, img: 'chars/hachiware/dress_co_cathood.png', headTop: 24, hatTop: 54, earY: 42, cx: 238, headW: 440, eyes: [[181,  244],  [294,  248]], eyeR: 22, neckY: 365, bodyL: 98, bodyR: 466, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'co_bearhood', hat: null, img: 'chars/chiikawa/dress_co_bearhood.png', headTop: 24, hatTop: 49, earY: 34, cx: 227, headW: 425, eyes: [[170,  241],  [284,  243]], eyeR: 22, neckY: 361, bodyL: 69, bodyR: 440, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'co_carrotcape', hat: null, img: 'chars/usagi/dress_co_carrotcape.png', headTop: 23, hatTop: 106, earY: 81, cx: 227, headW: 347, eyes: [[181,  286],  [273,  288]], eyeR: 17, neckY: 399, bodyL: 85, bodyR: 432, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'co_astronaut', hat: null, img: 'chars/hachiware/dress_co_astronaut.png', headTop: 24, hatTop: 50, earY: 36, cx: 238, headW: 439, eyes: [[180,  225],  [296,  229]], eyeR: 23, neckY: 336, bodyL: 95, bodyR: 438, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_sailorsuit', hat: 'hat_captainhat', img: 'chars/chiikawa/dress_cl_sailorsuit.png', headTop: 24, hatTop: 43, earY: 39, cx: 233, headW: 398, eyes: [[177,  231],  [289,  233]], eyeR: 21, neckY: 349, bodyL: 101, bodyR: 428, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'co_pilot', hat: null, img: 'chars/usagi/dress_co_pilot.png', headTop: 23, hatTop: 151, earY: 142, cx: 234, headW: 331, eyes: [[189,  282],  [279,  284]], eyeR: 16, neckY: 364, bodyL: 124, bodyR: 400, bottom: 496, footY: 0 },
    { char: 'hachiware', clothes: 'cl_uniform', hat: null, img: 'chars/hachiware/dress_cl_uniform.png', headTop: 24, hatTop: 65, earY: 49, cx: 232, headW: 417, eyes: [[175,  236],  [288,  240]], eyeR: 23, neckY: 345, bodyL: 88, bodyR: 447, bottom: 495, footY: 0 },
    { char: 'chiikawa', clothes: 'cl_cardigan', hat: null, img: 'chars/chiikawa/dress_cl_cardigan.png', headTop: 24, hatTop: 41, earY: 37, cx: 228, headW: 450, eyes: [[168,  216],  [289,  218]], eyeR: 23, neckY: 326, bodyL: 69, bodyR: 440, bottom: 495, footY: 0 },
    { char: 'usagi', clothes: 'cl_smock', hat: null, img: 'chars/usagi/dress_cl_smock.png', headTop: 23, hatTop: 172, earY: 165, cx: 237, headW: 334, eyes: [[192,  282],  [282,  284]], eyeR: 17, neckY: 351, bodyL: 106, bodyR: 405, bottom: 496, footY: 0 },
  ],
  // 옷 맞춤 보정표: 캐릭터별(all) · 포즈별. body=옷, hood=코스튬, hat=모자
  //   w/h: 폭·높이 배율, dx/dy: 위치(512 그림 기준 픽셀), s: 코스튬 크기, len: 코스튬 길이, top: 모자 얹는 머리 꼭대기 y
  //   mode: 'hat' = 이 포즈에선 모자만, 'none' = 아무것도 안 입히기
  fit: {
    usagi: { ears: true, all: { hat: { dy: 40, w: 1.2 } }, stand: { hat: { dy: 34, w: 1.32 } } },                 // 귀가 모자 위로 나오기 (참고 그림처럼)
    kurimanju: { front: [[380, 255, 500, 395]] },
    rakko: { all: { mode: 'hat' } },      // 누워 있는 그림이라 옷은 숨기고 모자만
    shisa: { front: [[120, 360, 380, 492]], all: { body: { w: 1.35 } } },   // 쟁반 옆으로 옷이 보이게 넓게
    furuhonya: { front: [[170, 345, 392, 455], [10, 385, 145, 500]], all: { body: { w: 1.4 } } },
  },
  miniGameSeconds: 25,   // 간식 받기·까꿍 놀이 시간(초)

  // 그림 파일 경로 (assets 폴더 기준)
  art: {
    coin: 'ui/ui_coin.png', heart: 'ui/ui_heart.png', star: 'ui/ui_star.png',
  },

  // category: hat(모자) / clothes(옷) / acc(장신구) / skin(몸 색깔)
  // img: 캐릭터 위에 겹치는 그림 (512x512 투명 PNG, 예전 기본 곰 위치 기준으로 그림)
  //   → 게임이 캐릭터마다 머리/눈/몸 위치에 맞춰 자동으로 옮겨 줘요.
  // anchor: 어디에 맞출지 (head: 머리, eyes: 눈, body: 몸). 안 쓰면 모자=head, 장신구=eyes, 옷=body
  // skin은 tint(색) + 아이콘
  items: [
    { id: 'hat_chefhat', name: '요리사 모자', desc: '오늘의 요리사!', category: 'hat', price: 60, img: 'items/o_chefhat.png', type: 'hat', w: 94, h: 74, hw: 0.46, hy: 0.14 },
    { id: 'hat_strawhat', name: '밀짚모자', desc: '햇살 좋은 날 산책용', category: 'hat', price: 60, img: 'items/o_strawhat.png', type: 'hat', w: 164, h: 104, hw: 0.95, hy: 0.42, hdx: -0.07 },
    { id: 'hat_captainhat', name: '선장 모자', desc: '출항 준비 완료!', category: 'hat', price: 80, img: 'items/o_captainhat.png', type: 'hat', w: 160, h: 74, hw: 0.64, hy: 0.2 },
    { id: 'hat_wizardhat', name: '마법사 모자', desc: '반짝반짝 별 마법', category: 'hat', price: 90, img: 'items/o_wizardhat.png', type: 'hat', w: 153, h: 116, hw: 0.8, hy: 0.24 },
    { id: 'hat_policehat', name: '경찰 모자', desc: '삐뽀삐뽀 출동!', category: 'hat', price: 80, img: 'items/o_policehat.png', type: 'hat', w: 142, h: 82, hw: 0.66, hy: 0.22 },
    { id: 'hat_firehat', name: '소방관 헬멧', desc: '불 끄러 갑니다', category: 'hat', price: 90, img: 'items/o_firehat.png', type: 'hat', w: 159, h: 98, hw: 0.74, hy: 0.24 },
    { id: 'hat_crown', name: '왕관', desc: '오늘은 내가 임금님', category: 'hat', price: 150, img: 'items/o_crown.png', type: 'hat', w: 80, h: 51, hw: 0.36, hy: 0.06 },
    { id: 'hat_tiara', name: '티아라', desc: '반짝이는 공주님 티아라', category: 'hat', price: 150, img: 'items/o_tiara.png', type: 'hat', w: 91, h: 52, hw: 0.4, hy: 0.08 },
    { id: 'hat_cap', name: '야구 모자', desc: '홈런 치러 가자', category: 'hat', price: 60, img: 'items/o_cap.png', type: 'hat', w: 128, h: 80, hw: 0.68, hy: 0.24 },
    { id: 'cl_sailor', name: '세일러 원피스', desc: '노란 리본 세일러복', category: 'clothes', price: 120, img: 'items/o_sailor.png', type: 'body', w: 360, h: 309 },
    { id: 'cl_sweater', name: '분홍 니트', desc: '빨간 스카프 포인트', category: 'clothes', price: 90, img: 'items/o_sweater.png', type: 'body', w: 360, h: 249 },
    { id: 'cl_overalls', name: '당근 멜빵바지', desc: '주머니에 당근 하나', category: 'clothes', price: 100, img: 'items/o_overalls.png', type: 'body', w: 281, h: 360 },
    { id: 'cl_apron', name: '앞치마', desc: '요리할 때 필수', category: 'clothes', price: 70, img: 'items/o_apron.png', type: 'body', w: 149, h: 189 },
    { id: 'cl_pajamas', name: '딸기 잠옷', desc: '꿀잠 보장 잠옷', category: 'clothes', price: 90, img: 'items/o_pajamas.png', type: 'body', w: 175, h: 221 },
    { id: 'cl_hanbok', name: '한복', desc: '설날에 입는 고운 한복', category: 'clothes', price: 150, img: 'items/o_hanbok.png', type: 'body', w: 176, h: 208 },
    { id: 'cl_kimono', name: '꽃 유카타', desc: '여름 축제 갈 때', category: 'clothes', price: 130, img: 'items/o_kimono.png', type: 'body', w: 159, h: 213 },
    { id: 'cl_sundress', name: '꽃 원피스', desc: '노란 꽃무늬 원피스', category: 'clothes', price: 110, img: 'items/o_sundress.png', type: 'body', w: 188, h: 166 },
    { id: 'cl_sailorsuit', name: '마린 세일러복', desc: '파란 닻 무늬', category: 'clothes', price: 120, img: 'items/o_sailorsuit.png', type: 'body', w: 172, h: 154 },
    { id: 'cl_reindeer', name: '루돌프 스웨터', desc: '크리스마스 스웨터', category: 'clothes', price: 100, img: 'items/o_reindeer.png', type: 'body', w: 253, h: 195 },
    { id: 'cl_santa', name: '산타 코트', desc: '선물 배달 갑니다', category: 'clothes', price: 140, img: 'items/o_santa.png', type: 'body', w: 250, h: 216 },
    { id: 'cl_elf', name: '요정 옷', desc: '방울이 딸랑딸랑', category: 'clothes', price: 120, img: 'items/o_elf.png', type: 'body', w: 256, h: 195 },
    { id: 'cl_uniform', name: '교복', desc: '단정한 학생 교복', category: 'clothes', price: 110, img: 'items/o_uniform.png', type: 'body', w: 164, h: 157 },
    { id: 'cl_cardigan', name: '분홍 가디건', desc: '체크 치마 세트', category: 'clothes', price: 90, img: 'items/o_cardigan.png', type: 'body', w: 170, h: 153 },
    { id: 'cl_smock', name: '유치원 원복', desc: '이름표도 달았어요', category: 'clothes', price: 80, img: 'items/o_smock.png', type: 'body', w: 175, h: 154 },
    { id: 'cl_wizardrobe', name: '마법사 망토', desc: '별이 쏟아지는 망토', category: 'clothes', price: 130, img: 'items/o_wizardrobe.png', type: 'body', w: 168, h: 148 },
    { id: 'cl_swimsuit', name: '수영복+튜브', desc: '물놀이 준비 끝', category: 'clothes', price: 90, img: 'items/o_swimsuit.png', type: 'body', w: 169, h: 184 },
    { id: 'cl_beachshirt', name: '바캉스 셔츠', desc: '선글라스는 덤', category: 'clothes', price: 80, img: 'items/o_beachshirt.png', type: 'body', w: 174, h: 180 },
    { id: 'cl_duckshorts', name: '오리 반바지', desc: '오리 무늬 반바지', category: 'clothes', price: 60, img: 'items/o_duckshorts.png', type: 'bottom', w: 171, h: 140 },
    { id: 'cl_police', name: '경찰복', desc: '정의의 경찰관', category: 'clothes', price: 120, img: 'items/o_police.png', type: 'body', w: 166, h: 170 },
    { id: 'cl_doctor', name: '의사 가운', desc: '청진기로 진찰해요', category: 'clothes', price: 120, img: 'items/o_doctor.png', type: 'body', w: 168, h: 193 },
    { id: 'cl_firefighter', name: '소방복', desc: '용감한 소방관', category: 'clothes', price: 130, img: 'items/o_firefighter.png', type: 'body', w: 177, h: 171 },
    { id: 'cl_kingrobe', name: '임금님 망토', desc: '폭신한 털 망토', category: 'clothes', price: 160, img: 'items/o_kingrobe.png', type: 'body', w: 162, h: 179 },
    { id: 'cl_princess', name: '공주 드레스', desc: '하얀 레이스 드레스', category: 'clothes', price: 180, img: 'items/o_princess.png', type: 'body', w: 208, h: 212 },
    { id: 'cl_knight', name: '기사 갑옷', desc: '사자 문양 갑옷', category: 'clothes', price: 160, img: 'items/o_knight.png', type: 'body', w: 157, h: 166 },
    { id: 'cl_baseball', name: '야구복', desc: '파란 야구 유니폼', category: 'clothes', price: 110, img: 'items/o_baseball.png', type: 'body', w: 164, h: 172 },
    { id: 'cl_taekwondo', name: '태권도복', desc: '검은 띠 도복', category: 'clothes', price: 110, img: 'items/o_taekwondo.png', type: 'body', w: 160, h: 192 },
    { id: 'cl_soccer', name: '축구복', desc: '등번호 10번', category: 'clothes', price: 100, img: 'items/o_soccer.png', type: 'body', w: 163, h: 190 },
    { id: 'co_raincoat', name: '노란 모자 우비', desc: '비 오는 날에도 신나게', category: 'clothes', group: 'costume', price: 110, img: 'items/o_raincoat.png', type: 'hood', w: 180, h: 246, hole: [88, 78, 55, 36], hw: 176, hs: 1, htop: 0 },
    { id: 'co_cathood', name: '고양이 후드', desc: '귀 달린 고양이 후드', category: 'clothes', group: 'costume', price: 130, img: 'items/o_cathood.png', type: 'hood', w: 222, h: 250, hole: [114, 80, 66, 40], hw: 190, hs: 1, htop: 26 },
    { id: 'co_bearhood', name: '곰돌이 털옷', desc: '포근포근 곰돌이', category: 'clothes', group: 'costume', price: 140, img: 'items/o_bearhood.png', type: 'hood', w: 232, h: 254, hole: [118, 92, 58, 37], hw: 200, hs: 1, htop: 24 },
    { id: 'co_carrotcape', name: '당근 망토', desc: '당근 모자 망토', category: 'clothes', group: 'costume', price: 120, img: 'items/o_carrotcape.png', type: 'hood', w: 230, h: 228, hole: [112, 82, 58, 30], hw: 168, hs: 1, htop: 30 },
    { id: 'co_astronaut', name: '우주복', desc: '우주로 출발!', category: 'clothes', group: 'costume', price: 200, img: 'items/o_astronaut.png', type: 'hood', w: 172, h: 248, hole: [83, 62, 54, 38], hw: 150, hs: 1, htop: 0 },
    { id: 'co_pilot', name: '토끼 비행복', desc: '고글 쓴 비행사', category: 'clothes', group: 'costume', price: 180, img: 'items/o_pilot.png', type: 'hood', w: 176, h: 303, hole: [82, 130, 38, 31], hw: 150, hs: 0.85, htop: 70 },
    { id: 'co_ghost', name: '유령 옷', desc: '하나도 안 무서운 유령', category: 'clothes', group: 'costume', price: 100, img: 'items/o_ghost.png', type: 'hood', w: 160, h: 209, hole: [80, 52, 46, 32], hw: 130, hs: 1, htop: 0 },
    { id: 'co_pumpkin', name: '호박 옷', desc: '할로윈 호박', category: 'clothes', group: 'costume', price: 120, img: 'items/o_pumpkin.png', type: 'hood', w: 165, h: 246, hole: [77, 80, 45, 26], hw: 150, hs: 1, htop: 36 },
    { id: 'set_police', name: '경찰 세트', desc: '경찰 모자 + 경찰복', category: 'set', price: 180, img: 'items/o_police.png', set: ['hat_policehat', 'cl_police'] },
    { id: 'set_fire', name: '소방관 세트', desc: '소방관 헬멧 + 소방복', category: 'set', price: 200, img: 'items/o_firefighter.png', set: ['hat_firehat', 'cl_firefighter'] },
    { id: 'set_captain', name: '선장 세트', desc: '선장 모자 + 마린 세일러복', category: 'set', price: 180, img: 'items/o_sailorsuit.png', set: ['hat_captainhat', 'cl_sailorsuit'] },
    { id: 'set_wizard', name: '마법사 세트', desc: '마법사 모자 + 마법사 망토', category: 'set', price: 200, img: 'items/o_wizardrobe.png', set: ['hat_wizardhat', 'cl_wizardrobe'] },
    { id: 'set_king', name: '임금님 세트', desc: '왕관 + 임금님 망토', category: 'set', price: 280, img: 'items/o_kingrobe.png', set: ['hat_crown', 'cl_kingrobe'] },
    { id: 'set_princess', name: '공주 세트', desc: '티아라 + 공주 드레스', category: 'set', price: 300, img: 'items/o_princess.png', set: ['hat_tiara', 'cl_princess'] },
    { id: 'set_chef', name: '요리사 세트', desc: '요리사 모자 + 앞치마', category: 'set', price: 115, img: 'items/o_apron.png', set: ['hat_chefhat', 'cl_apron'] },
    { id: 'set_baseball', name: '야구 세트', desc: '야구 모자 + 야구복', category: 'set', price: 150, img: 'items/o_baseball.png', set: ['hat_cap', 'cl_baseball'] },
    { id: 'set_summer', name: '여름 나들이 세트', desc: '밀짚모자 + 꽃 원피스', category: 'set', price: 150, img: 'items/o_sundress.png', set: ['hat_strawhat', 'cl_sundress'] },
    { id: 'skin_white', name: '기본 하양', desc: '원래 색', category: 'skin', price: 0, owned: true, tint: '#ffffff', img: 'items/skin_white.png' },
    { id: 'skin_peach', name: '복숭아색', desc: '말랑말랑 복숭아', category: 'skin', price: 70, tint: '#ffd6c2', img: 'items/skin_peach.png' },
    { id: 'skin_mint', name: '민트색', desc: '상큼한 민트', category: 'skin', price: 70, tint: '#bdf2db', img: 'items/skin_mint.png' },
    { id: 'skin_sky', name: '하늘색', desc: '맑은 하늘 같은 색', category: 'skin', price: 90, tint: '#bfddff', img: 'items/skin_sky.png' },
  ],

  // hunger: 배부름, mood: 기분, aff: 호감도
  snacks: [
    { id: 'snack_cookie', name: '쿠키', price: 10, hunger: 15, mood: 5, aff: 3, img: 'snacks/snack_cookie.png' },
    { id: 'snack_pudding', name: '푸딩', price: 20, hunger: 25, mood: 8, aff: 6, img: 'snacks/snack_pudding.png' },
    { id: 'snack_onigiri', name: '주먹밥', price: 25, hunger: 40, mood: 4, aff: 4, img: 'snacks/snack_onigiri.png' },
    { id: 'snack_cake', name: '딸기 케이크', price: 50, hunger: 30, mood: 20, aff: 15, img: 'snacks/snack_cake.png' },
  ],

  // type: login / pet / tap / feed / play(아무 놀이) / score(간식 받기 점수) / memory(짝 맞추기 성공) / dress / buy
  missions: [
    { id: 'm_login', title: '오늘 접속하기', type: 'login', target: 1, coins: 10 },
    { id: 'm_pet', title: '5번 쓰다듬어 주기', type: 'pet', target: 5, coins: 20 },
    { id: 'm_tap', title: '10번 톡톡 터치하기', type: 'tap', target: 10, coins: 15 },
    { id: 'm_feed', title: '간식 1번 주기', type: 'feed', target: 1, coins: 15, snack: 'snack_cookie', snackCount: 1 },
    { id: 'm_game', title: '놀이 3판 하기', type: 'play', target: 3, coins: 25 },
    { id: 'm_score', title: '간식 받기 20점 넘기', type: 'score', target: 20, coins: 30, snack: 'snack_pudding', snackCount: 1 },
    { id: 'm_memory', title: '얼굴 짝 맞추기 성공하기', type: 'memory', target: 1, coins: 20 },
    { id: 'm_dress', title: '옷 갈아입혀 주기', type: 'dress', target: 1, coins: 10 },
  ],

  // 캐릭터별 대사 (없는 종류는 아래 공통 대사 lines 를 써요)
  // 종류: greet 인사, tap 톡, pet 쓰다듬기, happy 기쁨, hungry 배고픔, sad 심심/우울, idle 혼잣말, sleep 잠,
  //       eat 간식 먹기, full 배부름, shop 선물(구매), mission 미션 완료, dress 새 옷, levelup 레벨업,
  //       win 놀이 잘함, lose 놀이 못함, shy 아직 안 친할 때(호감도 낮음)
  petLines: {
    chiikawa: {
      greet: ['와…!', '하아~ 왔다…!', '…!! (반가워)'],
      tap: ['와… 와…', '…으?', '에…?', '하아~'],
      pet: ['하아~…', '헤헤…', '와아…'],
      happy: ['와아~!', '헤헤…!', '와… 와…!'],
      hungry: ['배… 고파…', '꼬르륵…', '으으…'],
      sad: ['흐에…', '훌쩍…', '…(울먹울먹)'],
      idle: ['와…', '…(두리번두리번)', '하아~', '오늘도… 힘내자…!'],
      sleep: ['쿠울…', '음냐…'],
      eat: ['와…! 맛있어…', '냠… 냠…', '우와아…'],
      full: ['배… 불러…', '이제… 못 먹어…'],
      shop: ['와…! 이거…?', '고, 고마워…'],
      mission: ['해냈다…!', '와… 해냈어…!'],
      dress: ['어, 어울려…?', '…헤헤 (부끄)'],
      levelup: ['더… 친해졌다…!', '와아…!'],
      win: ['해, 해냈다…!!', '와… 와아…!'],
      lose: ['흐에에…', '훌쩍… 그래도… 다음엔 할 수 있어…!'],
      shy: ['…(쭈뼛쭈뼛)', '아, 안녕…'],
    },
    hachiware: {
      greet: ['안녕! 오늘도 같이 놀자~', '어서 와! 기다렸어!'],
      tap: ['응? 불렀어?', '헤헤, 간지러워~', '마음이 두 개 있어~', '어떻게든 돼라!'],
      pet: ['헤헤, 기분 좋다~', '고마워! 더 해 줘도 돼~'],
      happy: ['최고야!', '문짝은 없지만 하늘이 예뻐서 문 달 생각 없지!', '오늘 기분 짱이야~'],
      hungry: ['배고프다~ 뭐 먹을까?', '맛있는 거 먹고 싶다~'],
      sad: ['괜찮아, 어떻게든 될 거야…', '조금 쓸쓸하네…'],
      idle: ['어떻게든 돼라!', '마음이 두 개 있어~', '오늘 하늘 예쁘다~', '노래 부를까? 랄랄라~'],
      sleep: ['쿨쿨…', '음냐… 내일도 놀자…'],
      eat: ['우와, 맛있다!', '고마워! 잘 먹을게~'],
      full: ['배불러~ 이따 또 먹자!'],
      shop: ['우와, 이거 갖고 싶었어!', '고마워! 소중히 할게~'],
      mission: ['해냈다! 우리 대단해!', '역시 하면 된다니까~'],
      dress: ['어때? 잘 어울려?', '새 옷 신난다~'],
      levelup: ['우리 더 친해졌네! 기쁘다~'],
      win: ['해냈다! 최고야!', '역시 어떻게든 됐잖아!'],
      lose: ['괜찮아! 다음엔 어떻게든 될 거야!', '아깝다~ 한 판 더?'],
      shy: ['안녕! 나는 하치와레야. 친하게 지내자!'],
    },
    usagi: {
      greet: ['야하!!!!', '하?', '야하~!'],
      tap: ['하?', '야하!!!!', '후와~앙…', '야!'],
      pet: ['야하~', '후와~앙…', '하?!'],
      happy: ['야하!!!!', '야하야하!!', '우라!'],
      hungry: ['하굿…?', '후와~앙…', '하??'],
      sad: ['후와~앙…', '하…'],
      idle: ['야하!!!!', '하?', '우라~!', '…야하.'],
      sleep: ['쿠-…', 'Zzz…'],
      eat: ['우마!', '하굿! 하굿!', '우마~!!'],
      full: ['하?', '우마… (배부름)'],
      shop: ['야하!!!!', '하?!'],
      mission: ['야하!!!!', '우라!!!'],
      dress: ['야하~!', '하?'],
      levelup: ['야하!!!!!!!!'],
      win: ['야하!!!!', '우라아!!!'],
      lose: ['후와~앙…', '하?!?!'],
      shy: ['하?', '…야.'],
    },
    momonga: {
      greet: ['왔어? 나 귀엽지?', '나만 봐!'],
      tap: ['나 귀엽지? 그치?', '그거 이리 줘봐!', '왜! 나 불렀어?', '나만 봐 줘!'],
      pet: ['더! 더 쓰다듬어!', '흥, 이 정도로는 부족해!'],
      happy: ['역시 내가 제일 귀여워!', '헤헹~'],
      hungry: ['배고파! 빨리 간식 줘!', '그거 이리 줘봐!', '후에에에에에에엥~~~~~~~'],
      sad: ['후에에에에에에엥~~~~~~~', '나 안 봐 주면 울 거야!'],
      idle: ['나 좀 봐!', '그거 이리 줘봐!', '심심해! 놀아 줘!'],
      sleep: ['쿨쿨… (자는 것도 귀여움)'],
      eat: ['내 거야! 냠냠!', '더 줘!'],
      full: ['흥, 지금은 배불러. 나중에 또 줘!'],
      shop: ['그거 이리 줘봐!', '그거 내 거지?'],
      mission: ['다 내 덕분이야!', '헤헹, 칭찬해 줘!'],
      dress: ['당연히 내가 제일 잘 어울리지!', '나 귀엽지?'],
      levelup: ['이제야 내 매력을 알았구나!'],
      win: ['당연하지! 내가 이겼어!', '칭찬해 줘!'],
      lose: ['후에에에에에에엥~~~~~~~', '이건 무효야!'],
      shy: ['흥! 아직 안 친하거든!', '…간식 주면 친해 줄게.'],
    },
    kurimanju: {
      greet: ['…왔나.', '하아~'], tap: ['하아~', '…응?', '…(꿀꺽)'], pet: ['…좋구먼.', '하아~'],
      happy: ['하아~ 좋다.', '오늘은 좋은 날이구먼.'], hungry: ['안주가… 필요해.', '…출출하구먼.'],
      idle: ['하아~', '…(꿀꺽)', '좋구먼…'], eat: ['하아~ 맛있다.', '이 맛이지.'], full: ['…배부르구먼.'],
      win: ['하아~ 해냈구먼.'], lose: ['…뭐, 이런 날도 있지.'], shy: ['…(꾸벅)'],
    },
    rakko: {
      greet: ['…왔군.', '좋아.'], tap: ['…훈련 중이다.', '후…', '…뭐지?'], pet: ['…나쁘지 않군.'],
      happy: ['좋아.', '훌륭하다.'], hungry: ['…훈련 뒤엔 밥이지.'], idle: ['…훈련이다.', '후…', '방심하지 마라.'],
      eat: ['…맛있군.', '좋은 보급이다.'], full: ['…충분하다.'], win: ['훌륭하다.', '…잘했다.'], lose: ['더 훈련이 필요하군.'], shy: ['…(끄덕)'],
    },
    shisa: {
      greet: ['어서 오세요오!', '안녕하세요옷!'], tap: ['네엣!', '열심히 할게요!', '헤헤!'], pet: ['감사합니다앗!', '헤헤~'],
      happy: ['신나요옷!', '최고예요!'], hungry: ['라멘 먹고 싶어요오…'], idle: ['오늘도 열심히!', '라멘 먹으러 와요!', '네엣!'],
      eat: ['맛있어요옷!', '감사합니다앗!'], full: ['배불러요오~'], win: ['해냈어요옷!'], lose: ['다음엔 더 열심히 할게요…!'], shy: ['처, 처음 뵙겠습니다앗!'],
    },
    furuhonya: {
      greet: ['어서 오세요~', '천천히 보고 가세요.'], tap: ['네~?', '좋은 책이 있어요.', '후후.'], pet: ['후후, 고마워요.'],
      happy: ['오늘은 좋은 날이네요.', '후후~'], hungry: ['차 한 잔 할까요…'], idle: ['좋은 책이 있어요.', '천천히 보세요~', '책 냄새가 좋네요.'],
      eat: ['맛있네요~', '고마워요.'], full: ['이제 충분해요.'], win: ['훌륭해요~'], lose: ['괜찮아요, 다음이 있어요.'], shy: ['…어서 오세요.'],
    },
  },

  // 대사 종류마다 캐릭터가 다른 포즈를 해요 (data.js pets → poses → tags)
  lines: {
    greet: ['안녕! 반가워요~', '왔어요? 기다렸어요!', '오늘도 같이 놀아요!'],
    tap: ['헤헤!', '왜 불렀어요?', '간지러워요~', '놀아 주세요!', '반가워요!', '히히'],
    pet: ['기분 좋아요~', '더 쓰다듬어 주세요!', '헤헤헤', '포근해요...'],
    happy: ['신난다!', '최고예요!', '야호~'],
    hungry: ['배고파요...', '간식 먹고 싶어요', '꼬르륵...'],
    sad: ['심심해요...', '같이 놀아 주세요...'],
    idle: ['오늘도 좋은 하루!', '랄랄라~', '같이 있어서 좋아요', '뭐 하고 놀까요?', '새 옷 입고 싶다~'],
    sleep: ['쿨쿨...', 'Zzz...', '음냐음냐...'],
    eat: ['냠냠!', '맛있어요!', '최고예요~'],
    shop: ['우와 새 거다!', '고마워요!', '갖고 싶었어요!'],
    mission: ['해냈다!', '미션 성공!', '우리 대단해요!'],
    dress: ['어때요? 어울려요?', '헤헤 멋지죠?', '마음에 들어요!'],
    levelup: ['우리 더 친해졌어요!'],
    play: ['재밌었어요!', '또 해요!'],
    full: ['지금은 배불러요~'],
    win: ['해냈어요!', '최고예요!'],
    lose: ['아깝다~', '다음엔 더 잘할래요!'],
    shy: ['안녕…', '…(빤히)'],
    overlay: ['여기 있어요~', '뭐 해요?', '같이 놀아요!', '헤헤', '나 보여요?', '심심해요~'],
  },
};
