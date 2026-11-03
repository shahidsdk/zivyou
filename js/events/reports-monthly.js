/* MODULE: events/reports-monthly
   Monthly events report (print to PDF). */

function generateMonthlyReportPDF(){
  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', {month:'long', year:'numeric'});
  const thisMonth = todayStr().slice(0,7);
  const REPORT_TYPES = ['Short Leave','Duty Change','Day Off Change','Special Event','Handing Over Taking Over'];
  const colorMap = Object.fromEntries(EVENT_TYPES.map(t=>[t.key,t.color]));

  let sectionsHtml = '';
  REPORT_TYPES.forEach(type=>{
    const list = events.filter(e=>!e.hidden && e.type===type && (e.date||'').slice(0,7)===thisMonth)
      .slice().sort((a,b)=> (a.date||'').localeCompare(b.date||''));
    sectionsHtml += `<h3 style="margin:20px 0 8px; font-size:14px; border-bottom:2px solid ${colorMap[type]||'#333'}; padding-bottom:5px; color:#111;">${type} <span style="font-weight:400; color:#555;">(${list.length})</span></h3>`;
    if(list.length===0){
      sectionsHtml += `<div style="font-size:11.5px; color:#777; margin-bottom:6px;">No records this month.</div>`;
    } else {
      sectionsHtml += `<table style="width:100%; border-collapse:collapse; margin-bottom:6px; font-size:11px;">
        <tr style="background:#f0f0f0;">
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Date</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Employee</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Code</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Exchanged With</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Time</th>
          <th style="border:1px solid #999; padding:4px 6px; text-align:left;">Note</th>
        </tr>
        ${list.map(e=>`<tr>
          <td style="border:1px solid #999; padding:4px 6px;">${e.date||''}</td>
          <td style="border:1px solid #999; padding:4px 6px;">${e.employeeName||''}</td>
          <td style="border:1px solid #999; padding:4px 6px;">${e.employeeCode||''}</td>
          <td style="border:1px solid #999; padding:4px 6px;">${e.employeeName2?e.employeeName2+' ':''}${e.employeeCode2||''}</td>
          <td style="border:1px solid #999; padding:4px 6px;">${e.timeFrom?e.timeFrom+(e.timeTo?' - '+e.timeTo:''):''}</td>
          <td style="border:1px solid #999; padding:4px 6px;">${e.note||''}</td>
        </tr>`).join('')}
      </table>`;
    }
  });

  document.getElementById('monthlyReportPrintArea').innerHTML = `
    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:16px; font-weight:800;">CONTACT MANAGEMENT SYSTEM — RESCUE 1122 RAHIM YAR KHAN</div>
      <div style="font-size:13px; margin-top:3px;">Monthly Duty / Leave Report — ${monthLabel}</div>
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
