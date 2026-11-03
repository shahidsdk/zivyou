/* MODULE: proforma/proforma
   Printable Casual Leave (Control/Operational) and Short Leave proformas. */

/* ---- Leave Proforma: printable Casual Leave (Control / Operational) and Short Leave applications,
   matching the office's official Word formats — optionally pre-filled from a selected employee ---- */
let proformaVariant = null;

function renderProformaEmpList(query){
  const list = document.getElementById('pf_employee_list');
  if(!list) return;
  const q = query.trim().toLowerCase();
  const matches = contacts.filter(c=>{
    if(!q) return true;
    const hay = (empComboLabel(c)+' '+(c.employeeCode||'')+' '+(c.designation||'')+' '+(c.department||'')).toLowerCase();
    return hay.includes(q);
  }).slice(0,50);
  if(matches.length===0){ list.innerHTML = '<div class="emp-combo-empty">No matching employee</div>'; return; }
  list.innerHTML = matches.map(c=>`<div class="emp-combo-item" onclick="selectProformaEmp('${c.id}')"><b>${empComboLabel(c)}</b>${(c.employeeCode||c.designation||c.department)?`<div class="ec-sub">${[c.employeeCode,c.designation,c.department].filter(Boolean).join(' · ')}</div>`:''}</div>`).join('');
}

function selectProformaEmp(id){
  const c = contacts.find(x=>String(x.id)===String(id));
  if(!c) return;
  document.getElementById('pf_employee').value = c.id;
  document.getElementById('pf_employee_search').value = empComboLabel(c);
  document.getElementById('pf_code').value = c.employeeCode||'';
  const list = document.getElementById('pf_employee_list');
  if(list) list.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', function(){
  const pfSearch = document.getElementById('pf_employee_search');
  if(pfSearch){
    pfSearch.addEventListener('input', ()=>{
      document.getElementById('pf_employee').value = '';
      renderProformaEmpList(pfSearch.value);
      document.getElementById('pf_employee_list').classList.add('show');
    });
    pfSearch.addEventListener('focus', ()=>{
      renderProformaEmpList(pfSearch.value);
      document.getElementById('pf_employee_list').classList.add('show');
    });
  }
  // Reverse direction: typing the Employee Code fills the Name field above it (and vice versa
  // via selectProformaEmp above) — same pattern used in the Duty/Leave add-forms.
  const pfCode = document.getElementById('pf_code');
  if(pfCode){
    pfCode.addEventListener('input', ()=>{
      const typed = pfCode.value.trim().toLowerCase();
      if(!typed){ document.getElementById('pf_employee').value = ''; return; }
      const exact = contacts.filter(c=> (c.employeeCode||'').trim().toLowerCase()===typed);
      const prefixMatches = contacts.filter(c=> (c.employeeCode||'').trim().toLowerCase().startsWith(typed));
      const match = exact[0] || (prefixMatches.length===1 ? prefixMatches[0] : null);
      if(match){
        document.getElementById('pf_employee').value = match.id;
        document.getElementById('pf_employee_search').value = empComboLabel(match);
      } else {
        document.getElementById('pf_employee').value = '';
      }
    });
  }
});

function openProformaModal(variant){
  proformaVariant = variant;
  const titles = {control:'📄 Casual Leave Proforma — Control', operational:'📄 Casual Leave Proforma — Operational', short:'📄 Short Leave Proforma'};
  document.getElementById('proformaModalTitle').textContent = titles[variant] || '📄 Generate Proforma';
  document.getElementById('pf_employee').value = '';
  document.getElementById('pf_employee_search').value = '';
  document.getElementById('pf_code').value = '';
  document.getElementById('pf_status').value = '';
  document.getElementById('pf_fatherName').value = '';
  document.getElementById('pf_dateFrom').value = '';
  document.getElementById('pf_dateTo').value = '';
  document.getElementById('pf_reason').value = '';
  document.getElementById('pf_address').value = '';
  document.getElementById('pf_daysPreview').textContent = '';
  document.getElementById('pf_short_date').value = '';
  document.getElementById('pf_short_fatherName').value = '';
  document.getElementById('pf_short_timeFrom').value = '';
  document.getElementById('pf_short_timeTo').value = '';
  document.getElementById('pf_short_reason').value = '';
  const isShort = variant==='short';
  document.getElementById('pf_leaveFields').style.display = isShort ? 'none' : '';
  document.getElementById('pf_shortFields').style.display = isShort ? '' : 'none';
  document.getElementById('proformaOverlay').classList.add('show');
}

