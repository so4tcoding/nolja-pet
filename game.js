/* 힐링펫 - 게임 코드 (설정/숫자는 data.js 에서 바꾸세요) */
(function () {
  'use strict';
  var D = window.HP_DATA, P = D.pet;
  var SAVE_KEY = 'healingpet_save_v1';
  var ASSET = 'assets/';
  var $ = function (id) { return document.getElementById(id); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var itemById = {}, snackById = {};
  D.items.forEach(function (i) { itemById[i.id] = i; });
  D.snacks.forEach(function (s) { snackById[s.id] = s; });
  var petById = {};
  D.pets.forEach(function (p) { petById[p.id] = p; p.poses.forEach(function (q) { q._char = p.id; }); });
  var CAT_NAMES = { hat: '모자', clothes: '옷', costume: '코스튬', set: '세트', skin: '색깔', pet: '캐릭터' };
  function tabOf(it) { return it.group || it.category; }

  // ───────── 그림 불러오기 ─────────
  var imgs = {};
  function img(src) {
    if (!src) return null;
    if (!imgs[src]) { var im = new Image(); im.src = ASSET + src; imgs[src] = im; }
    return imgs[src];
  }
  function ready(im) { return im && im.complete && im.naturalWidth > 0; }
  var loadProgress = 0;
  function preload() {
    var list = [D.art.coin, D.art.heart, D.art.star];
    D.pets.forEach(function (p) { list.push(p.avatar); p.poses.forEach(function (q) { list.push(q.img); }); });
    D.items.forEach(function (i) { list.push(i.img); });
    D.snacks.forEach(function (s) { list.push(s.img); });
    (D.dress || []).forEach(function (d) { list.push(d.img); });
    list = list.filter(Boolean); var done = 0, tick = function () { done++; loadProgress = done / list.length; };
    return Promise.all(list.map(function (src) {
      var im = img(src);
      return ready(im) ? tick() : new Promise(function (res) {
        im.addEventListener('load', function () { tick(); res(); }); im.addEventListener('error', function () { console.warn('그림을 못 불러왔어요: ' + src); tick(); res(); });
      });
    }));
  }

  // ───────── 저장 데이터 ─────────
  var S;
  function defaultSkin() { var d = D.items.filter(function (i) { return i.category === 'skin' && i.owned; })[0]; return d ? d.id : ''; }
  function newGame() {
    S = { v: 1, coins: D.startingCoins, affection: 0, hunger: 70, mood: 80,
      owned: D.items.filter(function (i) { return i.owned; }).map(function (i) { return i.id; }),
      pet: D.pets[0].id, snacks: {}, equip: { hat: '', clothes: '', acc: '', skin: defaultSkin() },
      missionDate: '', missions: {}, dailyPetAff: 0, lastSave: Date.now(), totalPets: 0, best: 0 };
    S.snacks[D.snacks[0].id] = D.startingCookies;
    S.petOutfits = {}; S.overlayPets = [S.pet]; S.overlayScale = 1; S.petSizes={}; initProgress();
  }
  function sanitize() {
    var n = { v: 1, coins: 0, affection: 0, hunger: 70, mood: 80, owned: [], snacks: {}, equip: {}, missionDate: '', missions: {}, dailyPetAff: 0, lastSave: Date.now(), totalPets: 0, best: 0 };
    Object.keys(n).forEach(function (k) { if (S[k] === undefined || S[k] === null) S[k] = n[k]; });
    ['hat', 'clothes', 'acc', 'skin'].forEach(function (c) { var id = S.equip[c]; if (!id || !itemById[id]) S.equip[c] = ''; });
    D.items.forEach(function (i) { if (i.owned && S.owned.indexOf(i.id) < 0) S.owned.push(i.id); });
    if (!S.equip.skin) S.equip.skin = defaultSkin();
    // v1.4: 예전 임시 옷은 없어졌어요 → 산 값만큼 코인 돌려주기
    var OLD = { hat_ribbon: 30, hat_straw: 60, hat_crown: 150, clothes_scarf: 40, clothes_overalls: 80, clothes_raincoat: 120, acc_glasses: 50, acc_flower: 35 }, back = 0;
    S.owned = S.owned.filter(function (id) { if (OLD[id] !== undefined && !itemById[id]) { back += OLD[id]; return false; } return true; });
    if (back) { S.coins = (S.coins | 0) + back; S.refund = back; }
    // v1.8: 사용자가 그린 12벌만 남기고 나머지 옷·모자·세트는 '업데이트 예정' → 이미 산 건 코인 돌려주기 (한 번만)
    if (!S.v18) {
      var back2 = 0, viaSet = {};
      S.owned.forEach(function (id) { var it = itemById[id]; if (it && it.set && it.soon) { back2 += it.price; it.set.forEach(function (x) { viaSet[x] = 1; var p = itemById[x]; if (p && !p.soon) { back2 -= p.price; if (S.owned.indexOf(x) < 0) S.owned.push(x); } }); } });
      S.owned = S.owned.filter(function (id) { var it = itemById[id]; if (!it || !it.soon) return true; if (!it.set && !viaSet[id]) back2 += it.price; return false; });
      back2 = Math.max(0, back2); if (back2) { S.coins = (S.coins | 0) + back2; S.refund = (S.refund || 0) + back2; }
      S.v18 = 1;
    }
    ['hat', 'clothes'].forEach(function (c) { var it = itemById[S.equip[c]]; if (it && it.soon) S.equip[c] = ''; });
    S.equip.acc = '';
    S.petOutfits = S.petOutfits || {};
    S.overlayPets = Array.isArray(S.overlayPets) ? S.overlayPets.filter(function (id, i, a) { return petById[id] && a.indexOf(id) === i; }) : [S.pet];
    S.overlayScale = clamp(+S.overlayScale || 1, 0.5, 2.5); S.petSizes=S.petSizes||{};
    S.petOutfits[S.pet] = S.equip.clothes || '';
    if (!petById[S.pet]) S.pet = D.pets[0].id;
    initProgress();
    S.hunger = clamp(+S.hunger || 0, 0, 100); S.mood = clamp(+S.mood || 0, 0, 100); S.coins = Math.max(0, S.coins | 0);
  }
  function load() {
    try { var raw = localStorage.getItem(SAVE_KEY); if (raw) { S = JSON.parse(raw); sanitize(); return true; } }
    catch (e) { console.warn('저장 데이터를 읽지 못해서 새로 시작해요', e); }
    newGame(); return false;
  }
  function save() {
    if (!S || !started) return;
    S.lastSave = Date.now();
    S.petOutfits = S.petOutfits || {}; S.petOutfits[S.pet] = S.equip.clothes || '';
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { console.warn('저장 실패', e); }
  }

  // ───────── 시간 / 배고픔 ─────────
  var lastTick = Date.now(), started = false;
  function decay(h) {
    S.hunger = clamp(S.hunger - P.hungerDecayPerHour * h, 0, 100);
    S.mood = clamp(S.mood - P.moodDecayPerHour * (S.hunger < 30 ? 2 : 1) * h, 0, 100);
  }
  function offline(hours) {
    if (!(hours > 0.0003)) return;
    hours = Math.min(hours, P.maxOfflineHours);
    decay(hours * P.offlineDecayMultiplier);
    if (hours >= 1) toast(Math.floor(hours) + '시간 만이에요! 보고 싶었어요~');
    else if (hours >= 10 / 60) toast(Math.floor(hours * 60) + '분 만이에요! 어서 와요~');
  }
  function refundNote() { if (S && S.refund) { toast('옷이 새로 바뀌었어요! 업데이트 예정인 옷 값 ' + S.refund + '코인을 돌려줬어요'); delete S.refund; save(); } }
  function timeStep() {
    var now = Date.now(), h = (now - lastTick) / 3600000;
    lastTick = now;
    if (h <= 0) return;                 // 기기 시간을 되돌린 경우 무시
    if (h > 5 / 3600) offline(h);        // 5초 넘게 멈춰 있었으면 (앱을 내렸다가 온 경우) 꺼진 시간으로 계산
    else decay(h);
  }
  function isSleepHour() {
    var hr = new Date().getHours(), a = P.sleepStartHour, b = P.sleepEndHour;
    return a > b ? (hr >= a || hr < b) : (hr >= a && hr < b);
  }

  // ───────── 호감도 ─────────
  function levelOf(aff) { var t = P.levelThresholds, lv = 1; for (var i = 0; i < t.length; i++) if (aff >= t[i]) lv = i + 1; return lv; }
  function initProgress() {
    if (!S.affectionByPet) { S.affectionByPet = {}; D.pets.forEach(function(p){ S.affectionByPet[p.id] = Math.max(0,+S.affection || 0); }); }
    D.pets.forEach(function(p){ if(!Number.isFinite(S.affectionByPet[p.id])) S.affectionByPet[p.id]=0; S.affectionByPet[p.id]=Math.max(0,S.affectionByPet[p.id]); });
    if (!S.dailyPetAffByPet) { S.dailyPetAffByPet = {}; D.pets.forEach(function(p){ S.dailyPetAffByPet[p.id]=Math.max(0,+S.dailyPetAff||0); }); }
    S.affection=S.affectionByPet[S.pet] || 0; S.dailyPetAff=S.dailyPetAffByPet[S.pet] || 0;
  }
  function level() { return levelOf(S.affectionByPet ? S.affectionByPet[S.pet] || 0 : S.affection); }
  function levelProgress() {
    var lv = level(), t = P.levelThresholds; if (lv >= t.length) return 1;
    return (S.affection - t[lv - 1]) / (t[lv] - t[lv - 1]);
  }
  function addAffection(n) {
    if (n <= 0) return;
    var before = level(); S.affectionByPet[S.pet]=(S.affectionByPet[S.pet] || 0)+n; S.affection=S.affectionByPet[S.pet]; var after = level();
    if (after > before) {
      var reward = 0; for (var lv = before + 1; lv <= after; lv++) reward += P.levelUpRewardPerLevel * lv;
      S.coins += reward;
      toast('호감도 레벨 업! \'' + P.levelNames[after - 1] + '\' (+' + reward + ' 코인)');
      pet.happy = 2.5; burst(D.art.heart, 10); talk('levelup', 3);
      save();
    }
  }

  // ───────── 미션 ─────────
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function prog(m) { if (!S.missions[m.id]) S.missions[m.id] = { p: 0, c: false }; return S.missions[m.id]; }
  function checkDaily() {
    if (S.missionDate === today()) return;
    S.missionDate = today(); S.missions = {}; S.dailyPetAff = 0; S.dailyPetAffByPet = {};
    report('login', 1); save(); refreshOpenSheet();
  }
  function report(type, amount) {
    D.missions.forEach(function (m) {
      if (m.type !== type) return;
      var p = prog(m); if (p.c) return;
      var was = p.p >= m.target;
      if (type === 'score') p.p = Math.max(p.p, Math.min(amount, m.target)); else p.p = Math.min(m.target, p.p + amount);
      if (!was && p.p >= m.target) toast('미션 완료! \'' + m.title + '\' 보상을 받으세요');
    });
    updateDot();
  }
  function canClaim(m) { var p = prog(m); return !p.c && p.p >= m.target; }
  function claim(m) {
    if (!canClaim(m)) return;
    prog(m).c = true; S.coins += m.coins;
    var t = '+' + m.coins + ' 코인';
    if (m.snack && snackById[m.snack]) { addSnack(m.snack, m.snackCount || 1); t += ', ' + snackById[m.snack].name + ' ' + (m.snackCount || 1) + '개'; }
    toast('보상 받기! ' + t); talk('mission', 2.6); save(); updateDot(); updateHud();
  }
  function updateDot() { $('missionDot').classList.toggle('hidden', !D.missions.some(canClaim)); }

  // ───────── 간식 / 상점 / 옷 ─────────
  function snackCount(id) { return S.snacks[id] || 0; }
  function addSnack(id, n) { S.snacks[id] = Math.max(0, snackCount(id) + n); }
  function feed(id) {
    var s = snackById[id]; if (!s) return false;
    if (snackCount(id) <= 0) { toast(s.name + '이(가) 없어요. 상점에서 사 주세요!'); return false; }
    if (S.hunger >= 95) { talk('full', 2.4); toast('지금은 배불러요! 조금 있다가 주세요'); return false; }
    addSnack(id, -1);
    S.hunger = clamp(S.hunger + s.hunger, 0, 100); S.mood = clamp(S.mood + s.mood, 0, 100);
    wake(); pet.eat = 1.6; pet.eatImg = s.img; pet.vx = pet.vy = 0; pet.wait = 2;
    talk('eat', 2.4); burst(D.art.heart, 4);
    addAffection(s.aff); report('feed', 1); save(); updateHud();
    return true;
  }
  function buySnack(id) {
    var s = snackById[id]; if (!s) return;
    if (S.coins < s.price) { toast('코인이 부족해요'); return; }
    S.coins -= s.price; addSnack(id, 1); report('buy', 1); toast(s.name + ' 샀어요!'); talk('shop', 2.4); save(); updateHud();
  }
  function owned(it) { return S.owned.indexOf(it.id) >= 0; }
  function buyItem(id) {
    var it = itemById[id]; if (!it || owned(it) || it.soon) return;
    if (S.coins < it.price) { toast('코인이 부족해요'); return; }
    S.coins -= it.price;
    if (it.set) { it.set.forEach(function (x) { if (S.owned.indexOf(x) < 0) S.owned.push(x); var p = itemById[x]; if (p) S.equip[p.category] = x; }); S.owned.push(it.id); }
    else S.owned.push(it.id);
    report('buy', 1);
    toast(it.name + (it.set ? ' 샀어요! 바로 입혀 줬어요' : ' 샀어요! 옷장에서 입혀 보세요'));
    if (it.set) nativeSync(); talk('shop', 2.4); save(); updateHud();
  }
  function equipped(it) { return S.equip[it.category] === it.id; }
  function toggleEquip(id) {
    var it = itemById[id]; if (!it || !owned(it) || it.soon) return;
    if (it.wear && it.only !== curPet().id) { toast(petById[it.only].name + '만 입을 수 있어요 (다른 친구는 업데이트 예정)'); return; }
    if (equipped(it)) {
      if (it.category === 'skin') { if (it.id === defaultSkin()) return; S.equip.skin = defaultSkin(); }
      else S.equip[it.category] = '';
    } else { S.equip[it.category] = it.id; if (it.wear) S.equip.hat = ''; }
    report('dress', 1); wake(); pet.happy = 1.2; pet.hop = 0.01; talk('dress', 2.6); save(); nativeSync();
  }

  // ───────── 캐릭터 ─────────
  var cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
  var W = 300, H = 300, DPR = 1;
  var pet = { pose: 'stand', poseT: 0, vari: null, x: 150, y: 150, tx: 150, ty: 150, vx: 0, vy: 0, size: 150, wait: 1, face: 1, happy: 0, eat: 0, eatImg: null, hop: 0, sleeping: false, idle: 0, awake: 0, chat: 6, t: 0, petLine: 0 };
  var fx = [];
  function resize() {
    var r = stage.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 3);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    pet.size = homeSizeFor(S.pet);
    var b = bounds(); pet.x = clamp(pet.x, b.x0, b.x1); pet.y = clamp(pet.y, b.y0, b.y1); pet.tx = pet.x; pet.ty = pet.y;
  }
  function homeIds() { var a=(S.overlayPets || [S.pet]).filter(function(id){return !!petById[id];});return a.length?a:[S.pet]; }
  function homeSizeFor(id) { var count=homeIds().length,base=clamp(Math.min(W,H)*P.sizeRatio,110,420)/Math.sqrt(Math.min(count,4));return clamp(base*((S.petSizes||{})[id]||S.overlayScale||1),55,Math.min(W*.95,H*.8)); }
  function homeHasMain(){return homeIds().indexOf(S.pet)>=0;}
  function visibleH() { // 아래 창이 열려 있으면 그 위쪽만 사용
    var sh = $('sheet'); if (sh.classList.contains('hidden')) return H;
    var top = sh.getBoundingClientRect().top - stage.getBoundingClientRect().top; return clamp(top, pet.size * 0.9, H);
  }
  function bounds() {
    var s = pet.size, vh = visibleH();
    return { x0: s * 0.45, x1: Math.max(s * 0.45, W - s * 0.45), y0: s * 0.62, y1: Math.max(s * 0.62, vh - s * 0.45) };
  }
  function wake() { pet.idle = 0; if (pet.sleeping) { stopSleep(); pet.awake = 8; } }
  function stopSleep() { pet.sleeping = false; if (pet.poseT === Infinity) { pet.poseT = 0; pet.pose = 'stand'; pet.vari = null; } }
  var bubbleT = 0;
  function say(msg, dur, kind) { var b = $('bubble'); b.textContent = msg; b.classList.remove('hidden'); bubbleT = dur || 2.4; if (kind) setPose(kind, bubbleT); }
  // 말할 때마다 그 말에 맞는 포즈로 바꾸기 (포즈가 없으면 같은 그림을 다르게 움직여요)
  // 캐릭터별 대사 → 없으면 공통 대사
  function line(kind) { var pl = D.petLines && D.petLines[curPet().id], a = (pl && pl[kind]) || D.lines[kind] || D.lines.tap; return pick(a); }
  function talk(kind, dur) { say(line(kind), dur || 2.4, kind); }
  var POSE_ALIAS = { full: 'happy', win: 'happy', lose: 'sad', shy: 'idle' };
  function posesWith(kind) { return curPet().poses.filter(function (q) { return q.tags.indexOf(kind) >= 0; }); }
  function setPose(kind, dur) {
    var jump = { shop: 1, mission: 1, play: 1, levelup: 1, win: 1 };
    if (POSE_ALIAS[kind]) kind = POSE_ALIAS[kind];
    var c = posesWith(kind), ch;
    if (!c.length && jump[kind]) c = posesWith('happy').filter(function (q) { return q.id !== 'stand'; });
    if (c.length > 1) { var others = c.filter(function (q) { return q.id !== pet.pose; }); ch = pick(others.length ? others : c); } else ch = c[0];
    pet.pose = ch ? ch.id : 'stand';
    pet.vari = (!ch || jump[kind] || (ch.id === 'stand' && kind !== 'walk' && kind !== 'idle' && kind !== 'tap')) ? kind : null;
    pet.poseT = (pet.sleeping && kind === 'sleep') ? Infinity : dur;
    if (pet.pose !== 'stand' || pet.vari) { pet.tx = pet.x; pet.ty = pet.y; pet.wait = Math.max(pet.wait, Math.min(dur, 5)); }
  }
  // 옷 입은 모습 그림: 치이카와·하치와레·우사기가 참고 그림과 같은 옷(+모자)을 입으면 그 그림을 통째로 써요
  var dressBy = {};
  (D.dress || []).forEach(function (d) {
    d._char = d.char; d.id = 'dress'; d.dress = true; d.outfit = true; d.closeEyes = true; d.tags = [];
    d.color = petById[d.char] ? petById[d.char].poses[0].color : '#ffffff';
    dressBy[d.char + '|' + d.clothes] = d;
  });
  // v1.8 옷 입고 서 있는 그림 (사용자 그림 그대로): 걷기·기본·말하기 모두 이 그림 한 장, 멈춰 있으면 앉은 그림(있을 때만)
  var wearBy = {};
  (D.wear || []).forEach(function (w) {
    w._char = w.char; w.id = 'wear'; w.dress = true; w.wear = true; w.outfit = true; w.closeEyes = true; w.tags = ['walk', 'idle', 'greet', 'tap'];
    w.color = petById[w.char] ? petById[w.char].poses[0].color : '#ffffff';
    wearBy[w.char + '|' + w.clothes] = w;
  });
  function wearFor() {
    var it = S && itemById[S.equip.clothes];
    return (it && it.wear && it.only === curPet().id && wearBy[it.only + '|' + it.id]) || null;
  }
  function dressFor(pd) {
    if (!S || !pd || !pd._char) return pd;
    var it = itemById[S.equip.clothes]; if (!it || !it.wear || it.only !== pd._char) return pd;
    return dressBy[pd._char + '|' + it.id] || pd;    // 같은 옷의 앉은 그림(예전 참고 그림)이 있으면 멈춰 있을 때 그걸로
  }
  function curPose() { return (pet.mix || 0) > 0.5 ? dressFor(basePose()) : basePose(); }
  function basePose() {
    var w = wearFor(); if (w) return w;
    var ps = curPet().poses;
    if (!pet.walking) for (var i = 0; i < ps.length; i++) if (ps[i].id === pet.pose) return ps[i];
    return ps[0];
  }
  function iga(w) { var c = w.charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '이' : '가'); }
  function curPet() { return petById[S.pet] || D.pets[0]; }
  function petName() { return curPet().name; }
  function hitPet(x, y) {
    if(!homeHasMain())return false; // 캐릭터 몸 범위(타원) 안을 눌렀는지
    var s = pet.size, pd = curPose(), u = s / 512;
    var cx = pet.x + (((pd.bodyL + pd.bodyR) / 2) - 256) * u * pet.face, cy = pet.y + (((pd.headTop + pd.bottom) / 2) - 256) * u;
    var dx = (x - cx) / ((pd.bodyR - pd.bodyL) / 2 * u + 10), dy = (y - cy) / ((pd.bottom - pd.headTop) / 2 * u + 10);
    return dx * dx + dy * dy <= 1;
  }
  function selectPet(id) {
    if (!petById[id] || S.pet === id) return;
    S.petOutfits = S.petOutfits || {}; S.petOutfits[S.pet] = S.equip.clothes || '';
    S.pet = id; initProgress(); S.equip.clothes = S.petOutfits[id] || ''; S.equip.hat = ''; save(); wake(); pet.hop = 0.01; pet.happy = 1.5; pet.pose = 'stand'; pet.poseT = 0; pet.vari = null;
    say('안녕! 나는 ' + petName() + '! 잘 부탁해요~', 3, 'greet'); updateHud(); nativeSync(); if (window.HPAuth && HPAuth.current()) HPAuth.setPet(id);
  }
  function spawn(src, x, y, opt) {
    opt = opt || {};
    fx.push({ img: src, x: x, y: y, vx: opt.vx || rnd(-30, 30), vy: opt.vy || rnd(-120, -70), life: opt.life || 1.2, max: opt.life || 1.2, size: opt.size || rnd(22, 34), text: opt.text });
  }
  function burst(src, n) { for (var i = 0; i < n; i++) spawn(src, pet.x + rnd(-pet.size * 0.3, pet.size * 0.3), pet.y - pet.size * 0.2, { vx: rnd(-80, 80), vy: rnd(-200, -90), life: 1.4 }); }

  function doTap() {
    wake(); pet.hop = 0.01; pet.happy = 0.6;
    S.mood = Math.min(100, S.mood + 1); report('tap', 1);
    if (S.hunger < 30) talk('hungry', 2.4); else if (level() <= 2 && Math.random() < 0.3) talk('shy', 2.4); else talk('tap', 2.4);
  }
  function doPet(x, y) {
    wake(); pet.happy = 1.2; pet.vx = pet.vy = 0; pet.wait = Math.max(pet.wait, 1.5);
    S.totalPets++; S.mood = Math.min(100, S.mood + 4);
    if (S.dailyPetAff < P.dailyPetAffectionCap) { S.dailyPetAff++; S.dailyPetAffByPet[S.pet]=S.dailyPetAff; addAffection(1); }
    else if (S.dailyPetAff === P.dailyPetAffectionCap) { S.dailyPetAff++; S.dailyPetAffByPet[S.pet]=S.dailyPetAff; toast('오늘 쓰다듬기 호감도는 다 받았어요 (내일 또!)'); }
    report('pet', 1);
    spawn(D.art.heart, x, y, { vy: -110 });
    if (pet.t - pet.petLine > 1.6) { pet.petLine = pet.t; talk('pet', 2.4); }
  }

  // 터치: 톡 = 짧게 누르기, 쓰다듬기 = 캐릭터 위에서 문지르기 (여러 손가락 따로 인식)
  var touches = {};
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function onDown(e) {
    var p = pos(e);
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    touches[e.pointerId] = { compId: COMP && COMP.hit(p.x,p.y), sx: p.x, sy: p.y, lx: p.x, ly: p.y, rub: 0, moved: false, t: performance.now(), onPet: hitPet(p.x, p.y) };
  }
  function onMove(e) {
    var t = touches[e.pointerId]; if (!t) return;
    if(t.compId)return;
    var p = pos(e), d = Math.hypot(p.x - t.lx, p.y - t.ly);
    if (Math.hypot(p.x - t.sx, p.y - t.sy) > 12) t.moved = true;
    if (hitPet(p.x, p.y)) {
      t.rub += d; var step = pet.size * 0.55;
      while (t.rub >= step) { t.rub -= step; doPet(p.x, p.y); }
    }
    t.lx = p.x; t.ly = p.y;
  }
  function up(e) {
    var t = touches[e.pointerId]; if (!t) return; delete touches[e.pointerId];
    if (t.moved || performance.now() - t.t > 600) return;
    if(t.compId){COMP.tap(t.compId);return;}
    if (t.onPet) doTap();
    else if (!pet.sleeping && pet.eat <= 0) { // 빈 곳을 누르면 그쪽으로 걸어가요
      var b = bounds(); pet.tx = clamp(t.sx, b.x0, b.x1); pet.ty = clamp(t.sy + pet.size * 0.3, b.y0, b.y1); pet.wait = 0; wake();
      spawn(D.art.star, t.sx, t.sy, { vx: 0, vy: -40, life: 0.6, size: 20 });
    }
  }
  function cancel(e) { delete touches[e.pointerId]; }
  if (window.PointerEvent) {
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', cancel);
  } else { // 아주 오래된 안드로이드 웹뷰용 (터치 이벤트)
    var tw = function (fn) { return function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var c = e.changedTouches[i]; fn({ pointerId: c.identifier, clientX: c.clientX, clientY: c.clientY }); } }; };
    cv.addEventListener('touchstart', tw(onDown), { passive: false }); cv.addEventListener('touchmove', tw(onMove), { passive: false });
    cv.addEventListener('touchend', tw(up), { passive: false }); cv.addEventListener('touchcancel', tw(cancel), { passive: false });
    var md = false;
    cv.addEventListener('mousedown', function (e) { md = true; onDown({ pointerId: 'm', clientX: e.clientX, clientY: e.clientY }); });
    window.addEventListener('mousemove', function (e) { if (md) onMove({ pointerId: 'm', clientX: e.clientX, clientY: e.clientY }); });
    window.addEventListener('mouseup', function (e) { if (md) { md = false; up({ pointerId: 'm', clientX: e.clientX, clientY: e.clientY }); } });
  }

  function update(dt) {
    pet.size=homeSizeFor(S.pet);
    if(COMP)COMP.update(dt);
    pet.t += dt;
    var b = bounds();
    ['happy', 'eat', 'awake'].forEach(function (k) { if (pet[k] > 0) pet[k] -= dt; });
    pet.idle += dt;
    if (!pet.sleeping && isSleepHour() && pet.idle > 10 && pet.awake <= 0 && pet.eat <= 0) { pet.sleeping = true; talk('sleep', 2.4); }
    if (pet.sleeping && !isSleepHour() && !pet.forceSleep) stopSleep();
    if (pet.poseT > 0 && pet.poseT !== Infinity) { pet.poseT -= dt; if (pet.poseT <= 0) { pet.poseT = 0; pet.pose = 'stand'; pet.vari = null; } }
    if (pet.hop > 0) { pet.hop += dt; if (pet.hop > 0.45) pet.hop = 0; }
    // 걷기
    var busy = pet.sleeping || pet.eat > 0 || pet.pose !== 'stand' || (pet.vari && pet.poseT > 0) || Object.keys(touches).some(function (k) { return touches[k].onPet; });
    if (!busy) {
      var dx = pet.tx - pet.x, dy = pet.ty - pet.y, dist = Math.hypot(dx, dy);
      if (dist > 2) {
        var sp = P.walkSpeed * Math.min(W, 700) * (S.hunger < 20 ? 0.6 : 1);
        var st = Math.min(dist, sp * dt); pet.x += dx / dist * st; pet.y += dy / dist * st;
        if (Math.abs(dx) > 4) pet.face = dx < 0 ? -1 : 1;
        pet.walking = true;
      } else {
        pet.walking = false; pet.wait -= dt;
        if (pet.wait <= 0) { pet.tx = rnd(b.x0, b.x1); pet.ty = rnd(b.y0, b.y1); pet.wait = rnd(1.5, 4.5); }
      }
    } else pet.walking = false;
    // 옷 입은 앉은 그림(참고 그림)은 멈춰 있을 때만: 걷기 시작하면 서 있는 그림 + 겹쳐 입힌 옷으로 부드럽게 바꾸기
    pet.stillT = pet.walking ? 0 : (pet.stillT || 0) + dt;
    var dTarget = (!pet.walking && pet.stillT > 0.35 && dressFor(basePose()) !== basePose()) ? 1 : 0;
    pet.mix = pet.mix || 0; pet.mix += clamp(dTarget - pet.mix, -dt * 6, dt * 6);
    pet.x = clamp(pet.x, b.x0, b.x1); pet.y = clamp(pet.y, b.y0, b.y1);
    pet.tx = clamp(pet.tx, b.x0, b.x1); pet.ty = clamp(pet.ty, b.y0, b.y1);
    // 혼잣말
    pet.chat -= dt;
    if (pet.chat <= 0) {
      pet.chat = rnd(10, 18);
      if (pet.sleeping) talk('sleep', 2.4);
      else if (S.hunger < 30) talk('hungry', 2.6);
      else if (S.mood < 30) talk('sad', 2.6);
      else talk(Math.random() < 0.5 ? 'idle' : 'happy', 2.6);
    }
    if (pet.sleeping && Math.random() < dt * 0.8) spawn(null, pet.x + pet.size * 0.25, pet.y - pet.size * 0.45, { vx: 20, vy: -40, life: 2, size: 26, text: 'Z' });
    for (var i = fx.length - 1; i >= 0; i--) { var f = fx[i]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.life <= 0) fx.splice(i, 1); }
    if (bubbleT > 0) { bubbleT -= dt; if (bubbleT <= 0) $('bubble').classList.add('hidden'); }
  }

  var tintCache = {};
  function bodyImage(pd) {
    var body = img(pd.img), it = itemById[S.equip.skin];
    if (!ready(body)) return null;
    if (!it || !it.tint || /^#?f{6}$/i.test(it.tint) || pd.dress) return body;  // 옷 입은 그림은 옷 색이 바뀌지 않게 그대로
    var key = pd.img + '|' + it.id;
    if (!tintCache[key]) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 512;
      var g = c.getContext('2d'); g.drawImage(body, 0, 0, 512, 512);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = it.tint; g.fillRect(0, 0, 512, 512);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(body, 0, 0, 512, 512);
      tintCache[key] = c;
    }
    return tintCache[key];
  }
  function mulColor(a, b) { // 두 색 곱하기 (몸 색 x 색깔 아이템)
    var p = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
    var x = p(a), y = p(b || '#ffffff'); return 'rgb(' + x.map(function (v, i) { return Math.round(v * y[i] / 255); }).join(',') + ')';
  }
  // ───────── 옷 ─────────
  // v1.8: 옷은 사용자가 그린 '옷 입은 그림'(D.wear, D.dress)을 통째로만 써요. 옷 그림을 따로 겹쳐 그리지 않아요.
  var LMX = 160, LMY = 300;
  function itemLayer() { return null; }
  function mood() {
    if (pet.eat > 0) return 'eat';
    if (pet.happy > 0) return 'happy';
    if (pet.sleeping) return 'sleep';
    if (S.hunger < 30 || S.mood < 30) return 'sad';
    return 'normal';
  }
  // 표정은 그림 한 장으로 코드가 만들어요: 잘 때 눈 감기, 기쁠 때 볼 빨개지기, 슬플 때 눈물
  function drawFace(g, pd, md, t) {
    var r = pd.eyeR || 26;
    if (md === 'sleep' && pd.closeEyes !== false) {
      var col = mulColor(pd.color || '#ffffff', itemById[S.equip.skin] && itemById[S.equip.skin].tint);
      pd.eyes.forEach(function (e) {
        g.fillStyle = col; g.beginPath(); g.ellipse(e[0], e[1], r * 1.2, r * 1.15, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#3a2a2e'; g.lineWidth = Math.max(5, r * 0.28); g.lineCap = 'round';
        g.beginPath(); g.arc(e[0], e[1] - r * 0.35, r * 0.75, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
      });
    } else if (md === 'happy' || md === 'eat') {
      g.fillStyle = 'rgba(255,120,150,' + (0.28 + Math.sin(t * 6) * 0.08) + ')';
      pd.eyes.forEach(function (e, i) { g.beginPath(); g.ellipse(e[0] + (i ? r * 0.6 : -r * 0.6), e[1] + r * 1.5, r * 1.1, r * 0.6, 0, 0, Math.PI * 2); g.fill(); });
    } else if (md === 'sad') {
      var e = pd.eyes[1], k = (t * 0.6) % 1;
      g.globalAlpha = 1 - k; g.fillStyle = '#8fc8ff';
      g.beginPath(); g.ellipse(e[0] + r * 0.9, e[1] + r * 0.8 + k * r * 2, r * 0.25, r * 0.38, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
  }
  // 512x512 그림 좌표에서 캐릭터(+옷) 그리기. legs=true 면 발을 번갈아 들어 올려 걷기 (freq: 걸음 빠르기)
  function drawFigure(g, pd, t, legs, freq, faceFn) {
    var bodyIm = bodyImage(pd);
    if (legs) {
      var fy = pd.footY, fh = 512 - fy, ph = Math.sin(t * freq), L = Math.max(0, ph), Rr = Math.max(0, -ph), lift = freq > 12 ? 24 : 16;
      if (bodyIm) {
        var k = (bodyIm.naturalWidth || bodyIm.width) / 512, cxp = pd.cx;
        g.drawImage(bodyIm, 0, fy * k, cxp * k, fh * k, ph * 7, fy - L * lift, cxp, fh);
        g.drawImage(bodyIm, cxp * k, fy * k, (512 - cxp) * k, fh * k, cxp - ph * 7, fy - Rr * lift, 512 - cxp, fh);
      }
      g.save(); g.beginPath(); g.rect(-LMX, -LMY, 512 + LMX * 2, fy + LMY + 12); g.clip(); g.translate(0, -Math.abs(ph) * 6);
    }
    if (bodyIm) g.drawImage(bodyIm, 0, 0, 512, 512);
    var cl = pd.dress ? null : itemLayer(S.equip.clothes, pd); if (cl) g.drawImage(cl, -LMX, -LMY);
    if (faceFn) faceFn(g);
    var hl = pd.dress && pd.hat ? null : itemLayer(S.equip.hat, pd); if (hl) g.drawImage(hl, -LMX, -LMY);
    if (legs) g.restore();
  }
  // 놀이·로딩 화면용: 발바닥 위치(x, foot)와 크기(size)로 그리기
  function drawChar(g, o) {
    var pd = o.pd || (!o.plain && wearFor()) || curPet().poses[0], u = o.size / 512, t = o.t || 0;
    if (!o.plain && o.dress !== false && !o.walking && !o.run) pd = dressFor(pd);   // 움직일 땐 항상 서 있는 그림
    var legs = o.walking && pd.footY > 0 && pd.footY < 505;
    g.save();
    g.fillStyle = 'rgba(80,50,70,0.13)'; g.beginPath(); g.ellipse(o.x, o.foot, o.size * 0.3, o.size * 0.05, 0, 0, 7); g.fill();
    g.translate(o.x + (o.shake || 0), o.foot);
    g.scale((o.face || 1) * u, u); g.translate(-256, -pd.bottom);
    if (o.walking && !legs) g.translate(0, -Math.abs(Math.sin(t * (o.run ? 16 : 10))) * 20);   // 옷 입은 그림은 통째로 통통
    if (o.plain) { // 다른 캐릭터 (옷 없이)
      var im = img(pd.img);
      if (ready(im)) {
        if (legs) {
          var fy = pd.footY, fh = 512 - fy, ph = Math.sin(t * (o.run ? 16 : 10)), k = im.naturalWidth / 512, cxp = pd.cx;
          g.drawImage(im, 0, fy * k, cxp * k, fh * k, ph * 7, fy - Math.max(0, ph) * 24, cxp, fh);
          g.drawImage(im, cxp * k, fy * k, (512 - cxp) * k, fh * k, cxp - ph * 7, fy - Math.max(0, -ph) * 24, 512 - cxp, fh);
          g.beginPath(); g.rect(-50, -100, 612, fy + 112); g.clip(); g.translate(0, -Math.abs(ph) * 8);
        }
        g.drawImage(im, 0, 0, 512, 512);
      }
    } else drawFigure(g, pd, t, legs, o.run ? 16 : 10, null);
    g.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    $('bubble').style.visibility=homeHasMain()?'':'hidden';
    if(!homeHasMain()){if(COMP)COMP.draw(ctx);return;}
    var s = pet.size, t = pet.t, pd = curPose(), u = s / 512, md = mood(), v = pet.vari;
    var hp = pet.hop > 0 ? pet.hop / 0.45 : 0;
    var hopY = hp ? -Math.sin(hp * Math.PI) * s * 0.18 : 0;
    var legs = pet.walking && pd.footY > 0 && pd.footY < 505;
    var bob = pet.walking && !legs ? -Math.abs(Math.sin(t * 9)) * s * 0.035 : 0;
    // 기본·걷기는 똑바로 선 그대로 (기울이기·찌그러뜨리기 없음). 말할 때 잠깐만 위아래로 움직이기
    var sx = 1, sy = 1, rot = 0;
    if (v === 'hungry' || v === 'sad') bob = s * 0.015;
    else if (v === 'mission' || v === 'shop' || v === 'play' || v === 'levelup') bob = -Math.abs(Math.sin(t * 7)) * s * 0.08;
    else if (v === 'happy' || v === 'pet' || v === 'dress' || v === 'greet' || v === 'win') bob = -Math.abs(Math.sin(t * 8)) * s * 0.04;
    else if (!pet.walking && md === 'happy') bob = -Math.abs(Math.sin(t * 6)) * s * 0.02;
    var footY = pet.y + (pd.bottom / 512 - 0.5) * s;
    ctx.fillStyle = 'rgba(80,50,70,0.13)';
    ctx.beginPath(); ctx.ellipse(pet.x + (pd.cx - 256) * u * pet.face, footY, (pd.bodyR - pd.bodyL) * u * 0.42 * (1 + hopY / s), s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    // 서 있는 그림 ↔ 옷 입은 앉은 그림: 0.17초 동안 겹쳐서 부드럽게 바꾸기
    var bp = basePose(), dp = dressFor(bp), mx = dp === bp ? 0 : clamp(pet.mix || 0, 0, 1);
    [[bp, 1 - mx], [dp, mx]].forEach(function (L, i) {
      var q = L[0], al = L[1]; if (al <= 0.01 || (i === 1 && dp === bp)) return;
      var fy2 = pet.y + (q.bottom / 512 - 0.5) * s;
      ctx.save(); ctx.globalAlpha = al;
      ctx.translate(pet.x, fy2 + hopY + bob); ctx.rotate(rot); ctx.scale(pet.face * sx, sy);
      ctx.translate(-256 * u, -q.bottom * u); ctx.scale(u, u);           // 이제부터 그림(512x512) 좌표
      drawFigure(ctx, q, t, legs && q === bp, 10, function (g) { drawFace(g, q, v === 'sleep' ? 'sleep' : md, t); });
      ctx.restore();
    });
    var my = pet.y + (((pd.eyes[0][1] + pd.eyes[1][1]) / 2 + (pd.eyeR || 26) * 2.2) / 512 - 0.5) * s;
    if (pet.eat > 0 && pet.eatImg) { var e = img(pet.eatImg), es = s * 0.26 * Math.max(0.2, pet.eat / 1.6); if (ready(e)) ctx.drawImage(e, pet.x + ((pd.eyes[0][0] + pd.eyes[1][0]) / 2 - 256) * u * pet.face - es / 2, my - es / 2 + hopY, es, es); }
    fx.forEach(function (f) {
      ctx.globalAlpha = clamp(f.life / f.max * 1.5, 0, 1);
      if (f.text) { ctx.fillStyle = '#8a7da8'; ctx.font = f.size + 'px Jua, sans-serif'; ctx.fillText(f.text, f.x, f.y); }
      else { var im = img(f.img); if (ready(im)) ctx.drawImage(im, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size); }
    });
    ctx.globalAlpha = 1;
    hopY += bob; var bub = $('bubble'); bub.style.left = clamp(pet.x, 80, W - 80) + 'px'; bub.style.top = Math.max(40, pet.y + (pd.headTop / 512 - 0.5) * s - 14 + hopY) + 'px';
    if(COMP)COMP.draw(ctx);
  }

  // ───────── 화면 (HUD, 창) ─────────
  var hudName = '', hudProf = '';
  function updateHud() {
    var cu = window.HPAuth && HPAuth.current(), ph = cu ? esc(cu.nick) : '';
    if (ph !== hudProf) { hudProf = ph; $('profBtn').innerHTML = '👤 ' + ph; $('profBtn').classList.toggle('hidden', !cu); }
    var nh = '<img src="' + ASSET + curPet().avatar + '" alt="">' + esc(petName()) + ' ▾'; if (hudName !== nh) { hudName = nh; $('petName').innerHTML = nh; } $('coinText').textContent = S.coins;
    var lv = level(); $('levelName').textContent = P.levelNames[lv - 1] || ''; $('lvText').textContent = 'Lv.' + lv;
    $('affFill').style.width = (levelProgress() * 100).toFixed(1) + '%';
    $('hungerFill').style.width = S.hunger.toFixed(1) + '%'; $('hungerFill').classList.toggle('low', S.hunger < 30);
    $('moodFill').style.width = S.mood.toFixed(1) + '%'; $('moodFill').classList.toggle('low', S.mood < 30);
  }
  var toastBox = $('toasts');
  function toast(msg) {
    var d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; toastBox.appendChild(d);
    while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2600);
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function priceHtml(n) { return '<span class="price"><img src="' + ASSET + D.art.coin + '" alt="">' + n + '</span>'; }

  var sheet = { kind: null, tab: null };
  function drawTry() { // 상점 미리보기: 지금 캐릭터가 고른 옷을 입은 모습 (저장은 안 바뀜)
    var c = sheet.kind === 'shop' && $('tryCv'); if (!c) return;
    var g = c.getContext('2d'), keep = { hat: S.equip.hat, clothes: S.equip.clothes }, it = itemById[sheet.tryId];
    if (it && it.wear && it.only !== curPet().id) { // 다른 캐릭터 옷: 그 캐릭터가 입은 그림 그대로 보여 주기
      var im = img(it.img); g.clearRect(0, 0, 300, 300); if (ready(im)) g.drawImage(im, 150 - 128, 290 - 256 * (wearBy[it.only + '|' + it.id].bottom / 512), 256, 256); return;
    }
    if (it) (it.set || [it.id]).forEach(function (x) { var p = itemById[x]; if (p) S.equip[p.category] = x; });
    g.clearRect(0, 0, 300, 300);
    drawChar(g, { x: 150, foot: 284, size: 230, face: 1, t: pet.t });
    S.equip.hat = keep.hat; S.equip.clothes = keep.clothes;
  }
  var TITLES = { snack: '간식 주기', mission: '오늘의 미션', shop: '상점', wardrobe: '옷장', game: '놀이', profile: '내 프로필' };
  function openSheet(kind, tab) {
    sheet.kind = kind; sheet.tab = tab || (kind === 'shop' ? 'snack' : kind === 'wardrobe' ? 'pet' : null);
    sheet.tryId = null; sheet.tryName = '';
    $('sheet').classList.remove('hidden'); $('sheet').classList.toggle('tall', kind === 'mission' || kind === 'shop');
    $('sheetTitle').textContent = TITLES[kind]; renderSheet();
  }
  function closeSheet() { sheet.kind = null; $('sheet').classList.add('hidden'); }
  function refreshOpenSheet() { if (sheet.kind) renderSheet(); }
  function tabs(list) {
    var t = $('tabs'); t.innerHTML = ''; t.classList.toggle('hidden', !list);
    (list || []).forEach(function (k) {
      var b = el('button', sheet.tab === k ? 'on' : '', k === 'snack' ? '간식' : CAT_NAMES[k]);
      b.onclick = function () { sheet.tab = k; renderSheet(); }; t.appendChild(b);
    });
  }
  function renderSheet() {
    var body = $('sheetBody'), k = sheet.kind; body.innerHTML = ''; updateHud();
    $('sheet').classList.toggle('tall', k === 'mission' || k === 'shop' || (k === 'wardrobe' && sheet.tab === 'pet'));
    if (k === 'snack') {
      tabs(null);
      var have = D.snacks.filter(function (s) { return snackCount(s.id) > 0; });
      if (!have.length) { body.appendChild(el('div', 'empty', '간식이 없어요.<br>상점에서 사 오거나 미션 보상으로 받아요!')); var go = el('button', 'primary', '상점 가기'); go.style.cssText = 'display:block;margin:0 auto;padding:10px 24px;border-radius:14px;font-size:16px'; go.onclick = function () { openSheet('shop', 'snack'); }; body.appendChild(go); return; }
      var g = el('div', 'grid'); body.appendChild(g);
      have.forEach(function (s) {
        var c = el('div', 'card', '<span class="badge">' + snackCount(s.id) + '개</span><img class="thumb" src="' + ASSET + s.img + '" alt=""><div class="nm">' + esc(s.name) + '</div><div class="sub">배부름 +' + s.hunger + ' · 호감 +' + s.aff + '</div>');
        var b = el('button', 'primary', '주기'); b.onclick = function () { feed(s.id); renderSheet(); }; c.appendChild(b); g.appendChild(c);
      });
    } else if (k === 'shop') {
      tabs(['snack', 'hat', 'clothes', 'costume', 'set', 'skin']);
      var g2 = el('div', 'grid'); body.appendChild(g2);
      if (sheet.tab === 'snack') D.snacks.forEach(function (s) {
        var c = el('div', 'card', (snackCount(s.id) ? '<span class="badge">' + snackCount(s.id) + '개</span>' : '') + '<img class="thumb" src="' + ASSET + s.img + '" alt=""><div class="nm">' + esc(s.name) + '</div><div class="sub">배부름 +' + s.hunger + ' · 호감 +' + s.aff + '</div>');
        var b = el('button', 'primary', '사기 ' + priceHtml(s.price)); b.disabled = S.coins < s.price; b.onclick = function () { buySnack(s.id); renderSheet(); }; c.appendChild(b); g2.appendChild(c);
      });
      var list = sheet.tab === 'snack' ? [] : D.items.filter(function (i) { return tabOf(i) === sheet.tab; });
      // 입을 수 있는 옷 먼저 (지금 캐릭터 옷 → 다른 캐릭터 옷 → 업데이트 예정)
      var rank = function (i) { return i.soon ? (i.only === curPet().id ? 0.5 : 2) : (i.wear && i.only !== curPet().id) ? 1 : 0; };
      list = list.map(function (i, n) { return [i, n]; }).sort(function (a, b) { return rank(a[0]) - rank(b[0]) || a[1] - b[1]; }).map(function (x) { return x[0]; });
      if (sheet.tab !== 'snack' && sheet.tab !== 'skin' && list.some(function (i) { return !i.soon; })) { // 입어 보기 미리보기
        var tw = el('div', 'tryOn', '<canvas id="tryCv" width="300" height="300"></canvas><div class="tryTxt"><b id="tryName">' + esc(sheet.tryName || '그림을 눌러 보세요') + '</b><br>옷 그림을 누르면 입은 모습을 크게 봐요</div>');
        body.insertBefore(tw, g2);
      }
      list.forEach(function (it) {
        if (it.soon) { // 업데이트 예정: 그림 대신 물음표
          var cs = el('div', 'card soon', '<div class="thumb qmark">?</div><div class="nm">' + esc(it.name) + '</div><div class="sub">' + (it.only && petById[it.only] ? '<span class="only">' + esc(petById[it.only].name) + ' 전용</span> ' : '') + '업데이트 예정</div>');
          var bs = el('button', '', '업데이트 예정'); bs.disabled = true; cs.appendChild(bs); g2.appendChild(cs); return;
        }
        var who = it.wear ? '<span class="only">' + esc(petById[it.only].name) + ' 전용</span> ' : '';
        var c = el('div', 'card' + (it.set ? ' set' : '') + (sheet.tryId === it.id ? ' trying' : ''), '<img class="thumb" src="' + ASSET + it.img + '" alt="" style="' + thumbStyle(it) + '"><div class="nm">' + esc(it.name) + '</div><div class="sub">' + who + esc(it.desc || '') + '</div>');
        var b;
        if (owned(it) || (it.set && it.set.every(function (x) { return S.owned.indexOf(x) >= 0; }))) { b = el('button', '', '갖고 있어요'); b.disabled = true; }
        else { b = el('button', 'primary', '사기 ' + priceHtml(it.price)); b.disabled = S.coins < it.price; b.onclick = function () { buyItem(it.id); renderSheet(); }; }
        c.appendChild(b); g2.appendChild(c);
        if (it.category !== 'skin') c.querySelector('img').onclick = function () { sheet.tryId = it.id; sheet.tryName = it.name; renderSheet(); };
      });
    } else if (k === 'wardrobe') {
      tabs(['pet', 'clothes', 'costume', 'skin']);
      if (sheet.tab === 'pet') {
        body.appendChild(overlayBox()); // 화면 친구는 안드로이드 앱 전용: 웹/아이폰에선 메뉴를 숨겨요
        var gp = el('div', 'grid'); body.appendChild(gp);
        D.pets.forEach(function (p) {
          var on = S.pet === p.id;
          var c = el('div', 'card' + (on ? ' on' : ''), '<img class="thumb av" src="' + ASSET + p.avatar + '" alt=""><div class="nm">' + esc(p.name) + '</div><div class="sub">Lv.' + levelOf((S.affectionByPet || {})[p.id] || 0) + ' · 호감 ' + ((S.affectionByPet || {})[p.id] || 0) + '</div>');
          var b = el('button', on ? '' : 'primary', on ? '함께하는 중' : '함께하기'); b.disabled = on;
          b.onclick = function () { selectPet(p.id); renderSheet(); }; c.appendChild(b);
          {
            var ck = el('label', 'ovPick'); var input = document.createElement('input'); input.type = 'checkbox'; input.dataset.overlayPet = p.id;
            input.checked = (S.overlayPets || [S.pet]).indexOf(p.id) >= 0;
            input.onchange = function () { S.overlayPets = S.overlayPets || [S.pet]; if (input.checked) { if (S.overlayPets.indexOf(p.id) < 0) S.overlayPets.push(p.id); } else S.overlayPets = S.overlayPets.filter(function (id) { return id !== p.id; }); save(); nativeSync(); renderSheet(); };
            ck.appendChild(input); ck.appendChild(document.createTextNode('홈에 소환')); c.appendChild(ck);
            var sizeLabel=el('label','petSize','크기 <output>'+Math.round(((S.petSizes||{})[p.id]||S.overlayScale||1)*100)+'%</output>');var sizeInput=document.createElement('input');sizeInput.type='range';sizeInput.min=50;sizeInput.max=250;sizeInput.value=Math.round(((S.petSizes||{})[p.id]||S.overlayScale||1)*100);sizeInput.dataset.petSize=p.id;sizeInput.setAttribute('aria-label',p.name+' 크기');
            sizeInput.oninput=function(){S.petSizes=S.petSizes||{};S.petSizes[p.id]=+sizeInput.value/100;sizeLabel.querySelector('output').textContent=sizeInput.value+'%';save();nativeSync();};sizeLabel.appendChild(sizeInput);c.appendChild(sizeLabel);
          }
          gp.appendChild(c);
        });
        return;
      }
      var mine = D.items.filter(function (i) { return tabOf(i) === sheet.tab && owned(i); });
      if (!mine.length) { body.appendChild(el('div', 'empty', '아직 ' + CAT_NAMES[sheet.tab] + '이(가) 없어요. 상점에서 사 오세요!')); return; }
      var g3 = el('div', 'grid'); body.appendChild(g3);
      mine.sort(function (a, b) { return (a.wear && a.only !== curPet().id ? 1 : 0) - (b.wear && b.only !== curPet().id ? 1 : 0); });
      mine.forEach(function (it) {
        if (it.wear && it.only !== curPet().id) { // 다른 캐릭터가 그려진 옷: 이 캐릭터는 아직 못 입어요
          var cl2 = el('div', 'card soon', '<div class="thumb qmark">?</div><div class="nm">' + esc(it.name) + '</div><div class="sub">' + esc(petById[it.only].name) + ' 전용 · ' + esc(petName()) + '는 업데이트 예정</div>');
          var bl = el('button', '', '업데이트 예정'); bl.disabled = true; cl2.appendChild(bl); g3.appendChild(cl2); return;
        }
        var on = equipped(it);
        var c = el('div', 'card' + (on ? ' on' : ''), '<img class="thumb" src="' + ASSET + it.img + '" alt="" style="' + thumbStyle(it) + '"><div class="nm">' + esc(it.name) + '</div>');
        var b = el('button', on ? '' : 'primary', on ? (it.category === 'skin' ? '입는 중' : '벗기') : '입히기');
        if (on && it.category === 'skin' && it.id === defaultSkin()) b.disabled = true;
        b.onclick = function () { toggleEquip(it.id); renderSheet(); }; c.appendChild(b); g3.appendChild(c);
      });
    } else if (k === 'mission') {
      tabs(null);
      body.appendChild(el('div', 'sub', '<p style="margin:0 0 8px;color:#9a8c9c;font-size:13px">매일 밤 12시에 새 미션으로 바뀌어요</p>'));
      D.missions.forEach(function (m) {
        var p = prog(m), r = el('div', 'mrow');
        var rew = '보상: ' + m.coins + ' 코인' + (m.snack && snackById[m.snack] ? ' + ' + snackById[m.snack].name + ' ' + (m.snackCount || 1) + '개' : '');
        r.innerHTML = '<div class="info"><div class="t">' + esc(m.title) + '</div><div class="r">' + rew + ' · ' + p.p + '/' + m.target + '</div><div class="track"><div class="fill" style="width:' + (p.p / m.target * 100) + '%"></div></div></div>';
        var b = el('button', canClaim(m) ? 'primary' : '', p.c ? '완료 ✓' : canClaim(m) ? '받기' : '진행 중');
        b.disabled = !canClaim(m); b.onclick = function () { claim(m); renderSheet(); }; r.appendChild(b); body.appendChild(r);
      });
    } else if (k === 'profile') {
      tabs(null);
      var cu = HPAuth.current();
      if (!cu) { body.appendChild(el('div', 'empty', '로그인하지 않았어요')); return; }
      var pc = el('div', 'ovl', '<b>' + esc(cu.nick) + '</b><br>프로필 사진: ' + esc(petName()) + ' (함께하는 캐릭터)<br><span class="note">기록은 이 폰에 저장돼요. 서버 연결 시 계정 복구와 친구 채팅을 쓸 수 있어요.</span>');
      body.appendChild(pc);
      body.appendChild(CHEER.settings());
      var bs = el('div', 'btns'), lo = el('button', 'primary', '로그아웃 / 친구 바꾸기'); lo.onclick = logout; bs.appendChild(lo); pc.appendChild(bs);
      var pw = el('div', 'ovl', '<b>비밀번호 바꾸기</b><div class="pinRow"><input id="pinOld" inputmode="numeric" maxlength="4" placeholder="지금 비밀번호" type="password"><input id="pinNew" inputmode="numeric" maxlength="4" placeholder="새 비밀번호 4자리" type="password"></div>');
      var cb = el('button', '', '바꾸기'); cb.onclick = function () {
        var oldP=$('pinOld').value,newP=$('pinNew').value;
        if(!/^\d{4}$/.test(newP)){toast('새 비밀번호는 숫자 4자리예요');return;}
        var chk=HPAuth.login(cu.id,oldP); if(!chk.ok){toast(chk.msg);return;}
        var done=function(){var r=HPAuth.changePin(oldP,newP);oldP=newP='';toast(r.ok?'비밀번호를 바꿨어요':r.msg);if(r.ok)renderSheet();};
        if(cu.cloud){cb.disabled=true;HPCloud.changePin(oldP,newP).then(done).catch(function(e){oldP=newP='';toast(HPCloud.error(e));cb.disabled=false;});} else done();
      };
      var b2 = el('div', 'btns'); b2.appendChild(cb); pw.appendChild(b2); body.appendChild(pw);
      var dl = el('div', 'ovl', '<b>프로필 지우기</b><br><span class="note">이 폰의 프로필과 저장 기록을 지워요. 서버 계정은 지우지 않으며, 계정 복구로 돌아올 수 있어요.</span><div class="pinRow"><input id="pinDel" inputmode="numeric" maxlength="4" placeholder="비밀번호" type="password"></div>');
      var db = el('button', '', '이 프로필 지우기'); db.onclick = function () {
        if (!confirm(cu.nick + ' 프로필을 정말 지울까요?')) return;
        var r = HPAuth.remove(cu.id, $('pinDel').value); if (!r.ok) { toast(r.msg); return; }
        nCall('configureCheer',JSON.stringify({enabled:false})); S = null; nCall('setOverlay', false, overlayCfg()); location.reload();
      };
      var b3 = el('div', 'btns'); b3.appendChild(db); dl.appendChild(b3); body.appendChild(dl);
      // 백업 코드: 아이폰은 오래 안 열면 기록이 지워질 수 있어서, 코드로 복사해 두고 다시 불러올 수 있어요
      var bk = el('div', 'ovl', '<b>🔑 백업 코드</b><br><span class="note">' + (NATIVE ? '폰을 바꾸거나 앱을 지울 때' : '아이폰은 오래 안 열면 기록이 지워질 수 있어요.') +
        ' 코드를 카톡 나에게 보내기나 메모에 붙여 두면, 로그인 화면의 "백업 코드로 불러오기"로 되살릴 수 있어요. (비밀번호도 그대로예요)</span><textarea id="bkCode" readonly placeholder="아래 버튼을 눌러 주세요"></textarea>');
      var mk = el('button', 'primary', '백업 코드 만들고 복사');
      mk.onclick = function () {
        save(); var code = HPAuth.exportCode(), ta = $('bkCode'); ta.value = code;
        var done = function () { toast('백업 코드를 복사했어요! 메모나 카톡에 붙여 두세요'); };
        try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done, function () { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('코드를 길게 눌러 복사해 주세요'); } }); return; } } catch (e) {}
        ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('코드를 길게 눌러 복사해 주세요'); }
      };
      var b4 = el('div', 'btns'); b4.appendChild(mk); bk.appendChild(b4); body.appendChild(bk);
      if (!NATIVE) { var ins = el('div', 'ovl', '<b>📲 설치 방법</b><br><span class="note">홈 화면에 추가하는 방법, 안드로이드 앱 받는 방법</span><div class="btns"><a class="btnLink" href="install.html">설치 방법 보기</a></div>'); body.appendChild(ins); }
    } else if (k === 'game') {
      tabs(null);
      var gg = el('div', 'grid games'); body.appendChild(gg);
      var ca = el('div', 'card arCard', '<div class="gIco">📷</div><div class="nm">보물찾기 AR</div><div class="sub">카메라로 친구랑 보물 찾기</div>');
      var ba = el('button', 'primary', '하기'); ba.onclick = function () { closeSheet(); AR.open(); }; ca.appendChild(ba); gg.appendChild(ca);
      Object.keys(MINI.games).forEach(function (kk) {
        var gm = MINI.games[kk], c = el('div', 'card', '<div class="gIco">' + gm.icon + '</div><div class="nm">' + gm.name + '</div><div class="sub">최고 ' + ((S.bests && S.bests[kk]) || 0) + '점</div>');
        var b = el('button', 'primary', '하기'); b.onclick = function () { closeSheet(); MINI.start(kk); }; c.appendChild(b); gg.appendChild(c);
      });
      body.appendChild(el('div', 'sub', '<p style="margin:10px 0 0;color:#9a8c9c;font-size:13px;text-align:center">' + esc(petName()) + '와 함께 놀아요! 점수만큼 코인을 받아요</p>'));
    }
  }
  function thumbStyle(it) { // 새 옷 그림은 딱 맞게 잘라 둬서 통째로 보여 주기
    return it.category === 'skin' ? '' : 'object-fit:contain;padding:4px;box-sizing:border-box;';
  }
  Array.prototype.forEach.call(document.querySelectorAll('#bottom button'), function (b) {
    b.addEventListener('click', function () { var k = b.getAttribute('data-open'); if (sheet.kind === k) closeSheet(); else openSheet(k); });
  });
  $('sheetClose').onclick = closeSheet;
  $('petName').onclick = function () { openSheet('wardrobe', 'pet'); };
  $('socialBtn').onclick = function () { save(); HPSocial.open(); };
  $('profBtn').onclick = function () { if (sheet.kind === 'profile') closeSheet(); else openSheet('profile'); };

  // ───────── 화면 친구 (안드로이드: 앱을 꺼도 화면 위를 돌아다니기) ─────────
  var NATIVE = window.HPNative || null;
  function nCall(fn, a, b) { try { return NATIVE && NATIVE[fn] ? NATIVE[fn](a, b) : null; } catch (e) { console.warn(e); return null; } }
  function overlayCfgFor(id) {
    var c = petById[id] || curPet(), cl = id === S.pet ? S.equip.clothes : (S.petOutfits || {})[id];
    var w = wearBy[id + '|' + cl], it = itemById[cl]; if (!it || S.owned.indexOf(cl) < 0 || it.only !== id) w = null;
    var list = c.poses.map(function (q) {
      var p = w || q;
      return { id: q.id, img: 'www/assets/' + p.img, tags: q.tags, footY: p.footY || 0, cx: p.cx, bottom: p.bottom, headTop: p.headTop };
    });
    var dp = w ? dressBy[id + '|' + cl] : null;
    if (dp) list.push({ id: 'dress', img: 'www/assets/' + dp.img, tags: [], footY: 0, cx: dp.cx, bottom: dp.bottom, headTop: dp.headTop });
    return { id: c.id, name: c.name, poses: list, lines: ovLines(c.id), scale: (S.petSizes || {})[id] || S.overlayScale || 1 };
  }
  function overlayCfg() {
    if (!S) return '{}';
    var o = overlayCfgFor(S.pet);
    o.pets = (S.overlayPets || [S.pet]).filter(function (id) { return !!petById[id]; }).map(overlayCfgFor);
    return JSON.stringify(o);
  }
  function ovLines(id) {
    var pl = (D.petLines && D.petLines[id]) || {}, o = {};
    ['pet', 'tap', 'happy', 'sleep', 'hungry', 'idle', 'greet', 'cheer'].forEach(function (k) { o[k] = pl[k] || D.lines[k] || D.lines.happy; });
    o.overlay = pl.idle ? pl.idle.concat(pl.tap || []) : D.lines.overlay;
    return o;
  }
  function nativeSync() { if (NATIVE) nCall('updatePet', overlayCfg()); if (CHEER) CHEER.syncNative(); }
  function overlayBox() {
    var d = el('div', 'ovl');
    if (!NATIVE) { d.innerHTML = '<b>함께 걷는 친구들</b><br>아래에서 여러 친구를 골라요. 각자 걸어 다니고 톡 누르면 말해요.<br><span class="note">아이폰/웹은 앱 안에서만 걸어요. Android는 다른 앱 위에도 띄울 수 있어요. 선택이 없으면 현재 친구 한 명만 보여요.</span>'; overlaySizeControls(d); return d; }
    var on = !!nCall('isOverlayOn'), perm = !!nCall('hasOverlayPermission');
    d.innerHTML = '<b>화면 친구 ' + (on ? '켜짐 ✓' : '꺼짐') + '</b><br>아래에서 여러 친구를 소환할 수 있어요 (' + (S.overlayPets || [S.pet]).length + '명). 친구별로 마지막에 입힌 옷을 기억해요. 톡: 말하기 · 두 번 톡: 앱 열기 · 끌기: 이동.' +
      (perm ? '' : '<br><span class="note">처음에는 "다른 앱 위에 표시" 허용이 필요해요.</span>');
    var bs = el('div', 'btns'), t = el('button', on ? '' : 'primary', on ? '화면 친구 끄기' : '화면 친구 켜기');
    t.onclick = function () {
      if (on) { nCall('setOverlay', false, overlayCfg()); toast('화면 친구를 껐어요'); }
      else {
        if (!(S.overlayPets || []).length) { toast('아래에서 소환할 친구를 골라 주세요'); return; }
        var r = nCall('setOverlay', true, overlayCfg());
        if (r === 'need_permission') toast('"다른 앱 위에 표시"를 허용하고 돌아오면 켜져요');
        else toast('켜졌어요! 앱을 나가면 ' + iga(petName()) + ' 화면에 나타나요');
      }
      setTimeout(refreshOpenSheet, 300);
    };
    bs.appendChild(t);
    if (!perm) { var p = el('button', '', '권한 설정 열기'); p.onclick = function () { nCall('openOverlaySettings'); }; bs.appendChild(p); }
    d.appendChild(bs);
    overlaySizeControls(d); return d;
  }
  function overlaySizeControls(d) {
    var sz = el('label', 'ovSize', '전체 크기 <output id="ovSizeValue">' + Math.round((S.overlayScale || 1) * 100) + '%</output>');
    var sl = document.createElement('input'); sl.type = 'range'; sl.id = 'ovSize'; sl.min = '50'; sl.max = '250'; sl.step = '1'; sl.value = Math.round((S.overlayScale || 1) * 100); sl.setAttribute('aria-label', '화면 친구 크기');
    sl.onchange=refreshOpenSheet;
    sl.oninput = function () { S.overlayScale = +sl.value / 100; S.petSizes={}; $('ovSizeValue').textContent = sl.value + '%'; save(); nativeSync(); };
    sz.appendChild(sl); d.appendChild(sz); return d;
  }

  // ───────── 놀이 (minigames.js) ─────────
  var MINI = window.HP_MINI({
    D: D, img: img, ready: ready, drawChar: drawChar, curId: function () { return curPet().id; },
    pet: function (id) { return petById[id] || D.pets[0]; },
    say: function () {},
    finish: function (kind, score, coins, win) {
      if (!S.bests) S.bests = {};
      var best = score > (S.bests[kind] || 0); S.bests[kind] = Math.max(S.bests[kind] || 0, score);
      S.coins += coins; report('play', 1);
      if (kind === 'catch') report('score', score);
      if (kind === 'memory' && win) report('memory', 1);
      S.mood = Math.min(100, S.mood + (win ? 12 : 6)); if (win) addAffection(2);
      save(); updateHud(); lastMini = win ? 'win' : 'lose';
      $('miniEndTitle').textContent = win ? '잘했어요!' : '놀이 끝!';
      $('miniResult').innerHTML = MINI.games[kind].name + ' ' + score + '점<br>+' + coins + ' 코인' + (best && score > 0 ? '<br>🎉 최고 기록!' : '');
      var who = $('miniWho'); who.src = ASSET + curPet().avatar;
      $('miniLine').textContent = line(win ? 'win' : 'lose');
      $('miniEnd').classList.remove('hidden');
    },
  });
  var lastMini = null;
  function closeMini() { MINI.stop(); $('miniEnd').classList.add('hidden'); if (lastMini) { pet.happy = lastMini === 'win' ? 1.5 : 0; talk(lastMini, 2.8); lastMini = null; } }
  $('miniOk').onclick = closeMini;
  $('miniAgain').onclick = function () { $('miniEnd').classList.add('hidden'); lastMini = null; MINI.again(); };
  $('miniQuit').onclick = function () { if (MINI.over()) closeMini(); else MINI.stop(); };

  // 안드로이드 뒤로 가기 버튼: 열린 창이 있으면 닫기 (true = 처리함)
  // ───────── 보물찾기 AR (ar.js) ─────────
  var AR = window.HP_AR({
    D: D, img: img, ready: ready, drawChar: drawChar, asset: ASSET,
    reward: function () { // 보물 하나: 코인 또는 간식 + 호감도
      var r;
      if (Math.random() < 0.55) { var c = 10 + Math.floor(Math.random() * 16); S.coins += c; r = { text: '코인 +' + c, img: D.art.coin }; }
      else { var sn = pick(D.snacks); addSnack(sn.id, 1); r = { text: sn.name + ' +1', img: sn.img }; }
      addAffection(2); S.mood = Math.min(100, S.mood + 4); save(); updateHud(); return r;
    },
    finish: function (n) { report('play', 1); S.mood = Math.min(100, S.mood + 8); save(); updateHud(); },
    closed: function () { save(); updateHud(); }
  });
  window.HP_ARX = AR;
  window.hpBack = function () {
    if (window.HPSocial && HPSocial.back()) return true;
    if (AR.running()) { AR.close(); return true; }
    if (MINI.running()) { if (MINI.over()) closeMini(); else MINI.stop(); return true; }
    if (sheet.kind) { closeSheet(); return true; }
    save(); return false;
  };
  window.hpPause = function () { save(); };

  var COMP = window.HP_COMPANIONS({state:function(){return S;},ids:homeIds,width:function(){return W;},height:visibleH,size:homeSizeFor,config:overlayCfgFor,drawChar:drawChar,stage:stage});
  var CHEER = window.HP_CHEER({ state:function(){return S;}, pet:curPet, line:line, say:function(text,dur,kind){if(homeHasMain())say(text,dur,kind);else toast(petName()+': '+text);}, save:save, native:NATIVE, nCall:nCall });
  window.hpCheerNative = function (text) { if(started){if(homeHasMain())say(text,6,'happy');else toast(petName()+': '+text);} };
  // ───────── 시작 / 반복 ─────────
  var last = 0, acc = { save: 0, daily: 0, hud: 0 };
  function loop(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    timeStep(); update(dt); draw(); drawTry();
    acc.save += dt; acc.daily += dt; acc.hud += dt;
    if (acc.save >= 20) { acc.save = 0; save(); }
    if (acc.daily >= 5) { acc.daily = 0; checkDaily(); }
    if (acc.hud >= 0.25) { acc.hud = 0; updateHud(); }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function () { if (!started) return; if (document.hidden) save(); else { timeStep(); checkDaily(); updateHud(); refreshOpenSheet(); if(CHEER) CHEER.opened(); } });
  window.hpResume = function () { refreshOpenSheet(); };
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', resize);
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // 테스트용 (개발자 도구 콘솔에서 사용): HP.addCoins(500), HP.skipHours(3), HP.nextDay(), HP.reset()
  window.HP = {
    drawChar: drawChar, overlayCfg: overlayCfg, wearFor: wearFor, itemLayer: itemLayer, equip: function (o) { Object.keys(o).forEach(function (k) { S.equip[k] = o[k]; }); },
    state: function () { return S; }, save: save, feed: feed, buyItem: buyItem, buySnack: buySnack, toggleEquip: toggleEquip, claim: function (id) { claim(D.missions.filter(function (m) { return m.id === id; })[0]); },
    addCoins: function (n) { S.coins += n; save(); updateHud(); },
    skipHours: function (h) { offline(h); save(); updateHud(); },
    nextDay: function () { S.missionDate = ''; checkDaily(); },
    reset: function () { localStorage.removeItem(SAVE_KEY); newGame(); checkDaily(); save(); updateHud(); },
    addAffection:addAffection, cheer:CHEER, companions:COMP, homeIds:homeIds,
    pet: pet, selectPet: selectPet, say: say, mini: MINI, auth: window.HPAuth, line: line, curPose: function () { return curPose().id; }, openSheet: openSheet, closeSheet: closeSheet, level: level,
  };

  // ───────── 로딩 화면: 친구 3명이 달려가요 ─────────
  var splash = { on: true, t: 0, last: 0, who: [] };
  (function () {
    var ids = D.pets.map(function (p) { return p.id; });
    for (var i = 0; i < 3; i++) splash.who.push(ids.splice(Math.floor(Math.random() * ids.length), 1)[0]);
    splash.who.forEach(function (id) { img(petById[id].poses[0].img); });
  })();
  function splashLoop(now) {
    if (!splash.on) return;
    var c = $('splashCv'), g = c.getContext('2d'), r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
    var dt = splash.last ? Math.min(0.05, (now - splash.last) / 1000) : 0.016; splash.last = now; splash.t += dt;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    var size = Math.min(r.width * 0.3, 150), span = r.width + size * 3.2, foot = r.height * 0.8;
    g.fillStyle = '#bfe3a8'; g.fillRect(0, foot - 2, r.width, r.height - foot + 2);
    splash.who.forEach(function (id, i) {
      var x = ((splash.t * r.width * 0.42 + i * size * 0.95) % span) - size;
      drawChar(g, { pd: petById[id].poses[0], x: x, foot: foot + Math.sin(splash.t * 16 + i) * 1.5, size: size * (i === 1 ? 1 : 0.88), face: 1, walking: true, run: true, t: splash.t + i * 0.3, plain: true });
    });
    $('splashFill').style.width = Math.round(Math.min(1, Math.max(loadProgress, splash.t / 2)) * 100) + '%';
    requestAnimationFrame(splashLoop);
  }
  requestAnimationFrame(splashLoop);
  function hideSplash() {
    var sp = $('splash'); sp.classList.add('fade');
    setTimeout(function () { splash.on = false; sp.classList.add('hidden'); }, 450);
  }

  // ───────── 프로필 (로그인) ─────────
  function boot() {
    var cur = window.HPAuth && HPAuth.current();
    if (!cur) { HPAuth.show(function (info) { start(info); }); return; }
    start();
  }
  function logout() { save(); nCall('configureCheer',JSON.stringify({enabled:false})); HPAuth.logout(); nCall('setOverlay', false, overlayCfg()); location.reload(); }

  function start(info) {
    var cur = window.HPAuth && HPAuth.current();
    if (cur) SAVE_KEY = HPAuth.saveKey(cur.id);
    var existed = load(); started = true;
    if (!existed && info && info.pet && petById[info.pet]) S.pet = info.pet;
    initProgress();
    if (cur) { HPAuth.setPet(S.pet); hudProf = ''; }
    if (info && info.migrated) toast('예전 저장 기록을 ' + cur.nick + ' 프로필로 옮겼어요');
    offline((Date.now() - S.lastSave) / 3600000); refundNote();
    lastTick = Date.now();
    checkDaily(); if (!existed) say('안녕! 나는 ' + petName() + '! 잘 부탁해요~', 3.5, 'greet'); else talk('greet', 3);
    resize(); var b = bounds(); pet.x = pet.tx = (b.x0 + b.x1) / 2; pet.y = pet.ty = (b.y0 + b.y1) / 2;
    updateHud(); updateDot(); save(); nativeSync();
    if (window.HPCloud) { HPCloud.session(HPAuth.current()); HPCloud.sync(true); }
    CHEER.opened();
    requestAnimationFrame(loop);
  }
  var fontReady = (document.fonts && document.fonts.load) ? document.fonts.load('20px Jua', '가') : Promise.resolve();
  var minSplash = new Promise(function (r) { setTimeout(r, 2000); });
  Promise.all([Promise.race([fontReady, new Promise(function (r) { setTimeout(r, 2500); })]), preload(), minSplash])
    .then(function () { hideSplash(); boot(); }, function (e) { console.warn(e); hideSplash(); boot(); });
})();
