// v2.0 Friends + realtime 1:1 chat. Images/window preferences stay on THIS device, never uploaded.
(function () {
  'use strict';
  var panel, win, friends=[], requests=[], stopFriends=null, stopRequests=null, stopMessages=null, current=null, messages=[], geo=null, prefs=null, bgImage=null, imageCanvas=null, loadingPrefs=null;
  var $=function(id){return document.getElementById(id);};
  var esc=function(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function key(){var p=HPAuth.current();return 'hp_chat_v20_'+(p?p.id:'none');}
  function defaults(){return {alpha:72,tint:0,color:'#e7b5c4',bg:null,geo:null};}
  function database(){return new Promise(function(resolve,reject){var r=indexedDB.open('hp_chat_local',1);r.onupgradeneeded=function(){r.result.createObjectStore('settings');};r.onsuccess=function(){resolve(r.result);};r.onerror=function(){reject(r.error);};});}
  function readPrefs(){var k=key();return database().then(function(db){return new Promise(function(resolve,reject){var r=db.transaction('settings').objectStore('settings').get(k);r.onsuccess=function(){db.close();resolve(r.result||defaults());};r.onerror=reject;});}).catch(function(){return defaults();});}
  function writePrefs(){if(!prefs)return;var k=key(),v=JSON.parse(JSON.stringify(prefs));database().then(function(db){var t=db.transaction('settings','readwrite');t.objectStore('settings').put(v,k);t.oncomplete=function(){db.close();};t.onerror=function(){notice('사진 저장 공간이 부족해요');};}).catch(function(){notice('사진 저장을 지원하지 않는 브라우저예요');});}
  function notice(t){if($('socialMsg'))$('socialMsg').textContent=t;if($('chatStatus'))$('chatStatus').textContent=t;}
  function sdk(){return HPCloud.sdk().sdk;}
  function db(){return HPCloud.sdk().db;}
  function me(){return HPCloud.account();}
  function avatar(p){var f=HP_DATA.pets.filter(function(q){return q.id===p;})[0]||HP_DATA.pets[0];return 'assets/'+f.avatar;}
  function cleanup(){if(stopFriends)stopFriends();if(stopRequests)stopRequests();stopFriends=stopRequests=null;}
  function mount(){
    if(panel)return;
    panel=document.createElement('section');panel.id='social';panel.className='hidden';
    panel.innerHTML='<div class="socialCard"><header><h2>친구 · 채팅</h2><button id="socialClose" aria-label="닫기">✕</button></header><div id="socialBody"></div><p id="socialMsg" role="status"></p></div>';
    document.body.appendChild(panel);$('socialClose').onclick=function(){panel.classList.add('hidden');};
    win=document.createElement('section');win.id='chatWin';win.className='hidden';win.setAttribute('aria-label','자유 크기 채팅 창');
    win.innerHTML='<div id="chatCanvasBg"></div><header id="chatDrag"><b id="chatTitle">채팅</b><button id="chatSetting" aria-label="배경과 말풍선 설정">⚙</button><button id="chatMin" aria-label="작게 접기">−</button><button id="chatClose" aria-label="채팅 닫기">✕</button></header>'+
      '<div id="chatMain"><div id="chatSettings" class="hidden"><label>내 배경 사진 <input type="file" id="chatPhoto" accept="image/*"></label><button id="chatBgReset">기본 배경</button><label>말풍선 불투명도 <output id="chatAlphaText"></output><input id="chatAlpha" type="range" min="15" max="100" value="72"></label><label>직접 색 섞기 <input type="color" id="chatTintColor" value="#e7b5c4"><input id="chatTint" type="range" min="0" max="100" value="0"></label><small>사진은 이 기기에만 저장돼요. 다른 사람에게 보내지 않아요. 글자 뒤는 대비 4.5:1 이상으로 보호해요.</small></div>'+
      '<div id="chatMessages" aria-live="polite"></div><div id="chatStatus" role="status"></div><form id="chatComposer"><input id="chatText" maxlength="1000" placeholder="메시지 입력" autocomplete="off" aria-label="메시지"><button id="chatSend" class="primary" type="submit">보내기</button></form></div><button id="chatResize" aria-label="창 크기 조절">◢</button>';
    document.body.appendChild(win);
    $('chatClose').onclick=closeChat;
    $('chatMessages').onscroll=function(){requestAnimationFrame(tintBubbles);};
    $('chatMin').onclick=function(){if(geo.docked)restore();else dock();};
    $('chatSetting').onclick=function(){if(geo.docked)restore();$('chatSettings').classList.toggle('hidden');setTimeout(tintBubbles,0);};
    $('chatComposer').onsubmit=function(e){e.preventDefault();send();};
    $('chatPhoto').onchange=function(){if(this.files[0])upload(this.files[0]);};
    $('chatBgReset').onclick=function(){prefs.bg=null;applyBg();writePrefs();};
    ['chatAlpha','chatTint','chatTintColor'].forEach(function(id){$(id).oninput=function(){prefs.alpha=+$('chatAlpha').value;prefs.tint=+$('chatTint').value;prefs.color=$('chatTintColor').value;$('chatAlphaText').textContent=prefs.alpha+'%';tintBubbles();writePrefs();};});
    var gesture=null;
    function down(e,kind){if(e.button!==undefined && e.button!==0)return;if(kind==='move' && e.target.closest('button'))return;e.preventDefault();gesture={kind:kind,x:e.clientX,y:e.clientY,g:Object.assign({},geo)};e.currentTarget.setPointerCapture(e.pointerId);}
    $('chatDrag').onpointerdown=function(e){down(e,'move');};$('chatResize').onpointerdown=function(e){if(geo.docked)restore();down(e,'resize');};
    function move(e){if(!gesture)return;var dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,g=gesture.g;if(gesture.kind==='move'){geo.x=g.x+dx;geo.y=g.y+dy;}else{geo.w=g.w+dx;geo.h=g.h+dy;}position();}
    function up(){if(!gesture)return;gesture=null;snap();remember();tintBubbles();}
    ['chatDrag','chatResize'].forEach(function(id){$(id).onpointermove=move;$(id).onpointerup=up;$(id).onpointercancel=up;});
    $('chatDrag').ondblclick=function(){if(geo.docked)restore();else dock();};
    window.addEventListener('resize',function(){if(geo){position();tintBubbles();}});
    if(window.visualViewport)visualViewport.addEventListener('resize',function(){if(geo){position();tintBubbles();}});
  }
  function render(){
    var draft=$('friendCode')?$('friendCode').value:'',pinDraft=$('connectPin')?$('connectPin').value:'',focus=document.activeElement&&document.activeElement.id;
    var p=HPAuth.current(), connected=HPCloud.configured && p && p.cloud;
    var html='<div class="ovl"><b>내 친구 코드</b><strong id="myFriendCode">'+esc(connected?p.cloud.code:'--------')+'</strong><p>'+esc(!HPCloud.configured?'서버 준비 중 · 설정 후 친구 코드가 생겨요':connected?'전화번호 없이 코드로 친구를 추가해요. 상대가 수락한 뒤 대화할 수 있어요.':'기존 로컬 프로필을 서버에 연결해 주세요')+'</p>';
    if(connected)html+='<button id="copyFriendCode">내 코드 복사</button>';
    if(HPCloud.configured && !connected)html+='<input id="connectPin" type="password" inputmode="numeric" maxlength="4" placeholder="지금 프로필 PIN"><button id="connectAccount" class="primary">서버 계정 연결</button>';
    html+='</div><div class="ovl"><label>친구 코드로 추가<input id="friendCode" maxlength="8" placeholder="8글자 친구 코드" autocapitalize="characters" autocomplete="off"></label><button id="addFriend" class="primary"'+(connected?'':' disabled')+'>친구 요청</button></div><h3>받은 친구 요청</h3><div id="friendRequests">';
    if(!requests.length)html+='<p class="note">아직 요청이 없어요</p>';
    requests.forEach(function(r){html+='<div class="friendRow"><span>'+esc(r.nickname)+'</span><button class="acceptFriend" data-from="'+esc(r.id)+'">수락</button><button class="declineFriend" data-from="'+esc(r.id)+'">거절</button></div>';});
    html+='</div><h3>내 친구</h3><div id="friendList">';
    if(!friends.length)html+='<p class="note">친구 코드를 주고받아 보세요</p>';
    friends.forEach(function(f){html+='<div class="friendRow"><img src="'+avatar(f.pet)+'" alt=""><span>'+esc(f.nickname)+'</span><button class="chatFriend" data-id="'+esc(f.id)+'">대화</button></div>';});
    html+='</div><button id="chatPreview">채팅 창 미리보기 (전송 안 됨)</button><p class="note">창 윗부분 끌기 · 오른쪽 아래 ◢로 크기 조절 · −로 모서리에 접기<br>채팅은 앱 안에서만 떠요. 다른 앱 위 미니 채팅은 아직 지원하지 않아요.</p>';
    $('socialBody').innerHTML=html;
    if($('friendCode'))$('friendCode').value=draft;if($('connectPin'))$('connectPin').value=pinDraft;
    if((focus==='friendCode'||focus==='connectPin')&&$(focus))$(focus).focus();
    $('socialMsg').textContent=HPCloud.status();
    if($('copyFriendCode'))$('copyFriendCode').onclick=function(){navigator.clipboard.writeText(p.cloud.code).then(function(){notice('친구 코드를 복사했어요');}).catch(function(){notice(p.cloud.code);});};
    $('addFriend').onclick=function(){var b=this;b.disabled=true;HPCloud.call('addFriend',{accountId:me(),code:$('friendCode').value}).then(function(r){notice(r.already?'이미 친구예요':'친구 요청을 보냈어요. 수락을 기다려 주세요');}).catch(function(e){notice(HPCloud.error(e));}).finally(function(){b.disabled=false;});};
    if($('connectAccount'))$('connectAccount').onclick=function(){
      var pin=$('connectPin').value, r=HPAuth.login(p.id,pin);if(!r.ok){notice(r.msg);return;}this.disabled=true;
      HP.save();HPCloud.register(p.originalNick||p.nick,pin,p.pet,localStorage.getItem(HPAuth.saveKey(p.id))).then(function(c){pin='';HPAuth.setCloud(p.id,c);HPCloud.session(HPAuth.current());open();}).catch(function(e){pin='';notice(HPCloud.error(e));if($('connectAccount'))$('connectAccount').disabled=false;});
    };
    Array.prototype.forEach.call(panel.querySelectorAll('.acceptFriend'),function(b){b.onclick=function(){b.disabled=true;HPCloud.call('acceptFriend',{accountId:me(),from:b.dataset.from}).catch(function(e){notice(HPCloud.error(e));b.disabled=false;});};});
    Array.prototype.forEach.call(panel.querySelectorAll('.declineFriend'),function(b){b.onclick=function(){sdk().deleteDoc(sdk().doc(db(),'users',me(),'requests',b.dataset.from)).catch(function(e){notice(HPCloud.error(e));});};});
    Array.prototype.forEach.call(panel.querySelectorAll('.chatFriend'),function(b){b.onclick=function(){openChat(friends.filter(function(f){return f.id===b.dataset.id;})[0]);};});
    $('chatPreview').onclick=function(){openChat({id:'preview',nickname:'미리보기',room:null});};
  }
  function open(){
    mount();cleanup();friends=[];requests=[];panel.classList.remove('hidden');render();
    if(!HPCloud.configured || !me())return;
    HPCloud.init().then(function(){
      stopFriends=sdk().onSnapshot(sdk().collection(db(),'users',me(),'friends'),function(s){friends=s.docs.map(function(d){return Object.assign({id:d.id},d.data());});render();},function(e){notice(HPCloud.error(e));});
      stopRequests=sdk().onSnapshot(sdk().collection(db(),'users',me(),'requests'),function(s){requests=s.docs.map(function(d){return Object.assign({id:d.id},d.data());});render();},function(e){notice(HPCloud.error(e));});
    }).catch(function(e){notice(HPCloud.error(e));});
  }
  function initialGeo(){return {x:Math.max(8,innerWidth-370),y:Math.min(120,innerHeight*0.12),w:Math.min(360,innerWidth-16),h:Math.min(560,innerHeight-32),docked:false};}
  function position(){
    if(!geo)return;var screenH=window.visualViewport?visualViewport.height:innerHeight,screenY=window.visualViewport?visualViewport.offsetTop:0;geo.w=Math.max(Math.min(220,innerWidth-16),Math.min(innerWidth-16,geo.w));geo.h=Math.max(Math.min(220,screenH-16),Math.min(screenH-16,geo.h));
    var w=geo.docked?Math.min(220,innerWidth-16):geo.w,h=geo.docked?48:geo.h;
    geo.x=Math.max(8,Math.min(innerWidth-w-8,geo.x));geo.y=Math.max(screenY+8,Math.min(screenY+screenH-h-8,geo.y));
    win.style.left=geo.x+'px';win.style.top=geo.y+'px';win.style.width=w+'px';win.style.height=h+'px';win.classList.toggle('docked',geo.docked);$('chatMin').textContent=geo.docked?'□':'−';$('chatMin').setAttribute('aria-label',geo.docked?'원래 크기로':'작게 접기');
  }
  function remember(){if(prefs){prefs.geo=geo;writePrefs();}}
  function snap(){var w=geo.docked?220:geo.w,h=geo.docked?48:geo.h;if(geo.x<36)geo.x=8;if(innerWidth-(geo.x+w)<36)geo.x=innerWidth-w-8;if(geo.y<36)geo.y=8;if(innerHeight-(geo.y+h)<36)geo.y=innerHeight-h-8;position();}
  function dock(){geo.restore={x:geo.x,y:geo.y,w:geo.w,h:geo.h};geo.x=geo.x+geo.w/2<innerWidth/2?8:innerWidth-228;geo.y=geo.y+geo.h/2<innerHeight/2?8:innerHeight-56;geo.docked=true;position();remember();}
  function restore(){var r=geo.restore;geo=Object.assign({},r||initialGeo(),{docked:false});position();remember();setTimeout(tintBubbles,0);}
  function applyBg(){
    var bg=$('chatCanvasBg');bg.style.backgroundImage=prefs.bg?'url("'+prefs.bg+'")':'';bgImage=null;imageCanvas=null;
    var source=prefs.bg,cssBg=getComputedStyle(bg).backgroundImage;
    if(!source && /^url\(/.test(cssBg))source=cssBg.slice(4,-1).replace(/^["']|["']$/g,'');
    if(source){var im=new Image();im.onload=function(){bgImage=im;tintBubbles();};im.src=source;}
    tintBubbles();
  }
  function upload(file){
    if(!file.type.match(/^image\//)||file.size>10*1024*1024){notice('10MB 이하 사진 파일을 골라 주세요');return;}
    var url=URL.createObjectURL(file), im=new Image();
    im.onload=function(){try{var r=Math.min(1,1440/Math.max(im.width,im.height)), c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*r));c.height=Math.max(1,Math.round(im.height*r));c.getContext('2d').drawImage(im,0,0,c.width,c.height);prefs.bg=c.toDataURL('image/jpeg',0.84);writePrefs();applyBg();notice('배경은 이 기기에만 저장했어요');}catch(e){notice('사진을 읽지 못했어요');}URL.revokeObjectURL(url);};im.onerror=function(){URL.revokeObjectURL(url);notice('이 사진 형식은 지원하지 않아요. JPG/PNG로 다시 골라 주세요');};im.src=url;
  }
  function luminance(c){var a=c.map(function(v){v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*a[0]+.7152*a[1]+.0722*a[2];}
  function sample(rect){
    if(!imageCanvas)return [255,235,234];
    var r=win.getBoundingClientRect(),x=Math.max(0,Math.floor(rect.left-r.left)),y=Math.max(0,Math.floor(rect.top-r.top)),w=Math.max(1,Math.min(Math.ceil(rect.width),imageCanvas.width-x)),h=Math.max(1,Math.min(Math.ceil(rect.height),imageCanvas.height-y));
    try{var d=imageCanvas.getContext('2d').getImageData(x,y,w,h).data,sum=[0,0,0],n=0;for(var i=0;i<d.length;i+=64){sum[0]+=d[i];sum[1]+=d[i+1];sum[2]+=d[i+2];n++;}return sum.map(function(v){return Math.round(v/Math.max(1,n));});}catch(e){return [235,225,225];}
  }
  function tintBubbles(){
    if(!win || !prefs || win.classList.contains('hidden'))return;
    var w=Math.round(win.clientWidth),h=Math.round(win.clientHeight);if(w&&h){imageCanvas=document.createElement('canvas');imageCanvas.width=w;imageCanvas.height=h;var ctx=imageCanvas.getContext('2d');if(bgImage){var s=Math.max(w/bgImage.width,h/bgImage.height);ctx.drawImage(bgImage,(w-bgImage.width*s)/2,(h-bgImage.height*s)/2,bgImage.width*s,bgImage.height*s);}else{var grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#ffe3ea');grad.addColorStop(.65,'#fff5eb');grad.addColorStop(1,'#edf5dc');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);}}
    var manual=(prefs.color||'#e7b5c4').match(/\w\w/g).map(function(s){return parseInt(s,16);}),t=(prefs.tint||0)/100;
    Array.prototype.forEach.call(win.querySelectorAll('.chatBubble'),function(b){var col=sample(b.getBoundingClientRect()).map(function(v,i){return Math.round(v*(1-t)+manual[i]*t);}),lum=luminance(col),black=(lum+.05)/.05,white=1.05/(lum+.05),fg=black>=white?'#000':'#fff',ratio=Math.max(black,white);
      b.style.backgroundColor='rgba('+col.join(',')+','+prefs.alpha/100+')';b.style.color=fg;b.dataset.contrast=ratio.toFixed(2);b.style.setProperty('--word-bg','rgb('+col.join(',')+')');
    });
  }
  function renderMessages(){
    var list=$('chatMessages'),near=list.scrollHeight-list.scrollTop-list.clientHeight<80;list.innerHTML='';
    if(!messages.length){var note=document.createElement('p');note.className='chatEmpty';note.textContent=current.room?'대화를 시작해 보세요':'서버 준비 중 / 미리보기 · 전송하지 않아요';list.appendChild(note);}
    messages.forEach(function(m){var row=document.createElement('div');row.className='chatMessage'+(m.sender===me()?' mine':'');var b=document.createElement('div');b.className='chatBubble';var text=document.createElement('span');text.className='chatWords';text.textContent=m.text;b.appendChild(text);row.appendChild(b);list.appendChild(row);});
    if(near)list.scrollTop=list.scrollHeight;
    requestAnimationFrame(tintBubbles);
  }
  function openChat(friend){
    mount();panel.classList.add('hidden');if(stopMessages)stopMessages();stopMessages=null;current=friend;messages=[];win.classList.remove('hidden');$('chatTitle').textContent=friend.nickname;$('chatText').value='';$('chatSend').disabled=!friend.room || !HPCloud.configured;$('chatStatus').textContent=friend.room?'실시간 연결 중…':'미리보기 · 메시지는 보내지 않아요';
    loadingPrefs=readPrefs().then(function(p){prefs=Object.assign(defaults(),p);geo=prefs.geo||initialGeo();position();$('chatAlpha').value=prefs.alpha;$('chatAlphaText').textContent=prefs.alpha+'%';$('chatTint').value=prefs.tint;$('chatTintColor').value=prefs.color;applyBg();renderMessages();});
    if(friend.room)HPCloud.init().then(function(){
      if(current!==friend || win.classList.contains('hidden'))return;
      var q=sdk().query(sdk().collection(db(),'rooms',friend.room,'messages'),sdk().orderBy('createdAt','desc'),sdk().limit(100));
      stopMessages=sdk().onSnapshot(q,function(s){messages=s.docs.map(function(d){return Object.assign({id:d.id},d.data());}).reverse();$('chatStatus').textContent=s.metadata.fromCache?'연결 확인 중…':'실시간 연결됨';if(prefs)renderMessages();},function(e){notice(HPCloud.error(e));});
    }).catch(function(e){notice(HPCloud.error(e));});
  }
  var sending=false,lastSent=0;
  function send(){
    if(!current || !current.room || !me() || sending)return;var text=$('chatText').value.trim();if(!text)return;
    if(Date.now()-lastSent<1000){notice('잠깐 뒤에 보내 주세요');return;}sending=true;$('chatSend').disabled=true;
    sdk().addDoc(sdk().collection(db(),'rooms',current.room,'messages'),{sender:me(),text:text,createdAt:sdk().serverTimestamp()}).then(function(){if($('chatText').value.trim()===text)$('chatText').value='';lastSent=Date.now();notice('실시간 연결됨');}).catch(function(e){notice(HPCloud.error(e));}).finally(function(){sending=false;$('chatSend').disabled=false;});
  }
  function closeChat(){if(win)win.classList.add('hidden');if(stopMessages)stopMessages();stopMessages=null;}
  function back(){if(win && !win.classList.contains('hidden')){closeChat();return true;}if(panel && !panel.classList.contains('hidden')){panel.classList.add('hidden');return true;}return false;}
  HPCloud.onStatus(function(t){if($('socialMsg'))$('socialMsg').textContent=t;});
  HPCloud.onAvailability(function(){if(panel&&!panel.classList.contains('hidden'))open();});
  window.HPSocial={open:open,openChat:openChat,back:back,close:closeChat,tint:tintBubbles};
})();
