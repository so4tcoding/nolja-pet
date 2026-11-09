// ===== 보물찾기 AR: 카메라(뒤쪽) 화면 위에 먼작귀 친구가 나타나고, 친구가 보물이 있는 쪽을 알려 줘요 =====
// 그림은 게임에 원래 있던 캐릭터 그림·간식 그림·코인/하트/별 그림과 이모지(🎁)만 써요. game.js 가 api 를 넘겨줘요.
window.HP_AR = function (api) {
  'use strict';
  var D = api.D, $ = function (id) { return document.getElementById(id); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var wrap = function (d) { d = ((d + 180) % 360 + 360) % 360 - 180; return d; };   // -180..180
  var R2D = 180 / Math.PI, D2R = Math.PI / 180;
  var box = $('ar'), vid = $('arVid'), cv = $('arCv'), g = cv.getContext('2d'), W = 300, H = 600, DPR = 1;
  var A = null;              // 지금 놀이 상태
  var stream = null, raf = 0, lastT = 0;
  var view = { yaw: 0, pitch: 0, ty: 0, tp: 0, sensor: false, got: false, cam: false };
  var FOVV = 62;             // 세로 화면 기준 대략적인 카메라 시야(도)
  function fovH() { return FOVV * W / H; }

  function resize() {
    var r = box.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', function () { if (A) resize(); });

  // ── 폰 방향 → 카메라가 보는 방향(좌우 yaw, 위아래 pitch) ──
  // 회전 행렬 R = Rz(alpha)·Rx(beta)·Ry(gamma) 에서 뒤 카메라 방향(0,0,-1)을 계산: 폰을 세워 들어도 안 흔들려요
  function onOrient(e) {
    if (!A || e.alpha === null || e.alpha === undefined) return;
    var a = e.alpha * D2R, b = (e.beta || 0) * D2R, c = (e.gamma || 0) * D2R;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(c), sg = Math.sin(c);
    var vx = -ca * sg - sa * sb * cg, vy = -sa * sg + ca * sb * cg, vz = -cb * cg;
    view.ty = Math.atan2(vx, vy) * R2D; view.tp = Math.asin(clamp(vz, -1, 1)) * R2D;
    if (!view.got) { view.yaw = view.ty; view.pitch = view.tp; view.got = true; }
    view.sensor = true;
  }
  window.addEventListener('deviceorientation', onOrient);

  // ── 화면 끌어서 둘러보기 (카메라·센서가 없을 때) + 누르기 ──
  var drag = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', function (e) { if (!A) return; var p = pos(e); drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; });
  cv.addEventListener('pointermove', function (e) {
    if (!A || !drag) return; var p = pos(e);
    if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 8) drag.moved = true;
    if (!view.sensor) { view.ty -= (p.x - drag.x) * fovH() / W; view.tp = clamp(view.tp + (p.y - drag.y) * FOVV / H, -45, 45); }
    drag.x = p.x; drag.y = p.y;
  });
  window.addEventListener('pointerup', function (e) { if (!A || !drag) return; var d = drag; drag = null; if (!d.moved) tap(d.sx, d.sy); });

  // ── 월드(방향) → 화면 좌표 ──
  function proj(yaw, pitch) {
    var dx = wrap(yaw - view.yaw), dy = pitch - view.pitch;
    return { x: W / 2 + dx / fovH() * W, y: H / 2 - dy / FOVV * H, dx: dx, dy: dy };
  }

  // ── 말풍선 ──
  var bubT = 0;
  function say(t, dur) { var b = $('arBubble'); b.textContent = t; b.classList.remove('hidden'); bubT = dur || 0; }
  function lineOf(id, kind) { var pl = D.petLines && D.petLines[id]; var a = (pl && pl[kind]) || D.lines[kind] || D.lines.tap; return pick(a); }

  // ── 시작 / 끝 ──
  function open() {
    box.classList.remove('hidden'); $('arStart').classList.remove('hidden'); $('arEnd').classList.add('hidden'); $('arBubble').classList.add('hidden');
    $('arMode').textContent = ''; $('arCount').textContent = ''; A = { phase: 'ready', t: 0 }; resize(); loop();
  }
  function begin() {
    $('arStart').classList.add('hidden');
    var needPerm = window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function';
    var p1 = needPerm ? DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }) : Promise.resolve('granted');  // 아이폰: 버튼을 눌렀을 때만 물어볼 수 있어요
    var p2 = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ?
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (s) {
        stream = s; vid.srcObject = s; vid.setAttribute('playsinline', ''); vid.muted = true; var pp = vid.play(); if (pp && pp.catch) pp.catch(function () {}); return true;
      }).catch(function (e) { console.warn('camera', e && e.name); return false; }) : Promise.resolve(false);
    Promise.all([p1, p2]).then(function (r) {
      view.cam = !!r[1]; box.classList.toggle('noCam', !view.cam);
      setTimeout(function () { // 센서 값이 안 들어오면 끌어서 둘러보기
        if (!A) return;
        if (!view.sensor) { view.yaw = view.ty = 0; view.pitch = view.tp = 0; }
        $('arMode').textContent = (view.cam ? '📷 카메라' : '🌸 카메라 없음') + ' · ' + (view.sensor ? '폰을 돌려서 둘러봐요' : '화면을 끌어서 둘러봐요');
        setup();
      }, 700);
    });
  }
  function setup() {
    var f = pick(D.pets);
    A = { phase: 'seek', t: 0, friend: { id: f.id, pet: f, yaw: view.yaw + (Math.random() < 0.5 ? -1 : 1) * rnd(90, 170), pitch: rnd(-10, 2) },
          treasures: [], found: 0, got: [], hintT: 0 };
    say((view.sensor ? '폰을 천천히 돌려 봐요…' : '화면을 끌어서 둘러봐요…') + ' 어디선가 먼작귀 소리가 나요!', 0);
    $('arCount').textContent = '';
  }
  function makeTreasures() {
    var n = Math.random() < 0.5 ? 2 : 3, list = [], base = A.friend.yaw, tries = 0;
    while (list.length < n && tries++ < 200) {
      var y = base + (Math.random() < 0.5 ? -1 : 1) * rnd(60, 170);
      if (list.every(function (t) { return Math.abs(wrap(t.yaw - y)) > 55; })) list.push({ yaw: y, pitch: rnd(-18, 8), found: false, pop: 0 });
    }
    A.treasures = list; $('arCount').textContent = '🎁 0 / ' + list.length;
  }
  function close() {
    A = null; box.classList.add('hidden'); cancelAnimationFrame(raf); raf = 0;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } vid.srcObject = null;
    view.sensor = false; view.got = false;
  }
  function finish() {
    A.phase = 'done'; var f = A.friend.pet;
    api.finish(A.got.length);
    $('arWho').src = api.asset + f.avatar;
    $('arEndTitle').textContent = '보물을 다 찾았어요!';
    $('arLine').textContent = lineOf(f.id, 'happy');
    $('arResult').innerHTML = f.name + '랑 찾은 보물<br>' + A.got.join('<br>');
    $('arEnd').classList.remove('hidden'); $('arBubble').classList.add('hidden');
  }

  // ── 누르기 ──
  function tap(x, y) {
    if (!A || !A.friend) return;
    var f = A.friend;
    if (A.phase === 'seek') {
      var p = proj(f.yaw, f.pitch), s = friendSize();
      if (Math.abs(x - p.x) < s * 0.45 && y > p.y - s * 0.95 && y < p.y + s * 0.1) {
        A.phase = 'met'; A.t = 0; say(f.pet.name + ': ' + lineOf(f.id, 'greet'), 2.4); makeTreasures();
      }
      return;
    }
    if (A.phase === 'guide') {
      A.treasures.forEach(function (t) {
        if (t.found || !t.shown) return;
        var p = proj(t.yaw, t.pitch);
        if (Math.hypot(x - p.x, y - p.y) < 70) {
          t.found = true; t.pop = 1.6; A.found++;
          var r = api.reward(); t.reward = r; A.got.push(r.text);
          $('arCount').textContent = '🎁 ' + A.found + ' / ' + A.treasures.length;
          say(f.pet.name + ': ' + lineOf(f.id, 'happy') + '  (' + r.text + ')', 2.4);
          if (A.found >= A.treasures.length) setTimeout(function () { if (A && A.phase === 'guide') finish(); }, 1700);
        }
      });
    }
  }
  function friendSize() { return Math.min(W, H) * 0.55; }

  // ── 그리기 ──
  function loop(now) {
    raf = requestAnimationFrame(loop);
    now = now || performance.now(); var dt = clamp((now - (lastT || now)) / 1000, 0, 0.05); lastT = now;
    if (!A) return;
    A.t += dt;
    // 부드럽게 따라가기 (흔들림 줄이기)
    var k = view.sensor ? 1 - Math.pow(0.001, dt) : 1;
    view.yaw += wrap(view.ty - view.yaw) * k; view.pitch += (view.tp - view.pitch) * k;
    if (bubT > 0) { bubT -= dt; if (bubT <= 0) $('arBubble').classList.add('hidden'); }
    g.clearRect(0, 0, W, H);
    if (A.phase === 'ready') return;
    var f = A.friend, s = friendSize(), t = A.t;
    if (A.phase === 'seek') {
      var p = proj(f.yaw, f.pitch), inView = Math.abs(p.dx) < fovH() / 2 + 15;
      if (inView) {
        api.drawChar(g, { pd: f.pet.poses[0], x: p.x, foot: p.y + Math.sin(t * 3) * 4, size: s, face: p.dx > 0 ? -1 : 1, walking: false, t: t, plain: true });
        if (Math.abs(p.dx) < fovH() * 0.3) { if (A.hintT !== 2) { say('앗! ' + f.pet.name + '! 톡 눌러 봐요', 0); A.hintT = 2; } }
      } else {
        A.hintT = A.hintT === 2 ? 1 : A.hintT;
        if (t > 6) edgeArrow(p.dx, '?');          // 한참 못 찾으면 화면 끝에 살짝 힌트
      }
      return;
    }
    // 만난 뒤: 친구는 화면 아래 왼쪽에서 같이 다녀요 (화면에 붙어 있음)
    var tg = null, best = 999;
    A.treasures.forEach(function (tr) { if (!tr.found) { var d = Math.abs(wrap(tr.yaw - view.yaw)); if (d < best) { best = d; tg = tr; } } });
    if (A.phase === 'met' && A.t > 2.4) { A.phase = 'guide'; }
    A.treasures.forEach(function (tr) { drawTreasure(tr, dt); });
    var dir = tg ? wrap(tg.yaw - view.yaw) : 0;
    var fs = Math.min(W, H) * 0.36;
    api.drawChar(g, { pd: f.pet.poses[0], x: W * 0.24, foot: H - 24 - Math.abs(Math.sin(t * 5)) * 6, size: fs, face: dir < 0 ? -1 : 1, walking: false, t: t, plain: true });
    if (A.phase !== 'guide' || !tg) return;
    var pp = proj(tg.yaw, tg.pitch), msg;
    if (tg.shown) msg = '여기 있다! 눌러 봐!';
    else if (Math.abs(dir) > fovH() / 2) { msg = dir > 0 ? '이쪽이야! ▶' : '◀ 이쪽이야!'; edgeArrow(dir, dir > 0 ? '▶' : '◀'); }
    else if (Math.abs(pp.dy) > FOVV * 0.3) msg = pp.dy > 0 ? '조금 더 위쪽이야! ▲' : '조금 더 아래쪽이야! ▼';
    else msg = '거의 다 왔어! 가운데로~';
    if (bubT <= 0 && A.lastMsg !== msg) { say(f.pet.name + ': ' + msg, 0); A.lastMsg = msg; }
  }
  function edgeArrow(dx, ch) {
    var right = dx > 0, x = right ? W - 34 : 34, y = H * 0.45 + Math.sin(A.t * 6) * 6;
    g.save(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill();
    g.fillStyle = '#e0708f'; g.font = '28px Jua, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + 1); g.restore();
  }
  function drawTreasure(tr, dt) {
    var p = proj(tr.yaw, tr.pitch);
    var near = Math.abs(p.dx) < 14 && Math.abs(p.dy) < 16;     // 가운데쯤 와야 보여요
    tr.a = clamp((tr.a || 0) + (near || tr.found ? dt * 3 : -dt * 3), 0, 1);
    tr.shown = !tr.found && tr.a > 0.6;
    if (tr.a <= 0.01 && !(tr.found && tr.pop > 0)) return;
    g.save(); g.globalAlpha = tr.found ? clamp(tr.pop, 0, 1) : tr.a;
    if (!tr.found) {
      var star = api.img(D.art.star);           // 반짝이(원래 있던 별 그림)
      for (var i = 0; i < 3; i++) { var an = A.t * 2 + i * 2.1, r = 62; if (api.ready(star)) g.drawImage(star, p.x + Math.cos(an) * r - 12, p.y + Math.sin(an) * r * 0.6 - 12, 24, 24); }
      g.font = (78 + Math.sin(A.t * 5) * 4) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🎁', p.x, p.y);
    } else if (tr.pop > 0) {
      tr.pop -= dt; var up = (1.6 - tr.pop) * 40, im = api.img(tr.reward.img);
      if (api.ready(im)) g.drawImage(im, p.x - 32, p.y - 32 - up, 64, 64);
      var h = api.img(D.art.heart); if (api.ready(h)) g.drawImage(h, p.x + 26, p.y - 46 - up, 28, 28);
      g.fillStyle = '#e0708f'; g.font = '22px Jua, sans-serif'; g.textAlign = 'center'; g.fillText(tr.reward.text, p.x, p.y + 50 - up);
    }
    g.restore();
  }

  $('arGo').onclick = begin;
  $('arQuit').onclick = function () { close(); api.closed(); };
  $('arOk').onclick = function () { close(); api.closed(); };
  $('arAgain').onclick = function () { $('arEnd').classList.add('hidden'); setup(); };
  return { open: open, close: close, running: function () { return !!A; }, _state: function () { return A; }, _view: view };
};
