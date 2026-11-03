/* MODULE: data/idb
   IndexedDB helpers (remember linked file, backup store). */

/* File System Access handles cannot go in localStorage (not JSON-safe) but CAN be stored
   in IndexedDB. This is what lets the app reconnect without asking the user to "Link File"
   every single time — only once per browser/device, ever (a hard browser-security limit:
   no webpage can be granted write access to a file without the user approving it at least once). */
const IDB_NAME = 'crbFileHandles', IDB_STORE = 'handles', IDB_BACKUP_STORE = 'backups', IDB_VERSION = 2, BACKUP_LIMIT = 10;

function idbOpen(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      if(!db.objectStoreNames.contains(IDB_BACKUP_STORE)) db.createObjectStore(IDB_BACKUP_STORE);
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}

async function idbSetHandle(handle){
  try{
    const db = await idbOpen();
    await new Promise((resolve,reject)=>{
      const tx = db.transaction(IDB_STORE,'readwrite');
      tx.objectStore(IDB_STORE).put(handle,'linkedFile');
      tx.oncomplete = resolve; tx.onerror = ()=>reject(tx.error);
    });
  } catch(err){ console.error('Could not remember file handle', err); }
}

async function idbGetHandle(){
  try{
    const db = await idbOpen();
    return await new Promise((resolve,reject)=>{
      const tx = db.transaction(IDB_STORE,'readonly');
      const req = tx.objectStore(IDB_STORE).get('linkedFile');
      req.onsuccess = ()=>resolve(req.result||null); req.onerror = ()=>reject(req.error);
    });
  } catch(err){ return null; }
}

async function idbClearHandle(){
  try{
    const db = await idbOpen();
    await new Promise((resolve,reject)=>{
      const tx = db.transaction(IDB_STORE,'readwrite');
      tx.objectStore(IDB_STORE).delete('linkedFile');
      tx.oncomplete = resolve; tx.onerror = ()=>reject(tx.error);
    });
  } catch(err){}
}
