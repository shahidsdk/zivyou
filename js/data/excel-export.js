/* MODULE: data/excel-export
   Build the Excel workbook and export it. */

function contactsToRows(){
  return contacts.map(c=>{
    const nums = c.numbers||[];
    const byType = (t)=> nums.filter(n=>n.type===t).map(n=>n.value).join('; ');
    return {
      "First Name": c.firstName||'', "Last Name": c.lastName||'', "Employee Code": c.employeeCode||'', "Designation": c.designation||'',
      "Department": c.department||'', "Group": c.group||'', "Blood Group": c.bloodGroup||'',
      "Mobile Number": byType('Mobile'), "Office Number": byType('Office'),
      "Home Number": byType('Home'), "WhatsApp Number": byType('WhatsApp'),
      "Address": c.address||'', "Tehsil": c.tehsil||'', "Office Address": c.officeAddress||'',
      "Birthday": c.birthday||'', "Notes": c.notes||''
    };
  });
}

function eventsToRowsByType(type){
  // Always exports every record, including soft-deleted (hidden) ones — the Excel sheet
  // stays the permanent record even after something is removed from the on-screen view.
  return events.filter(e=>e.type===type).map(e=>({
    "Employee": e.employeeName||'', "Employee Code": e.employeeCode||'',
    "Employee 2": e.employeeName2||'', "Employee Code 2": e.employeeCode2||'',
    "Date": e.date||'', "Time From": e.timeFrom||'', "Time To": e.timeTo||'', "Note": e.note||'',
    "Logged At": e.createdAt||'', "Hidden": e.hidden ? 'Yes' : ''
  }));
}

function listsToRows(){
  const d = managedLists.department, s = managedLists.designation, t = managedLists.tehsil;
  const max = Math.max(d.length, s.length, t.length, 1);
  const rows = [];
  for(let i=0;i<max;i++){
    rows.push({ "Department": d[i]||'', "Designation": s[i]||'', "Tehsil": t[i]||'' });
  }
  return rows;
}

function leaveRecordsToRows(){
  return leaveRecords.map(r=>({
    "Name": r.name||'', "Employee ID": r.employeeCode||'', "Designation": r.designation||'',
    "Station": r.station||'', "District": r.district||'', "Leave Type": r.leaveType||'',
    "Date Range": r.dateRange||'', "Days": r.days||'', "Remarks": r.remarks||'',
    "Created At": r.createdAt||'', "Status": r.status||'',
    "Source File": r.sourceFile||'', "Uploaded At": r.uploadedAt||'',
    "Hidden": r.hidden ? 'Yes' : ''
  }));
}

function dayOffRecordsToRows(){
  return dayOffRecords.map(r=>({
    "Name": r.name||'', "Employee Code": r.employeeCode||'', "Station": r.station||'',
    "Month": r.monthLabel || r.monthKey || '', "Month Key": r.monthKey || '',
    "Off Days": r.offDays||0, "Total Days": r.totalDays||0,
    "Source File": r.sourceFile||'', "Uploaded At": r.uploadedAt||'',
    "Hidden": r.hidden ? 'Yes' : ''
  }));
}

function messagesToRows(){
  return messages.map(m=>({
    "Title": m.title||'', "Message": m.text||'', "Logged At": m.createdAt||'', "Hidden": m.hidden ? 'Yes' : ''
  }));
}

function rowsToSheet(rows, headers){
  if(rows.length===0) return XLSX.utils.aoa_to_sheet([headers]);
  return XLSX.utils.json_to_sheet(rows);
}

const EVENT_SHEET_HEADERS = ["Employee","Employee Code","Employee 2","Employee Code 2","Date","Time From","Time To","Note","Logged At","Hidden"];

const CONTACT_SHEET_HEADERS = ["First Name","Last Name","Employee Code","Designation","Department","Group","Blood Group","Mobile Number","Office Number","Home Number","WhatsApp Number","Address","Tehsil","Office Address","Birthday","Notes"];

function buildWorkbook(){
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, rowsToSheet(contactsToRows(), CONTACT_SHEET_HEADERS), "Contacts");
  EVENT_TYPES.forEach(t=>{
    if(t.bulkUpload || t.messagesFeature) return; // Leave and Messages are written separately below, in their own schemas
    XLSX.utils.book_append_sheet(wb, rowsToSheet(eventsToRowsByType(t.key), EVENT_SHEET_HEADERS), t.key);
  });
  XLSX.utils.book_append_sheet(wb, rowsToSheet(leaveRecordsToRows(), LEAVE_HEADERS), "Leave");
  XLSX.utils.book_append_sheet(wb, rowsToSheet(dayOffRecordsToRows(), DAYOFF_HEADERS), "Day Off Check");
  XLSX.utils.book_append_sheet(wb, rowsToSheet(messagesToRows(), MESSAGE_HEADERS), "Messages");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(listsToRows()), "Lists");
  return wb;
}

function exportExcel(){
  const wb = buildWorkbook();
  XLSX.writeFile(wb, "contact-book-export.xlsx");
  toast('Exported to Excel');
}
