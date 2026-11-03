/* MODULE: leave/leave-reports
   Leave: low casual-balance reports (short + detailed PDF). */

// One PDF, all at once: every employee whose Casual Leave balance for the current year is
// 4 days or fewer, each with their full Leave record history — not one employee at a time.
// One row per employee (name, code, designation, "Total: X (Casual: A · Gazetted: B · Cancelled: C)",
// balance) — a quick-glance version of the same ≤4 list, instead of each employee's full history.
function generateLowLeaveBalanceShortReportPDF(){
  const currentYear = String(new Date().getFullYear());
  const groups = leaveSummaryGroups();
  const flagged = groups.map(g=>{
    const balances = g.casualBalances || [];
    const b = balances.find(x=>x.year===currentYear) || (balances.length===1 ? balances[0] : null);
    return b ? {g, b} : null;
  }).filter(x=> x && x.b.remaining<=4).sort((a,b)=> a.b.remaining-b.b.remaining);

  if(flagged.length===0){ toast('No employee currently has 4 or fewer Casual Leave days left'); return; }

  // Short label for each leave type so the whole breakdown fits on ONE line
  const shortType = (t)=>{
    const l=(t||'').toLowerCase();
    if(l.includes('casual')) return 'Casual';
    if(l.includes('gazet')) return 'Gazetted';
    return (t||'Other').replace(/\s*(leave|holiday)s?\s*$/i,'').trim() || 'Other';
  };
  const cell = 'border:1px solid #999; padding:4px 6px; white-space:nowrap;';
  const rowsHtml = flagged.map(({g,b},i)=>{
    const parts = Object.entries(g.byType).map(([t,d])=> `${shortType(t)} ${d}`);
    if(g.cancelledCount>0) parts.push(`Cancel ${g.cancelledDays}`);
    if(g.deniedCount>0) parts.push(`Denied ${g.deniedDays}`);
    const breakdown = parts.join(' · ');
    return `<tr>
        <td style="${cell} text-align:center;">${i+1}</td>
        <td style="${cell} font-weight:600;">${g.name||''}</td>
        <td style="${cell}">${g.employeeCode||''}</td>
        <td style="${cell}">${g.designation||''}</td>
        <td style="${cell} font-weight:700; color:#E0374B; text-align:center;">Balance ${b.remaining}/${CASUAL_LEAVE_ANNUAL_QUOTA}</td>
        <td style="${cell}">Total ${g.totalDays}${breakdown?(' &nbsp;→&nbsp; '+breakdown):''}</td>
      </tr>`;
  }).join('');

  const now = new Date();
  document.getElementById('monthlyReportPrintArea').innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:16px; font-weight:800;">CONTACT MANAGEMENT SYSTEM — RESCUE 1122 RAHIM YAR KHAN</div>
      <div style="font-size:13px; margin-top:3px;">Low Casual Leave Balance — Short Report — ${flagged.length} employee${flagged.length===1?'':'s'} with 4 or fewer days left (${currentYear})</div>
      <div style="font-size:10px; color:#666; margin-top:2px;">Generated: ${now.toLocaleString()}</div>
    </div>
    <hr style="margin:10px 0; border:none; border-top:2px solid #333;">
    <table style="width:100%; border-collapse:collapse; font-size:10.5px;">
      <tr style="background:#f0f0f0;">
        <th style="border:1px solid #999; padding:4px 6px;">#</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Name</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Code</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Designation</th>
        <th style="border:1px solid #999; padding:4px 6px;">Casual Balance</th>
        <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Total Leave (Casual · Gazetted · Cancel)</th>
      </tr>
      ${rowsHtml}
    </table>
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

function generateLowLeaveBalanceReportPDF(){
  const currentYear = String(new Date().getFullYear());
  const groups = leaveSummaryGroups();
  const flagged = groups.map(g=>{
    const balances = g.casualBalances || [];
    const b = balances.find(x=>x.year===currentYear) || (balances.length===1 ? balances[0] : null);
    return b ? {g, b} : null;
  }).filter(x=> x && x.b.remaining<=4).sort((a,b)=> a.b.remaining-b.b.remaining);

  if(flagged.length===0){ toast('No employee currently has 4 or fewer Casual Leave days left'); return; }

  const sectionsHtml = flagged.map(({g,b})=>{
    const rows = g.records.slice().sort((a,c)=>(a.dateRange||'').localeCompare(c.dateRange||''));
    const rowsHtml = rows.map(r=>`<tr>
        <td style="border:1px solid #999; padding:4px 6px;">${r.dateRange||''}</td>
        <td style="border:1px solid #999; padding:4px 6px;">${r.leaveType||''}</td>
        <td style="border:1px solid #999; padding:4px 6px;">${r.days||''}</td>
        <td style="border:1px solid #999; padding:4px 6px;">${r.status||''}</td>
        <td style="border:1px solid #999; padding:4px 6px;">${r.remarks||''}</td>
      </tr>`).join('');
    return `<div style="margin-bottom:18px; page-break-inside:avoid;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:6px; border-bottom:2px solid #E0374B; padding-bottom:4px; margin-bottom:6px;">
        <div style="font-size:13.5px; font-weight:800;">${g.name||''} <span style="font-weight:400; color:#555;">${g.employeeCode?('· Code: '+g.employeeCode):''}${g.designation?(' · '+g.designation):''}</span></div>
        <div style="font-size:13px; font-weight:800; color:#E0374B;">Casual Leave Balance: ${b.remaining}/${CASUAL_LEAVE_ANNUAL_QUOTA} (${b.year})</div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <tr style="background:#f0f0f0;">
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Date Range</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Type</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Days</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Status</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Remarks</th>
        </tr>
        ${rowsHtml}
      </table>
    </div>`;
  }).join('');

  const now = new Date();
  document.getElementById('monthlyReportPrintArea').innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:16px; font-weight:800;">CONTACT MANAGEMENT SYSTEM — RESCUE 1122 RAHIM YAR KHAN</div>
      <div style="font-size:13px; margin-top:3px;">Low Casual Leave Balance — Detail Report — ${flagged.length} employee${flagged.length===1?'':'s'} with 4 or fewer days left (${currentYear})</div>
      <div style="font-size:10px; color:#666; margin-top:2px;">Generated: ${now.toLocaleString()}</div>
    </div>
    <hr style="margin:10px 0; border:none; border-top:2px solid #333;">
    ${sectionsHtml}
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
