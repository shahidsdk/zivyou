/* MODULE: events/events-ui
   Event tiles, ticker, recent-events list, event modal opener. */

function renderEventTiles(){
  const wrap = document.getElementById('eventTiles');
  const ico = t => `<span class="tile-ic">${icon(EVENT_ICONS[t.key]||'calendar', 22)}</span>`;
  wrap.innerHTML = EVENT_TYPES.map(t=>{
    if(t.bulkUpload){
      const searchFn = t.bulkUpload==='dayoff' ? 'openDayOffSearchFocused' : 'openLeaveSearchFocused';
      const searchBtn = `<button class="tile-search-btn" title="Search ${t.key} records" onclick="event.stopPropagation(); ${searchFn}();">${icon('search',15)}</button>`;
      return `<div class="event-tile" style="--c:${t.color};" onclick="openEventModal('${t.key}')">
        ${searchBtn}
        ${ico(t)}
        <div><div class="lbl">${t.key}</div>
        <div class="sub">click to upload monthly data</div></div>
      </div>`;
    }
    if(t.messagesFeature){
      const count = messages.filter(m=>!m.hidden).length;
      const searchBtn = `<button class="tile-search-btn" title="Search Messages" onclick="event.stopPropagation(); openMessagesModal();">${icon('search',15)}</button>`;
      return `<div class="event-tile" style="--c:${t.color};" onclick="openMessagesModal()">
        ${searchBtn}
        ${ico(t)}
        <div><div class="lbl">${t.key}</div>
        <div class="sub">${count} saved · click to add</div></div>
      </div>`;
    }
    const todayCount = events.filter(e=>!e.hidden && e.type===t.key && e.date===todayStr()).length;
    const searchBtn = t.searchable ? `<button class="tile-search-btn" title="Search ${t.key} records" onclick="event.stopPropagation(); openRecordSearch('${t.key}')">${icon('search',15)}</button>` : '';
    const proformaBtn = t.hasProforma ? `<button class="tile-proforma-btn" title="Generate ${t.key} Proforma" onclick="event.stopPropagation(); openProformaModal('${t.hasProforma}')">${icon('file-text',15)}</button>` : '';
    return `<div class="event-tile" style="--c:${t.color};" onclick="openEventModal('${t.key}')">
      ${searchBtn}
      ${proformaBtn}
      ${ico(t)}
      <div><div class="lbl">${t.key}</div>
      <div class="sub">${todayCount} today · click to add</div></div>
    </div>`;
  }).join('');
}

function renderTicker(){
  const today = todayStr();
  // Short Leave / Leave / Day Off Change / Duty Change no longer run in the top marquee —
  // they only appear on-screen (event tiles + Recent Events panel), for today's date only.
  const todays = events.filter(e=>!e.hidden && e.date===today && TICKER_TYPES.includes(e.type));
  const wrap = document.getElementById('tickerWrap');
  const track = document.getElementById('tickerTrack');
  if(todays.length===0){ wrap.classList.remove('show'); track.innerHTML=''; return; }
  const parts = todays.map(e=>{
    if(e.type==='Special Event') return `⭐ Special Event: ${e.note||''}`;
    if(e.type==='Handing Over Taking Over') return `🔄 Handing Over / Taking Over: ${e.note||''}`;
    return '';
  });
  // duplicate the list so the marquee loops seamlessly
  const html = parts.map(p=>`<span class="titem">${p}</span>`).join('') + parts.map(p=>`<span class="titem">${p}</span>`).join('');
  track.innerHTML = html;
  wrap.classList.add('show');
}

