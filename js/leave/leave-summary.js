/* MODULE: leave/leave-summary
   Leave: per-employee summary list + month-wise detail view. */

function leaveSummaryGroups(){
  // Group leave records by employee code (falls back to name if code is blank) — not hidden
  const map = new Map();
  leaveRecords.filter(r=>!r.hidden).forEach(r=>{
    const key = leaveEmployeeKey(r);
    if(!map.has(key)) map.set(key, {name:r.name, employeeCode:r.employeeCode, designation:r.designation, records:[]});
    map.get(key).records.push(r);
  });
  return Array.from(map.values()).map(g=>{
    // Date-wise dedup happens here, per employee, BEFORE any totals are calculated — so a leave
    // that exists twice in the raw data (same date range/type/days/status) is only counted once.
    const records = dedupeLeaveRecords(g.records);
    const active = records.filter(r=>!isNotCountedLeave(r));
    const cancelled = records.filter(r=>isCancelledLeave(r) && !isDeniedLeave(r));
    const denied = records.filter(isDeniedLeave);
    const totalDays = active.reduce((s,r)=>s+leaveDayValue(r), 0);
    const cancelledDays = cancelled.reduce((s,r)=>s+leaveDayValue(r), 0);
    const deniedDays = denied.reduce((s,r)=>s+leaveDayValue(r), 0);
    // Breakdown by Leave Type (Casual, Gazetted, Medical, or whatever types appear in the data) — cancelled leaves excluded from the type breakdown, shown separately
    const byType = {};
    active.forEach(r=>{
      const t = (r.leaveType||'').trim() || 'Other';
      byType[t] = (byType[t]||0) + leaveDayValue(r);
    });
    return {
      name:g.name, employeeCode:g.employeeCode, designation:g.designation,
      count:records.length, totalDays, byType,
      cancelledCount:cancelled.length, cancelledDays,
      deniedCount:denied.length, deniedDays,
      casualBalances: casualLeaveBalances(active),
      records:records
    };
  }).sort((a,b)=> (a.name||'').localeCompare(b.name||''));
}

function leaveGroupSummaryLine(g){
  const typeParts = Object.entries(g.byType).map(([t,d])=> `${t}: ${d}`).join(' · ');
  const cancelledPart = g.cancelledCount>0 ? ` · Cancelled: ${g.cancelledDays}` : '';
  const deniedPart = g.deniedCount>0 ? ` · Denied: ${g.deniedDays}` : '';
  return `Total: ${g.totalDays}${typeParts?(' ('+typeParts+')'):''}${cancelledPart}${deniedPart}`;
}

// Bold, two-colour pill(s) — e.g. a big "10" in red/orange/green (by how low it is) next to
// "Leave Balance 2026" in blue — one pill per year that has Casual Leave activity.
function casualBalanceBadgeHtml(g){
  if(!g.casualBalances || g.casualBalances.length===0) return '';
  return `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">` + g.casualBalances.map(b=>{
    const color = b.remaining<=5 ? '#E0374B' : (b.remaining<=10 ? '#E58A00' : '#16A064');
    const yearPart = b.year==='Unspecified' ? '' : (' '+b.year);
    return `<div class="bal" style="--c:${color}; --cbg:${color}1A;"><b>${b.remaining}</b><span>Leave Balance${yearPart} left</span></div>`;
  }).join('') + `</div>`;
}

