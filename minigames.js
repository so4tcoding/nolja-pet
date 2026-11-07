// ===== 놀이 4종: 간식 받기 / 점프 달리기 / 얼굴 짝 맞추기 / 까꿍! =====
// 모두 지금 함께하는 캐릭터가 주인공이에요. game.js 가 api 를 넘겨줘요.
window.HP_MINI = function (api) {
  'use strict';
  var D = api.D, $ = function (id) { return document.getElementById(id); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var cv = $('miniCv'), g = cv.getContext('2d'), W = 300, H = 500, DPR = 1;
  var M = null; // 지금 하는 놀이

  var GAMES = {
    catch: { name: '간식 받기', icon: '🍪', help: '손가락으로 좌우로 움직여서 떨어지는 간식을 받아요!<br>밤송이는 피하기 (−2점)', secs: D.miniGameSeconds || 25, win: 20 },
    run: { name: '점프 달리기', icon: '🏃', help: '화면을 톡 누르면 점프! (공중에서 한 번 더)<br>돌과 덤불을 넘고 별을 모아요. 하트 3개', win: 60 },
    memory: { name: '얼굴 짝 맞추기', icon: '🃏', help: '카드를 2장씩 뒤집어서 같은 친구를 찾아요!<br>90초 안에 8쌍 모두 찾기', secs: 90, win: 1 },
    peek: { name: '까꿍!', icon: '👀', help: '구멍에서 나온 친구들을 톡! 내 캐릭터는 +2점<br>밤송이는 누르지 마요 (−2점)', secs: D.miniGameSeconds || 25, win: 20 },
  };

  function resize() {
    var r = cv.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', function () { if (M) resize(); });

  // ── 입력 ──
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function down(e) { if (!M || M.over) return; var p = pos(e); M.px = p.x; M.pdown = true; if (M.onDown) M.onDown(p.x, p.y); }
  function move(e) { if (!M || !M.pdown) return; M.px = pos(e).x; }
  function up() { if (M) M.pdown = false; }
  if (window.PointerEvent) { cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }
  else {
    var tw = function (fn) { return function (e) { e.preventDefault(); var c = e.changedTouches[0]; fn({ clientX: c.clientX, clientY: c.clientY }); }; };
    cv.addEventListener('touchstart', tw(down), { passive: false }); cv.addEventListener('touchmove', tw(move), { passive: false }); cv.addEventListener('touchend', function (e) { e.preventDefault(); up(); }, { passive: false });
    cv.addEventListener('mousedown', down); window.addEventListener('mousemove', function (e) { if (M && M.pdown) move(e); }); window.addEventListener('mouseup', up);
  }

  // ── 그림 도우미 ──
  function chestnut(x, y, r, t) { // 밤송이 (피해야 하는 것)
    g.save(); g.translate(x, y); g.rotate(t || 0);
    g.strokeStyle = '#6b4a2b'; g.lineWidth = 2;
    for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); g.stroke(); }
    g.fillStyle = '#8a5a32'; g.beginPath(); g.arc(0, 0, r * 0.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(-r * 0.25, -r * 0.05, r * 0.09, 0, 7); g.arc(r * 0.25, -r * 0.05, r * 0.09, 0, 7); g.fill();
    g.restore();
  }
  function sky(top, bottom) { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  function imgAt(src, x, y, s) { var im = api.img(src); if (api.ready(im)) g.drawImage(im, x - s / 2, y - s / 2, s, s); }
  function pop(x, y, text, color) { M.fx.push({ x: x, y: y, text: text, color: color || '#ff6f91', life: 0.9 }); }
  function drawFx(dt) {
    M.fx = M.fx.filter(function (f) { f.life -= dt; f.y -= 50 * dt; return f.life > 0; });
    g.textAlign = 'center'; g.font = '22px Jua, sans-serif';
    M.fx.forEach(function (f) { g.globalAlpha = Math.min(1, f.life * 2); g.fillStyle = f.color; g.fillText(f.text, f.x, f.y); }); g.globalAlpha = 1;
  }
  function hud(timeText) { $('miniTime').textContent = timeText; $('miniScore').textContent = M.score + '점'; }

  // ───────── 1. 간식 받기 ─────────
  function initCatch() {
    M.size = Math.min(W, H) * 0.3; M.x = W / 2; M.px = W / 2; M.face = 1; M.items = []; M.spawn = 0.5; M.ouch = 0;
    M.update = function (dt) {
      var foot = H - 18, sp = Math.min(W * 1.6, 900);
      var dx = M.px - M.x; M.walking = Math.abs(dx) > 3;
      if (M.walking) { M.x += Math.max(-sp * dt, Math.min(sp * dt, dx)); M.face = dx < 0 ? -1 : 1; }
      M.x = Math.max(M.size * 0.35, Math.min(W - M.size * 0.35, M.x));
      M.spawn -= dt;
      var prog = 1 - M.t / GAMES.catch.secs;
      if (M.spawn <= 0) {
        M.spawn = rnd(0.45, 0.8) * (1 - prog * 0.45);
        var r = Math.random(), it = { x: rnd(24, W - 24), y: -30, v: rnd(150, 230) * (1 + prog * 0.8) * (H / 700 + 0.35), rot: rnd(-2, 2), a: 0 };
        if (r < 0.18) it.kind = 'bad'; else if (r < 0.26) { it.kind = 'star'; it.pts = 3; } else if (r < 0.4) { it.kind = 'coin'; it.pts = 2; } else { it.kind = 'snack'; it.pts = 1; it.src = pick(D.snacks).img; }
        M.items.push(it);
      }
      var headY = foot - M.size * 0.85;
      M.items = M.items.filter(function (it) {
        it.y += it.v * dt; it.a += it.rot * dt;
        if (Math.abs(it.x - M.x) < M.size * 0.42 && it.y > headY && it.y < foot - M.size * 0.25) {
          if (it.kind === 'bad') { M.score = Math.max(0, M.score - 2); M.ouch = 0.5; pop(it.x, it.y, '−2', '#8a5a32'); api.say('ouch'); }
          else { M.score += it.pts; M.happy = 0.4; pop(it.x, it.y, '+' + it.pts); }
          return false;
        }
        return it.y < H + 40;
      });
      if (M.happy > 0) M.happy -= dt; if (M.ouch > 0) M.ouch -= dt;
      hud(Math.max(0, Math.ceil(M.t)) + '초');
    };
    M.draw = function (dt) {
      sky('#ffe3ea', '#e8f6e0');
      g.fillStyle = '#bfe3a8'; g.fillRect(0, H - 24, W, 24);
      M.items.forEach(function (it) {
        var s = 46;
        if (it.kind === 'bad') chestnut(it.x, it.y, 17, it.a);
        else imgAt(it.kind === 'snack' ? it.src : it.kind === 'star' ? D.art.star : D.art.coin, it.x, it.y, it.kind === 'snack' ? s : 36);
      });
      var hopY = M.happy > 0 ? -Math.sin(M.happy / 0.4 * Math.PI) * 14 : 0;
      api.drawChar(g, { x: M.x, foot: H - 18 + hopY, size: M.size, face: M.face, walking: M.walking, dress: false, t: M.time, shake: M.ouch > 0 ? Math.sin(M.time * 50) * 4 : 0 });
      drawFx(dt);
    };
    M.end = function () { return { coins: M.score, win: M.score >= GAMES.catch.win }; };
  }

  // ───────── 2. 점프 달리기 ─────────
  function initRun() {
    M.size = Math.min(W, H) * 0.24; M.ground = H * 0.78; M.y = 0; M.vy = 0; M.jumps = 0; M.lives = 3; M.inv = 0;
    M.dist = 0; M.stars = 0; M.speed = Math.max(220, W * 0.55); M.obs = []; M.next = 1.2; M.clouds = [];
    for (var i = 0; i < 4; i++) M.clouds.push({ x: rnd(0, W), y: rnd(H * 0.08, H * 0.4), s: rnd(0.6, 1.2) });
    var G = H * 3.2, J = Math.sqrt(2 * G * M.size * 1.25);
    M.onDown = function () { if (M.jumps < 2) { M.vy = -J * (M.jumps ? 0.85 : 1); M.jumps++; } };
    M.update = function (dt) {
      M.speed += dt * 6; M.dist += M.speed * dt;
      M.vy += G * dt; M.y += M.vy * dt; if (M.y > 0) { M.y = 0; M.vy = 0; M.jumps = 0; }
      M.next -= dt;
      if (M.next <= 0) {
        var kind = Math.random() < 0.5 ? 'rock' : 'bush';
        M.obs.push({ kind: kind, x: W + 40, w: M.size * (kind === 'rock' ? 0.42 : 0.55), h: M.size * (kind === 'rock' ? 0.36 : 0.45) });
        if (Math.random() < 0.6) M.obs.push({ kind: 'star', x: W + 40 + rnd(60, 160), y: M.ground - M.size * rnd(0.9, 1.6), r: 16 });
        M.next = rnd(0.9, 1.7) * Math.max(0.55, 1 - M.dist / 30000);
      }
      var px = W * 0.25, pw = M.size * 0.28, top = M.ground + M.y - M.size * 0.7;
      M.obs = M.obs.filter(function (o) {
        o.x -= M.speed * dt;
        if (o.kind === 'star') {
          if (Math.abs(o.x - px) < pw + o.r && o.y > top - o.r && o.y < M.ground + M.y + o.r) { M.stars++; pop(o.x, o.y, '+5'); return false; }
        } else if (M.inv <= 0 && Math.abs(o.x - px) < pw + o.w * 0.4 && M.ground + M.y > M.ground - o.h * 0.8) {
          M.lives--; M.inv = 1.2; pop(px, top, '아야!', '#e05a5a'); api.say('ouch');
          if (M.lives <= 0) { M.t = 0; }
        }
        return o.x > -60;
      });
      if (M.inv > 0) M.inv -= dt;
      M.score = Math.floor(M.dist / 60) + M.stars * 5;
      hud('❤'.repeat(Math.max(0, M.lives)));
    };
    M.draw = function (dt) {
      sky('#bfe6ff', '#fff4e8');
      g.fillStyle = 'rgba(255,255,255,.9)';
      M.clouds.forEach(function (c) { c.x -= M.speed * 0.15 * dt * c.s; if (c.x < -80) c.x = W + 60; g.beginPath(); g.ellipse(c.x, c.y, 40 * c.s, 16 * c.s, 0, 0, 7); g.ellipse(c.x + 22 * c.s, c.y - 8 * c.s, 26 * c.s, 16 * c.s, 0, 0, 7); g.fill(); });
      g.fillStyle = '#9fd68a'; g.fillRect(0, M.ground, W, H - M.ground);
      g.fillStyle = '#86c271'; for (var i = 0; i < 12; i++) { var gx = ((i * 70 - M.dist * 1) % (W + 70) + W + 70) % (W + 70) - 35; g.fillRect(gx, M.ground + 8, 22, 4); }
      M.obs.forEach(function (o) {
        if (o.kind === 'star') imgAt(D.art.star, o.x, o.y, o.r * 2.4);
        else if (o.kind === 'rock') { g.fillStyle = '#9a9aa6'; g.beginPath(); g.ellipse(o.x, M.ground - o.h / 2 + 2, o.w / 2, o.h / 2, 0, 0, 7); g.fill(); g.fillStyle = '#b8b8c4'; g.beginPath(); g.ellipse(o.x - o.w * 0.12, M.ground - o.h * 0.7, o.w * 0.18, o.h * 0.14, 0, 0, 7); g.fill(); }
        else { g.fillStyle = '#4fae5a'; for (var k = -1; k <= 1; k++) { g.beginPath(); g.arc(o.x + k * o.w * 0.3, M.ground - o.h * (k ? 0.4 : 0.6), o.w * 0.32, 0, 7); g.fill(); } }
      });
      if (!(M.inv > 0 && Math.floor(M.time * 12) % 2)) api.drawChar(g, { x: W * 0.25, foot: M.ground + M.y + 4, size: M.size, face: 1, walking: M.y === 0, run: true, dress: false, t: M.time });
      drawFx(dt);
    };
    M.end = function () { return { coins: Math.floor(M.score / 4), win: M.score >= GAMES.run.win }; };
  }

  // ───────── 3. 얼굴 짝 맞추기 ─────────
  function initMemory() {
    var ids = D.pets.map(function (p) { return p.id; }), cards = [];
    ids.forEach(function (id) { cards.push({ id: id }, { id: id }); });
    for (var i = cards.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp; }
    cards.forEach(function (c) { c.open = false; c.done = false; c.flip = 0; });
    M.cards = cards; M.sel = []; M.wait = 0; M.miss = 0; M.pairs = 0; M.peek = 0;
    function layout() {
      var pad = 12, top = 64, cw = (W - pad * 5) / 4, ch = Math.min(cw * 1.2, (H - top - pad * 5) / 4);
      cw = Math.min(cw, ch / 1.2); var ox = (W - (cw * 4 + pad * 3)) / 2, oy = top + ((H - top) - (ch * 4 + pad * 3)) / 2;
      return { cw: cw, ch: ch, ox: ox, oy: oy, pad: pad };
    }
    M.onDown = function (x, y) {
      if (M.wait > 0) return;
      var L = layout();
      M.cards.forEach(function (c, i) {
        var cx = L.ox + (i % 4) * (L.cw + L.pad), cy = L.oy + Math.floor(i / 4) * (L.ch + L.pad);
        if (x >= cx && x <= cx + L.cw && y >= cy && y <= cy + L.ch && !c.open && !c.done && M.sel.length < 2) {
          c.open = true; M.sel.push(c);
          if (M.sel.length === 2) {
            if (M.sel[0].id === M.sel[1].id) { M.sel.forEach(function (k) { k.done = true; }); M.pairs++; M.score = M.pairs * 10; M.sel = []; pop(cx + L.cw / 2, cy, '짝!'); if (M.pairs === 8) M.t = 0; }
            else { M.miss++; M.wait = 0.75; }
          }
        }
      });
    };
    M.update = function (dt) {
      if (M.wait > 0) { M.wait -= dt; if (M.wait <= 0) { M.sel.forEach(function (k) { k.open = false; }); M.sel = []; } }
      M.cards.forEach(function (c) { var tgt = (c.open || c.done) ? 1 : 0; c.flip += (tgt - c.flip) * Math.min(1, dt * 14); });
      hud(Math.max(0, Math.ceil(M.t)) + '초');
    };
    M.draw = function (dt) {
      sky('#fff4e8', '#ffe3ea');
      var L = layout();
      M.cards.forEach(function (c, i) {
        var cx = L.ox + (i % 4) * (L.cw + L.pad), cy = L.oy + Math.floor(i / 4) * (L.ch + L.pad);
        var sx = Math.abs(Math.cos(c.flip * Math.PI)), front = c.flip > 0.5;
        g.save(); g.translate(cx + L.cw / 2, cy + L.ch / 2); g.scale(Math.max(0.02, sx), 1);
        g.fillStyle = front ? (c.done ? '#fff7d6' : '#ffffff') : '#ff8fb1';
        round(-L.cw / 2, -L.ch / 2, L.cw, L.ch, 12); g.fill();
        if (front) { var p = api.pet(c.id), im = api.img(p.avatar); if (api.ready(im)) { var s = Math.min(L.cw, L.ch) * 0.8; g.drawImage(im, -s / 2, -s / 2 - 6, s, s); } g.fillStyle = '#4a3f4d'; g.font = Math.round(L.cw * 0.16) + 'px Jua, sans-serif'; g.textAlign = 'center'; g.fillText(p.name, 0, L.ch / 2 - 6); }
        else { g.fillStyle = '#fff'; g.font = Math.round(L.cw * 0.4) + 'px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('?', 0, L.cw * 0.14); }
        g.restore();
      });
      drawFx(dt);
    };
    M.end = function () { var win = M.pairs === 8; return { coins: win ? Math.max(8, 40 - M.miss * 2) : M.pairs * 2, win: win }; };
  }
  function round(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ───────── 4. 까꿍! (두더지 잡기) ─────────
  function initPeek() {
    M.holes = []; M.spawn = 0.4;
    for (var i = 0; i < 9; i++) M.holes.push({ who: null, up: 0, life: 0, hit: 0 });
    function layout() { var top = 80, cell = Math.min(W / 3, (H - top - 20) / 3); return { cell: cell, ox: (W - cell * 3) / 2, oy: top + ((H - top) - cell * 3) / 2 }; }
    M.onDown = function (x, y) {
      var L = layout();
      M.holes.forEach(function (h, i) {
        if (!h.who || h.hit || h.up < 0.4) return;
        var cx = L.ox + (i % 3 + 0.5) * L.cell, cy = L.oy + (Math.floor(i / 3) + 0.62) * L.cell;
        if (Math.abs(x - cx) < L.cell * 0.4 && y > cy - L.cell * 0.75 && y < cy + L.cell * 0.15) {
          h.hit = 1;
          if (h.who === 'bad') { M.score = Math.max(0, M.score - 2); pop(cx, cy - L.cell * 0.5, '−2', '#8a5a32'); api.say('ouch'); }
          else { var pts = h.who === api.curId() ? 2 : 1; M.score += pts; pop(cx, cy - L.cell * 0.5, '+' + pts); }
          h.life = Math.min(h.life, 0.25);
        }
      });
    };
    M.update = function (dt) {
      var prog = 1 - M.t / GAMES.peek.secs;
      M.spawn -= dt;
      if (M.spawn <= 0) {
        M.spawn = rnd(0.35, 0.75) * (1 - prog * 0.4);
        var free = M.holes.filter(function (h) { return !h.who; });
        if (free.length) { var h = pick(free); h.who = Math.random() < 0.18 ? 'bad' : pick(D.pets).id; h.life = rnd(0.7, 1.25) * (1 - prog * 0.35); h.up = 0; h.hit = 0; }
      }
      M.holes.forEach(function (h) {
        if (!h.who) return;
        h.life -= dt;
        h.up = h.life > 0 ? Math.min(1, h.up + dt * 6) : h.up - dt * 6;
        if (h.up <= 0 && h.life <= 0) h.who = null;
      });
      hud(Math.max(0, Math.ceil(M.t)) + '초');
    };
    M.draw = function (dt) {
      sky('#d9f2ff', '#e8f6e0');
      var L = layout();
      M.holes.forEach(function (h, i) {
        var cx = L.ox + (i % 3 + 0.5) * L.cell, cy = L.oy + (Math.floor(i / 3) + 0.62) * L.cell, rw = L.cell * 0.38;
        g.fillStyle = '#6d4c35'; g.beginPath(); g.ellipse(cx, cy, rw, rw * 0.32, 0, 0, 7); g.fill();
        if (h.who) {
          g.save(); g.beginPath(); g.rect(cx - L.cell / 2, cy - L.cell, L.cell, L.cell); g.clip();
          var rise = Math.max(0, h.up) * L.cell * 0.62;
          if (h.who === 'bad') chestnut(cx, cy + L.cell * 0.3 - rise, L.cell * 0.22, 0);
          else { var p = api.pet(h.who), im = api.img(p.poses[0].img), s = L.cell * 0.8; if (api.ready(im)) g.drawImage(im, cx - s / 2, cy + s * 0.15 - rise * 1.05 - s * 0.5 + (h.hit ? 6 : 0), s, s); if (h.hit && h.who !== 'bad') { g.fillStyle = '#ff6f91'; g.font = '20px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('까꿍!', cx, cy - rise - 4); } }
          g.restore();
        }
        g.fillStyle = '#8fcf7a'; g.beginPath(); g.ellipse(cx, cy + rw * 0.18, rw * 1.15, rw * 0.3, 0, 0, Math.PI); g.fill();
      });
      drawFx(dt);
    };
    M.end = function () { return { coins: M.score, win: M.score >= GAMES.peek.win }; };
  }

  // ───────── 공통 진행 ─────────
  var last = 0;
  function loop(now) {
    if (!M || M.stopped) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    if (!M.over && M.started) {
      M.time += dt; if (GAMES[M.kind].secs) M.t -= dt;
      M.update(dt);
      if (M.t <= 0 || (M.kind === 'run' && M.lives <= 0)) finish();
    }
    g.clearRect(0, 0, W, H); M.draw(dt);
    requestAnimationFrame(loop);
  }
  function finish() {
    M.over = true; var r = M.end();
    api.finish(M.kind, M.score, r.coins, r.win);
  }
  function start(kind) {
    var gm = GAMES[kind]; if (!gm) return;
    $('mini').classList.remove('hidden'); $('miniEnd').classList.add('hidden');
    resize();
    M = { kind: kind, score: 0, time: 0, t: gm.secs || 9999, fx: [], started: false, over: false, lives: 3 };
    ({ catch: initCatch, run: initRun, memory: initMemory, peek: initPeek })[kind]();
    $('miniTitle').textContent = gm.name;
    var help = $('miniHelp'); help.innerHTML = '<div class="card"><h2>' + gm.icon + ' ' + gm.name + '</h2><p>' + gm.help + '</p><button class="primary" id="miniGo">시작!</button></div>';
    help.classList.remove('hidden');
    $('miniGo').onclick = function () { help.classList.add('hidden'); M.started = true; };
    hud(gm.secs ? gm.secs + '초' : '❤❤❤');
    last = 0; requestAnimationFrame(loop);
  }
  function stop() { if (M) M.stopped = true; M = null; $('mini').classList.add('hidden'); }
  return { games: GAMES, start: start, stop: stop, running: function () { return !!M; }, over: function () { return !!(M && M.over); }, again: function () { var k = M && M.kind; stop(); if (k) start(k); },
    _state: function () { return M; } };
};
