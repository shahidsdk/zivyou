/* MODULE: contacts/manage-lists
   Department / Designation / Tehsil list manager. */

function toggleManageDrawer(){
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('manageDrawer').classList.add('show');
  renderManageLists();
}

function closeManageDrawer(e){
  if(e) e.stopPropagation();
  document.getElementById('drawerOverlay').classList.remove('show');
  document.getElementById('manageDrawer').classList.remove('show');
}

function switchManageTab(kind){
  manageActiveTab = kind;
  ['department','designation','tehsil'].forEach(k=>{
    document.getElementById('tab_'+k).classList.toggle('active', k===kind);
  });
  document.getElementById('manageAddInput').value = '';
  renderManageLists();
}

function renderManageLists(){
  const kind = manageActiveTab;
  // union of manually-added items + anything already used on contacts, so nothing already in use "disappears"
  const used = uniqueVals(contacts, kind);
  const all = [...new Set([...managedLists[kind], ...used])];
  const body = document.getElementById('manageListBody');
  document.getElementById('manageAddInput').placeholder = 'Add new ' + kind + '...';
  if(all.length===0){ body.innerHTML = '<div class="drawer-empty">No items yet. Add one above.</div>'; return; }
  body.innerHTML = all.map(v=>{
    const inUse = used.includes(v);
    return `<div class="drawer-list-item"><span>${v}${inUse?' <span class="sub">(in use)</span>':''}</span>
      <button onclick="removeManageItem('${kind}','${v.replace(/'/g,"\\'")}')" title="Remove">✕</button></div>`;
  }).join('');
}

function addManageItem(){
  const input = document.getElementById('manageAddInput');
  const val = input.value.trim();
  if(!val){ toast('Type a value first'); return; }
  const kind = manageActiveTab;
  if(managedLists[kind].some(v=>v.toLowerCase()===val.toLowerCase())){ toast('Already in the list'); input.value=''; return; }
  managedLists[kind].push(val);
  input.value = '';
  renderManageLists();
  renderFilterOptions();
  persistAll();
  toast(kind.charAt(0).toUpperCase()+kind.slice(1)+' added: '+val);
}

function removeManageItem(kind, val){
  const used = uniqueVals(contacts, kind);
  if(used.includes(val)){
    toast('Cannot remove — still used by a contact. Change/clear it on that contact first.');
    return;
  }
  managedLists[kind] = managedLists[kind].filter(v=>v!==val);
  renderManageLists();
  renderFilterOptions();
  persistAll();
  toast('Removed: '+val);
}
