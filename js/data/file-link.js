/* MODULE: data/file-link
   Link / unlink the Excel file (File System Access API). */

async function linkExcelFile(){
  if(!window.showOpenFilePicker){
    toast('Auto-sync needs Chrome or Edge browser. Use Import/Export instead.');
    return;
  }
  try{
    const [handle] = await window.showOpenFilePicker({
      types: [{description:'Excel/CSV', accept:{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'], 'text/csv':['.csv']}}]
    });
    const perm = await handle.requestPermission({mode:'readwrite'});
    if(perm!=='granted'){ toast('Permission denied'); return; }
    linkedHandle = handle;
    await idbSetHandle(handle);
    await loadFromLinkedFile();
    document.getElementById('syncDot').classList.add('on');
    document.getElementById('syncStatusText').textContent = 'Linked: ' + handle.name;
    document.getElementById('resumeBanner').classList.remove('show');
    startPolling();
    toast('File linked — this browser will remember it next time');
  } catch(err){
    if(err.name!=='AbortError') toast('Could not link file');
  }
}

function unlinkExcelFile(){
  linkedHandle = null;
  if(pollTimer) clearInterval(pollTimer);
  document.getElementById('syncDot').classList.remove('on');
  document.getElementById('syncStatusText').textContent = 'Not linked';
  idbClearHandle();
  toast('File unlinked');
}
