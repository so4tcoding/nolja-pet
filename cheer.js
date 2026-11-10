// Friendly local encouragement only, never a chat message sent to another person.
window.HP_CHEER = function(api) {
  'use strict';
  var lastCheck=0;
  function settingsState(){var s=api.state();if(!s.cheerSettings)s.cheerSettings={enabled:true,frequency:3,notifications:false};s.cheerSettings.frequency=Math.max(1,Math.min(6,+s.cheerSettings.frequency||3));return s.cheerSettings;}
  function kst(){var d=new Date(Date.now()+9*3600000);return {hour:d.getUTCHours(),day:d.toISOString().slice(0,10)};}
  function syncNative(){if(!api.state())return;var c=settingsState(),p=api.pet();if(api.native)api.nCall('configureCheer',JSON.stringify({enabled:!!(c.enabled&&c.notifications),frequency:c.frequency,id:p.id,name:p.name,avatar:'www/assets/'+p.avatar,lines:(HP_DATA.petLines[p.id]||{}).cheer||['오늘도 응원해요!']}));}
  function emit(manual){
    var s=api.state(),c=settingsState(),k=kst();if(!manual&&(!c.enabled||k.hour<9||k.hour>=22))return false;
    var text=api.line('cheer');api.say(text,7,'happy');
    if(!manual){s.cheerState=s.cheerState||{};s.cheerState.count=(s.cheerState.count||0)+1;s.cheerState.nextAt=Date.now()+(13*3600000/c.frequency)*(.8+Math.random()*.4);api.save();}
    if(!manual&&!api.native&&c.notifications&&window.Notification&&Notification.permission==='granted'){
      var opts={body:text,icon:'assets/'+api.pet().avatar,tag:'hp-cheer'};
      if(navigator.serviceWorker)navigator.serviceWorker.ready.then(function(r){return r.showNotification(api.pet().name+'의 응원',opts);}).catch(function(){});
      else try{new Notification(api.pet().name+'의 응원',opts);}catch(e){}
    }
    return true;
  }
  function opened(){var s=api.state();if(!s)return;var c=settingsState(),k=kst();if(!s.cheerState||s.cheerState.day!==k.day)s.cheerState={day:k.day,count:0,nextAt:0};if(c.enabled&&s.cheerState.count<c.frequency&&Date.now()>=s.cheerState.nextAt)emit(false);syncNative();}
  setInterval(function(){if(!document.hidden&&api.state()&&Date.now()-lastCheck>60000){lastCheck=Date.now();opened();}},61000);
  function settings(){
    var c=settingsState(),d=document.createElement('div');d.className='ovl';d.id='cheerSettings';
    d.innerHTML='<b>친구의 응원</b><label style="display:block;margin:10px 0"><input id="cheerEnabled" type="checkbox" '+(c.enabled?'checked':'')+'> 응원 말풍선 받기</label><label>하루 횟수 <select id="cheerFrequency">'+[1,2,3,4,5,6].map(function(n){return '<option value="'+n+'"'+(c.frequency===n?' selected':'')+'>'+n+'번</option>';}).join('')+'</select></label><p class="note">오전 9시~밤 10시 (KST) 사이에만 응원해요.<br>Android 알림은 절전 설정에 따라 늦어질 수 있어요. 웹/아이폰은 앱을 연 동안만 가능해요.</p><button id="cheerNotify">'+(c.notifications?'기기 응원 알림 끄기':'기기 응원 알림 허용')+'</button> <button id="cheerPreview">응원 미리보기</button><p id="cheerStatus" class="note"></p>';
    var $=function(id){return d.querySelector('#'+id);};
    function changed(){api.save();syncNative();}
    $('cheerEnabled').onchange=function(){c.enabled=this.checked;changed();};
    $('cheerFrequency').onchange=function(){c.frequency=+this.value;var s=api.state();if(s.cheerState)s.cheerState.nextAt=Date.now()+13*3600000/c.frequency;changed();};
    $('cheerPreview').onclick=function(){emit(true);$('cheerStatus').textContent='미리보기 · 실제 알림/메시지를 보내지 않아요';};
    $('cheerNotify').onclick=function(){
      if(c.notifications){c.notifications=false;changed();this.textContent='기기 응원 알림 허용';return;}
      var button=this;
      if(api.native){c.notifications=true;api.nCall('requestCheerPermission');changed();button.textContent='기기 응원 알림 끄기';$('cheerStatus').textContent='기기의 알림 허용 설정을 확인해 주세요';}
      else if(window.Notification&&typeof Notification.requestPermission==='function')Notification.requestPermission().then(function(p){c.notifications=p==='granted';changed();button.textContent=c.notifications?'기기 응원 알림 끄기':'기기 응원 알림 허용';$('cheerStatus').textContent=c.notifications?'앱을 열었을 때 응원 알림을 보여요':'알림이 허용되지 않았어요. 말풍선은 받을 수 있어요';}).catch(function(){$('cheerStatus').textContent='이 브라우저에서는 기기 알림을 지원하지 않아요';});
      else $('cheerStatus').textContent='이 브라우저에서는 기기 알림을 지원하지 않아요. 말풍선으로 응원해요';
    };
    return d;
  }
  return {opened:opened,settings:settings,syncNative:syncNative,preview:function(){return emit(true);}};
};
