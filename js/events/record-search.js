/* MODULE: events/record-search
   Search Short Leave / Day Off Change / Duty Change records by date + name. */

/* ---- Record Search (Short Leave / Day Off Change / Duty Change): From/To date range + name/code/designation ---- */
let recordSearchType = null;

let lastSearchResults = [];

function openRecordSearch(type){
  recordSearchType = type;
  document.getElementById('recordSearchTitle').textContent = type + ' — Search Records';
  document.getElementById('rs_fromDate').value = '';
  document.getElementById('rs_toDate').value = '';
  document.getElementById('rs_query').value = '';
  renderRecordSearchResults();
  document.getElementById('recordSearchOverlay').classList.add('show');
}

function closeRecordSearchModal(){ document.getElementById('recordSearchOverlay').classList.remove('show'); }

function openMonthSummaryDetail(type){
  // Opens the same Record Search modal, but pre-filtered to the current calendar month —
  // used by the "This Month — Duty/Leave" dashboard card's clickable numbers.
  openRecordSearch(type);
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
  const fmt = (d)=> d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  document.getElementById('rs_fromDate').value = fmt(first);
  document.getElementById('rs_toDate').value = fmt(last);
  renderRecordSearchResults();
}

function renderRecordSearchResults(){
  let from = document.getElementById('rs_fromDate').value;
  let to = document.getElementById('rs_toDate').value;
  const q = document.getElementById('rs_query').value.trim().toLowerCase();
  // No date picked -> default to the current month only.
  // One date picked -> show just that date. Both picked -> that range.
  let scopeLabel;
  if(!from && !to){
    const now = new Date();
    const pad = n=>String(n).padStart(2,'0');
    const last = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    from = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-01';
    to = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(last);
    scopeLabel = now.toLocaleString('en-US',{month:'long',year:'numeric'})+' (select a date to see other days)';
  } else {
    if(from && !to) to = from;
    if(to && !from) from = to;
    scopeLabel = from===to ? from : (from+' to '+to);
  }
  let list = events.filter(e=> !e.hidden && e.type===recordSearchType);
  list = list.filter(e=> e.date >= from && e.date <= to);
  if(q){
    list = list.filter(e=>{
      const c = contacts.find(x=>String(x.id)===String(e.employeeId));
      const hay = [e.employeeName, e.employeeCode, c?c.designation:'', c?c.department:''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  list = list.slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  lastSearchResults = list;
  document.getElementById('rs_summary').textContent = list.length+' record'+(list.length===1?'':'s')+' found — '+scopeLabel;
  const resultsEl = document.getElementById('rs_results');
  if(list.length===0){
    resultsEl.innerHTML = '<div style="font-size:12.5px; color:#8A94A3; padding:8px 2px;">No matching records.</div>';
    return;
  }
  resultsEl.innerHTML = list.map(e=>{
    const c = contacts.find(x=>String(x.id)===String(e.employeeId));
    const desig = c ? [c.designation, c.department].filter(Boolean).join(' · ') : '';
    const timeLine = (e.timeFrom||e.timeTo) ? (e.timeFrom||'')+' - '+(e.timeTo||'') : '';
    let code2Line = '';
    if(e.employeeCode2){
      const c2 = contacts.find(x=> (x.employeeCode||'').trim().toLowerCase()===e.employeeCode2.trim().toLowerCase());
      code2Line = 'Exchanged with: ' + (c2 ? (c2.firstName+' '+(c2.lastName||'')).trim()+' ('+e.employeeCode2+')' : e.employeeCode2);
    }
    return `
    <div style="border:1px solid #E5E9F0; border-radius:8px; padding:9px 11px; background:#F9FAFC;">
      <div style="font-size:13.5px; font-weight:600; color:#22262E;">${e.employeeName||'(no name)'}${e.employeeCode?(' · '+e.employeeCode):''}</div>
      ${desig?`<div style="font-size:11.5px; color:#8A94A3;">${desig}</div>`:''}
      <div style="font-size:12.5px; color:#3B7DED; margin-top:3px;">${e.date}${timeLine?(' · '+timeLine):''}</div>
      ${code2Line?`<div style="font-size:12px; color:#5C6472; margin-top:2px;">${code2Line}</div>`:''}
      ${e.note?`<div style="font-size:11.5px; color:#8A94A3; margin-top:2px;">${e.note}</div>`:''}
    </div>`;
  }).join('');
}

function exportRecordSearchResults(){
  if(lastSearchResults.length===0){ toast('No records to export'); return; }
  const rows = lastSearchResults.map(e=>{
    const c = contacts.find(x=>String(x.id)===String(e.employeeId));
    return {
      "Employee": e.employeeName||'', "Employee Code": e.employeeCode||'',
      "Designation": c?(c.designation||''):'', "Department": c?(c.department||''):'',
      "Employee 2": e.employeeName2||'', "Employee Code 2": e.employeeCode2||'',
      "Date": e.date||'', "Time From": e.timeFrom||'', "Time To": e.timeTo||'', "Note": e.note||''
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, recordSearchType.slice(0,31));
  const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout], {type:'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = recordSearchType.replace(/\s+/g,'_')+'_export_'+todayStr()+'.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Exported '+lastSearchResults.length+' record'+(lastSearchResults.length===1?'':'s'));
}
