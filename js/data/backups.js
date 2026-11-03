/* MODULE: data/backups
   Automatic backups (last 10) and restore. */

async function saveBackupSnapshot(){
  if(!window.indexedDB) return;
  try{
    const db = await idbOpen();
    const snapshot = {
      ts: new Date().toISOString(),
      contacts, events, leaveRecords, dayOffRecords, messages, nextId, nextEventId, nextLeaveRecId, nextDayOffRecId, nextMessageId
    };
    await new Promise((resolve,reject)=>{
      const tx = db.transaction(IDB_BACKUP_STORE,'readwrite');
      tx.objectStore(IDB_BACKUP_STORE).put(snapshot, snapshot.ts);
      tx.oncomplete = resolve; tx.onerror = ()=>reject(tx.error);
    });
    await trimBackups();
  } catch(err){ console.error('Could not save backup snapshot', err); }
}

async function trimBackups(){
  try{
    const db = await idbOpen();
    const tx = db.transaction(IDB_BACKUP_STORE,'readwrite');
    const store = tx.objectStore(IDB_BACKUP_STORE);
    await new Promise((resolve,reject)=>{
      const req = store.getAllKeys();
      req.onsuccess = ()=>{
        const keys = req.result.slice().sort(); // ISO timestamp strings sort chronologically
        const excess = keys.length - BACKUP_LIMIT;
        if(excess>0){ keys.slice(0,excess).forEach(k=>store.delete(k)); }
        resolve();
      };
      req.onerror = ()=>reject(req.error);
    });
  } catch(err){}
}

async function listBackups(){
  if(!window.indexedDB) return [];
  try{
    const db = await idbOpen();
    return await new Promise((resolve,reject)=>{
      const tx = db.transaction(IDB_BACKUP_STORE,'readonly');
      const req = tx.objectStore(IDB_BACKUP_STORE).getAll();
      req.onsuccess = ()=>resolve((req.result||[]).sort((a,b)=>b.ts.localeCompare(a.ts)));
      req.onerror = ()=>reject(req.error);
    });
  } catch(err){ return []; }
}

async function openBackupsModal(){
  document.getElementById('backupsOverlay').classList.add('show');
  document.getElementById('backupsList').innerHTML = '<div style="font-size:12.5px; color:#8A94A3; padding:8px 2px;">Loading…</div>';
  const backups = await listBackups();
  renderBackupsList(backups);
}

function closeBackupsModal(){ document.getElementById('backupsOverlay').classList.remove('show'); }

function renderBackupsList(backups){
  const listEl = document.getElementById('backupsList');
  if(backups.length===0){
    listEl.innerHTML = '<div style="font-size:12.5px; color:#8A94A3; padding:8px 2px;">No backups yet — one is saved automatically every time data is synced to the Excel file.</div>';
    return;
  }
  listEl.innerHTML = backups.map(b=>{
    const when = new Date(b.ts).toLocaleString();
    return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid #E5E9F0; border-radius:8px; padding:9px 11px; background:#F9FAFC;">
      <div style="min-width:0;">
        <div style="font-size:13px; font-weight:600; color:#22262E;">${when}</div>
        <div style="font-size:11.5px; color:#8A94A3;">${(b.contacts||[]).length} contacts · ${(b.events||[]).length} duty/leave events · ${(b.leaveRecords||[]).length} leave records · ${(b.dayOffRecords||[]).length} day off check records · ${(b.messages||[]).length} messages</div>
      </div>
      <button onclick="restoreBackup('${b.ts}')" style="flex-shrink:0; background:#F5F1FF; color:#6C3EF2; border:1px solid #DCD0FB; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;">Restore</button>
    </div>`;
  }).join('');
}

async function restoreBackup(ts){
  if(!confirm('Restore this backup?\n\nThis replaces all current Contacts, Duty/Leave records, Leave data, and Day Off Check data with the version from '+new Date(ts).toLocaleString()+'.\n\n(The current state is backed up first, so this itself can be undone by restoring again.)')) return;
  await saveBackupSnapshot(); // safety net: back up current state before overwriting it
  try{
    const db = await idbOpen();
    const tx = db.transaction(IDB_BACKUP_STORE,'readonly');
    const req = tx.objectStore(IDB_BACKUP_STORE).get(ts);
    req.onsuccess = ()=>{
      const snap = req.result;
      if(!snap){ toast('Backup not found'); return; }
      contacts = snap.contacts||[];
      events = snap.events||[];
      leaveRecords = snap.leaveRecords||[];
      dayOffRecords = snap.dayOffRecords||[];
      messages = snap.messages||[];
      if(snap.nextId) nextId = Math.max(nextId, snap.nextId);
      if(snap.nextEventId) nextEventId = Math.max(nextEventId, snap.nextEventId);
      if(snap.nextLeaveRecId) nextLeaveRecId = Math.max(nextLeaveRecId, snap.nextLeaveRecId);
      if(snap.nextDayOffRecId) nextDayOffRecId = Math.max(nextDayOffRecId, snap.nextDayOffRecId);
      if(snap.nextMessageId) nextMessageId = Math.max(nextMessageId, snap.nextMessageId);
      render();
      renderLeaveSummary();
      renderDayOffSummary();
      renderMessages();
      persistAll();
      closeBackupsModal();
      toast('Restored backup from '+new Date(ts).toLocaleString());
    };
    req.onerror = ()=>toast('Could not restore backup');
  } catch(err){ console.error(err); toast('Could not restore backup'); }
}

async function tryAutoResumeSync(){
  if(!window.showOpenFilePicker || !window.indexedDB) return;
  const handle = await idbGetHandle();
  if(!handle) return;
  try{
    const perm = await handle.queryPermission({mode:'readwrite'});
    if(perm==='granted'){
      linkedHandle = handle;
      await loadFromLinkedFile();
      document.getElementById('syncDot').classList.add('on');
      document.getElementById('syncStatusText').textContent = 'Linked: ' + handle.name;
      startPolling();
      toast('Reconnected to ' + handle.name);
    } else {
      showResumeBanner(handle);
    }
  } catch(err){
    // handle no longer valid (file moved/deleted) — forget it silently
    idbClearHandle();
  }
}
