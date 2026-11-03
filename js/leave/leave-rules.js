/* MODULE: leave/leave-rules
   Leave: counting rules (Denied/Cancelled, month keys, de-duplication, casual quota 24/yr). */

/* ---- Leave Summary: per-employee totals, search, view-details ---- */
let currentLeaveGroups = [];

function leaveDayValue(r){
  // Use the Days column when it's a usable number; otherwise count the record as 1 day/unit
  const n = parseFloat(r.days);
  return (!isNaN(n) && n>0) ? n : 1;
}

function isCancelledLeave(r){ return (r.status||'').toLowerCase().includes('cancel'); }

// Denied / Rejected leaves were never granted — like Cancelled ones they are kept out of the totals,
// the per-type breakdown and the Casual Leave balance, and shown separately instead.
function isDeniedLeave(r){ return /denied|reject/i.test(r.status||''); }

function isNotCountedLeave(r){ return isCancelledLeave(r) || isDeniedLeave(r); }

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Month a leave belongs to = month of its first (start) date. Date Range is free text, so try
// YYYY-MM-DD / YYYY/MM/DD first, then DD-MM-YYYY / DD/MM/YYYY.
function leaveMonthKey(r){
  const dr = r.dateRange||'';
  let m = dr.match(/((?:19|20)\d{2})[\/\-.](\d{1,2})[\/\-.]\d{1,2}/);
  if(m) return m[1]+'-'+String(m[2]).padStart(2,'0');
  m = dr.match(/\d{1,2}[\/\-.](\d{1,2})[\/\-.]((?:19|20)\d{2})/);
  if(m) return m[2]+'-'+String(m[1]).padStart(2,'0');
  return 'unspecified';
}

function leaveMonthLabel(key){
  if(key==='unspecified') return 'Date not specified';
  const [y,mo] = key.split('-');
  return (MONTH_NAMES[parseInt(mo,10)-1]||mo)+' '+y;
}

// Identifies "the same employee" for grouping/dedup purposes — employee code if present, else name.
function leaveEmployeeKey(r){
  return (r.employeeCode && r.employeeCode.trim()) ? ('code:'+r.employeeCode.trim().toLowerCase()) : ('name:'+(r.name||'').trim().toLowerCase());
}

// A record is a duplicate of another if it's the same date range + leave type + days + status
// (this is what the "same leave counted twice" issue looks like — same file/row added more than once,
// or the same period appearing in two uploaded files). employeeCode/name is NOT part of this key
// because dedup only ever runs within one employee's own record list (see leaveSummaryGroups below).
function leaveDupeKey(r){
  return [
    (r.dateRange||'').trim().toLowerCase(),
    (r.leaveType||'').trim().toLowerCase(),
    String(r.days||'').trim().toLowerCase(),
    (r.status||'').trim().toLowerCase()
  ].join('|');
}

function dedupeLeaveRecords(records){
  const seen = new Set();
  const result = [];
  records.forEach(r=>{
    const key = leaveDupeKey(r);
    if(seen.has(key)) return; // exact duplicate for this employee — skip it, count/show once
    seen.add(key);
    result.push(r);
  });
  return result;
}

// Casual Leave annual quota: only the "Casual Leave" type is deducted from this — Gazetted
// Holidays, Medical/Leave, and any other Leave Type never count against it.
const CASUAL_LEAVE_ANNUAL_QUOTA = 24;

function isCasualLeaveType(t){ return (t||'').trim().toLowerCase().includes('casual'); }

// Best-effort year for a leave record: first 4-digit year found in its date range, else in its
// upload date. Records where no year can be determined are grouped under "Unspecified".
function leaveRecordYear(r){
  const m1 = (r.dateRange||'').match(/\b(19|20)\d{2}\b/);
  if(m1) return m1[0];
  const m2 = (r.createdAt||'').match(/\b(19|20)\d{2}\b/);
  if(m2) return m2[0];
  return 'Unspecified';
}

// Per-year Casual Leave usage/balance for one employee's (already deduped, non-cancelled) records.
function casualLeaveBalances(activeRecords){
  const byYear = {};
  activeRecords.forEach(r=>{
    if(!isCasualLeaveType(r.leaveType)) return;
    const y = leaveRecordYear(r);
    byYear[y] = (byYear[y]||0) + leaveDayValue(r);
  });
  return Object.keys(byYear).sort().map(year=>{
    const used = byYear[year];
    const remaining = CASUAL_LEAVE_ANNUAL_QUOTA - used;
    return { year, used, remaining };
  });
}
