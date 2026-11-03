/* MODULE: dayoff/dayoff-summary
   Day Off Check: per-employee summary + detail + All Clear. */

/* ---- Day Off Check Summary: per-employee totals by month, search, view-details, and All Clear ---- */
let currentDayOffGroups = [];

function dayOffEmployeeKey(r){
  return (r.employeeCode && r.employeeCode.trim()) ? ('code:'+r.employeeCode.trim().toLowerCase()) : ('name:'+(r.name||'').trim().toLowerCase());
}

// One employee can only have one on-file record per month — re-uploading the same month
// again (same file re-picked, etc) is treated as a duplicate and skipped, not added again.
function dayOffDupeKey(r){ return (r.monthKey||'').trim().toLowerCase(); }

function dayOffSummaryGroups(){
  const map = new Map();
  dayOffRecords.filter(r=>!r.hidden).forEach(r=>{
    const key = dayOffEmployeeKey(r);
    if(!map.has(key)) map.set(key, {name:r.name, employeeCode:r.employeeCode, station:r.station, records:[]});
    map.get(key).records.push(r);
  });
  return Array.from(map.values()).map(g=>{
    const records = g.records.slice().sort((a,b)=> (a.monthKey||'').localeCompare(b.monthKey||''));
    const totalOff = records.reduce((s,r)=> s+(r.offDays||0), 0);
    const byMonth = {};
    records.forEach(r=>{
      const label = r.monthLabel || r.monthKey || 'Unspecified';
      byMonth[label] = (byMonth[label]||0) + (r.offDays||0);
    });
    return { name:g.name, employeeCode:g.employeeCode, station:g.station, count:records.length, totalOff, byMonth, records };
  }).sort((a,b)=> (a.name||'').localeCompare(b.name||''));
}

// One bold line: the running total in green, and — right alongside it, in blue — the
// month-by-month breakdown that backs it up.
function dayOffGroupSummaryLine(g){
  const parts = Object.entries(g.byMonth).map(([m,d])=> `${m}: ${d}`).join(' · ');
  return `<div style="margin-top:3px; font-size:12.5px; font-weight:800; line-height:1.4;">
    <span style="color:#1E8E3E;">${g.totalOff||0} Day Off${(g.totalOff||0)===1?'':'s'} so far</span>${parts?` <span style="color:#3B7DED; font-weight:700;">(${parts})</span>`:''}
  </div>`;
}

function renderDayOffSummary(){
  const listEl = document.getElementById('dayOffSummaryList');
  if(!listEl) return;
  const searchBox = document.getElementById('dayOffSummarySearch');
  const q = (searchBox ? searchBox.value : '').trim().toLowerCase();
  let groups = dayOffSummaryGroups();
  if(q){ groups = groups.filter(g=> (g.name||'').toLowerCase().includes(q) || (g.employeeCode||'').toLowerCase().includes(q)); }
  currentDayOffGroups = groups;
  if(groups.length===0){
    listEl.innerHTML = '<div style="font-size:12.5px; color:#8A94A3; padding:8px 2px;">No Day Off Check records found.</div>';
    return;
  }
  listEl.innerHTML = groups.map((g,i)=>`
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; border:1px solid #E5E9F0; border-radius:8px; background:#F9FAFC;">
      <div style="min-width:0;">
        <div style="font-size:13.5px; font-weight:600; color:#22262E; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name||'(no name)'}</div>
        <div style="font-size:11.5px; color:#8A94A3;">${g.employeeCode?('Code: '+g.employeeCode):''}${g.station?(' · '+g.station):''}</div>
        ${dayOffGroupSummaryLine(g)}
      </div>
      <button onclick="openDayOffDetail(${i})" style="flex-shrink:0; background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:6px; padding:5px 10px; font-size:12px; font-weight:600; cursor:pointer;">Detail</button>
    </div>`).join('');
}

function openDayOffDetail(i){
  const g = currentDayOffGroups[i];
  if(!g) return;
  document.getElementById('dayOffDetailTitle').textContent = g.name || '(no name)';
  document.getElementById('dayOffDetailTotal').innerHTML = `
    ${dayOffGroupSummaryLine(g)}
    <div style="font-weight:400; font-size:12px; color:#8A94A3; margin-top:3px;">${g.count} month${g.count===1?'':'s'} on file${g.employeeCode?' · Code: '+g.employeeCode:''}</div>`;
  document.getElementById('dayOffDetailRows').innerHTML = g.records.map(r=>{
    return `
    <div style="border:1px solid #E5E9F0; border-radius:8px; padding:8px 10px; background:#F9FAFC;">
      <div style="font-size:13px; font-weight:600; color:#22262E;">${r.monthLabel || r.monthKey || '(month not specified)'}</div>
      <div style="font-size:12px; color:#5C6472; margin-top:2px;">${r.offDays} OFF day${r.offDays===1?'':'s'} of ${r.totalDays} day${r.totalDays===1?'':'s'} in the file</div>
      <div style="font-size:11.5px; color:#8A94A3; margin-top:2px;">${escapeHtml(r.sourceFile||'')}</div>
    </div>`;
  }).join('');
  document.getElementById('dayOffDetailOverlay').classList.add('show');
}

function closeDayOffDetailModal(){ document.getElementById('dayOffDetailOverlay').classList.remove('show'); }

function clearAllDayOffRecords(){
  if(dayOffRecords.length===0){ toast('No Day Off Check records to clear'); return; }
  if(!confirm('Delete ALL Day Off Check records? This removes every Day Off Check entry from the Excel file\'s Day Off Check sheet (all other sheets — Contacts, Leave, Short Leave, etc. — are untouched). This cannot be undone.')) return;
  dayOffRecords = [];
  renderDayOffSummary();
  renderDayOffBatches();
  render();
  persistAll();
  toast('All Day Off Check records cleared');
}