function closeProformaModal(){ document.getElementById('proformaOverlay').classList.remove('show'); }

document.addEventListener('DOMContentLoaded', function(){
  const fromEl = document.getElementById('pf_dateFrom');
  const toEl = document.getElementById('pf_dateTo');
  const updateDaysPreview = ()=>{
    const days = daysBetweenInclusive(fromEl.value, toEl.value);
    document.getElementById('pf_daysPreview').textContent = days!==null ? ('Number of days will be filled in automatically: '+days) : '';
  };
  if(fromEl && toEl){
    fromEl.addEventListener('change', updateDaysPreview);
    toEl.addEventListener('change', updateDaysPreview);
  }
});

function proformaFieldRow(label, value, widthPct){
  return `<tr><td style="border:1px solid #000; padding:7px 10px; font-weight:700; width:${widthPct||34}%;">${label}</td><td style="border:1px solid #000; padding:7px 10px; text-align:center;">${value||''}</td></tr>`;
}

function proformaFormHtml(variant, emp){
  const code = emp ? (emp.employeeCode||'') : '';
  const name = emp ? empComboLabel(emp) : '';
  const designation = emp ? (emp.designation||'') : '';
  const placeOfDuty = emp ? (emp.department||'') : '';
  const mobileNum = emp ? (((emp.numbers||[]).find(n=>n.type==='Mobile')||{}).value || '') : '';
  const logoTag = `<img src="data:image/jpeg;base64,${RESCUE_LOGO_B64}" style="position:absolute; left:0; top:0; width:66px; height:auto;">`;

  if(variant==='short'){
    const shortDate = fmtDMY(document.getElementById('pf_short_date').value);
    const shortFatherName = document.getElementById('pf_short_fatherName').value;
    const timeFrom = document.getElementById('pf_short_timeFrom').value;
    const timeTo = document.getElementById('pf_short_timeTo').value;
    const shortReason = document.getElementById('pf_short_reason').value;
    const timeValue = (timeFrom||timeTo) ? `From: ${timeFrom||'_______'}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To: ${timeTo||'_______'}` : 'From: _______&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To: _______';
    return `
      <div style="position:relative; text-align:center; min-height:74px; margin-bottom:6px;">
        ${logoTag}
        <div style="font-size:17px; font-weight:800; text-decoration:underline;">Punjab Emergency Service (Rescue 1122)</div>
        <div style="font-size:13px; text-decoration:underline; margin-top:3px;">Application for Short Leave</div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:12px;">
        ${proformaFieldRow('Employee Code', code)}
        ${proformaFieldRow('Name of Applicant', name)}
        ${proformaFieldRow("Father's Name", shortFatherName)}
        ${proformaFieldRow('Designation', designation)}
        ${proformaFieldRow('Place of Duty', placeOfDuty)}
        ${proformaFieldRow('Date from which the short leave required', shortDate)}
        ${proformaFieldRow('Reason of short leave', shortReason)}
        ${proformaFieldRow('Time from which the short leave required', timeValue)}
        ${proformaFieldRow('Contact Number', mobileNum)}
      </table>
      <div style="margin-top:20px; font-size:12px; font-weight:700;">Date: ______________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Sign. Of Applicant: ______________</div>
      <div style="margin-top:20px; font-size:13px; font-weight:700; text-decoration:underline;">Establishment Report</div>
      <div style="font-size:11.5px; font-weight:700; margin:6px 0;">Total 2 short leaves are allowed in one month</div>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr>
          <td style="border:1px solid #000; padding:8px 10px; font-weight:700; text-align:center;">1st short leave on</td>
          <td style="border:1px solid #000; padding:8px 10px; font-weight:700; text-align:center;">2nd short leave on</td>
          <td style="border:1px solid #000; padding:8px 10px; font-weight:700; text-align:center;">Remarks</td>
        </tr>
        <tr>
          <td style="border:1px solid #000; padding:22px 10px;"></td>
          <td style="border:1px solid #000; padding:22px 10px;"></td>
          <td style="border:1px solid #000; padding:22px 10px;"></td>
        </tr>
      </table>
      <div style="display:flex; justify-content:space-between; margin-top:44px; font-size:12px; font-weight:700;">
        <div>____________________<br>Shift Incharge</div>
        <div>____________________<br>Control Room Incharge</div>
      </div>`;
  }

  // Casual leave — Control or Operational
  const footerRole = variant==='operational' ? 'Rescue & Safety Officer' : 'Control Room Incharge';
  const designationValue = variant==='operational'
    ? `${designation||''} &nbsp;&nbsp;&nbsp;&nbsp; <b>Shift:</b> _______`
    : (designation||'');
  const status = document.getElementById('pf_status').value;
  const fatherName = document.getElementById('pf_fatherName').value;
  const dateFrom = document.getElementById('pf_dateFrom').value;
  const dateTo = document.getElementById('pf_dateTo').value;
  const reason = document.getElementById('pf_reason').value;
  const address = document.getElementById('pf_address').value;
  const days = daysBetweenInclusive(dateFrom, dateTo);
  let dateRangeDisplay = '';
  if(dateFrom && dateTo) dateRangeDisplay = (dateFrom===dateTo) ? fmtDMY(dateFrom) : (fmtDMY(dateFrom)+' to '+fmtDMY(dateTo));
  else if(dateFrom) dateRangeDisplay = fmtDMY(dateFrom);
  const relieverRow = `<tr>
      <td style="border:1px solid #000; padding:22px 10px; font-weight:700; width:34%;">Duty Arrangement<br>Reliever</td>
      <td style="border:1px solid #000; padding:22px 10px; text-align:center;"><b>Name:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Design:</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Sign:</b></td>
    </tr>`;
  return `
    <div style="position:relative; text-align:center; min-height:74px; margin-bottom:6px;">
      ${logoTag}
      <div style="font-size:16.5px; font-weight:800; text-decoration:underline;">Punjab Emergency Service (Rescue 1122) R.Y.Khan</div>
      <div style="font-size:12.5px; text-decoration:underline; margin-top:3px;">Application for Casual Leave${variant==='operational'?' (Operational)':' (Control)'}</div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:11.5px;">
      ${proformaFieldRow('Employee Code', code)}
      ${proformaFieldRow('Name of Applicant', name)}
      ${proformaFieldRow("Father's Name", fatherName)}
      ${proformaFieldRow('Designation', designationValue)}
      ${proformaFieldRow('Place of Duty', placeOfDuty)}
      ${proformaFieldRow('Employee status', status)}
      ${proformaFieldRow('Date from which the leave required', dateRangeDisplay)}
      ${proformaFieldRow('Number of days', days!==null ? days : '')}
      ${proformaFieldRow('Reason of leave', reason)}
      ${proformaFieldRow('Address if to proceed outside the city', address)}
      ${proformaFieldRow('Contact Number', mobileNum)}
      ${relieverRow}${relieverRow}${relieverRow}
    </table>
    <div style="margin-top:18px; font-size:11.5px; font-weight:700;">Date: ______________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Sign. Of Applicant: ______________</div>
    <div style="margin-top:18px; font-size:13px; font-weight:700; text-decoration:underline;">Establishment Report</div>
    <table style="width:100%; border-collapse:collapse; margin-top:6px; font-size:11.5px;">
      ${proformaFieldRow('Date of Appointment', '')}
      ${proformaFieldRow('Balance', '')}
    </table>
    <div style="display:flex; justify-content:space-between; margin-top:36px; font-size:11.5px; font-weight:700;">
      <div>____________________<br>Shift In charge</div>
      <div>____________________<br>${footerRole}</div>
    </div>`;
}

function generateProforma(){
  const empId = document.getElementById('pf_employee').value;
  let emp = empId ? contacts.find(c=>String(c.id)===String(empId)) : null;
  if(!emp){
    // Fall back to resolving directly from the Employee Code field, in case it wasn't auto-matched
    // (e.g. multiple employees share a code prefix, or Generate was clicked before typing finished).
    const typedCode = document.getElementById('pf_code').value.trim().toLowerCase();
    if(typedCode){ emp = contacts.find(c=> (c.employeeCode||'').trim().toLowerCase()===typedCode) || null; }
  }
  document.getElementById('monthlyReportPrintArea').innerHTML = proformaFormHtml(proformaVariant, emp);
  closeProformaModal();
  document.body.classList.add('report-mode');
  setTimeout(()=>{
    window.print();
    setTimeout(()=>document.body.classList.remove('report-mode'), 300);
  }, 150);
}