function leaveInitials(name){
  const parts = (name||'?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]||'?')[0] + (parts.length>1 ? parts[parts.length-1][0] : '')).toUpperCase();
}

function leaveEmployeeCardHtml(g, i){
  const typeChips = Object.entries(g.byType).map(([t,d])=> `<span class="chip">${escapeHtml(t)}: ${d}</span>`).join('');
  const bad = (g.cancelledCount>0 ? `<span class="chip bad">Cancelled: ${g.cancelledDays}</span>` : '')
            + (g.deniedCount>0 ? `<span class="chip bad">Denied: ${g.deniedDays}</span>` : '');
  return `
    <div class="emp-card">
      <div class="emp-avatar">${escapeHtml(leaveInitials(g.name))}</div>
      <div class="emp-main">
        <div class="emp-name">${escapeHtml(g.name||'(no name)')}</div>
        <div class="emp-meta">${escapeHtml([g.employeeCode, g.designation].filter(Boolean).join(' · '))}</div>
        <div class="emp-chips"><span class="chip total">Total: ${g.totalDays}</span>${typeChips}${bad}</div>
        ${casualBalanceBadgeHtml(g)}
      </div>
      <button class="emp-btn" onclick="openLeaveDetail(${i})">Detail ${icon('chevron-right',15)}</button>
    </div>`;
}

function renderLeaveSummary(){
  const listEl = document.getElementById('leaveSummaryList');
  if(!listEl) return;
  const searchBox = document.getElementById('leaveSummarySearch');
  const q = (searchBox ? searchBox.value : '').trim().toLowerCase();
  let groups = leaveSummaryGroups();
  if(q){ groups = groups.filter(g=> (g.name||'').toLowerCase().includes(q) || (g.employeeCode||'').toLowerCase().includes(q)); }
  currentLeaveGroups = groups;
  if(typeof leavePageRefreshStats==='function') leavePageRefreshStats();
  if(groups.length===0){
    listEl.innerHTML = '<div class="lp-empty">No leave records found.<br><small>Use the Upload tab to add a monthly file.</small></div>';
    return;
  }
  listEl.innerHTML = groups.map(leaveEmployeeCardHtml).join('');
}

function leaveRecordCardHtml(r){
  const cancelled = isCancelledLeave(r), denied = isDeniedLeave(r);
  const flagged = cancelled || denied;
  const tag = denied ? ' <em>(Denied — not counted)</em>' : (cancelled ? ' <em>(Cancelled — not counted)</em>' : '');
  return `
    <div class="lr${flagged?' flag':''}">
      <div class="d">${escapeHtml(r.dateRange || '(date not specified)')}${tag}</div>
      <div class="t">${escapeHtml([r.leaveType||'Other', r.days?(r.days+' day'+(r.days==1?'':'s')):'', r.status].filter(Boolean).join(' · '))}</div>
      ${r.remarks?`<div class="r">${escapeHtml(r.remarks)}</div>`:''}
    </div>`;
}

// One block per month (newest first): a summary line (counted total by type, plus Cancelled / Denied
// shown separately) followed by that month's individual leaves.
function leaveMonthSectionsHtml(records){
  const byMonth = new Map();
  records.forEach(r=>{
    const k = leaveMonthKey(r);
    if(!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k).push(r);
  });
  const keys = Array.from(byMonth.keys()).sort((a,b)=>{
    if(a==='unspecified') return 1; if(b==='unspecified') return -1;
    return b.localeCompare(a);
  });
  return keys.map(k=>{
    const recs = byMonth.get(k);
    const counted = recs.filter(r=>!isNotCountedLeave(r));
    const total = counted.reduce((s,r)=>s+leaveDayValue(r),0);
    const types = {};
    counted.forEach(r=>{ const t=(r.leaveType||'').trim()||'Other'; types[t]=(types[t]||0)+leaveDayValue(r); });
    const typeStr = Object.entries(types).map(([t,d])=>`${t}: ${d}`).join(' · ');
    const cx = recs.filter(r=>isCancelledLeave(r) && !isDeniedLeave(r)).reduce((s,r)=>s+leaveDayValue(r),0);
    const dn = recs.filter(isDeniedLeave).reduce((s,r)=>s+leaveDayValue(r),0);
    const extra = (cx?` · Cancelled: ${cx}`:'') + (dn?` · Denied: ${dn}`:'');
    return `<div class="lm">
      <div class="lm-head">
        <b>${leaveMonthLabel(k)}</b>
        <span>Total: ${total}${typeStr?(' ('+typeStr+')'):''}${extra}</span>
      </div>
      ${recs.map(leaveRecordCardHtml).join('')}
    </div>`;
  }).join('');
}

function openLeaveDetail(i){
  const g = currentLeaveGroups[i];
  if(!g) return;
  document.getElementById('leaveDetailTitle').textContent = g.name || '(no name)';
  document.getElementById('leaveDetailTotal').innerHTML = `
    <div>${leaveGroupSummaryLine(g)}</div>${casualBalanceBadgeHtml(g)}
    <div style="font-weight:400; font-size:12px; color:#66756D; margin-top:3px;">${g.count} entr${g.count===1?'y':'ies'}${g.employeeCode?' · Code: '+g.employeeCode:''}</div>`;
  document.getElementById('leaveDetailRows').innerHTML = leaveMonthSectionsHtml(g.records);
  document.getElementById('leaveDetailOverlay').classList.add('show');
}

function closeLeaveDetailModal(){ document.getElementById('leaveDetailOverlay').classList.remove('show'); }
