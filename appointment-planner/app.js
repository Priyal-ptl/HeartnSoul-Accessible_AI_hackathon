var currentEvent = null;
var speakingBtn = null;

/* ─── Speech ─── */
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
  if (btn) {
    if (!btn.dataset.orig) btn.dataset.orig = btn.textContent;
    btn.textContent = "⏹ Stop";
    btn.classList.add("speaking");
  }
  var u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88; u.pitch = 1;
  u.onend = u.onerror = function() {
    if (btn) { btn.classList.remove("speaking"); btn.textContent = btn.dataset.orig || "🔊"; }
    speakingBtn = null;
  };
  window.speechSynthesis.speak(u);
}

function toggleSpeakHome() {
  var btn = document.getElementById("home-speak-btn");
  if (speakingBtn === btn && window.speechSynthesis.speaking) { stopSpeaking(); return; }
  doSpeak("Your upcoming appointments. " + EVENTS.map(function(e) {
    return e.title + ". " + dayLabel(e.date) + " at " + e.time + ". " + (e.online ? "Online." : e.location.name + ".");
  }).join(". Next: "), btn);
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

/* ─── Date helpers ─── */
function formatDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
}
function formatMediumDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"long" });
}
function dayLabel(ds) {
  var d = new Date(ds + "T00:00:00"), today = new Date();
  today.setHours(0,0,0,0);
  var diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday:"long" });
}
function formatShortDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"short" });
}

/* ─── Home screen ─── */
function renderHome() {
  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  var html = "";
  var today = new Date(); today.setHours(0,0,0,0);

  EVENTS.forEach(function(ev) {
    var d = new Date(ev.date + "T00:00:00");
    var diff = Math.round((d - today) / 86400000);
    var isToday = diff === 0;

    html += '<div class="event-card" onclick="showDetail(' + ev.id + ')">';
    html += '<div class="event-card-inner">';
    html += '<div class="event-accent-bar" style="background:' + ev.typeColor + '"></div>';
    html += '<div class="event-card-text">';
    html += '<div class="event-card-title">' + ev.title + '</div>';
    html += '<div class="event-card-day">' + dayLabel(ev.date) + (isToday ? '' : '  ·  ' + formatShortDate(ev.date)) + '</div>';
    html += '<div class="event-card-time" style="color:' + ev.typeColor + '">' + ev.time + '  ·  ' + ev.duration + '</div>';
    html += '<div class="event-card-loc">' + (ev.online ? '💻 Online' : '📍 ' + ev.location.name) + '</div>';
    if (ev.alert) html += '<div class="alert-tag">💙 ' + ev.alert.title + '</div>';
    html += '</div>';
    html += '<div class="event-card-arrow">›</div>';
    html += '</div></div>';
  });

  document.getElementById("events-list").innerHTML = html;
}

