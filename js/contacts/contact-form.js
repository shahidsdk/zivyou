/* MODULE: contacts/contact-form
   Add / edit / delete a contact. */

let editingId = null;

function addNumberRow(type, value){
  const block = document.getElementById('numbersBlock');
  const row = document.createElement('div');
  row.className = 'number-row';
  row.innerHTML = `<select class="numType">
      <option ${type==='Mobile'?'selected':''}>Mobile</option>
      <option ${type==='Office'?'selected':''}>Office</option>
      <option ${type==='Home'?'selected':''}>Home</option>
      <option ${type==='WhatsApp'?'selected':''}>WhatsApp</option>
    </select>
    <input class="numValue" placeholder="03XX-XXXXXXX" value="${value||''}">
    <button class="rm" onclick="this.parentElement.remove()">✕</button>`;
  block.appendChild(row);
}

function openAddModal(){
  editingId = null;
  document.getElementById('modalTitle').textContent = '➕ Add New Contact';
  ['f_firstName','f_lastName','f_designation','f_address','f_tehsil','f_officeAddress','f_department','f_group','f_birthday','f_notes','f_employeeCode'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f_bloodGroup').value = '';
  document.getElementById('numbersBlock').innerHTML = '';
  addNumberRow('Mobile','');
  document.getElementById('contactOverlay').classList.add('show');
}

function openEditModal(id){
  const c = contacts.find(x=>x.id===id);
  if(!c) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '✎ Edit Contact';
  document.getElementById('f_firstName').value = c.firstName||'';
  document.getElementById('f_lastName').value = c.lastName||'';
  document.getElementById('f_designation').value = c.designation||'';
  document.getElementById('f_employeeCode').value = c.employeeCode||'';
  document.getElementById('f_bloodGroup').value = c.bloodGroup||'';
  document.getElementById('f_address').value = c.address||'';
  document.getElementById('f_tehsil').value = c.tehsil||'';
  document.getElementById('f_officeAddress').value = c.officeAddress||'';
  document.getElementById('f_department').value = c.department||'';
  document.getElementById('f_group').value = c.group||'';
  document.getElementById('f_birthday').value = c.birthday||'';
  document.getElementById('f_notes').value = c.notes||'';
  document.getElementById('numbersBlock').innerHTML = '';
  (c.numbers && c.numbers.length ? c.numbers : [{type:'Mobile',value:''}]).forEach(n=>addNumberRow(n.type, n.value));
  document.getElementById('contactOverlay').classList.add('show');
}

function closeModal(){ document.getElementById('contactOverlay').classList.remove('show'); }

function saveContact(){
  const firstName = document.getElementById('f_firstName').value.trim();
  if(!firstName){ toast('First Name is required'); return; }
  const numbers = [...document.querySelectorAll('#numbersBlock .number-row')].map(row=>({
    type: row.querySelector('.numType').value,
    value: normalizePhoneNumber(row.querySelector('.numValue').value.trim())
  })).filter(n=>n.value);

  const data = {
    firstName,
    lastName: document.getElementById('f_lastName').value.trim(),
    designation: document.getElementById('f_designation').value.trim(),
    employeeCode: document.getElementById('f_employeeCode').value.trim(),
    bloodGroup: document.getElementById('f_bloodGroup').value.trim(),
    address: document.getElementById('f_address').value.trim(),
    tehsil: document.getElementById('f_tehsil').value.trim(),
    officeAddress: document.getElementById('f_officeAddress').value.trim(),
    department: document.getElementById('f_department').value.trim(),
    group: document.getElementById('f_group').value.trim(),
    birthday: document.getElementById('f_birthday').value,
    notes: document.getElementById('f_notes').value.trim(),
    numbers
  };

  const now = Date.now();
  if(editingId){
    const idx = contacts.findIndex(x=>x.id===editingId);
    contacts[idx] = {...contacts[idx], ...data, updatedAt: now};
    toast('Contact updated');
  } else {
    contacts.push({id: nextId++, ...data, createdAt: now, updatedAt: now});
    toast('Contact added');
  }
  closeModal();
  render();
  persistAll();
}

function deleteContact(id){
  const idx = contacts.findIndex(c=>c.id===id);
  if(idx===-1) return;
  const removed = contacts[idx];
  contacts.splice(idx,1);
  selectedContactIds.delete(id);
  render();
  persistAll();
  toastWithUndo('Contact deleted', ()=>{
    contacts.splice(idx,0,removed);
    render();
    persistAll();
    toast('Delete undone');
  });
}

function deleteContactFromDuplicates(id){
  const idx = contacts.findIndex(c=>c.id===id);
  if(idx===-1) return;
  const removed = contacts[idx];
  contacts.splice(idx,1);
  selectedContactIds.delete(id);
  render();
  persistAll();
  renderDuplicatesList();
  toastWithUndo('Contact deleted', ()=>{
    contacts.splice(idx,0,removed);
    render();
    persistAll();
    renderDuplicatesList();
    toast('Delete undone');
  });
}
