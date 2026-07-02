var currentEvent = null;
var speakingBtn = null;

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  document.querySelectorAll(".btn-speak-global,.btn-speak-sm").forEach(function(b) {
    b.classList.remove("speaking");
    if (b.dataset.orig) b.textContent = b.dataset.orig;
  });
  speakingBtn = null;
}

function doSpeak(text, btn) {
  if (!("speechSynthesis" in window)) return;
  stopSpeaking();
  speakingBtn = btn;
  if (btn) { if (!btn.dataset.orig) btn.dataset.orig = btn.textContent; btn.textContent = "⏹ Stop"; btn.classList.add("speaking"); }
  var u = new SpeechSynthesisUtterance(text); u.rate = 0.88; u.pitch = 1;
  u.onend = u.onerror = function() { if (btn) { btn.classList.remove("speaking"); btn.textContent = btn.dataset.orig || "🔊"; } speakingBtn = null; };
  window.speechSynthesis.speak(u);
}

function toggleSpeakHome() {
  var btn = document.getElementById("home-speak-btn");
  if (speakingBtn === btn && window.speechSynthesis.speaking) { stopSpeaking(); return; }
  doSpeak("Your upcoming appointments. " + EVENTS.map(function(e) { return e.title + ". " + dayLabel(e.date) + " at " + e.time + ". " + (e.online ? "Online." : e.location.name + "."); }).join(". Next: "), btn);
}

function toggleSpeakDetail() {
  var btn = document.getElementById("detail-speak-btn");
  if (speakingBtn === btn && window.speechSynthesis.speaking) { stopSpeaking(); return; }
  var ev = currentEvent; if (!ev) return;
  var t = ev.title + ". " + formatDate(ev.date) + " at " + ev.time + ". ";
  if (ev.alert) t += "Important: " + ev.alert.message + " " + ev.alert.fix + ". ";
  t += "Before you go: " + ev.before.documents.join(". ") + ". When you arrive: " + ev.arrival.contact + ". After: " + ev.after.actions.join(". ");
  doSpeak(t, btn);
}

function speakSection(text, btnId) {
  var btn = document.getElementById(btnId);
  if (btn && speakingBtn === btn && window.speechSynthesis.speaking) { stopSpeaking(); return; }
  doSpeak(text, btn);
}

