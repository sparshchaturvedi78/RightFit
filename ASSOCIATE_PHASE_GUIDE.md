# Associate Phase — Employee Self-Service Profile

Status: **PLANNING ONLY — nothing built yet.** Revised after a second review pass; changes from the first draft are marked **(updated)**.

## Where things stand today

An Associate (any employee, really — this isn't role-specific) currently has no way to manage their own profile at all. The system already stores skills, certifications, preferences, and availability — but right now those are only ever *read* by a Manager or RMG searching for candidates. Nobody — not the employee, not an Admin — has ever been given a way to actually add or edit any of it. It's all empty shelves.

There's also a specific, already-known gap worth calling out: when someone needs to go temporarily unavailable (medical leave, personal reasons, whatever), there is currently **no way to record that at all**. The field that's supposed to flip to "unavailable" never gets touched by any code today. There's actually a second, related dead field too: `Employee.availableFromDate` — a column that already exists for recording "available again from this date" — also never gets touched by anything. That turns out to matter for how availability restoration should work (below).

## What this plan adds

Five self-service areas, all scoped to "my own profile" — there's no way for one employee to edit another's data through these endpoints, by design:

**Basic profile (updated — new)** — an employee can see their own record and edit the handful of fields that are genuinely personal (just `phone`, since that's the only such field that actually exists in the data model today — things like designation, grade, employment status, and RMG assignment stay Admin-only, as they're organizational facts about the employee, not personal ones).

**Skills** — add a skill from the catalog with a proficiency level (1–10) and years of experience, update it later, or remove it. Removing a skill never touches the shared catalog entry — just the employee's own link to it.

**Certifications (updated twice now — this one had a modeling mistake, now fixed)** — pick a certification from the shared catalog (name, issuing organization and a generic description all come from the catalog entry you pick — you don't re-type any of that), then record the date you obtained it and (optionally) an expiry date. Whether it's still valid is worked out automatically from the expiry date, not something you set yourself. **New**: certifications can also carry an uploaded certificate file (PDF or image) — upload it when adding or updating, preview/download it, and replace it later without losing the record. This wasn't in the BRD explicitly, so it's flagged as an extension, not a requirement — see the open question below before we build it.

**Preferences** — one simple profile: preferred technology, domain, location, work mode, project type. Get-and-update, with the ability to clear a preference back to "no preference."

**Availability (updated twice now — both the restoration mechanism and the dates changed)** — an employee requests "I expect to be unavailable until Y, because Z." **Only one date, the expected return date** — the first revision of this guide implied a separate future start date too ("starting X"), but nothing in this plan actually stores or activates a future start, so that wording was misleading and has been dropped. Approval takes effect immediately, the day RMG approves it, not on some later scheduled date; if you need to request leave that starts next month, request it closer to the time. An RMG person (their own RMG, specifically) approves or rejects the request. Only on approval does the employee's status actually flip to unavailable — at which point, automatically, not as a separate step: if they were sitting in the Resource Pool, they're pulled out, and if they were on the bench, their bench-aging clock pauses (see the RMG phase guide).

Coming back is where the first draft had the wrong idea. Originally this plan had the employee manually click "I'm back." On a second look, there's a column already sitting in the `employees` table for exactly this (`available_from_date`, currently unused by any code) — which is a strong signal the system was meant to restore people automatically once that date arrives, not wait for them to self-report. So: a scheduled daily check restores anyone whose approved return date has passed — status back to available, bench clock resumes, pool re-entry — with no action needed from the employee. An explicit "I'm back early" action still exists for the case where someone returns before their stated date.

Two small catalog-management areas are also needed, because right now there's no way to add a new skill or certification to the list employees pick from — that's Admin-only, since it's shared reference data, not personal data. **Updated**: retiring an unused skill or certification is now a status flip (hidden from new selections, but every employee record that already references it keeps working and keeps showing up in history/search), not a true delete.

## What's deliberately **not** in this phase

Raised in review, genuinely useful, but kept out to avoid scope creep beyond what the BRD actually asks for right now: profile-completeness indicators, certification-expiry reminder notifications, and dedicated renewal-history tracking (the last one is actually already free — the certifications table already allows the same certification to be re-added with a different obtained date, so renewal history falls out of the existing schema without extra work; nobody has to build anything for it).

## Endpoints

### Basic profile

| Who | Action | Endpoint |
|---|---|---|
| Any employee | See my own profile | `GET` my profile |
| Any employee | Update my phone number | `PUT` update my profile |

### Skills

| Who | Action | Endpoint |
|---|---|---|
| Any employee | See my skills | `GET` my skills |
| Any employee | Add a skill | `POST` add skill |
| Any employee | Update a skill (proficiency, experience, last used) | `PUT` update skill |
| Any employee | Remove a skill | `DELETE` remove skill |

### Certifications

| Who | Action | Endpoint |
|---|---|---|
| Any employee | See my certifications | `GET` my certifications |
| Any employee | Add a certification (with file upload) | `POST` add certification |
| Any employee | Update a certification (optionally replace the file) | `PUT` update certification |
| Any employee | Preview/download my certificate file | `GET` certification document |
| Any employee | Remove a certification | `DELETE` remove certification |

### Preferences

| Who | Action | Endpoint |
|---|---|---|
| Any employee | See my preferences | `GET` my preferences |
| Any employee | Update my preferences | `PUT` update preferences |

### Availability

| Who | Action | Endpoint |
|---|---|---|
| Any employee | See my current availability and history | `GET` my availability |
| Any employee | Request temporary unavailability, with a reason and the expected return date | `POST` request unavailability |
| Any employee | Withdraw a request that's still pending | `POST` cancel my pending request |
| Any employee | Return early, before the approved date | `POST` return early |

### RMG verification (acting on someone else's request)

| Who | Action | Endpoint |
|---|---|---|
| RMG | See pending unavailability requests for my associates | `GET` pending availability requests |
| RMG | Approve a request (employee becomes unavailable, leaves pool if they were in it) | `PUT` approve request |
| RMG | Reject a request, with a reason | `PUT` reject request |

### Catalog management (shared reference data)

| Who | Action | Endpoint |
|---|---|---|
| Any employee | Browse the active skill list (to pick one when adding a skill) | `GET` list skills |
| Admin | Add a new skill to the catalog | `POST` create skill |
| Admin | Fix/update a skill's name or description | `PUT` update skill |
| Admin | Retire a skill (hide it from new selections, keep history) | `PUT` retire skill |
| Any employee | Browse the active certification list | `GET` list certifications |
| Admin | Add a new certification to the catalog | `POST` create certification |
| Admin | Fix/update a certification's details | `PUT` update certification |
| Admin | Retire a certification | `PUT` retire certification |

**28 new endpoints** — counted directly from the tables above (28 rows total: 2 basic profile + 4 skills + 5 certifications + 2 preferences + 4 availability + 3 RMG verification + 8 catalog). Earlier drafts said 27 and then 26; both were arithmetic slips, not table edits — the tables above are the source of truth. **If certification upload is deferred, it's 27** — only the document-preview endpoint drops; add/update certification still exist either way, just without a file field.

## Open questions for you to confirm before we build

1. **Certification document upload.** The BRD requires certification info to be *visible*; it doesn't require file upload/storage, so this is a product call, not a compliance gap. Recommendation: build it, **conditional on one thing only you can confirm** — does the deployment target have *persistent, backed-up* file storage? The app already has a local-disk upload directory configured, but a plain local directory on a container that gets redeployed would leave database records pointing at files that no longer exist. If persistent storage is confirmed, we build it with these rules: certificate title and issuing organization required, description and expiry optional, **the file itself is optional on creation** (a certification record without supporting evidence is still a valid record — the BRD doesn't mandate evidence, say so if you want it mandatory instead), updating without a new file keeps the existing one, and deleting the record safely removes its file. If storage isn't confirmed persistent, we defer the file and ship everything else.
2. **Should Admin be able to edit an employee's skills/certifications/preferences directly, on their behalf?** Not settled by the BRD either way. If yes, every record changed that way gets an audit entry naming the Admin as actor; the normal self-service path is unaffected either way. Independent of this answer: **Admin can always view/download a certificate document** (read-only), the same way Admin already has broad read access to employee records elsewhere in this system — that part isn't contingent on the on-behalf-edit decision.
3. If RMG rejects an unavailability request, should the employee get an in-app notification, same as other reject flows elsewhere in the system?
