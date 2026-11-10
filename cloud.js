/* v2.1 Spark-only: Anonymous Auth + Firestore rules. No Functions, Analytics or billing.
   Credential/claim documents are NEVER client-readable. Failed proofs are committed before verification. */
(function () {
  'use strict';
  var sdk, db, auth, loaded=null, ready=null, active=null, available=false, syncTimer=0, lastPush=0, syncing=false;
  var hasConfig=!!window.HP_FIREBASE_CONFIG, status='서버 준비 중', listeners=[], availabilityListeners=[];
  var ITERATIONS=600000, WINDOW=900000;
  function emit(s){status=s;listeners.forEach(function(f){f(s);});}
  function availability(v){var changed=v!==available;available=v;if(changed)availabilityListeners.forEach(function(f){f(v);});}
  function failure(code,message){var e=Error(message||code);e.code=code;return e;}
  function err(e){
    var c=String(e&&e.code||'');
    if(/already-exists/.test(c))return '이미 등록된 처음 계정 이름이에요. 계정 복구를 이용해 주세요';
    if(/resource-exhausted/.test(c))return '시도가 많아요. 15분 뒤 다시 해 주세요';
    if(/permission-denied|not-found/.test(c))return '계정 이름·PIN 또는 기기 연결을 확인해 주세요';
    if(/invalid-argument/.test(c))return e.message;
    if(!available)return '서버 준비 중 · 익명 로그인·Firestore·규칙 설정을 확인해 주세요';
    if(/unavailable|network|deadline/.test(c))return '인터넷 연결을 확인해 주세요 (게임은 이 폰에 저장돼요)';
    return '서버 연결을 확인해 주세요. 기록은 이 폰에 저장돼요';
  }
  function load(){
    if(!hasConfig)return Promise.reject(failure('unavailable','서버 준비 중'));
    if(loaded)return loaded;
    loaded=new Promise(function(resolve,reject){
      if(window.HPFB){resolve();return;}
      var s=document.createElement('script');s.src='vendor/firebase.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    }).then(function(){
      sdk=window.HPFB;var cfg=window.HP_FIREBASE_CONFIG,app=sdk.initializeApp(cfg);
      auth=sdk.getAuth(app);db=sdk.getFirestore(app);
      if(cfg.emulators){var e=cfg.emulators,h=e.host||'127.0.0.1';sdk.connectAuthEmulator(auth,'http://'+h+':'+(e.auth||9099),{disableWarnings:true});sdk.connectFirestoreEmulator(db,h,e.firestore||8085);}
    }).catch(function(e){loaded=null;throw e;});return loaded;
  }
  function timeout(p,ms){var timer;return Promise.race([p,new Promise(function(_,reject){timer=setTimeout(function(){reject(failure('deadline-exceeded'));},ms);})]).finally(function(){clearTimeout(timer);});}
  function init(){
    if(!hasConfig)return Promise.reject(failure('unavailable','서버 준비 중'));
    if(ready)return ready;
    ready=timeout(load().then(async function(){
      await auth.authStateReady();if(!auth.currentUser)await sdk.signInAnonymously(auth);
      // A server-only GET, never a cached success. This path is allowed only by the Spark v2.1 rules.
      await sdk.getDocFromServer(sdk.doc(db,'_health','spark'));
      availability(true);emit(active?'서버 연결됨 · 30초마다 저장':'서버 연결됨 · Spark 무료');return auth.currentUser;
    }),12000).catch(function(e){ready=null;availability(false);emit('서버 준비 중 · 익명 로그인·Firestore·규칙 설정을 확인해 주세요');throw e;});return ready;
  }
  function normalized(n){n=String(n||'').trim();if(!n||n.length>10||n.indexOf('/')>=0)throw failure('invalid-argument','계정 이름은 / 없이 1~10글자로 해 주세요');return {nick:n,key:'n_'+n.toLowerCase()};}
  function random(bytes){var a=new Uint8Array(bytes);crypto.getRandomValues(a);return Array.from(a,function(v){return v.toString(16).padStart(2,'0');}).join('');}
  function validPin(pin){if(!/^\d{4}$/.test(pin))throw failure('invalid-argument','PIN은 숫자 4자리예요');}
  async function hash(pin,salt){
    validPin(pin);if(!crypto.subtle)throw failure('invalid-argument','보안 연결에서 PIN 복구를 이용해 주세요');
    var key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
    var bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:ITERATIONS},key,256);
    return Array.from(new Uint8Array(bits),function(v){return v.toString(16).padStart(2,'0');}).join('');
  }
  function ref(){return sdk.doc.apply(null,[db].concat(Array.from(arguments)));}
  async function register(n,pin,pet,raw){
    validPin(pin);var name=normalized(n);await init();
    if((await sdk.getDocFromServer(ref('names',name.key))).exists())throw failure('already-exists');
    var id=sdk.doc(sdk.collection(db,'users')).id, salt=random(24), pinHash=await hash(pin,salt),code;
    for(var i=0;i<5;i++){code=random(4).toUpperCase();if(!(await sdk.getDocFromServer(ref('codes',code))).exists())break;if(i===4)throw failure('unavailable');}
    var uid=auth.currentUser.uid,b=sdk.writeBatch(db),ts=sdk.serverTimestamp;
    b.set(ref('users',id),{ownerUid:uid,nameKey:name.key,originalNick:name.nick,nickname:name.nick,pet:pet||'chiikawa',friendCode:code,createdAt:ts()});
    b.set(ref('credentials',id),{salt:salt,iterations:ITERATIONS,pinHash:pinHash});
    b.set(ref('names',name.key),{accountId:id,salt:salt,iterations:ITERATIONS,friendCode:code});
    b.set(ref('codes',code),{accountId:id});
    b.set(ref('devices',uid,'profiles',id),{accountId:id,claimId:'registration',createdAt:ts()});
    b.set(ref('users',id,'saves','main'),{json:raw||'{}',updatedAt:ts()});
    try{await b.commit();}catch(e){if((await sdk.getDocFromServer(ref('names',name.key))).exists())throw failure('already-exists');throw e;}
    return {accountId:id,originalNick:name.nick,code:code};
  }
  // Phase 1 ALWAYS commits the attempt + unreadable proof, including a WRONG PIN.
  // Phase 2 verifies in rules and grants this UID. Thus a rejected grant cannot roll back its attempt.
  async function prove(id,pinHash){
    var uid=auth.currentUser.uid,nonce=random(16),attempt=ref('attempts',uid),claim=ref('claims',uid,'items',nonce);
    await sdk.runTransaction(db,async function(t){
      var snap=await t.get(attempt),old=snap.exists()?snap.data():null;
      var reset=!old||Date.now()-old.windowStart.toMillis()>=WINDOW;
      if(!reset&&old.count>=5)throw failure('resource-exhausted');
      t.set(attempt,{count:reset?1:old.count+1,windowStart:reset?sdk.serverTimestamp():old.windowStart,lastAt:sdk.serverTimestamp(),lastClaimId:nonce});
      t.set(claim,{accountId:id,pinHash:pinHash,createdAt:sdk.serverTimestamp()});
    });
    await sdk.setDoc(ref('devices',uid,'profiles',id),{accountId:id,claimId:nonce,createdAt:sdk.serverTimestamp()});
  }
  async function recoverRaw(n,pin){
    validPin(pin);var name=normalized(n);await init();var d=await sdk.getDocFromServer(ref('names',name.key));
    if(!d.exists())throw failure('not-found');var dir=d.data();
    await prove(dir.accountId,await hash(pin,dir.salt));
    var u=(await sdk.getDocFromServer(ref('users',dir.accountId))).data(),s=await sdk.getDocFromServer(ref('users',dir.accountId,'saves','main'));
    return {accountId:dir.accountId,originalNick:u.originalNick,code:u.friendCode,pet:u.pet,save:s.exists()?s.data().json:'{}'};
  }
  function lockKey(n){return 'hp_recovery_limit_'+window.HPAuth._sha256(unescape(encodeURIComponent(String(n).trim().toLowerCase())));}
  function lock(n){try{var v=JSON.parse(localStorage.getItem(lockKey(n))||'{}');return v.until>Date.now()&&v.n>=5;}catch(e){return false;}}
  function wrong(n){try{var k=lockKey(n),v=JSON.parse(localStorage.getItem(k)||'{}');if(!(v.until>Date.now()))v={n:0,until:Date.now()+WINDOW};v.n++;localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  async function recover(n,pin){
    if(lock(n))throw Error('5회 실패했어요. 15분 뒤 다시 해 주세요');
    try{var r=await recoverRaw(n,pin);localStorage.removeItem(lockKey(n));return r;}
    catch(e){if(/permission-denied|not-found|resource-exhausted/.test(String(e.code)))wrong(n);throw Error(err(e));}
  }
  async function changePin(oldPin,newPin){
    validPin(newPin);await init();var id=api.account();if(!id)throw failure('permission-denied');
    var u=(await sdk.getDocFromServer(ref('users',id))).data(),d=(await sdk.getDocFromServer(ref('names',u.nameKey))).data();
    await prove(id,await hash(oldPin,d.salt));var salt=random(24),newHash=await hash(newPin,salt),b=sdk.writeBatch(db);
    b.set(ref('credentials',id),{salt:salt,iterations:ITERATIONS,pinHash:newHash});
    b.update(ref('names',u.nameKey),{salt:salt,iterations:ITERATIONS});await b.commit();
  }
  async function addFriend(data){
    await init();var id=data.accountId,code=String(data.code||'').trim().toUpperCase();
    if(!/^[A-F0-9]{8}$/.test(code))throw failure('invalid-argument','친구 코드 8글자를 확인해 주세요');
    var c=await sdk.getDocFromServer(ref('codes',code));if(!c.exists())throw failure('not-found');var to=c.data().accountId;
    if(to===id)throw failure('invalid-argument','자기 자신은 친구로 추가할 수 없어요');
    if((await sdk.getDocFromServer(ref('users',id,'friends',to))).exists())return {already:true};
    var request=ref('users',to,'requests',id);if((await sdk.getDocFromServer(request)).exists())return {pending:true};
    var u=(await sdk.getDocFromServer(ref('users',id))).data();
    await sdk.setDoc(request,{nickname:u.nickname,pet:u.pet,createdAt:sdk.serverTimestamp()});return {sent:true};
  }
  async function acceptFriend(data){
    await init();var id=data.accountId,from=data.from,req=ref('users',id,'requests',from),r=await sdk.getDocFromServer(req);
    if(!r.exists())throw failure('not-found');var sender=r.data(),u=(await sdk.getDocFromServer(ref('users',id))).data(),members=[id,from].sort(),room=members.join('_'),b=sdk.writeBatch(db);
    b.set(ref('rooms',room),{members:members,acceptedBy:id,createdAt:sdk.serverTimestamp()});
    b.set(ref('users',id,'friends',from),{nickname:sender.nickname,pet:sender.pet,room:room,createdAt:sdk.serverTimestamp()});
    b.set(ref('users',from,'friends',id),{nickname:u.nickname,pet:u.pet,room:room,createdAt:sdk.serverTimestamp()});b.delete(req);await b.commit();return {room:room};
  }
  function session(p){
    active=p&&p.cloud?p:null;clearInterval(syncTimer);
    if(active&&hasConfig){init().catch(function(){});syncTimer=setInterval(sync,30000);}
    else emit(available?'서버 계정 연결이 필요해요':'서버 준비 중');
  }
  function sync(force){
    if(!available||!active||syncing||(!force&&Date.now()-lastPush<20000))return Promise.resolve(false);
    var p=active,raw=localStorage.getItem(HPAuth.saveKey(p.id));if(!raw)return Promise.resolve(false);syncing=true;
    return init().then(function(){return sdk.setDoc(ref('users',p.cloud.accountId,'saves','main'),{json:raw,updatedAt:sdk.serverTimestamp()});}).then(function(){lastPush=Date.now();emit('서버 저장 완료');return true;}).catch(function(e){emit(err(e));return false;}).finally(function(){syncing=false;});
  }
  var api=window.HPCloud={
    get configured(){return available;},hasConfig:hasConfig,init:init,probe:init,session:session,sync:sync,status:function(){return status;},onStatus:function(f){listeners.push(f);},onAvailability:function(f){availabilityListeners.push(f);},error:err,
    register:register,recover:recover,changePin:changePin,
    call:function(name,data){if(name==='addFriend')return addFriend(data);if(name==='acceptFriend')return acceptFriend(data);if(name==='recoverAccount')return recoverRaw(data.nickname,data.pin);return Promise.reject(failure('invalid-argument','지원하지 않는 요청이에요'));},
    account:function(){var p=HPAuth.current();return p&&p.cloud&&p.cloud.accountId;},sdk:function(){return {sdk:sdk,db:db,auth:auth};}
  };
  function retry(){if(!hasConfig||document.hidden)return;init().then(function(){if(active)sync(true);}).catch(function(){});}
  window.addEventListener('online',retry);document.addEventListener('visibilitychange',function(){if(document.hidden)sync(true);else retry();});
  // No config=null network activity; when console becomes ready, no rebuild is necessary.
  if(hasConfig){setTimeout(retry,100);setInterval(function(){if(!available)retry();},60000);}
})();
