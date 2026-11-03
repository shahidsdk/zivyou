/* MODULE: dayoff/dayoff-reports
   Day Off Check: high Day Off reports (50+). */

/* ---- Day Off reports: every employee with 50 or more total Day Offs on file ---- */
const DAY_OFF_REPORT_MIN = 50;

function highDayOffGroups(){
  return dayOffSummaryGroups().filter(g=> (g.totalOff||0) >= DAY_OFF_REPORT_MIN).sort((a,b)=> (b.totalOff||0)-(a.totalOff||0));
}

function dayOffDesignationFor(g){
  const code = (g.employeeCode||'').trim().toLowerCase();
  const nm = (g.name||'').trim().toLowerCase();
  const c = contacts.find(x=> code ? (x.employeeCode||'').trim().toLowerCase()===code : ((x.firstName||'')+' '+(x.lastName||'')).trim().toLowerCase()===nm);
  return c ? (c.designation||'') : '';
}

function printDayOffReport(title, bodyHtml){
  const now = new Date();
  document.getElementById('monthlyReportPrintArea').innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:16px; font-weight:800;">CONTACT MANAGEMENT SYSTEM — RESCUE 1122 RAHIM YAR KHAN</div>
      <div style="font-size:13px; margin-top:3px;">${title}</div>
      <div style="font-size:10px; color:#666; margin-top:2px;">Generated: ${now.toLocaleString()}</div>
    </div>
    <hr style="margin:10px 0; border:none; border-top:2px solid #333;">
    ${bodyHtml}
    <div style="margin-top:26px; display:flex; justify-content:space-between; font-size:11px; color:#333;">
      <div>Prepared by: ____________________</div>
      <div>Signature: ____________________</div>
    </div>`;
  document.body.classList.add('report-mode');
  setTimeout(()=>{
    window.print();
    setTimeout(()=>document.body.classList.remove('report-mode'), 300);
  }, 150);
}

// One row per employee, everything on a single line: total Day Offs + month-by-month breakdown.
function generateHighDayOffShortReportPDF(){
  const flagged = highDayOffGroups();
  if(flagged.length===0){ toast('No employee has '+DAY_OFF_REPORT_MIN+' or more Day Offs'); return; }
  const cell = 'border:1px solid #999; padding:4px 6px; white-space:nowrap;';
  const rowsHtml = flagged.map((g,i)=>{
    const breakdown = Object.entries(g.byMonth).map(([m,d])=> `${escapeHtml(m)} ${d}`).join(' · ');
    return `<tr>
        <td style="${cell} text-align:center;">${i+1}</td>
        <td style="${cell} font-weight:600;">${escapeHtml(g.name||'')}</td>
        <td style="${cell}">${escapeHtml(g.employeeCode||'')}</td>
        <td style="${cell}">${escapeHtml(dayOffDesignationFor(g))}</td>
        <td style="${cell}">${escapeHtml(g.station||'')}</td>
        <td style="${cell} font-weight:700; color:#E0374B; text-align:center;">Total ${g.totalOff} Day Offs</td>
        <td style="${cell}">${breakdown}</td>
      </tr>`;
  }).join('');
  const body = `<table style="width:100%; border-collapse:collapse; font-size:10.5px;">
      <tr style="background:#f0f0f0;">
        <th style="border:1px solid #999; padding:4px 6px;">#</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Name</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Code</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Designation</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Station</th>
        <th style="border:1px solid #999; padding:4px 6px;">Total Day Off</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Month-wise Day Off</th>
      </tr>
      ${rowsHtml}
    </table>`;
  printDayOffReport(`Day Off Check — Short Report — ${flagged.length} employee${flagged.length===1?'':'s'} with ${DAY_OFF_REPORT_MIN} or more Day Offs`, body);
}

// Each employee gets their own block with the full month-by-month record underneath.
function generateHighDayOffDetailReportPDF(){
  const flagged = highDayOffGroups();
  if(flagged.length===0){ toast('No employee has '+DAY_OFF_REPORT_MIN+' or more Day Offs'); return; }
  const th = 'border:1px solid #999; padding:4px 6px; text-align:left;';
  const td = 'border:1px solid #999; padding:4px 6px;';
  const body = flagged.map(g=>{
    const desig = dayOffDesignationFor(g);
    const rowsHtml = g.records.map(r=>`<tr>
        <td style="${td}">${escapeHtml(r.monthLabel||r.monthKey||'(month not specified)')}</td>
        <td style="${td}">${r.offDays||0}</td>
        <td style="${td}">${r.totalDays||''}</td>
        <td style="${td}">${escapeHtml(r.sourceFile||'')}</td>
      </tr>`).join('');
    return `<div style="margin-bottom:18px; page-break-inside:avoid;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:6px; border-bottom:2px solid #E0374B; padding-bottom:4px; margin-bottom:6px;">
        <div style="font-size:13.5px; font-weight:800;">${escapeHtml(g.name||'')} <span style="font-weight:400; color:#555;">${g.employeeCode?('· Code: '+escapeHtml(g.employeeCode)):''}${desig?(' · '+escapeHtml(desig)):''}${g.station?(' · '+escapeHtml(g.station)):''}</span></div>
        <div style="font-size:13px; font-weight:800; color:#E0374B;">Total Day Offs: ${g.totalOff} (${g.count} month${g.count===1?'':'s'})</div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <tr style="background:#f0f0f0;">
          <th style="${th}">Month</th>
          <th style="${th}">Day Offs</th>
          <th style="${th}">Days in File</th>
          <th style="${th}">Source File</th>
        </tr>
        ${rowsHtml}
      </table>
    </div>`;
  }).join('');
  printDayOffReport(`Day Off Check — Detail Report — ${flagged.length} employee${flagged.length===1?'':'s'} with ${DAY_OFF_REPORT_MIN} or more Day Offs`, body);
}