function renderRecentEvents(){
  const body = document.getElementById('recentEventsBody');
  const today = todayStr();
  // Short Leave / Leave / Day Off Change / Duty Change are only shown on screen for today's date;
  // older/future records stay safely stored in the Excel sheet but aren't displayed here.
  // Special Event keeps showing regardless of date. Handing Over Taking Over is today-only
  // (like Short Leave / Day Off Change / Duty Change) so it disappears once the date changes.
  // Soft-deleted (hidden) records never show.
  const visible = events.filter(e=>{
    if(e.hidden) return false;
    if(e.type==='Special Event') return true;
    return e.date===today;
  });
  document.getElementById('recentEventsCount').textContent = visible.length + ' shown today · ' + events.filter(e=>!e.hidden).length + ' total in Excel';
  const list = [...visible].sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,15);
  if(list.length===0){ body.innerHTML = '<div class="empty-row">No events for today.</div>'; return; }
  const colorMap = Object.fromEntries(EVENT_TYPES.map(t=>[t.key,t.color]));
  body.innerHTML = list.map(e=>{
    const codeBits = [e.employeeCode?`Code: ${e.employeeCode}`:'', e.employeeCode2?`Exchanged with: ${e.employeeName2?e.employeeName2+' (':''}${e.employeeCode2}${e.employeeName2?')':''}`:''].filter(Boolean).join(' · ');
    return `<div class="recent-events-row">
      <div><span class="ty" style="background:${colorMap[e.type]||'#8A94A3'};">${e.type}</span>
        <b>${e.employeeName||'—'}</b> <span class="sub">${e.date||''}${e.timeFrom?` · ${e.timeFrom} to ${e.timeTo||''}`:''}</span>
        ${codeBits?`<div class="sub">${codeBits}</div>`:''}
        ${e.note?`<div class="sub">${e.note}</div>`:''}
      </div>
      <button onclick="deleteEvent(${e.id})" title="Remove from screen">🗑</button>
    </div>`;
  }).join('');
}

function openEventModal(type){
  const cfg0 = EVENT_TYPES.find(t=>t.key===type);
  if(cfg0.bulkUpload){ if(cfg0.bulkUpload==='dayoff'){ openDayOffUploadModal(); } else { openLeaveUploadModal(); } return; }
  if(cfg0.messagesFeature){ openMessagesModal(); return; }
  activeEventType = type;
  const cfg = cfg0;
  document.getElementById('eventModalTitle').textContent = type;
  document.getElementById('eventTimeFromField').style.display = cfg.needsTime ? '' : 'none';
  document.getElementById('eventTimeToField').style.display = cfg.needsTime ? '' : 'none';
  document.getElementById('eventEmployeeField').style.display = cfg.noEmployee ? 'none' : '';
  document.getElementById('eventCodeField').style.display = cfg.needsCode ? '' : 'none';
  document.getElementById('eventCode2Field').style.display = cfg.needsCode2 ? '' : 'none';
  document.getElementById('eventCodeLabel').textContent = cfg.needsCode2 ? 'Employee Code (yours) *' : 'Employee Code *';
  document.getElementById('eventCode2Label').textContent = cfg.code2Label || 'Employee Code (exchanged with) *';
  document.getElementById('eventNearLimitWarn').style.display = 'none';
  document.getElementById('eventShortLeaveHint').style.display = (cfg.sameDayOnly || cfg.monthlyLimit) ? '' : 'none';
  {
    let hintText = cfg.sameDayHint || (cfg.sameDayOnly ? 'Can only be logged for today.' : '');
    if(cfg.monthlyLimit){ hintText += (hintText?' ':'') + 'Max '+cfg.monthlyLimit+' '+type+' per employee per month.'; }
    document.getElementById('eventShortLeaveHintText').textContent = hintText;
  }
  document.getElementById('eventNoteLabel').textContent = cfg.noteLabel;
  document.getElementById('ev_date').value = todayStr();
  document.getElementById('ev_timeFrom').value = '';
  document.getElementById('ev_timeTo').value = '';
  document.getElementById('ev_note').value = '';
  document.getElementById('ev_code').value = '';
  document.getElementById('ev_code2').value = '';

  // Short Leave: locked to today only, and the start time can't be before right now
  const dateInput = document.getElementById('ev_date');
  const dateLabel = document.getElementById('eventDateLabel');
  const timeFromInput = document.getElementById('ev_timeFrom');
  dateTimeOverride = false; // reset every time the modal opens — password unlock is per-entry, not sticky
  monthlyLimitOverride = false;
  document.getElementById('eventPastEntryUnlock').style.display = cfg.sameDayOnly ? '' : 'none';
  if(cfg.sameDayOnly){
    dateInput.readOnly = true; dateInput.min = todayStr(); dateInput.max = todayStr();
    dateLabel.textContent = 'Date (today only) *';
    const now = new Date();
    const nowHM = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    timeFromInput.min = nowHM;
  } else {
    dateInput.readOnly = false; dateInput.removeAttribute('min'); dateInput.removeAttribute('max');
    dateLabel.textContent = 'Date *';
    timeFromInput.removeAttribute('min');
  }

  resetEmpCombo();
  document.getElementById('eventOverlay').classList.add('show');
}
