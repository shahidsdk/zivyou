/* MODULE: dayoff/dayoff-batches
   Day Off Check: uploaded-files list, delete one file. */

/* ---- Uploaded Files: each upload is tracked as its own batch, so a specific month's file can be deleted on its own ---- */
function dayOffBatchGroups(){
  const map = new Map();
  dayOffRecords.forEach(r=>{
    const key = String(r.batchId!==undefined && r.batchId!==null ? r.batchId : 'legacy');
    if(!map.has(key)) map.set(key, {batchId:key, sourceFile:r.sourceFile||'(existing data)', uploadedAt:r.uploadedAt||'', count:0, hiddenCount:0});
    const g = map.get(key);
    g.count++;
    if(r.hidden) g.hiddenCount++;
  });
  return Array.from(map.values()).sort((a,b)=> (b.uploadedAt||'').localeCompare(a.uploadedAt||''));
}

function renderDayOffBatches(){
  const listEl = document.getElementById('dayOffBatchesList');
  if(!listEl) return;
  const groups = dayOffBatchGroups();
  if(groups.length===0){
    listEl.innerHTML = '<div style="font-size:12px; color:#8A94A3; padding:4px 2px;">No files uploaded yet.</div>';
    return;
  }
  listEl.innerHTML = groups.map(g=>{
    const when = g.uploadedAt ? new Date(g.uploadedAt).toLocaleString() : '';
    return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:7px 10px; border:1px solid #E5E9F0; border-radius:7px; background:#F9FAFC;">
      <div style="min-width:0;">
        <div style="font-size:12.5px; font-weight:600; color:#22262E; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(g.sourceFile)}</div>
        <div style="font-size:11px; color:#8A94A3;">${g.count} employee record${g.count===1?'':'s'}${when?(' · '+when):''}</div>
      </div>
      <button onclick="deleteDayOffBatch('${g.batchId.replace(/'/g,"\\\\'")}')" style="flex-shrink:0; background:#FFF1F2; color:#E0374B; border:1px solid #F3C2C8; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:600; cursor:pointer;">🗑 Delete</button>
    </div>`;
  }).join('');
}

function deleteDayOffBatch(batchId){
  const idx = dayOffRecords.map((r,i)=>({r,i})).filter(x=> String(x.r.batchId!==undefined && x.r.batchId!==null ? x.r.batchId : 'legacy')===batchId).map(x=>x.i);
  if(idx.length===0) return;
  const sourceFile = dayOffRecords[idx[0]].sourceFile || '(existing data)';
  if(!confirm(`Delete all ${idx.length} Day Off Check record(s) from "${sourceFile}"? This cannot be undone (other uploaded files are untouched).`)) return;
  const idxSet = new Set(idx);
  const removed = dayOffRecords.filter((r,i)=>idxSet.has(i));
  dayOffRecords = dayOffRecords.filter((r,i)=>!idxSet.has(i));
  render();
  renderDayOffSummary();
  renderDayOffBatches();
  persistAll();
  toastWithUndo(`Deleted "${sourceFile}" (${removed.length} records)`, ()=>{
    dayOffRecords = dayOffRecords.concat(removed);
    render();
    renderDayOffSummary();
    renderDayOffBatches();
    persistAll();
    toast('Delete undone');
  });
}
