/* MODULE: data/cloud-sync
   Google Sheet sync (Apps Script), PIN screen, polling. */

/* Works with a Google Apps Script Web App deployed on top of a Google Sheet that mirrors
   the same tabs as the Excel file (Contacts, Short Leave, Day Off Change, Duty Change,
   Special Event, Handing Over Taking Over, Leave, Day Off Check, Messages, Lists). Unlike the File System
   Access sync above (which only works in Chrome/Edge and only on the device it was linked
   on), this works from any browser, any device, as long as it can reach the internet — which
   is what makes it possible to host this page on GitHub Pages and still have live data. */

function buildCloudPayload(){
  const sheets = {};
  sheets["Contacts"] = contactsToRows();
  EVENT_TYPES.forEach(t=>{
    if(t.bulkUpload || t.messagesFeature) return;
    sheets[t.key] = eventsToRowsByType(t.key);
  });
  sheets["Leave"] = leaveRecordsToRows();
  sheets["Day Off Check"] = dayOffRecordsToRows();
  sheets["Messages"] = messagesToRows();
  sheets["Lists"] = listsToRows();
  return { sheets, pin: cloudPin };
}

async function saveToCloud(){
  if(!cloudSyncUrl || cloudSyncBusy) return;
  cloudSyncBusy = true;
  try{
    const payload = buildCloudPayload();
    const res = await fetch(cloudSyncUrl, {
      method:'POST',
      // text/plain avoids a CORS preflight; Apps Script still reads it fine via e.postData.contents
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(data && data.error === 'wrong_pin'){ lockWithPin('PIN changed or wrong — enter it again'); return; }
    if(data && data.lastUpdated) cloudLastUpdated = data.lastUpdated;
    lastSyncTime = new Date();
    updateLastSyncIndicator();
    saveBackupSnapshot();
    setCloudStatus(true, 'Synced to Google Sheet');
  } catch(err){
    console.error('Cloud save failed', err);
    setCloudStatus(false, 'Cloud sync failed — will retry on next change');
  } finally {
    cloudSyncBusy = false;
  }
}

function applyCloudData(json){
  const sheets = json.sheets || {};

  // Contacts
  const cRows = sheets["Contacts"] || [];
  contacts = cRows.map((row, idx)=>{
    const obj = {firstName:'',lastName:'',employeeCode:'',designation:'',department:'',group:'',bloodGroup:'',mobile:'',phone:'',home:'',whatsapp:'',address:'',tehsil:'',officeAddress:'',birthday:'',notes:''};
    Object.keys(row).forEach(h=>{ const f=guessField(h); if(f!=='skip') obj[f]=String(row[h]||'').trim(); });
    const numbers=[];
    if(obj.mobile) numbers.push({type:'Mobile', value:obj.mobile});
    if(obj.phone) numbers.push({type:'Office', value:obj.phone});
    if(obj.home) numbers.push({type:'Home', value:obj.home});
    if(obj.whatsapp) numbers.push({type:'WhatsApp', value:obj.whatsapp});
    const stamp = Date.now() + idx;
    return {id: nextId++, firstName:obj.firstName, lastName:obj.lastName, employeeCode:obj.employeeCode, designation:obj.designation, department:obj.department,
      group:obj.group, bloodGroup:obj.bloodGroup, address:obj.address, tehsil:obj.tehsil, officeAddress:obj.officeAddress,
      birthday:obj.birthday, notes:obj.notes, numbers, createdAt: stamp, updatedAt: stamp};
  }).filter(c=>c.firstName);

  // Per-type event sheets
  events = [];
  EVENT_TYPES.forEach(t=>{
    if(t.bulkUpload || t.messagesFeature) return;
    const rows = sheets[t.key] || [];
    rows.filter(r=>r['Employee']||r['Note']).forEach(r=>{
      const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
      events.push({
        id: nextEventId++, type: t.key, employeeName: String(r['Employee']||''), employeeCode: String(r['Employee Code']||''),
        employeeName2: String(r['Employee 2']||''), employeeCode2: String(r['Employee Code 2']||''),
        date: String(r['Date']||''), timeFrom: String(r['Time From']||''), timeTo: String(r['Time To']||''),
        note: String(r['Note']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true'),
        createdAt: String(r['Logged At']||'')
      });
    });
  });

  // Leave records
  const lRows = sheets["Leave"] || [];
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
      sourceFile: sourceFile || '(existing data)',
      uploadedAt: uploadedAt || '',
      batchId: (sourceFile||uploadedAt) ? (sourceFile+'|'+uploadedAt) : 'legacy'
    };
  });

  // Day Off Check records
  const doRows = sheets["Day Off Check"] || [];
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

  // Messages
  const mRows = sheets["Messages"] || [];
  messages = mRows.filter(r=>r['Title']||r['Message']).map(r=>{
    const hiddenVal = String(r['Hidden']||'').trim().toLowerCase();
    return { id: nextMessageId++, title: String(r['Title']||''), text: String(r['Message']||''),
      createdAt: String(r['Logged At']||''), hidden: (hiddenVal==='yes'||hiddenVal==='true') };
  });

  // Lists
  const lsRows = sheets["Lists"] || [];
  managedLists.department = [...new Set(lsRows.map(r=>String(r['Department']||'')).filter(Boolean))];
  managedLists.designation = [...new Set(lsRows.map(r=>String(r['Designation']||'')).filter(Boolean))];
  managedLists.tehsil = [...new Set(lsRows.map(r=>String(r['Tehsil']||'')).filter(Boolean))];

  render();
  if(typeof renderLeaveSummary === 'function') renderLeaveSummary();
  if(typeof renderMessages === 'function') renderMessages();
  saveLocal();
}