function formatDate(ds) { return new Date(ds+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"}); }
function dayLabel(ds) {
  var d = new Date(ds+"T00:00:00"), today = new Date(); today.setHours(0,0,0,0);
  var diff = Math.round((d-today)/86400000);
  if (diff===0) return "Today"; if (diff===1) return "Tomorrow";
  return d.toLocaleDateString("en-GB",{weekday:"long"});
}

function renderHome() {
  document.getElementById("today-date").textContent = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  var html = "";
  EVENTS.forEach(function(ev) {
    html += '<div class="event-card"><div class="event-card-inner" onclick="showDetail('+ev.id+')">';
    html += '<div class="event-color-dot" style="background:'+ev.typeColor+'"></div>';
    html += '<div class="event-card-text">';
    html += '<div class="event-card-title">'+ev.title+"</div>";
    html += '<div class="event-card-day">'+dayLabel(ev.date)+" — "+formatDate(ev.date)+"</div>";
    html += '<div class="event-card-time">'+ev.time+" &nbsp;·&nbsp; "+ev.duration+"</div>";
    html += '<div class="event-card-loc">'+(ev.online?"💻 Online":"📍 "+ev.location.name)+"</div>";
    if (ev.alert) html += '<div class="alert-tag">💙 '+ev.alert.title+"</div>";
    html += '</div><div class="event-card-arrow">›</div></div></div>';
  });
  document.getElementById("events-list").innerHTML = html;
}

function showDetail(id) {
  stopSpeaking(); currentEvent = null;
  for (var i=0;i<EVENTS.length;i++) { if (EVENTS[i].id===id) { currentEvent=EVENTS[i]; break; } }
  if (!currentEvent) return;
  var ev = currentEvent, html = "";

  if (ev.alert) {
    var alertTxt = (ev.alert.message+" "+ev.alert.fix).replace(/'/g,"");
    html += '<div class="alert-card"><div class="alert-card-header"><div class="alert-card-title">💙 Just to let you know</div>';
    html += '<button class="btn-speak-sm" id="sp-alert" onclick="speakSection(\''+alertTxt+'\',\'sp-alert\')">🔊</button></div>';
    html += '<div class="alert-msg">'+ev.alert.message+"</div><div class=\"alert-fix\">👍 "+ev.alert.fix+"</div></div>";
  }

  html += '<div class="detail-hero">';
  html += '<div class="detail-title">'+ev.title+"</div>";
  html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:4px;">';
  html += '<div style="font-size:20px;font-weight:800;">📅 '+dayLabel(ev.date)+' — '+formatDate(ev.date)+'</div>';
  html += '<div style="font-size:20px;font-weight:800;color:var(--accent);">🕐 '+ev.time+' &nbsp;·&nbsp; '+ev.duration+'</div>';
  html += '<div style="font-size:17px;color:var(--text3);font-weight:500;">📍 '+ev.location.name+'</div>';
  html += '</div>';
  if (ev.online && ev.location.zoomLink) {
    var linkLabel = ev.isPhone ? "📞 Call back if needed" : "🎥 Join the meeting now";
    html += '<a href="'+ev.location.zoomLink+'" target="_blank" class="join-now-btn"'+(ev.isPhone?' style="background:var(--green-dark);"':'')+'>'+linkLabel+'</a>';
  }
  html += '</div>';

  html += buildPhase(1,"📋","Before you go","Documents, journey, weather",ev,true);
  html += buildPhase(2,"🏢","When you get there","Check in, who to find",ev,false);
  html += buildPhase(3,"✅","After the event","What to do next",ev,false);
  html += "<div style='height:16px;'></div>";

  document.getElementById("detail-content").innerHTML = html;
  document.getElementById("sticky-cal").innerHTML =
    '<button class="btn-link btn-gcal" onclick="addGCal()" style="margin-bottom:10px;">📅 Add to Google Calendar</button>'+
    '<button class="btn-link btn-ics" onclick="downloadICS()" style="margin-bottom:0;">📥 Download calendar file</button>';
  showScreen("screen-detail"); window.scrollTo(0,0);
}

function buildPhase(num,emoji,name,desc,ev,startOpen) {
  var html = '<div class="phase-block"><div class="phase-header" onclick="togglePhase('+num+')">';
  html += '<div class="phase-emoji">'+emoji+'</div>';
  html += '<div class="phase-text"><div class="phase-name">'+name+'</div><div class="phase-desc">'+desc+'</div></div>';
  html += '<div class="phase-right"><button class="btn-speak-sm" id="sp-phase'+num+'" onclick="event.stopPropagation();speakPhase('+num+')">🔊</button>';
  html += '<span class="phase-chevron'+(startOpen ? ' open' : '')+'" id="chev-'+num+'">›</span></div></div>';
  html += '<div class="phase-body'+(startOpen?' open':'')+'" id="phase-body-'+num+'">';
  html += buildPhaseBody(num,ev);
  html += '</div></div>';
  return html;
}

function buildPhaseBody(num,ev) {
  var html = "";
  if (num===1) {
    var jTxt = ev.before.journeyTip.replace(/'/g,"");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Plan your journey</div>';
    html += '<button class="btn-speak-sm" id="sp-journey" onclick="speakSection(\''+jTxt+'\',\'sp-journey\')">🔊</button></div>';
    html += '<div class="tip-box"><div class="tip-icon">⏰</div>'+ev.before.journeyTip+'</div>';
    if (!ev.online) {
      html += '<div class="transport-seg"><button class="t-seg-btn active" id="btn-pub" onclick="setTransport(\'pub\')">🚌 Public</button><button class="t-seg-btn" id="btn-priv" onclick="setTransport(\'priv\')">🚗 Personal / Uber</button></div>';
      html += '<div class="t-panel active" id="panel-pub">';
      ev.location.publicRoutes.forEach(function(r,ri) {
        html += '<div class="route-group"><div class="route-label">'+r.icon+' '+r.label+'</div>';
        if (r.cost) html += '<div class="cost-badge">💷 '+r.cost+'</div>';
        r.steps.forEach(function(s,i){html+='<div class="route-step"><div class="step-num">'+(i+1)+'</div><div class="step-text">'+s+'</div></div>';});
        html += '</div>';
        if (ri<ev.location.publicRoutes.length-1) html += '<hr class="route-divider">';
      });
      html += '</div><div class="t-panel" id="panel-priv">';
      ev.location.privateRoutes.forEach(function(r,ri) {
        html += '<div class="route-group"><div class="route-label">'+r.icon+' '+r.label+'</div>';
        if (r.cost) html += '<div class="cost-badge">💷 '+r.cost+'</div>';
        r.steps.forEach(function(s,i){html+='<div class="route-step"><div class="step-num">'+(i+1)+'</div><div class="step-text">'+s+'</div></div>';});
        html += '</div>';
        if (ri<ev.location.privateRoutes.length-1) html += '<hr class="route-divider">';
      });
      html += '<div style="margin-top:16px;"><a href="'+ev.location.googleMaps+'" target="_blank" class="btn-link btn-maps">🗺️ Open in Google Maps</a><a href="'+ev.location.uber+'" target="_blank" class="btn-link btn-uber">🚕 Book an Uber</a></div></div>';
    }
    html += '</div>';
    var dTxt = 'What to bring. '+ev.before.documents.join('. ').replace(/'/g,"");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">What to bring</div>';
    html += '<button class="btn-speak-sm" id="sp-docs" onclick="speakSection(\''+dTxt+'\',\'sp-docs\')">🔊</button></div>';
    ev.before.documents.forEach(function(d,i){html+='<div class="check-item"><div class="check-box" id="doc-'+i+'" onclick="toggleCheck(this,\'doc-text-'+i+'\')"></div><div class="check-text" id="doc-text-'+i+'">'+d+'</div></div>';});
    html += '</div>';
    if (ev.weather) {
      var wxTxt = ev.weather.temp+'. '+ev.weather.description+'. '+ev.weather.advice.replace(/'/g,"");
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">Weather on the day</div>';
      html += '<button class="btn-speak-sm" id="sp-wx" onclick="speakSection(\''+wxTxt+'\',\'sp-wx\')">🔊</button></div>';
      html += '<div class="wx-row"><div class="wx-big">'+ev.weather.icon+'</div><div><div class="wx-temp">'+ev.weather.temp+'</div><div class="wx-desc">'+ev.weather.description+'</div></div></div>';
      html += '<div class="wx-tip">💡 '+ev.weather.advice+'</div></div>';
    }
    if (!ev.online&&ev.location.photos) {
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">What it looks like</div></div><div class="photo-scroll">';
      ev.location.photos.forEach(function(p){html+='<img class="venue-photo" src="'+p.url+'" alt="'+p.caption+'" loading="lazy">';});
      html += '</div><div class="photo-hint">Swipe to see more →</div></div>';
    }
  }
  if (num===2) {
    if (!ev.online&&ev.location.floor) {
      var floorTxt = ev.location.floor.replace(/'/g,"");
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">Where to go</div>';
      html += '<button class="btn-speak-sm" id="sp-where" onclick="speakSection(\''+floorTxt+'\',\'sp-where\')">🔊</button></div>';
      html += '<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label2">'+ev.location.name+'</div><div class="info-value">'+ev.location.floor+'</div></div></div></div>';
    }
    var kioskTxt = ev.arrival.kiosk.replace(/'/g,"");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Check in</div>';
    html += '<button class="btn-speak-sm" id="sp-checkin" onclick="speakSection(\''+kioskTxt+'\',\'sp-checkin\')">🔊</button></div>';
    html += '<div class="info-row"><div class="info-icon">🖥️</div><div class="info-value">'+ev.arrival.kiosk+'</div></div></div>';
    var whoTxt = ev.arrival.contact.replace(/'/g,"");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Who to speak to</div>';
    html += '<button class="btn-speak-sm" id="sp-who" onclick="speakSection(\''+whoTxt+'\',\'sp-who\')">🔊</button></div>';
    html += '<div class="info-row"><div class="info-icon">👋</div><div class="info-value">'+ev.arrival.contact+'</div></div>';
    html += '<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label2">Contact</div><div class="info-value">'+ev.contact.name+'<br><span style="color:var(--text3);font-size:15px;">'+ev.contact.detail+'</span></div></div></div></div>';
    if (ev.online) {
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">How to join</div></div><div class="join-block"><div class="join-icon">'+(ev.isPhone?"📞":"💻")+'</div>';
      html += '<div class="zoom-id-box">'+ev.location.zoomId+'</div>';
      if (ev.isPhone) { html += '<div class="zoom-pw">Your doctor will call you at '+ev.time+'</div><a href="'+ev.location.zoomLink+'" class="btn-link btn-call" style="margin-top:14px;">📞 Call back if needed</a>'; }
      else { html += '<div class="zoom-pw">Password: <strong>'+ev.location.zoomPassword+'</strong></div><a href="'+ev.location.zoomLink+'" target="_blank" class="btn-link btn-zoom" style="margin-top:14px;">🎥 Open Zoom now</a>'; }
      html += '</div></div>';
    }
  }
  if (num===3) {
    var afterTxt = 'After the event. '+ev.after.actions.join('. ').replace(/'/g,"");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Things to do</div>';
    html += '<button class="btn-speak-sm" id="sp-after" onclick="speakSection(\''+afterTxt+'\',\'sp-after\')">🔊</button></div>';
    ev.after.actions.forEach(function(a,i){html+='<div class="check-item"><div class="check-box" id="act-'+i+'" onclick="toggleCheck(this,\'act-text-'+i+'\')"></div><div class="check-text" id="act-text-'+i+'">'+a+'</div></div>';});
    html += '</div>';
  }
  return html;
}

function togglePhase(num) {
  var body=document.getElementById("phase-body-"+num), chev=document.getElementById("chev-"+num);
  if (!body) return;
  var open=body.classList.toggle("open");
  if (chev) chev.classList.toggle("open",open);
}

function speakPhase(num) {
  var ev=currentEvent; if (!ev) return;
  var btn=document.getElementById("sp-phase"+num);
  if (btn&&speakingBtn===btn&&window.speechSynthesis.speaking) { stopSpeaking(); return; }
  var t="";
  if (num===1) t="Before you go. "+ev.before.journeyTip+". Bring: "+ev.before.documents.join(". ")+(ev.weather?". Weather: "+ev.weather.temp+". "+ev.weather.advice:"");
  if (num===2) t="When you get there. "+ev.arrival.kiosk+". "+ev.arrival.contact;
  if (num===3) t="After the event. "+ev.after.actions.join(". ");
  doSpeak(t,btn);
}

function setTransport(type) {
  ["pub","priv"].forEach(function(t){ var b=document.getElementById("btn-"+t),p=document.getElementById("panel-"+t); if(b)b.classList.toggle("active",t===type); if(p)p.classList.toggle("active",t===type); });
}

function toggleCheck(box,textId) {
  var checked=box.classList.toggle("checked");
  box.textContent=checked?"✓":"";
  var txt=document.getElementById(textId); if(txt)txt.classList.toggle("done",checked);
}

function addGCal() {
  var ev=currentEvent, ds=ev.date.replace(/-/g,""), ts=ev.time.replace(":","")+"00", te=ev.endTime.replace(":","")+"00";
  window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(ev.title)+"&dates="+ds+"T"+ts+"/"+ds+"T"+te+"&location="+encodeURIComponent(ev.online?"Online":ev.location.address),"_blank");
}

function downloadICS() {
  var ev=currentEvent, ds=ev.date.replace(/-/g,""), ts=ev.time.replace(":","")+"00", te=ev.endTime.replace(":","")+"00";
  var ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:"+ds+"T"+ts+"\r\nDTEND:"+ds+"T"+te+"\r\nSUMMARY:"+ev.title+"\r\nLOCATION:"+(ev.online?"Online":ev.location.address)+"\r\nEND:VEVENT\r\nEND:VCALENDAR";
  var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"})); a.download=ev.title.replace(/\s+/g,"_")+".ics";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function showScreen(id) { document.querySelectorAll(".screen").forEach(function(s){s.classList.remove("active");}); document.getElementById(id).classList.add("active"); }
function showHome() { stopSpeaking(); showScreen("screen-home"); window.scrollTo(0,0); }

renderHome();
