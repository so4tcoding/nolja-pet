/* v2.0: Anonymous Auth identifies a device; trusted functions verify PINs and grant account access.
   No credentials in Firestore-readable documents. No SDK/network work when config === null. */
(function () {
  'use strict';
  var ready = null, initialized = false, sdk, db, auth, functions, active = null, syncTimer = 0, lastPush = 0, syncing = false;
  var status = '서버 준비 중', configured = !!window.HP_FIREBASE_CONFIG && window.HP_FIREBASE_SERVER_READY !== false, listeners = [];
  function emit(s) { status = s; listeners.forEach(function (f) { f(s); }); }
  function err(e) {
    var c = String(e && e.code || '');
    if (/already-exists/.test(c)) return '이미 등록된 처음 계정 이름이에요. 계정 복구를 이용해 주세요';
    if (/resource-exhausted/.test(c)) return '시도가 많아요. 15분 뒤 다시 해 주세요';
    if (/permission-denied|not-found/.test(c)) return '계정 이름·PIN 또는 기기 연결을 확인해 주세요';
    if (/unavailable|network|deadline/.test(c)) return '인터넷 연결을 확인해 주세요 (게임은 이 폰에 저장돼요)';
    if (/functions\//.test(c) && e.message && e.message !== 'INTERNAL') return e.message;
    return configured ? '서버 연결을 확인해 주세요. 설정·함수·규칙 배포가 필요해요' : '서버 준비 중';
  }
  function init() {
    if (!configured) return Promise.reject(Error('서버 준비 중'));
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      if (window.HPFB) { resolve(); return; }
      var s = document.createElement('script'); s.src = 'vendor/firebase.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    }).then(function () {
      if (!initialized) {
      sdk = window.HPFB; var cfg = window.HP_FIREBASE_CONFIG, app = sdk.initializeApp(cfg);
      auth = sdk.getAuth(app); db = sdk.getFirestore(app); functions = sdk.getFunctions(app, 'asia-northeast3');
      if (cfg.emulators) {
        var e = cfg.emulators, h = e.host || '127.0.0.1';
        sdk.connectAuthEmulator(auth, 'http://' + h + ':' + (e.auth || 9099), { disableWarnings: true });
        sdk.connectFirestoreEmulator(db, h, e.firestore || 8085); sdk.connectFunctionsEmulator(functions, h, e.functions || 5001);
      }
      initialized = true;
      }
      return new Promise(function (resolve, reject) {
        var stop = sdk.onAuthStateChanged(auth, function (u) { stop(); (u ? Promise.resolve(u) : sdk.signInAnonymously(auth)).then(resolve,reject); }, reject);
      });
    }).catch(function (e) { ready = null; emit(err(e)); throw e; });
    return ready;
  }
  function callable(name, data) { return init().then(function () { return sdk.httpsCallable(functions, name)(data); }).then(function (r) { return r.data; }); }
  function lockKey(n) { return 'hp_recovery_limit_' + window.HPAuth._sha256(unescape(encodeURIComponent(n.trim().toLocaleLowerCase('ko-KR')))); }
  function lock(n) { try { var v = JSON.parse(localStorage.getItem(lockKey(n)) || '{}'); return v.until > Date.now() && v.n >= 5; } catch (e) { return false; } }
  function wrong(n) { try { var k=lockKey(n), v=JSON.parse(localStorage.getItem(k)||'{}'); if (!(v.until > Date.now())) v={n:0,until:Date.now()+900000}; v.n++; localStorage.setItem(k,JSON.stringify(v)); } catch (e) {} }
  function session(p) {
    active = p && p.cloud ? p : null;
    clearInterval(syncTimer);
    if (active && configured) {
      init().then(function () { emit('서버 연결됨 · 30초마다 저장'); }).catch(function () {});
      syncTimer = setInterval(sync, 30000);
    } else emit(configured ? '서버 계정 연결이 필요해요' : '서버 준비 중');
  }
  function sync(force) {
    if (!configured || !active || syncing || (!force && Date.now()-lastPush < 20000)) return Promise.resolve(false);
    var p = active, id=p.cloud.accountId, raw=localStorage.getItem(HPAuth.saveKey(p.id));
    if (!raw) return Promise.resolve(false);
    syncing=true;
    return init().then(function () {
      return sdk.setDoc(sdk.doc(db,'users',id,'saves','main'),{json:raw,updatedAt:sdk.serverTimestamp()});
    }).then(function () { lastPush=Date.now(); emit('서버 저장 완료'); return true; }).catch(function(e) {emit(err(e)); return false;}).finally(function(){syncing=false;});
  }
  function recover(n,pin) {
    if (!configured) return Promise.reject(Error('서버 준비 중'));
    if (lock(n)) return Promise.reject(Error('5회 실패했어요. 15분 뒤 다시 해 주세요'));
    return callable('recoverAccount',{nickname:n,pin:pin}).then(function(r){localStorage.removeItem(lockKey(n));return r;}).catch(function(e){
      if (/permission-denied|not-found|resource-exhausted/.test(String(e.code))) wrong(n);
      throw Error(err(e));
    });
  }
  window.HPCloud = {
    configured:configured, hasConfig:!!window.HP_FIREBASE_CONFIG, init:init, session:session, sync:sync, status:function(){return status;}, onStatus:function(f){listeners.push(f);}, error:err,
    register:function(n,pin,pet,raw){return callable('registerAccount',{nickname:n,pin:pin,pet:pet,save:raw||'{}'});},
    recover:recover, call:callable,
    account:function(){var p=HPAuth.current();return p && p.cloud && p.cloud.accountId;},
    changePin:function(oldPin,newPin){return callable('changeAccountPin',{accountId:this.account(),oldPin:oldPin,newPin:newPin});},
    sdk:function(){return {sdk:sdk,db:db};}
  };
  window.addEventListener('online',function(){sync(true);});
  document.addEventListener('visibilitychange',function(){if(document.hidden)sync(true);});
})();
