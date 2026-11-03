/* MODULE: core/storage
   localStorage save/load + first-run sample data. */

const LOCAL_KEY = 'cmsRescue1122ContactBook_v1';

function saveLocal(){
  try{
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ contacts, nextId, events, nextEventId, leaveRecords, nextLeaveRecId, dayOffRecords, nextDayOffRecId, messages, nextMessageId, managedLists }));
  } catch(err){ console.error('Local save failed', err); }
}

function loadLocal(){
  try{
    const raw = localStorage.getItem(LOCAL_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    contacts = data.contacts || [];
    nextId = data.nextId || (contacts.reduce((m,c)=>Math.max(m,c.id||0),0)+1);
    events = data.events || [];
    nextEventId = data.nextEventId || (events.reduce((m,e)=>Math.max(m,e.id||0),0)+1);
    leaveRecords = data.leaveRecords || [];
    nextLeaveRecId = data.nextLeaveRecId || (leaveRecords.reduce((m,r)=>Math.max(m,r.id||0),0)+1);
    dayOffRecords = data.dayOffRecords || [];
    nextDayOffRecId = data.nextDayOffRecId || (dayOffRecords.reduce((m,r)=>Math.max(m,r.id||0),0)+1);
    messages = data.messages || [];
    nextMessageId = data.nextMessageId || (messages.reduce((m,r)=>Math.max(m,r.id||0),0)+1);
    managedLists = data.managedLists || {department:[],designation:[],tehsil:[]};
    return true;
  } catch(err){ console.error('Local load failed', err); return false; }
}

/* Call after every add/edit/delete so nothing is lost on refresh, and also push to the linked Excel file if one is linked */
function persistAll(){
  saveLocal();
  autoSaveToLinkedFile();
  saveToCloud();
}

function seedSampleData(){
  const now = Date.now();
  contacts = [
    {id:nextId++, firstName:"Muhammad", lastName:"Shahi", employeeCode:"", designation:"Assistant Director", department:"Dispatch Wing", group:"Dispatch Wing", bloodGroup:"B+ve", tehsil:"Rahim Yar Khan", address:"", officeAddress:"", birthday:"", notes:"", numbers:[{type:"Mobile", value:"0300-1234567"}], createdAt:now, updatedAt:now},
    {id:nextId++, firstName:"Ayesha", lastName:"Khan", employeeCode:"", designation:"EOC Operator", department:"EOC Staff", group:"EOC Staff", bloodGroup:"O+ve", tehsil:"Khanpur", address:"", officeAddress:"", birthday:"", notes:"", numbers:[{type:"Mobile", value:"0333-7654321"}], createdAt:now, updatedAt:now},
    {id:nextId++, firstName:"Bilal", lastName:"Ahmed", employeeCode:"", designation:"Field Officer", department:"Field Operations", group:"Field Officers", bloodGroup:"A+ve", tehsil:"Sadiqabad", address:"", officeAddress:"", birthday:"", notes:"", numbers:[{type:"Mobile", value:"0321-9988776"}], createdAt:now, updatedAt:now}
  ];
  managedLists.department = uniqueVals(contacts,'department');
  managedLists.designation = uniqueVals(contacts,'designation');
  managedLists.tehsil = uniqueVals(contacts,'tehsil');
}