/* ─── Detail screen ─── */
function showDetail(id) {
  stopSpeaking(); currentEvent = null;
  for (var i = 0; i < EVENTS.length; i++) {
    if (EVENTS[i].id === id) { currentEvent = EVENTS[i]; break; }
  }
  if (!currentEvent) return;
  var ev = currentEvent;
  var html = "";

  /* Alert */
  if (ev.alert) {
    var alertTxt = (ev.alert.message + " " + ev.alert.fix).replace(/'/g, "");
    html += '<div class="alert-card">';
    html += '<div class="alert-card-header"><div class="alert-card-title">💙 Just to let you know</div>';
    html += '<button class="btn-speak-sm" id="sp-alert" onclick="speakSection(\'' + alertTxt + '\',\'sp-alert\')">🔊</button></div>';
    html += '<div class="alert-msg">' + ev.alert.message + '</div>';
    html += '<div class="alert-fix">👍 ' + ev.alert.fix + '</div>';
    html += '</div>';
  }

  /* Hero */
  html += '<div class="detail-hero">';
  html += '<div class="detail-hero-tint" style="background:' + ev.typeColor + '"></div>';
  html += '<div class="detail-title">' + ev.title + '</div>';
  html += '<div class="detail-meta">';
  html += '<div class="detail-meta-row"><div class="detail-meta-icon">📅</div><div><div class="detail-meta-text">' + dayLabel(ev.date) + '</div><div class="detail-meta-sub">' + formatMediumDate(ev.date) + '</div></div></div>';
  html += '<div class="detail-meta-row"><div class="detail-meta-icon">🕐</div><div><div class="detail-meta-text accent" style="color:' + ev.typeColor + '">' + ev.time + '</div><div class="detail-meta-sub">' + ev.duration + '</div></div></div>';
  html += '<div class="detail-meta-row"><div class="detail-meta-icon">📍</div><div><div class="detail-meta-text">' + ev.location.name + '</div>' + (!ev.online && ev.location.address ? '<div class="detail-meta-sub">' + ev.location.address + '</div>' : '') + '</div></div>';
  html += '</div>';

  if (ev.online && ev.location.zoomLink) {
    var isPhone = ev.isPhone;
    var joinLabel = isPhone ? '📞 Call back if needed' : '🎥 Join the meeting now';
    var joinStyle = isPhone ? 'background:var(--green-dark)' : '';
    html += '<a href="' + ev.location.zoomLink + '" target="_blank" class="join-now-btn" style="' + joinStyle + '">' + joinLabel + '</a>';
  }
  html += '</div>';

  html += buildPhase(1, "📋", "Before you go", "Journey, documents & weather", ev, true);
  html += buildPhase(2, "🏢", "When you get there", "Check in & who to find", ev, false);
  html += buildPhase(3, "✅", "After the event", "What to do next", ev, false);
  html += "<div style='height:8px'></div>";

  document.getElementById("detail-content").innerHTML = html;

  /* Sticky bottom */
  document.getElementById("sticky-cal").innerHTML =
    '<button class="sticky-btn sticky-btn-gcal" onclick="addGCal()">📅 Google Calendar</button>' +
    '<button class="sticky-btn sticky-btn-ics" onclick="downloadICS()">📥 Save file</button>';

  navigateTo("screen-detail");
  window.scrollTo(0, 0);
}

/* ─── Phase accordion ─── */
function buildPhase(num, emoji, name, desc, ev, startOpen) {
  var html = '<div class="phase-block">';
  html += '<div class="phase-header" onclick="togglePhase(' + num + ')">';
  html += '<div class="phase-emoji">' + emoji + '</div>';
  html += '<div class="phase-text"><div class="phase-name">' + name + '</div><div class="phase-desc">' + desc + '</div></div>';
  html += '<div class="phase-right">';
  html += '<button class="btn-speak-sm" id="sp-phase' + num + '" onclick="event.stopPropagation();speakPhase(' + num + ')">🔊</button>';
  html += '<div class="phase-chevron' + (startOpen ? ' open' : '') + '" id="chev-' + num + '">';
  html += '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2L7 5L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  html += '</div></div></div>';
  html += '<div class="phase-body' + (startOpen ? ' open' : '') + '" id="phase-body-' + num + '">';
  html += buildPhaseBody(num, ev);
  html += '</div></div>';
  return html;
}

function buildPhaseBody(num, ev) {
  var html = "";
  if (num === 1) {
    var jTxt = ev.before.journeyTip.replace(/'/g, "");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Journey plan</div>';
    html += '<button class="btn-speak-sm" id="sp-journey" onclick="speakSection(\'' + jTxt + '\',\'sp-journey\')">🔊</button></div>';
    html += '<div class="tip-box"><div class="tip-icon">⏰</div>' + ev.before.journeyTip + '</div>';

    if (!ev.online) {
      html += '<div class="transport-seg"><button class="t-seg-btn active" id="btn-pub" onclick="setTransport(\'pub\')">🚌 Public transport</button><button class="t-seg-btn" id="btn-priv" onclick="setTransport(\'priv\')">🚗 Drive / Uber</button></div>';

      html += '<div class="t-panel active" id="panel-pub">';
      ev.location.publicRoutes.forEach(function(r, ri) {
        html += '<div class="route-group"><div class="route-label">' + r.icon + ' ' + r.label + '</div>';
        if (r.cost) html += '<div class="cost-badge">💷 ' + r.cost + '</div>';
        r.steps.forEach(function(s, i) { html += '<div class="route-step"><div class="step-num">' + (i+1) + '</div><div class="step-text">' + s + '</div></div>'; });
        html += '</div>';
        if (ri < ev.location.publicRoutes.length - 1) html += '<hr class="route-divider">';
      });
      html += '</div>';

      html += '<div class="t-panel" id="panel-priv">';
      ev.location.privateRoutes.forEach(function(r, ri) {
        html += '<div class="route-group"><div class="route-label">' + r.icon + ' ' + r.label + '</div>';
        if (r.cost) html += '<div class="cost-badge">💷 ' + r.cost + '</div>';
        r.steps.forEach(function(s, i) { html += '<div class="route-step"><div class="step-num">' + (i+1) + '</div><div class="step-text">' + s + '</div></div>'; });
        html += '</div>';
        if (ri < ev.location.privateRoutes.length - 1) html += '<hr class="route-divider">';
      });
      html += '<div style="margin-top:16px;">';
      html += '<a href="' + ev.location.googleMaps + '" target="_blank" class="btn-link btn-maps">🗺️ Open in Google Maps</a>';
      html += '<a href="' + ev.location.uber + '" target="_blank" class="btn-link btn-uber">🚕 Book an Uber</a>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    var dTxt = 'What to bring. ' + ev.before.documents.join('. ').replace(/'/g, "");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">What to bring</div>';
    html += '<button class="btn-speak-sm" id="sp-docs" onclick="speakSection(\'' + dTxt + '\',\'sp-docs\')">🔊</button></div>';
    ev.before.documents.forEach(function(d, i) {
      html += '<div class="check-item"><div class="check-box" id="doc-' + i + '" onclick="toggleCheck(this,\'doc-text-' + i + '\')"></div><div class="check-text" id="doc-text-' + i + '">' + d + '</div></div>';
    });
    html += '</div>';

    if (ev.weather) {
      var wxTxt = ev.weather.temp + '. ' + ev.weather.description + '. ' + ev.weather.advice.replace(/'/g, "");
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">Weather</div>';
      html += '<button class="btn-speak-sm" id="sp-wx" onclick="speakSection(\'' + wxTxt + '\',\'sp-wx\')">🔊</button></div>';
      html += '<div class="wx-row"><div class="wx-big">' + ev.weather.icon + '</div><div><div class="wx-temp">' + ev.weather.temp + '</div><div class="wx-desc">' + ev.weather.description + '</div></div></div>';
      html += '<div class="wx-tip">💡 ' + ev.weather.advice + '</div></div>';
    }

    if (!ev.online && ev.location.photos) {
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">What it looks like</div></div>';
      html += '<div class="photo-scroll">';
      ev.location.photos.forEach(function(p) { html += '<img class="venue-photo" src="' + p.url + '" alt="' + p.caption + '" loading="lazy">'; });
      html += '</div><div class="photo-caption">Swipe to see more →</div></div>';
    }
  }

  if (num === 2) {
    if (!ev.online && ev.location.floor) {
      var floorTxt = ev.location.floor.replace(/'/g, "");
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">Where to go</div>';
      html += '<button class="btn-speak-sm" id="sp-where" onclick="speakSection(\'' + floorTxt + '\',\'sp-where\')">🔊</button></div>';
      html += '<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label2">' + ev.location.name + '</div><div class="info-value">' + ev.location.floor + '</div></div></div></div>';
    }

    var kioskTxt = ev.arrival.kiosk.replace(/'/g, "");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Check in</div>';
    html += '<button class="btn-speak-sm" id="sp-checkin" onclick="speakSection(\'' + kioskTxt + '\',\'sp-checkin\')">🔊</button></div>';
    html += '<div class="info-row"><div class="info-icon">🖥️</div><div class="info-value">' + ev.arrival.kiosk + '</div></div></div>';

    var whoTxt = ev.arrival.contact.replace(/'/g, "");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Who to speak to</div>';
    html += '<button class="btn-speak-sm" id="sp-who" onclick="speakSection(\'' + whoTxt + '\',\'sp-who\')">🔊</button></div>';
    html += '<div class="info-row"><div class="info-icon">👋</div><div class="info-value">' + ev.arrival.contact + '</div></div>';
    html += '<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label2">Contact</div><div class="info-value">' + ev.contact.name + '<br><span style="color:var(--label3);font-size:14px;">' + ev.contact.detail + '</span></div></div></div></div>';

    if (ev.online) {
      html += '<div class="sub"><div class="sub-header"><div class="sub-title">How to join</div></div>';
      html += '<div class="join-block"><div class="join-icon">' + (ev.isPhone ? '📞' : '💻') + '</div>';
      html += '<div class="zoom-id-box">' + ev.location.zoomId + '</div>';
      if (ev.isPhone) {
        html += '<div class="zoom-pw">Your doctor will call you at ' + ev.time + '</div>';
        html += '<a href="' + ev.location.zoomLink + '" class="btn-link btn-call" style="margin-top:14px;">📞 Call back if needed</a>';
      } else {
        html += '<div class="zoom-pw">Password: <strong>' + ev.location.zoomPassword + '</strong></div>';
        html += '<a href="' + ev.location.zoomLink + '" target="_blank" class="btn-link btn-zoom" style="margin-top:14px;">🎥 Open Zoom now</a>';
      }
      html += '</div></div>';
    }
  }

  if (num === 3) {
    var afterTxt = 'After the event. ' + ev.after.actions.join('. ').replace(/'/g, "");
    html += '<div class="sub"><div class="sub-header"><div class="sub-title">Things to do</div>';
    html += '<button class="btn-speak-sm" id="sp-after" onclick="speakSection(\'' + afterTxt + '\',\'sp-after\')">🔊</button></div>';
    ev.after.actions.forEach(function(a, i) {
      html += '<div class="check-item"><div class="check-box" id="act-' + i + '" onclick="toggleCheck(this,\'act-text-' + i + '\')"></div><div class="check-text" id="act-text-' + i + '">' + a + '</div></div>';
    });
    html += '</div>';
  }
  return html;
}

function togglePhase(num) {
  var body = document.getElementById("phase-body-" + num);
  var chev = document.getElementById("chev-" + num);
  if (!body) return;
  var open = body.classList.toggle("open");
  if (chev) chev.classList.toggle("open", open);
}

function speakPhase(num) {
  var ev = currentEvent; if (!ev) return;
  var btn = document.getElementById("sp-phase" + num);
  if (btn && speakingBtn === btn && window.speechSynthesis.speaking) { stopSpeaking(); return; }
  var t = "";
  if (num === 1) t = "Before you go. " + ev.before.journeyTip + ". Bring: " + ev.before.documents.join(". ") + (ev.weather ? ". Weather: " + ev.weather.temp + ". " + ev.weather.advice : "");
  if (num === 2) t = "When you get there. " + ev.arrival.kiosk + ". " + ev.arrival.contact;
  if (num === 3) t = "After the event. " + ev.after.actions.join(". ");
  doSpeak(t, btn);
}

/* ─── Transport toggle ─── */
function setTransport(type) {
  ["pub","priv"].forEach(function(t) {
    var b = document.getElementById("btn-" + t);
    var p = document.getElementById("panel-" + t);
    if (b) b.classList.toggle("active", t === type);
    if (p) p.classList.toggle("active", t === type);
  });
}

/* ─── Check boxes ─── */
function toggleCheck(box, textId) {
  var checked = box.classList.toggle("checked");
  box.textContent = checked ? "✓" : "";
  var txt = document.getElementById(textId);
  if (txt) txt.classList.toggle("done", checked);
}

/* ─── Calendar ─── */
function addGCal() {
  var ev = currentEvent;
  var ds = ev.date.replace(/-/g,""), ts = ev.time.replace(":","")+"00", te = ev.endTime.replace(":","")+"00";
  window.open("https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(ev.title) + "&dates=" + ds + "T" + ts + "/" + ds + "T" + te + "&location=" + encodeURIComponent(ev.online ? "Online" : ev.location.address), "_blank");
}

function downloadICS() {
  var ev = currentEvent;
  var ds = ev.date.replace(/-/g,""), ts = ev.time.replace(":","")+"00", te = ev.endTime.replace(":","")+"00";
  var ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:" + ds + "T" + ts + "\r\nDTEND:" + ds + "T" + te + "\r\nSUMMARY:" + ev.title + "\r\nLOCATION:" + (ev.online ? "Online" : ev.location.address) + "\r\nEND:VEVENT\r\nEND:VCALENDAR";
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], {type:"text/calendar"}));
  a.download = ev.title.replace(/\s+/g,"_") + ".ics";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ─── Navigation ─── */
function navigateTo(id) {
  var current = document.querySelector(".screen.active");
  var target = document.getElementById(id);
  if (!current || current === target) return;

  target.style.display = "block";
  target.style.position = "absolute";
  target.style.top = "0"; target.style.left = "0"; target.style.right = "0";
  target.style.transform = "translateX(100%)";
  target.style.transition = "none";
  target.style.zIndex = "10";

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      target.style.transition = "transform 0.32s cubic-bezier(0.36,0.66,0.04,1)";
      target.style.transform = "translateX(0)";
      current.style.transition = "transform 0.32s cubic-bezier(0.36,0.66,0.04,1)";
      current.style.transform = "translateX(-28%)";

      setTimeout(function() {
        current.classList.remove("active");
        current.style.cssText = "";
        target.classList.add("active");
        target.style.cssText = "";
      }, 340);
    });
  });
}

function showHome() {
  stopSpeaking();
  var current = document.querySelector(".screen.active");
  var target = document.getElementById("screen-home");
  if (!current || current === target) return;

  target.style.display = "block";
  target.style.position = "absolute";
  target.style.top = "0"; target.style.left = "0"; target.style.right = "0";
  target.style.transform = "translateX(-28%)";
  target.style.transition = "none";
  target.style.zIndex = "10";

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      target.style.transition = "transform 0.30s cubic-bezier(0.36,0.66,0.04,1)";
      target.style.transform = "translateX(0)";
      current.style.transition = "transform 0.30s cubic-bezier(0.36,0.66,0.04,1)";
      current.style.transform = "translateX(100%)";

      setTimeout(function() {
        current.classList.remove("active");
        current.style.cssText = "";
        target.classList.add("active");
        target.style.cssText = "";
        window.scrollTo(0,0);
      }, 310);
    });
  });
}

renderHome();
