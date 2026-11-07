// 웹(아이폰 Safari / 홈 화면 앱)용 보조 기능. 안드로이드 앱(WebView) 안에서는 대부분 건너뛰어요.
(function () {
  var native = !!window.HPNative;
  // 1) 오프라인 캐시 (서비스 워커)
  if (!native && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('sw', e); }); });
  }
  // 2) 핀치 확대 · 두 번 톡 확대 막기 (iOS는 user-scalable=no를 무시해요)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  // 두 번 톡 확대는 CSS touch-action(manipulation/none)으로 막아요 (touchend를 막으면 빠른 버튼 누름이 씹혀요)
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  // 3) 소리 잠금 풀기: iOS는 첫 터치 때만 소리를 켤 수 있어요. 소리를 쓰는 코드는 HPAudio.ctx()를 쓰면 돼요
  var ctx = null, unlocked = false;
  function getCtx() { if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) try { ctx = new AC(); } catch (e) {} } return ctx; }
  function unlock() {
    if (unlocked) return; var c = getCtx(); if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start ? s.start(0) : s.noteOn(0); } catch (e) {}
    if (c.resume) c.resume();
    unlocked = true; ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) { document.removeEventListener(t, unlock, true); });
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, unlock, true); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && ctx && ctx.state !== 'running' && unlocked && ctx.resume) ctx.resume(); });
  window.HPAudio = { ctx: getCtx, unlocked: function () { return unlocked; } };
  // 4) 홈 화면 앱으로 열렸는지 표시 (CSS에서 쓸 수 있게)
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  document.documentElement.classList.toggle('standalone', !!standalone);
  document.documentElement.classList.toggle('web', !native);
})();
