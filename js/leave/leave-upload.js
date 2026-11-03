/* MODULE: leave/leave-upload
   Leave: upload monthly Excel/CSV files. */

/* ---- Leave: bulk data upload (replaces the manual add-form for this type) ---- */
// The Leave section is now a full page (see leave-page.js). These names are kept so the tile and its
// search button keep working unchanged.
function openLeaveUploadModal(){ openLeavePage('employees'); }
function openLeaveSearchFocused(){
  openLeavePage('employees');
  setTimeout(()=>{ const el = document.getElementById('leaveSummarySearch'); if(el) el.focus(); }, 100);
}
function closeLeaveUploadModal(){ closeLeavePage(); }

function uploadLeaveFile(){
  const inp = document.getElementById('leaveUploadFile');
  const files = Array.from(inp.files || []);
  if(files.length===0){ toast('Choose at least one file'); return; }

  const readOneFile = (file) => new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = function(evt){
      try{
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type:'array', raw:true});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
        resolve(rows);
      } catch(err){ reject(err); }
    };
    reader.onerror = () => reject(new Error('Could not read '+file.name));
    reader.readAsArrayBuffer(file);
  });

  Promise.all(files.map(readOneFile)).then(rowsPerFile=>{
    let totalAdded = 0;
    let totalSkipped = 0;
    // Tracks every record (old + newly added so far) so duplicates are caught both against
    // already-saved data and against other rows in this same upload batch.
    const seenKeys = new Set(leaveRecords.map(r=> leaveEmployeeKey(r)+'|'+leaveDupeKey(r)));
    rowsPerFile.forEach((rows, fileIdx)=>{
      const batchId = nextLeaveBatchId++;
      const sourceFile = files[fileIdx].name;
      const uploadedAt = new Date().toISOString();
      const parsed = rows.map(r=>({
        id: nextLeaveRecId++,
        name: String(r['Name']||'').trim(),
        employeeCode: String(r['Employee ID']||'').trim(),
        designation: String(r['Designation']||'').trim(),
        station: String(r['Station']||'').trim(),
        district: String(r['District']||'').trim(),
        leaveType: String(r['Leave Type']||'').trim(),
        dateRange: String(r['Date Range']||'').trim(),
        days: String(r['Days']||'').trim(),
        remarks: String(r['Remarks']||'').trim(),
        createdAt: String(r['Created At']||'').trim(),
        status: String(r['Status']||'').trim(),
        hidden:false,
        batchId, sourceFile, uploadedAt
      })).filter(r=>r.name || r.employeeCode);
      const added = [];
      parsed.forEach(r=>{
        const fullKey = leaveEmployeeKey(r)+'|'+leaveDupeKey(r);
        if(seenKeys.has(fullKey)){ totalSkipped++; return; } // same employee + same date range/type/days/status already exists — don't add it again
        seenKeys.add(fullKey);
        added.push(r);
      });
      // Appended to the END of existing Leave records — nothing already stored is removed.
      leaveRecords = leaveRecords.concat(added);
      totalAdded += added.length;
    });
    render();
    renderLeaveSummary();
    renderLeaveBatches();
    leavePageRefreshStats();
    document.getElementById('leaveUploadFile').value = '';
    leaveFilesChosen();
    leavePageTab('files');
    persistAll();
    const skippedMsg = totalSkipped>0 ? (', '+totalSkipped+' duplicate'+(totalSkipped>1?'s':'')+' skipped') : '';
    toast(totalAdded+' Leave records added from '+files.length+' file'+(files.length>1?'s':'')+skippedMsg+' — total '+leaveRecords.filter(r=>!r.hidden).length);
  }).catch(err=>{
    console.error(err);
    toast('Could not read one of the files — check they are valid CSV/Excel exports');
  });
}
