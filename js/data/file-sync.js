/* MODULE: data/file-sync
   Load/auto-save/poll the linked Excel file. */

function showResumeBanner(handle){
  const banner = document.getElementById('resumeBanner');
  banner.querySelector('.rb-text').textContent = '📎 Resume live-sync with "' + handle.name + '"? (one click, remembered after that)';
  banner.querySelector('.rb-btn').onclick = async ()=>{
    try{
      const perm = await handle.requestPermission({mode:'readwrite'});
      if(perm==='granted'){
        linkedHandle = handle;
        await loadFromLinkedFile();
        document.getElementById('syncDot').classList.add('on');
        document.getElementById('syncStatusText').textContent = 'Linked: ' + handle.name;
        startPolling();
        banner.classList.remove('show');
        toast('Sync resumed');
      } else { toast('Permission denied'); }
    } catch(err){ toast('Could not resume — use ⇄ to link again'); }
  };
  banner.classList.add('show');
}

async function loadFromLinkedFile(){
  if(!linkedHandle) return;
  const file = await linkedHandle.getFile();
  linkedLastMod = file.lastModified;
  const buf = await file.arrayBuffer();
  if(buf.byteLength===0) return; // empty new file, keep current data and save to it
  const wb = XLSX.read(new Uint8Array(buf), {type:'array'});

  // Contacts sheet: prefer a sheet literally named "Contacts", else fall back to the first sheet
  const contactsSheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()==='contacts') || wb.SheetNames[0];
  const sheet = wb.Sheets[contactsSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
  if(rows.length>0){
    // Auto-map using header guesses (no manual step for linked-file sync)
    const headers = Object.keys(rows[0]);
    contacts = rows.map((row, idx)=>{
      const obj = {firstName:'',lastName:'',employeeCode:'',designation:'',department:'',group:'',bloodGroup:'',mobile:'',phone:'',home:'',whatsapp:'',address:'',tehsil:'',officeAddress:'',birthday:'',notes:''};
      headers.forEach(h=>{ const f=guessField(h); if(f!=='skip') obj[f]=String(row[h]||'').trim(); });
      const numbers=[];
      if(obj.mobile) numbers.push({type:'Mobile', value:obj.mobile});
      if(obj.phone) numbers.push({type:'Office', value:obj.phone});
      if(obj.home) numbers.push({type:'Home', value:obj.home});
      if(obj.whatsapp) numbers.push({type:'WhatsApp', value:obj.whatsapp});
      const stamp = Date.now() + idx; // later rows in the sheet rank as more "recent"
      return {id: nextId++, firstName:obj.firstName, lastName:obj.lastName, employeeCode:obj.employeeCode, designation:obj.designation, department:obj.department,
        group:obj.group, bloodGroup:obj.bloodGroup, address:obj.address, tehsil:obj.tehsil, officeAddress:obj.officeAddress,
        birthday:obj.birthday, notes:obj.notes, numbers, createdAt: stamp, updatedAt: stamp};
    }).filter(c=>c.firstName);
  }

  // Per-type event sheets: "Short Leave", "Day Off Change", "Duty Change", "Special Event", "Handing Over Taking Over"
  // ("Leave" is a bulk-upload type with its own schema — read separately below)
  events = [];
  EVENT_TYPES.forEach(t=>{
    if(t.bulkUpload || t.messagesFeature) return;
    const sheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()===t.key.toLowerCase());
    if(!sheetName) return;
    const evRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {defval:''});
    evRows.forEach(r=>{
      if(!r['Employee'] && !r['Date'] && !r['Note']) return; // skip blank rows
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      events.push({
        id: nextEventId++, type: t.key, employeeId:'', employeeName: String(r['Employee']||''),
        employeeCode: String(r['Employee Code']||''), employeeName2: String(r['Employee 2']||''), employeeCode2: String(r['Employee Code 2']||''),
        date: String(r['Date']||''), timeFrom: String(r['Time From']||''), timeTo: String(r['Time To']||''),
        note: String(r['Note']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true'),
        createdAt: String(r['Logged At']||'')
      });
    });
  });

  // Leave sheet (bulk-uploaded monthly file — kept as-is in its own schema)
  leaveRecords = [];
  const leaveSheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()==='leave');
  if(leaveSheetName){
    const lRows = XLSX.utils.sheet_to_json(wb.Sheets[leaveSheetName], {defval:''});
    leaveRecords = lRows.filter(r=>r['Name']||r['Employee ID']).map(r=>{
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      const sourceFile = String(r['Source File']||'');
      const uploadedAt = String(r['Uploaded At']||'');
      return {
        id: nextLeaveRecId++,
        name: String(r['Name']||''), employeeCode: String(r['Employee ID']||''),
        designation: String(r['Designation']||''), station: String(r['Station']||''),
        district: String(r['District']||''), leaveType: String(r['Leave Type']||''),
        dateRange: String(r['Date Range']||''), days: String(r['Days']||''),
        remarks: String(r['Remarks']||''), createdAt: String(r['Created At']||''),
        status: String(r['Status']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true'),
        // Older files saved before this feature existed won't have these columns — group
        // all of their rows into one "(existing data)" batch so they still show up, just
        // without individual per-file deletion.
        sourceFile: sourceFile || '(existing data)',
        uploadedAt: uploadedAt || '',
        batchId: (sourceFile||uploadedAt) ? (sourceFile+'|'+uploadedAt) : 'legacy'
      };
    });
  }
  // Day Off Check sheet (bulk-uploaded monthly attendance-grid file — kept as-is in its own schema)
  dayOffRecords = [];
  const dayOffSheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()==='day off check');
  if(dayOffSheetName){
    const doRows = XLSX.utils.sheet_to_json(wb.Sheets[dayOffSheetName], {defval:''});
    dayOffRecords = doRows.filter(r=>r['Name']||r['Employee Code']).map(r=>{
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      const sourceFile = String(r['Source File']||'');
      const uploadedAt = String(r['Uploaded At']||'');
      const monthLabel = String(r['Month']||'');
      const monthKey = String(r['Month Key']||'') || monthLabel;
      return {
        id: nextDayOffRecId++,
        name: String(r['Name']||''), employeeCode: String(r['Employee Code']||''),
        station: String(r['Station']||''),
        monthKey: monthKey, monthLabel: monthLabel || monthKey,
        offDays: Number(r['Off Days']||0)||0, totalDays: Number(r['Total Days']||0)||0,
        hidden: (hiddenVal==='yes'||hiddenVal==='true'),
        sourceFile: sourceFile || '(existing data)',
        uploadedAt: uploadedAt || '',
        batchId: (sourceFile||uploadedAt) ? (sourceFile+'|'+uploadedAt) : 'legacy'
      };
    });
  }

  // Backward-compat: older files may have a single combined "Duty Events" sheet
  const oldEventsSheet = wb.SheetNames.find(n=>n.trim().toLowerCase()==='duty events');
  if(oldEventsSheet){
    const evRows = XLSX.utils.sheet_to_json(wb.Sheets[oldEventsSheet], {defval:''});
    evRows.filter(r=>r['Type']).forEach(r=>{
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      events.push({
        id: nextEventId++, type: String(r['Type']||''), employeeId:'', employeeName: String(r['Employee']||''),
        employeeCode: String(r['Employee Code']||''), employeeName2: String(r['Employee 2']||''), employeeCode2: String(r['Employee Code 2']||''),
        date: String(r['Date']||''), timeFrom: String(r['Time From']||''), timeTo: String(r['Time To']||''),
        note: String(r['Note']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true'),
        createdAt: String(r['Logged At']||'')
      });
    });
  }

  // Messages sheet (WhatsApp-ready message templates — optional, older files won't have it)
  messages = [];
  const messagesSheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()==='messages');
  if(messagesSheetName){
    const mRows = XLSX.utils.sheet_to_json(wb.Sheets[messagesSheetName], {defval:''});
    messages = mRows.filter(r=>r['Title']||r['Message']).map(r=>{
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      return {
        id: nextMessageId++, title: String(r['Title']||''), text: String(r['Message']||''),
        createdAt: String(r['Logged At']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true')
      };
    });
  }

  // Lists sheet (optional — older files won't have it)
  const listsSheetName = wb.SheetNames.find(n=>n.trim().toLowerCase()==='lists');
  if(listsSheetName){
    const lsRows = XLSX.utils.sheet_to_json(wb.Sheets[listsSheetName], {defval:''});
    managedLists.department = [...new Set(lsRows.map(r=>String(r['Department']||'')).filter(Boolean))];
    managedLists.designation = [...new Set(lsRows.map(r=>String(r['Designation']||'')).filter(Boolean))];
    managedLists.tehsil = [...new Set(lsRows.map(r=>String(r['Tehsil']||'')).filter(Boolean))];
  }

  render();
  saveLocal();
}

let lastSyncTime = null;

async function autoSaveToLinkedFile(){
  if(!linkedHandle) return;
  try{
    const wb = buildWorkbook();
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const writable = await linkedHandle.createWritable();
    await writable.write(wbout);
    await writable.close();
    const file = await linkedHandle.getFile();
    linkedLastMod = file.lastModified;
    lastSyncTime = new Date();
    updateLastSyncIndicator();
    saveBackupSnapshot();
  } catch(err){ console.error('Auto-save failed', err); }
}

function updateLastSyncIndicator(){
  const el = document.getElementById('lastSyncText');
  if(!el) return;
  el.textContent = lastSyncTime ? ('Last saved: '+lastSyncTime.toLocaleString()) : 'Last saved: —';
}

function startPolling(){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async ()=>{
    if(!linkedHandle) return;
    try{
      const file = await linkedHandle.getFile();
      if(file.lastModified !== linkedLastMod){
        await loadFromLinkedFile();
        toast('Detected manual changes in Excel — refreshed');
      }
    } catch(err){}
  }, 2000);
}
