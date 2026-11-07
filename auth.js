// ===== 로그인 (이 폰 안에서만): 닉네임 + 숫자 4자리 비밀번호 =====
// 프로필마다 저장 데이터가 따로 있어요. 서버가 없어서 다른 폰과는 공유되지 않아요.
(function () {
  'use strict';
  var KEY = 'hp_profiles_v1', LEGACY = 'healingpet_save_v1';

  // SHA-256 (오래된 웹뷰에서도 되게 직접 계산)
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, max = mp(2, 32), result = '', words = [], bitLen = ascii.length * 8;
    var hash = [], k = [], primeCounter = 0, isComposite = {};
    for (var c = 2; primeCounter < 64; c++) {
      if (!isComposite[c]) {
        for (var i = 0; i < 313; i += c) isComposite[i] = c;
        hash[primeCounter] = (mp(c, 0.5) * max) | 0; k[primeCounter++] = (mp(c, 1 / 3) * max) | 0;
      }
    }
    hash = hash.slice(0, 8);
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { var j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / max) | 0; words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? 0 : '') + b.toString(16); }
    return result;
  }
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function pinHash(salt, pin) { var h = salt + ':' + pin; for (var i = 0; i < 500; i++) h = sha256(utf8(salt + h)); return h; }
  function rid() { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); }

  function load() { try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.list) return d; } catch (e) {} return { list: [], current: '' }; }
  function store(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { console.warn('프로필 저장 실패', e); } }
  function find(d, id) { for (var i = 0; i < d.list.length; i++) if (d.list[i].id === id) return d.list[i]; return null; }

  var A = window.HPAuth = {
    list: function () { return load().list.map(function (p) { return { id: p.id, nick: p.nick, pet: p.pet }; }); },
    current: function () { var d = load(); var p = find(d, d.current); return p ? { id: p.id, nick: p.nick, pet: p.pet } : null; },
    saveKey: function (id) { return 'healingpet_save_p_' + (id || load().current); },
    validNick: function (n) { n = String(n || '').trim(); return n.length >= 1 && n.length <= 10; },
    nickTaken: function (n) { n = String(n).trim(); return load().list.some(function (p) { return p.nick === n; }); },
    create: function (nick, pin, pet) {
      nick = String(nick).trim();
      if (!A.validNick(nick)) return { ok: false, msg: '닉네임은 1~10글자로 해 주세요' };
      if (!/^\d{4}$/.test(pin)) return { ok: false, msg: '비밀번호는 숫자 4자리예요' };
      if (A.nickTaken(nick)) return { ok: false, msg: '이미 있는 닉네임이에요' };
      var d = load(), salt = rid() + rid(), p = { id: rid(), nick: nick, pet: pet || '', salt: salt, hash: pinHash(salt, pin), created: Date.now() };
      // 로그인 기능이 생기기 전의 저장 데이터는 첫 번째 프로필이 이어받아요
      if (!d.list.length) { try { var old = localStorage.getItem(LEGACY); if (old) { localStorage.setItem(A.saveKey(p.id), old); localStorage.removeItem(LEGACY); p.migrated = true; } } catch (e) {} }
      d.list.push(p); d.current = p.id; store(d);
      return { ok: true, id: p.id, migrated: !!p.migrated };
    },
    login: function (id, pin) {
      var d = load(), p = find(d, id); if (!p) return { ok: false, msg: '프로필이 없어요' };
      if (pinHash(p.salt, pin) !== p.hash) return { ok: false, msg: '비밀번호가 달라요' };
      d.current = id; store(d); return { ok: true };
    },
    logout: function () { var d = load(); d.current = ''; store(d); },
    setPet: function (pet) { var d = load(), p = find(d, d.current); if (p && p.pet !== pet) { p.pet = pet; store(d); } },
    changePin: function (oldPin, newPin) {
      var d = load(), p = find(d, d.current); if (!p) return { ok: false, msg: '로그인해 주세요' };
      if (pinHash(p.salt, oldPin) !== p.hash) return { ok: false, msg: '지금 비밀번호가 달라요' };
      if (!/^\d{4}$/.test(newPin)) return { ok: false, msg: '새 비밀번호는 숫자 4자리예요' };
      p.salt = rid() + rid(); p.hash = pinHash(p.salt, newPin); store(d); return { ok: true };
    },
    remove: function (id, pin) {
      var d = load(), p = find(d, id); if (!p) return { ok: false, msg: '프로필이 없어요' };
      if (pinHash(p.salt, pin) !== p.hash) return { ok: false, msg: '비밀번호가 달라요' };
      d.list = d.list.filter(function (q) { return q.id !== id; }); if (d.current === id) d.current = '';
      store(d); try { localStorage.removeItem(A.saveKey(id)); } catch (e) {}
      return { ok: true };
    },
    // 백업 코드: 프로필(닉네임·비밀번호 확인값)과 저장 기록을 글자 한 줄로. 다른 폰/브라우저에서 불러올 수 있어요
    exportCode: function () {
      var d = load(), p = find(d, d.current); if (!p) return '';
      var body = JSON.stringify({ v: 1, nick: p.nick, pet: p.pet, salt: p.salt, hash: p.hash, save: localStorage.getItem(A.saveKey(p.id)) || '' });
      var b64 = btoa(utf8(body));
      return 'NJ1-' + sha256(b64).slice(0, 8) + '-' + b64;
    },
    importCode: function (code) {
      code = String(code || '').replace(/\s+/g, '');
      var m = /^NJ1-([0-9a-f]{8})-([A-Za-z0-9+/=]+)$/.exec(code);
      if (!m || sha256(m[2]).slice(0, 8) !== m[1]) return { ok: false, msg: '백업 코드가 올바르지 않아요 (전부 복사했는지 확인해 주세요)' };
      var o; try { o = JSON.parse(decodeURIComponent(escape(atob(m[2])))); } catch (e) { return { ok: false, msg: '백업 코드를 읽을 수 없어요' }; }
      if (!o || !A.validNick(o.nick) || !o.salt || !o.hash) return { ok: false, msg: '백업 코드를 읽을 수 없어요' };
      var d = load(), same = d.list.filter(function (q) { return q.nick === o.nick; })[0], p;
      if (same && same.hash !== o.hash) return { ok: false, msg: '이 폰에 같은 닉네임(' + o.nick + ')이 이미 있어요. 그 프로필을 지우고 다시 해 주세요' };
      if (same) p = same; else { p = { id: rid(), nick: o.nick, pet: o.pet || '', salt: o.salt, hash: o.hash, created: Date.now() }; d.list.push(p); }
      p.pet = o.pet || p.pet; store(d);
      try { if (o.save) localStorage.setItem(A.saveKey(p.id), o.save); } catch (e) { return { ok: false, msg: '저장 공간이 부족해요' }; }
      return { ok: true, id: p.id, nick: p.nick, restored: !!same };
    },
    _sha256: sha256,
  };

  // ───────── 로그인 화면 ─────────
  var D = window.HP_DATA, ASSET = 'assets/';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function petOf(id) { for (var i = 0; i < D.pets.length; i++) if (D.pets[i].id === id) return D.pets[i]; return D.pets[0]; }
  function avatar(id) { return ASSET + petOf(id).avatar; }

  A.show = function (onDone) {
    var box = $('login'); box.classList.remove('hidden');
    var view = A.list().length ? 'pick' : 'create', sel = null, pin = '', form = { nick: '', pet: D.pets[0].id, pin1: '' }, msg = '';
    function render() {
      var h = '<div class="lgTitle">놀자! 먼작귀</div>';
      if (view === 'pick') {
        h += '<div class="lgSub">누구예요?</div><div class="lgList">';
        A.list().forEach(function (p) { h += '<button class="lgProf" data-id="' + p.id + '"><img src="' + avatar(p.pet) + '" alt=""><span>' + esc(p.nick) + '</span></button>'; });
        h += '<button class="lgProf lgNew" data-new="1"><span class="plus">+</span><span>새 친구</span></button></div>' +
          '<button class="lgLink" data-import="1">🔑 백업 코드로 불러오기</button>';
      } else if (view === 'import') {
        h += '<div class="lgSub">백업 코드로 불러오기</div><textarea id="lgCode" placeholder="NJ1-로 시작하는 백업 코드를 붙여 넣어 주세요" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>' +
          '<button class="primary lgGo" data-doimport="1">불러오기</button><button class="lgLink" data-back="1">← 돌아가기</button>';
      } else if (view === 'pin') {
        var p = A.list().filter(function (q) { return q.id === sel; })[0];
        h += '<img class="lgAv" src="' + avatar(p.pet) + '" alt=""><div class="lgSub">' + esc(p.nick) + '의 비밀번호</div>' + dots() + pad() +
          '<button class="lgLink" data-back="1">← 다른 친구</button>';
      } else if (view === 'create') {
        h += '<div class="lgSub">새 친구 만들기</div>' +
          '<input id="lgNick" maxlength="10" placeholder="닉네임 (10글자까지)" value="' + esc(form.nick) + '" autocomplete="off">' +
          '<div class="lgSub2">프로필 캐릭터</div><div class="lgPets">';
        D.pets.forEach(function (q) { h += '<button class="lgPet' + (form.pet === q.id ? ' on' : '') + '" data-pet="' + q.id + '"><img src="' + ASSET + q.avatar + '" alt=""><span>' + q.name + '</span></button>'; });
        h += '</div><button class="primary lgGo" data-next="1">다음: 비밀번호 정하기</button>' +
          (A.list().length ? '<button class="lgLink" data-back="1">← 돌아가기</button>' : '<button class="lgLink" data-import="1">🔑 백업 코드로 불러오기</button>');
      } else if (view === 'pin1' || view === 'pin2') {
        h += '<img class="lgAv" src="' + avatar(form.pet) + '" alt=""><div class="lgSub">' + (view === 'pin1' ? '비밀번호 숫자 4자리' : '한 번 더 눌러 주세요') + '</div>' + dots() + pad() +
          '<button class="lgLink" data-back="1">← 돌아가기</button>';
      }
      h += '<div class="lgMsg">' + esc(msg) + '</div><div class="lgNote">이 폰 안에만 저장돼요 (친구끼리 같은 폰을 같이 쓸 때 사용)' +
        (window.HPNative ? '' : '<br><a class="lgInstall" href="install.html">📲 설치 방법 (아이폰 · 안드로이드)</a>') + '</div>';
      box.innerHTML = '<div class="lgCard">' + h + '</div>';
      bind();
    }
    function dots() { var s = '<div class="lgDots">'; for (var i = 0; i < 4; i++) s += '<i class="' + (i < pin.length ? 'on' : '') + '"></i>'; return s + '</div>'; }
    function pad() { var s = '<div class="lgPad">'; [1, 2, 3, 4, 5, 6, 7, 8, 9, 'x', 0, '<'].forEach(function (k) { s += k === 'x' ? '<span></span>' : '<button data-k="' + k + '">' + (k === '<' ? '⌫' : k) + '</button>'; }); return s + '</div>'; }
    function bind() {
      Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
        b.onclick = function () {
          if (b.getAttribute('data-id')) { sel = b.getAttribute('data-id'); pin = ''; msg = ''; view = 'pin'; render(); }
          else if (b.getAttribute('data-new')) { view = 'create'; msg = ''; form = { nick: '', pet: D.pets[0].id, pin1: '' }; render(); }
          else if (b.getAttribute('data-pet')) { form.nick = $('lgNick').value; form.pet = b.getAttribute('data-pet'); render(); }
          else if (b.getAttribute('data-next')) {
            form.nick = $('lgNick').value.trim();
            if (!A.validNick(form.nick)) { msg = '닉네임을 써 주세요 (1~10글자)'; render(); return; }
            if (A.nickTaken(form.nick)) { msg = '이미 있는 닉네임이에요'; render(); return; }
            view = 'pin1'; pin = ''; msg = ''; render();
          }
          else if (b.getAttribute('data-back')) { pin = ''; msg = ''; view = (view === 'pin1' || view === 'pin2') ? 'create' : (view === 'import' && !A.list().length) ? 'create' : 'pick'; if (view === 'pick' && !A.list().length) view = 'create'; render(); }
          else if (b.getAttribute('data-import')) { view = 'import'; msg = ''; render(); }
          else if (b.getAttribute('data-doimport')) {
            var r = A.importCode($('lgCode').value);
            if (!r.ok) { var keep = $('lgCode').value; msg = r.msg; render(); $('lgCode').value = keep; return; }
            sel = r.id; pin = ''; view = 'pin'; msg = (r.restored ? '기록을 되돌렸어요! ' : '불러왔어요! ') + '비밀번호를 눌러 들어가요'; render();
          }
          else if (b.getAttribute('data-k') !== null) key(b.getAttribute('data-k'));
        };
      });
    }
    function key(k) {
      if (k === '<') { pin = pin.slice(0, -1); render(); return; }
      if (pin.length >= 4) return;
      pin += k; render();
      if (pin.length < 4) return;
      setTimeout(function () {
        if (view === 'pin') {
          var r = A.login(sel, pin);
          if (r.ok) { box.classList.add('hidden'); onDone(); } else { msg = r.msg; pin = ''; render(); }
        } else if (view === 'pin1') { form.pin1 = pin; pin = ''; view = 'pin2'; msg = ''; render(); }
        else if (view === 'pin2') {
          if (pin !== form.pin1) { msg = '두 번 누른 비밀번호가 달라요. 처음부터 눌러 주세요'; pin = ''; view = 'pin1'; render(); return; }
          var c = A.create(form.nick, pin, form.pet);
          if (c.ok) { box.classList.add('hidden'); onDone({ created: true, pet: form.pet, migrated: c.migrated }); } else { msg = c.msg; pin = ''; view = 'create'; render(); }
        }
      }, 150);
    }
    render();
  };
})();
