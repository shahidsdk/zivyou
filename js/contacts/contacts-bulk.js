/* MODULE: contacts/contacts-bulk
   Bulk edit and bulk delete of selected contacts. */

/* ---- Bulk Edit: change Department / Group for all currently-selected contacts at once ---- */
function openBulkEditModal(){
  const n = selectedContactIds.size;
  if(n===0) return;
  document.getElementById('bulkEditSummary').textContent = `Applying changes to ${n} selected contact${n>1?'s':''}. Only fields you fill in below will be changed — leave a field blank to leave it untouched.`;
  document.getElementById('be_department').value = '';
  document.getElementById('be_group').value = '';
  document.getElementById('bulkEditOverlay').classList.add('show');
}

function closeBulkEditModal(){ document.getElementById('bulkEditOverlay').classList.remove('show'); }

function applyBulkEdit(){
  const dept = document.getElementById('be_department').value.trim();
  const group = document.getElementById('be_group').value.trim();
  if(!dept && !group){ toast('Enter a Department or Group to apply'); return; }
  let count = 0;
  contacts.forEach(c=>{
    if(!selectedContactIds.has(c.id)) return;
    if(dept) c.department = dept;
    if(group) c.group = group;
    count++;
  });
  closeBulkEditModal();
  selectedContactIds.clear();
  render();
  persistAll();
  toast(`Updated ${count} contact${count>1?'s':''}`);
}

function deleteSelectedContacts(){
  const n = selectedContactIds.size;
  if(n===0) return;
  if(!confirm(`Delete ${n} selected contact${n>1?'s':''}?`)) return;
  const removedIds = new Set(selectedContactIds);
  const removed = contacts.filter(c=>removedIds.has(c.id));
  const removedIndices = removed.map(c=>contacts.indexOf(c));
  contacts = contacts.filter(c=>!removedIds.has(c.id));
  selectedContactIds.clear();
  render();
  persistAll();
  toastWithUndo(`${n} contact${n>1?'s':''} deleted`, ()=>{
    // Re-insert in original relative order
    removed.forEach((c,i)=>{
      const insertAt = Math.min(removedIndices[i], contacts.length);
      contacts.splice(insertAt, 0, c);
    });
    render();
    persistAll();
    toast('Delete undone');
  });
}
