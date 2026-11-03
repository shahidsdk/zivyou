/* MODULE: dayoff/dayoff-upload
   Day Off Check: upload attendance-grid files. */

/* ---- Day Off Check: bulk data upload (wide monthly attendance-grid file) ---- */
function openDayOffUploadModal(){
  document.getElementById('dayOffUploadFile').value = '';
  document.getElementById('dayOffSummarySearch').value = '';
  renderDayOffSummary();
  renderDayOffBatches();
  document.getElementById('dayOffUploadOverlay').classList.add('show');
}

function openDayOffSearchFocused(){
  openDayOffUploadModal();
  setTimeout(()=>{
    const el = document.getElementById('dayOffSummarySearch');
    if(el) el.focus();
  }, 100);
}

function closeDayOffUploadModal(){ document.getElementById('dayOffUploadOverlay').classList.remove('show'); }

// Best-effort month for a row: the first date-like column header ("2026-01-05" style) tells us
// the year+month directly. If headers aren't in that format, fall back to the file name so the
// upload still gets its own bucket instead of being lost.
function deriveDayOffMonthInfo(dateKeys, sourceFile){
  for(const k of dateKeys){
    const m = String(k).trim().match(/^(\d{4})-(\d{2})-\d{2}$/);
    if(m){
      const monthKey = m[1]+'-'+m[2];
      const d = new Date(Number(m[1]), Number(m[2])-1, 1);
      const monthLabel = d.toLocaleString('en-US', {month:'long', year:'numeric'});
      return { monthKey, monthLabel };
    }
  }
  const base = (sourceFile||'').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return { monthKey: base || 'Unspecified', monthLabel: base || 'Unspecified' };
}

function uploadDayOffFile(){
  const inp = document.getElementById('dayOffUploadFile');
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
    // Blocks the exact same employee + same month being added twice (across this upload and
    // anything already saved) — that's what "the same month counted twice" would look like.
    const seenKeys = new Set(dayOffRecords.map(r=> dayOffEmployeeKey(r)+'|'+dayOffDupeKey(r)));
    rowsPerFile.forEach((rows, fileIdx)=>{
      const batchId = nextDayOffBatchId++;
      const sourceFile = files[fileIdx].name;
      const uploadedAt = new Date().toISOString();
      const parsed = rows.map(r=>{
        const keys = Object.keys(r);
        const nameKey = keys.find(k=> k.trim().toLowerCase()==='name') || keys[0];
        const codeKey = keys.find(k=> ['employee number','employee code','employee id'].includes(k.trim().toLowerCase())) || keys[1];
        const stationKey = keys.find(k=> ['station name','station'].includes(k.trim().toLowerCase())) || keys[2];
        // Everything else is treated as a day-of-month column, whatever the header format.
        const dateKeys = keys.filter(k=> k!==nameKey && k!==codeKey && k!==stationKey);
        const totalDays = dateKeys.length;
        let offDays = 0;
        dateKeys.forEach(k=>{ if(String(r[k]||'').trim().toLowerCase()==='off') offDays++; });
        const { monthKey, monthLabel } = deriveDayOffMonthInfo(dateKeys, sourceFile);
        return {
          id: nextDayOffRecId++,
          name: String(r[nameKey]||'').trim(),
          employeeCode: String(r[codeKey]||'').trim(),
          station: String(r[stationKey]||'').trim(),
          monthKey, monthLabel, offDays, totalDays,
          hidden:false, batchId, sourceFile, uploadedAt
        };
      }).filter(r=> r.name || r.employeeCode);
      const added = [];
      parsed.forEach(r=>{
        const fullKey = dayOffEmployeeKey(r)+'|'+dayOffDupeKey(r);
        if(seenKeys.has(fullKey)){ totalSkipped++; return; } // same employee + same month already exists
        seenKeys.add(fullKey);
        added.push(r);
      });
      // Appended to the END of existing Day Off Check records — nothing already stored is removed.
      dayOffRecords = dayOffRecords.concat(added);
      totalAdded += added.length;
    });
    closeDayOffUploadModal();
    render();
    renderDayOffSummary();
    renderDayOffBatches();
    persistAll();
    const skippedMsg = totalSkipped>0 ? (', '+totalSkipped+' month'+(totalSkipped>1?'s':'')+' already on file skipped') : '';
    toast(totalAdded+' Day Off Check record'+(totalAdded===1?'':'s')+' added from '+files.length+' file'+(files.length>1?'s':'')+skippedMsg);
  }).catch(err=>{
    console.error(err);
    toast('Could not read one of the files — check they are valid CSV/Excel exports');
  });
}
