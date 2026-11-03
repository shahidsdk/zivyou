# Contact Management System — Rescue 1122 Rahim Yar Khan (modular)

Kholne ke liye sirf `contact-book.html` kholein. Poora folder (css/ aur js/ ke saath) ek hi jagah rehna chahiye
(GitHub Pages par bhi poora folder upload karein).

## Module map  (js/)
| Folder | File | Kaam |
|---|---|---|
| core | state.js | Sara shared data (contacts, events, leaveRecords, dayOffRecords, messages) |
| core | utils.js, ui.js, storage.js, password.js, logo.js | Helpers, toast/dark mode, localStorage, password prompt, logo |
| contacts | contacts-list / -filters / -bulk / contact-detail / contact-form / contact-tools / manage-lists | Contacts ka sab kaam |
| messages | messages.js | Message Format |
| proforma | proforma.js | Leave / Short Leave proforma |
| events | events-ui / emp-combo / events-form / record-search / reports-monthly | Short Leave, Day Off Change, Duty Change, Special Event, Handing Over |
| leave | leave-rules / leave-upload / leave-summary / leave-batches / leave-reports | **Leave section** |
| dayoff | dayoff-upload / -summary / -reports / -batches | Day Off Check |
| data | excel-export / excel-import / file-link / idb / backups / file-sync / cloud-sync | Excel, backup, Google Sheet sync |
| — | init.js | Start-up (hamesha aakhir mein) |

Har `*-markup.js` file us module ke pop-up ka HTML rakhti hai.

## Leave section mein kahan change karein
- Gintee ke rules (Denied/Cancelled, duplicate, casual 24) → `leave/leave-rules.js`
- File upload → `leave-upload.js`
- Employee summary + month-wise detail → `leave-summary.js`
- Uploaded files list / delete → `leave-batches.js`
- Low balance reports → `leave-reports.js`
- Leave ke pop-up ka HTML → `leave-markup.js`

## Naya module / file jodna
1. Nayi `.js` file `js/<module>/` mein banayein.
2. `contact-book.html` ke neeche `<script src="...">` line `init.js` se **pehle** add karein.

## Ek file chahiye?
`python build_single.py` → `contact-book-single.html` (sab kuch ek file mein).