async function loadFromCloud(showToast){
  if(!cloudSyncUrl) return false;
  try{
    const bust = (cloudSyncUrl.includes('?') ? '&' : '?') + 'pin=' + encodeURIComponent(cloudPin) + '&_=' + Date.now();
    const res = await fetch(cloudSyncUrl + bust);
    const json = await res.json();
    if(json.error === 'wrong_pin'){
      lockWithPin(cloudPin ? 'Wrong PIN' : '');
      return false;
    }
    if(!json.pinChecked){
      // Server is running the old script that does not verify PINs — refuse to unlock.
      lockWithPin('Google script purani hai (PIN check nahi karti). Naya Code.gs deploy karein.');
      return false;
    }
    cloudLastUpdated = json.lastUpdated || null;
    applyCloudData(json);
    setCloudStatus(true, 'Connected: Google Sheet');
    if(showToast) toast('Loaded latest data from Google Sheet');
    return true;
  } catch(err){
    console.error('Cloud load failed', err);
    setCloudStatus(false, 'Could not reach Google Sheet');
    if(showToast) toast('Could not reach Google Sheet — check the URL');
    const msg = document.getElementById('pinMsg');
    if(msg && document.getElementById('pinOverlay').style.display !== 'none') msg.textContent = 'Could not reach server — check internet';
    return false;
  }
}

/* ---- PIN screen ---- */
function lockWithPin(message){
  cloudPin = '';
  localStorage.removeItem('crbPin');
  if(cloudPollTimer) clearInterval(cloudPollTimer);
  document.getElementById('pinOverlay').style.display = 'flex';
  document.getElementById('pinMsg').textContent = message || '';
  const inp = document.getElementById('pinInput'); inp.value=''; inp.focus();
}

async function submitPin(){
  const inp = document.getElementById('pinInput');
  const v = inp.value.trim();
  if(!v){ document.getElementById('pinMsg').textContent = 'Enter PIN'; return; }
  cloudPin = v;
  document.getElementById('pinMsg').style.color = '#8A94A3';
  document.getElementById('pinMsg').textContent = 'Checking…';
  const ok = await loadFromCloud(false);
  document.getElementById('pinMsg').style.color = '#E0374B';
  if(ok){
    localStorage.setItem('crbPin', v);
    document.getElementById('pinOverlay').style.display = 'none';
    startCloudPolling();
  }
}

function setCloudStatus(ok, text){
  const el = document.getElementById('cloudStatusText');
  if(el) el.style.color = ok ? '#2CB673' : '#E0374B';
  if(el) el.textContent = text;
  const timeEl = document.getElementById('cloudSyncText');
  if(timeEl) timeEl.textContent = 'Last cloud sync: ' + (lastSyncTime ? lastSyncTime.toLocaleString() : '—');
  const dot = document.getElementById('syncDot');
  if(dot && ok) dot.classList.add('on');
}

function startCloudPolling(){
  if(cloudPollTimer) clearInterval(cloudPollTimer);
  cloudPollTimer = setInterval(async ()=>{
    if(!cloudSyncUrl) return;
    try{
      const bust = (cloudSyncUrl.includes('?') ? '&' : '?') + 'pin=' + encodeURIComponent(cloudPin) + '&meta=1&_=' + Date.now();
      const res = await fetch(cloudSyncUrl + bust);
      const json = await res.json();
      if(json.error === 'wrong_pin' || (json.lastUpdated && !json.pinChecked)){ lockWithPin('PIN changed — enter the new PIN'); return; }
      if(json.lastUpdated && json.lastUpdated !== cloudLastUpdated){
        await loadFromCloud(false);
        toast('Detected update in Google Sheet — refreshed');
      }
    } catch(err){ /* stay quiet on transient network errors */ }
  }, 15000);
}

async function connectGoogleSheet(){
  const url = prompt('Paste your Google Apps Script Web App URL:', cloudSyncUrl || '');
  if(url===null) return; // cancelled
  const trimmed = url.trim();
  if(!trimmed){ toast('No URL entered'); return; }
  cloudSyncUrl = trimmed;
  localStorage.setItem('crbCloudSyncUrl', cloudSyncUrl);
  toast('Connecting to Google Sheet…');
  await loadFromCloud(true);
  startCloudPolling();
}

function disconnectGoogleSheet(){
  cloudSyncUrl = '';
  localStorage.removeItem('crbCloudSyncUrl');
  if(cloudPollTimer) clearInterval(cloudPollTimer);
  setCloudStatus(false, 'Not linked');
  toast('Disconnected from Google Sheet');
}
