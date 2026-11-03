/* MODULE: data/excel-import
   Import contacts from Excel/CSV with column mapping. */

function triggerImport(){ document.getElementById('importFileInput').click(); }

function handleImportFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    const data = new Uint8Array(evt.target.result);
    const wb = XLSX.read(data, {type:'array'});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
    if(rows.length===0){ toast('File has no data'); return; }
    importHeaders = Object.keys(rows[0]);
    importRawRows = rows;
    openMapModal();
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
}

function guessField(header){
  const h = header.toLowerCase();
  if(h.includes('first')) return 'firstName';
  if(h.includes('last')) return 'lastName';
  if((h.includes('employee') || h.includes('emp')) && (h.includes('code') || h.includes('id'))) return 'employeeCode';
  if(h.includes('mobile')) return 'mobile';
  if(h.includes('whatsapp')) return 'whatsapp';
  if(h.includes('home')) return 'home';
  if(h.includes('office') && h.includes('addr')) return 'officeAddress';
  if(h.includes('office') || h.includes('phone')) return 'phone';
  if(h.includes('design')) return 'designation';
  if(h.includes('depart')) return 'department';
  if(h.includes('group')&&!h.includes('blood')) return 'group';
  if(h.includes('blood')) return 'bloodGroup';
  if(h.includes('tehsil')) return 'tehsil';
  if(h.includes('address')) return 'address';
  if(h.includes('birth')||h.includes('dob')) return 'birthday';
  if(h.includes('note')) return 'notes';
  return 'skip';
}

function openMapModal(){
  const wrap = document.getElementById('mapRows');
  wrap.innerHTML = importHeaders.map((h,i)=>{
    const guess = guessField(h);
    const opts = APP_FIELDS.map(f=>`<option value="${f.key}" ${f.key===guess?'selected':''}>${f.label}</option>`).join('');
    return `<div class="map-row"><div class="col-name">${h}</div><div class="arrow">→</div><select id="map_${i}">${opts}</select></div>`;
  }).join('');
  document.getElementById('mapOverlay').classList.add('show');
}

function closeMapModal(){ document.getElementById('mapOverlay').classList.remove('show'); importRawRows=null; }

function confirmImport(){
  const mapping = importHeaders.map((h,i)=>document.getElementById('map_'+i).value);
  let added = 0, updated = 0;
  importRawRows.forEach((row, idx)=>{
    const obj = {firstName:'',lastName:'',employeeCode:'',designation:'',department:'',group:'',bloodGroup:'',mobile:'',phone:'',home:'',whatsapp:'',address:'',tehsil:'',officeAddress:'',birthday:'',notes:''};
    importHeaders.forEach((h,i)=>{
      const field = mapping[i];
      if(field!=='skip') obj[field] = String(row[h]||'').trim();
    });
    if(!obj.firstName) return;
    const numbers = [];
    if(obj.mobile) numbers.push({type:'Mobile', value:normalizePhoneNumber(obj.mobile)});
    if(obj.phone) numbers.push({type:'Office', value:normalizePhoneNumber(obj.phone)});
    if(obj.home) numbers.push({type:'Home', value:normalizePhoneNumber(obj.home)});
    if(obj.whatsapp) numbers.push({type:'WhatsApp', value:normalizePhoneNumber(obj.whatsapp)});
    const now = Date.now() + idx; // preserve file order when ranking "recent"

    // de-dupe by firstName+lastName+first number
    const existing = contacts.find(c=> c.firstName===obj.firstName && c.lastName===obj.lastName &&
      (c.numbers||[]).some(n=>numbers.some(nn=>nn.value && nn.value===n.value)));
    if(existing){
      Object.assign(existing, {employeeCode:obj.employeeCode||existing.employeeCode, designation:obj.designation||existing.designation, department:obj.department||existing.department,
        group:obj.group||existing.group, bloodGroup:obj.bloodGroup||existing.bloodGroup, address:obj.address||existing.address,
        tehsil:obj.tehsil||existing.tehsil, officeAddress:obj.officeAddress||existing.officeAddress, birthday:obj.birthday||existing.birthday,
        notes:obj.notes||existing.notes, updatedAt: now});
      if(numbers.length) existing.numbers = numbers;
      updated++;
    } else {
      contacts.push({id: nextId++, firstName:obj.firstName, lastName:obj.lastName, employeeCode:obj.employeeCode, designation:obj.designation,
        department:obj.department, group:obj.group, bloodGroup:obj.bloodGroup, address:obj.address, tehsil:obj.tehsil,
        officeAddress:obj.officeAddress, birthday:obj.birthday, notes:obj.notes, numbers, createdAt: now, updatedAt: now});
      added++;
    }
  });
  closeMapModal();
  render();
  persistAll();
  toast(`Imported: ${added} added, ${updated} updated`);
}
