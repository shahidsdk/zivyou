/* MODULE: leave/leave-batches
   Leave: uploaded-files list, delete one uploaded file. */

/* ---- Uploaded Files: each upload is tracked as its own batch, so a specific file's
   worth of Leave records can be deleted on its own instead of only "All Clear" ---- */
function leaveBatchGroups(){
  const map = new Map();
  leaveRecords.forEach(r=>{
    const key = String(r.batchId!==undefined && r.batchId!==null ? r.batchId : 'legacy');
    if(!map.has(key)) map.set(key, {batchId:key, sourceFile:r.sourceFile||'(existing data)', uploadedAt:r.uploadedAt||'', count:0, hiddenCount:0});
    const g = map.get(key);
    g.count++;
    if(r.hidden) g.hiddenCount++;
  });
  return Array.from(map.values()).sort((a,b)=> (b.uploadedAt||'').localeCompare(a.uploadedAt||''));
}

function renderLeaveBatches(){
  const listEl = document.getElementById('leaveBatchesList');
  if(!listEl) return;
  if(typeof leavePageRefreshStats==='function') leavePageRefreshStats();
  const groups = leaveBatchGroups();
  if(groups.length===0){
    listEl.innerHTML = '<div class="lp-empty">No files uploaded yet.<br><small>Files you upload will be listed here, so one month can be removed on its own.</small></div>';
    return;
  }
  listEl.innerHTML = groups.map(g=>{
    const when = g.uploadedAt ? new Date(g.uploadedAt).toLocaleString() : '';
    return `
    <div class="file-card">
      <div class="file-ic">${icon('file-text',20)}</div>
      <div class="file-main">
        <div class="file-name">${escapeHtml(g.sourceFile)}</div>
        <div class="file-meta">${g.count} record${g.count===1?'':'s'}${when?(' · '+when):''}</div>
      </div>
      <button class="file-del" onclick="deleteLeaveBatch('${g.batchId.replace(/'/g,"\\'")}')">${icon('trash',15)} Delete</button>
    </div>`;
  }).join('');
}

function deleteLeaveBatch(batchId){
  const idx = leaveRecords.map((r,i)=>({r,i})).filter(x=> String(x.r.batchId!==undefined && x.r.batchId!==null ? x.r.batchId : 'legacy')===batchId).map(x=>x.i);
  if(idx.length===0) return;
  const sourceFile = leaveRecords[idx[0]].sourceFile || '(existing data)';
  if(!confirm(`Delete all ${idx.length} Leave record(s) from "${sourceFile}"? This cannot be undone (other uploaded files are untouched).`)) return;
  const idxSet = new Set(idx);
  const removed = leaveRecords.filter((r,i)=>idxSet.has(i));
  leaveRecords = leaveRecords.filter((r,i)=>!idxSet.has(i));
  render();
  renderLeaveSummary();
  renderLeaveBatches();
  persistAll();
  toastWithUndo(`Deleted "${sourceFile}" (${removed.length} records)`, ()=>{
    leaveRecords = leaveRecords.concat(removed);
    render();
    renderLeaveSummary();
    renderLeaveBatches();
    persistAll();
    toast('Delete undone');
  });
}
