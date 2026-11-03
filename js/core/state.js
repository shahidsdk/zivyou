/* MODULE: core/state
   Shared data arrays, counters and constants (contacts, events, leaveRecords, dayOffRecords, messages …). */

let contacts = [];

let showAllContacts = false;

let selectedContactIds = new Set();

let nextId = 1;

let activeBlood = null;

let activeGroup = null;

let linkedHandle = null;

let linkedLastMod = null;

let pollTimer = null;

/* Google Sheet cloud sync (works on any device/browser, unlike the local-file sync above) */
/* Baked-in default so every visitor auto-connects with no manual setup. A URL saved via the
   Connect button (localStorage) still overrides this if you ever need to point at a different Sheet. */
const DEFAULT_CLOUD_SYNC_URL = 'https://script.google.com/macros/s/AKfycbya_gLg4AizKiCJw8XcxFjwKKLGsuwg0VKjIWh-ICYEjdFDfJsaGjLbrS8lN9PNOynV_Q/exec';

let cloudSyncUrl = localStorage.getItem('crbCloudSyncUrl') || DEFAULT_CLOUD_SYNC_URL;

let cloudPin = localStorage.getItem('crbPin') || '';

let cloudLastUpdated = null;

let cloudPollTimer = null;

let cloudSyncBusy = false;

let importRawRows = null; // parsed rows from file for mapping step

let importHeaders = [];

/* Managed lists (Department / Designation / Tehsil) - editable via the gear drawer */
let managedLists = { department:[], designation:[], tehsil:[] };

let manageActiveTab = 'department';

/* Duty / Leave events log */
let events = [];

let nextEventId = 1;

/* Leave records — bulk-uploaded from a monthly file, kept in their own schema (not the generic event schema) */
let leaveRecords = [];

let nextLeaveRecId = 1;

let nextLeaveBatchId = 1;

/* Day Off Check records — bulk-uploaded monthly attendance-grid files, one row per employee per month */
let dayOffRecords = [];

let nextDayOffRecId = 1;

let nextDayOffBatchId = 1;

let messages = [];

let nextMessageId = 1;

const LEAVE_HEADERS = ["Name","Employee ID","Designation","Station","District","Leave Type","Date Range","Days","Remarks","Created At","Status","Source File","Uploaded At","Hidden"];

const DAYOFF_HEADERS = ["Name","Employee Code","Station","Month","Month Key","Off Days","Total Days","Source File","Uploaded At","Hidden"];

const MESSAGE_HEADERS = ["Title","Message","Logged At","Hidden"];

const EVENT_TYPES = [
  {key:"Short Leave", color:"#FF9F1C", needsTime:true,  noteLabel:"Note (optional)", noteRequired:false, needsCode:true, sameDayOnly:true, monthlyLimit:2, noDuplicateSameDay:true, searchable:true, hasProforma:"short"},
  {key:"Leave",        color:"#E0374B", bulkUpload:true},
  {key:"Day Off Check", color:"#6D4C41", bulkUpload:"dayoff"},
  {key:"Day Off Change", color:"#3B7DED", needsTime:false, noteLabel:"Note (optional)", noteRequired:false, needsCode:true, needsCode2:true, code2Label:"Employee Code (day off exchanged with) *", monthlyLimit:2, noDuplicateSameDay:true, searchable:true},
  {key:"Duty Change",  color:"#8E2DE2", needsTime:false, noteLabel:"Note (optional)", noteRequired:false, needsCode:true, needsCode2:true, code2Label:"Employee Code (duty exchanged with) *", monthlyLimit:2, noDuplicateSameDay:true, searchable:true},
  {key:"Special Event", color:"#17A2B8", needsTime:false, noteLabel:"Event details *", noteRequired:true, noEmployee:true},
  {key:"Handing Over Taking Over", color:"#F72585", needsTime:false, noteLabel:"Handing over / taking over details *", noteRequired:true, noEmployee:true,
    sameDayOnly:true,
    sameDayHint:"Can only be logged for today. It stays visible for the rest of today and disappears automatically once the date changes."},
  {key:"Message Format", color:"#00B8A9", messagesFeature:true}
];

/* Ticker (top marquee) only shows these types — Short Leave / Leave / Day Off Change / Duty Change
   are shown on-screen (event tiles + Recent Events panel) instead, not in the marquee. */
const TICKER_TYPES = ["Special Event", "Handing Over Taking Over"];

let activeEventType = null;

let dateTimeOverride = false; // true once the correct password has been entered to unlock a previous date/time for the record currently being added

let monthlyLimitOverride = false; // true once the correct password has been entered to allow exceeding the monthly limit for the record currently being added
