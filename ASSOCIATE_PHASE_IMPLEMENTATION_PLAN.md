# Associate Phase — Implementation Plan

Companion to [ASSOCIATE_PHASE_GUIDE.md](ASSOCIATE_PHASE_GUIDE.md). That file says *what* and *why*; this one says *how*. **Nothing is coded yet.** Now on its third pass — two external review rounds have been applied; §4, §5, §7 and §13 reflect the second round specifically (a real two-dates bug in the first revision's availability design, the endpoint-count arithmetic, and production safeguards for the scheduled job).

## 1. What already exists, exactly as it stands today

| Thing | State |
|---|---|
| `Skill`, `Certification` (master data) | Entity matches table exactly. No `is_active`/retirement column yet — see §3. |
| `EmployeeSkill` | Entity matches table exactly. DB already enforces `UNIQUE(employee_id, skill_id)` and `CHECK (proficiency_level BETWEEN 1 AND 10)`. Read-only today (candidate search). |
| `EmployeeCertification` | Entity matches table exactly. DB allows `UNIQUE(employee_id, certification_id, obtained_date)` — i.e. **renewal history is already free**: re-adding the same certification with a new `obtained_date` just works, nothing needs to be built for it. No file-related columns exist yet — see §4. |
| `EmployeePreference` | Entity matches table exactly, one row per employee. Read-only today. |
| `EmployeeAvailability` | Entity doesn't match its own table (wrong column names/types) — fix before use, as already identified. |
| `TemporaryUnavailability` | No backing table at all; fully overlaps `EmployeeAvailability`. Delete it. |
| `Employee.phone` | Exists, nullable, never self-editable today — this phase's only basic-profile field (see §2; nothing like a "professional summary" column exists, so that's not something this phase invents). |
| **`Employee.availableFromDate`** | **Exists today, unused by any code.** This is new to this revision — it was missed in the first pass. Its existence is the strongest signal for how availability restoration should actually work; see §5. |
| File upload infrastructure | `spring.servlet.multipart.max-file-size=10MB` and `app.file.upload-dir=uploads` are already configured in `application.properties` — but **zero Java code anywhere uses `MultipartFile`**. Like the pool/bench entities before this phase, it's configured but never finished. Relevant only if §4's open question is answered "yes, build it now." |

Next free migration version: **V47**.

## 2. Basic profile self-edit (new in this revision)

The BRD allows employees to view and edit "permitted" profile information. Checking the actual `Employee` entity against that: the only field that's genuinely personal (not organizational/administrative) is `phone`. Everything else on that row — grade, designation, domain, years of experience, employment/allocation/availability status, RMG assignment — stays Admin-only, same as today. `GET /api/associate/profile` returns the full read-only view (name, designation, department, etc.) plus the one editable field; `PUT` only accepts `phone`.

## 3. Catalog retirement instead of hard delete (updated)

Both `skills` and `certifications` get a new `is_active BOOLEAN NOT NULL DEFAULT TRUE` column (migration, §7). "Delete" in the catalog controllers becomes "set `is_active = false`." Catalog list endpoints (`GET /api/admin/skills`, `/certifications`, and the read-only browse ones employees use when picking a skill) filter to `is_active = true` by default. Existing `employee_skills`/`employee_certifications` rows are completely unaffected either way — they reference the catalog row by ID regardless of its active flag, so history and search keep working. This is a strict improvement on the original "no delete at all" plan, same cost.

## 4. Certification document upload — ready to build, gated on one infrastructure fact

**This is the one item in this plan that's a genuine product decision, not a correction.** The BRD requires certification info to be visible to authorized teams; it does not require a file upload. Recommendation: build it — but only you can confirm the one thing that decides whether it's safe to: **does the deployment target have persistent, backed-up file storage?** `app.file.upload-dir=uploads` is already configured, but that's a local directory; if the deployment target is a container that gets rebuilt/redeployed without a mounted persistent volume, every file in it disappears on the next deploy while the database still points at them. That's an infrastructure fact, not something readable from the code, so it's an open question (§13), not a design flaw.

**If deferred**: certifications ship exactly as in the first draft (name, obtained date, expiry date, derived validity) — 1 fewer endpoint (no document GET; add/update still exist, just without a file field).

**Catalog vs. employee record — fixed, this was wrong before.** The catalog (`certifications` table: `certification_name`, `issuing_organization`, `description`, `valid_years`) already owns the name, issuer, and generic description. `employee_certifications` is a foreign key to one specific catalog row — an employee never re-enters a name, issuer, or description, because it's already sitting on the row they picked. The earlier draft invented a `certificate_title` and a second `description` directly on the employee record, which would have just duplicated the catalog's own fields with no way to keep them in sync. Dropped entirely. The employee record only ever needs what's genuinely per-employee: which catalog certification, when they got it, when it expires, and (if built) their own uploaded evidence file. If an employee has a certification that isn't in the catalog yet, the fix is adding it to the catalog first (Admin, or request Admin add it) — not inventing a free-text escape hatch on the employee record that duplicates catalog data.

**If built now**, confirmed rules:
- `certificationId` (must already exist in the catalog), `obtainedDate`: required. `expiryDate`: optional.
- **The file itself is optional on creation** — a certification record without supporting evidence is still valid (the BRD doesn't mandate evidence). Flag if you want the file mandatory instead.
- Update without a new file keeps the existing one; providing a new file replaces it.
- Deleting the record safely removes its file, subject to the sequencing below.
- **Admin can always view/download the document (read-only)**, independent of whatever §6 decides about Admin editing skills/certs/preferences on an employee's behalf — this is Admin's existing broad read access to employee records, not a new write capability, so it doesn't need to wait on that decision.

Technical design:
- New columns on `employee_certifications`: **only** `file_name VARCHAR(255)`, `storage_key VARCHAR(500)`, `content_type VARCHAR(100)`, `file_size BIGINT` — all nullable, since the file is optional. No title/description columns, for the reason above.
- Storage: local disk under `app.file.upload-dir`, keyed by a server-generated UUID filename (never the client's filename or path) — nothing in the request is ever trusted as a path.
- `POST`/`PUT` are `multipart/form-data`: JSON fields + an optional file part. Allowed types: PDF, PNG, JPEG only, enforced by content-type sniffing (not just the filename extension) and the existing 10MB request-size cap.
- Replace-on-update: write the new file to disk first, update the DB row to point at the new `storage_key`, and only then delete the old file — never the other way round, so a failure mid-replace can't leave the record pointing at nothing.
- `GET .../document` streams the file back with ownership re-checked on every call (same employee, or Admin) — never a public/static URL.
- Delete: remove the DB row first, then the file — a failed file cleanup leaves an orphaned file on disk (harmless, cleanable later) rather than a DB row pointing at nothing.
- `isValid` stays server-derived, exactly as before; the file has no bearing on it. No separate "document verified" workflow — correctly called out as unnecessary BRD scope.

## 5. Availability restoration — resolved, and a real bug in the first revision caught and fixed

The first draft had the employee manually mark themselves available again, specifically to avoid a scheduled job. On review, that was overcomplicating it in the wrong direction: `Employee.availableFromDate` already exists for exactly this, unused, which means the schema was designed for date-driven restoration from the start. That part stands.

**What the second revision got wrong**: it used a single `availableFrom` parameter and treated it as the return date, with no explicit decision about whether a *future unavailability start date* was also in scope. Left unresolved, that's a real bug: if an employee could request unavailability starting next month and RMG approved it today, the service as drafted would make them unavailable **immediately**, not next month.

**Fix: future-dated starts are explicitly out of scope, not half-supported.** The request carries exactly one date — the *expected return date* — and nothing else. Approval takes effect immediately, the day RMG approves it. There's no separate "activation" scheduled job because there's nothing to activate later; the only date that matters going forward is when to restore them, and that's the one `Employee.availableFromDate` already exists for.

**Final design**:
- `requestUnavailability(expectedReturnDate, reason)` — employee submits. Row inserted (`available_from` column holds `expectedReturnDate`), `verificationStatus = PENDING`.
- RMG `approve()` — effective immediately: `Employee.availabilityStatus = UNAVAILABLE`, `Employee.availableFromDate = expectedReturnDate`, pool exit if currently pooled, bench `pause_started_at` stamped if currently benched (needs the new column from §7).
- RMG `reject(reason)` — `verificationStatus = REJECTED`, nothing else changes.
- **A daily scheduled job** (`@Scheduled`, once at midnight, explicit `zone = "Asia/Kolkata"` rather than relying on the JVM default — matching the timezone the seed data's locations already use) finds every employee where `availabilityStatus = UNAVAILABLE AND availableFromDate <= today` and restores them: `availabilityStatus = AVAILABLE`, `availableFromDate = null`, bench resume (adds elapsed paused days, clears `pause_started_at`), pool re-entry via the existing `resourcePoolService.enterIfEligible(...)`.
- An explicit `returnEarly()` self-service endpoint runs the exact same restoration logic immediately, for anyone who comes back before their stated date — shares one private `restore(employee)` method with the scheduled job so there's only one place this logic lives.

This is the first `@Scheduled` job in the codebase (RMG phase deliberately avoided one for bench *colour*, which is a pure read-time classification with no side effects — restoring someone's availability status is a real state transition with side effects, which shouldn't happen as a side effect of an unrelated `GET`, so a small daily job is the right tool here, not a contradiction of the earlier "keep it simple" call). Production-level safeguards for it, specifically:
- **Idempotency is structural, not bolted on**: the job's query selects on `availabilityStatus = UNAVAILABLE`, and restoring someone is exactly what flips that to `AVAILABLE` — so a restored employee is automatically excluded from every later run's query. No separate "already processed today" flag is needed, and running the job twice in the same day (e.g. after a restart) is harmless by construction.
- **Each employee restored in their own transaction** (`EmployeeAvailabilityService.restore(employee)` is `@Transactional` per call, looped from the job, not one transaction wrapping the whole batch) — matching the pattern `ClosureService`/`EmployeeExitService` already use for cascades, so one bad row can't roll back everyone else's restoration that day.
- **Missed runs self-heal**: because the query is state-based rather than "did midnight fire," an app outage over midnight just means whoever was due gets picked up on the next run, whenever that is — no catch-up logic needed.
- **Stated policy for the gap between due-date and job-run**: an employee whose return date has passed but whom the job hasn't processed yet is still `UNAVAILABLE` as far as the system is concerned — not silently treated as available by any other code path. This is a deliberate trade-off (a bounded, at-most-one-day lag) in exchange for not having any endpoint's `GET` silently perform a write, which is the exact design this section already rejected once (the "compute on read" option from the first draft).
- **A real gap found by checking it against the already-shipped Employee Exit cascade**: `EmployeeExitService` (built and committed in the Admin/Manager phase, before any of this existed) sets `employmentStatus = INACTIVE` and `availabilityStatus = UNAVAILABLE` when someone leaves the company, but it never touches `availableFromDate`. So an employee who had an approved return date pending, then exited the company before that date arrived, would be sitting with a stale `availableFromDate` that's eventually `<= today` — exactly what the restoration job's query matches. Without a guard, the job would flip an exited employee's `availabilityStatus` back to `AVAILABLE`, which is wrong regardless of whether they actually re-enter the pool (the existing `enterIfEligible` eligibility check would correctly block *that* part, since it separately requires `employmentStatus = ACTIVE` — but the `availabilityStatus` field itself would still be incorrectly overwritten before that check ever runs).

  One fix, cleanly, not two contradictory ones — an earlier version of this section said the job's query would exclude inactive employees *and* that the job would clear their stale date "anyway," which can't both be true: a query that filters a row out can't also act on that row in the same pass. Corrected to the simpler, sufficient approach:
  - **At the source only**: `EmployeeExitService.processExit` gets one line added — `employee.setAvailableFromDate(null)` — so a stale return date can't outlive the employee's exit. This is a small edit to already-shipped code, not new-phase scope creep; it's the actual bug, and the restoration job just happens to be what exposes it.
  - **The job's query is scoped to `employmentStatus = 'ACTIVE' AND availabilityStatus = 'UNAVAILABLE' AND availableFromDate <= today`** — the active-only filter is defense in depth (it means a future code path that forgets this same precaution still can't cause harm), not a cleanup mechanism. It doesn't need to also clear anything, because there's no pre-existing stale data for it to clean up: `availableFromDate` has never been written by any shipped code until this phase exists, so the exit-cascade fix above prevents the stale state from ever being created in the first place, with nothing left over to sweep up after the fact. If that assumption ever stops holding — e.g. a future bulk-import script writes the column directly — a *separate*, explicitly-named cleanup query would be the right tool then, not folded into this job's normal run.
  - `allocationStatus` doesn't need its own separate guard here: `AllocationApprovalService.approve()` already refuses to allocate anyone whose `availabilityStatus` isn't `AVAILABLE`, so there's no existing path that produces an `UNAVAILABLE` employee who's also `ALLOCATED` — the employment-status guard above is the one that actually corresponds to a real, reachable bug.
  - Test cases this needs, specifically: an employee who exits while a return date is still pending (the exit cascade must clear it immediately, so the job never even sees a stale row for them — not flip them available, and not need to clean anything up later); an employee who exits *and is later reactivated* by Admin before their old return date would have arrived (confirms the one-line fix didn't accidentally break legitimate reactivation — `reactivateEmployee` is a separate, unrelated code path and isn't changed by this); and the normal case, an active employee whose return date arrives, to confirm the guard doesn't false-positive and block people who should be restored.

## 6. Access control — one clarification on the review's table

The review's access table lists "Manager/RMG: No by default" for managing skills/certifications/preferences. Read literally that would block a Manager or RMG from managing their *own* profile, which can't be right — every person in this system is an `Employee` first, regardless of what role they also hold. The correct rule, unchanged from the first draft: self-service permissions are granted to **all four roles** and every endpoint operates on the caller's own record only, resolved from the JWT — there's no path parameter and no way to target anyone else. What the review's "No by default" correctly rules out is a Manager/RMG reaching into *another* employee's profile, which was never part of this plan and still isn't.

Admin-on-behalf editing (the review's suggestion to let Admin make "authorized corrections" with an audit trail) stays an open question — see the guide's open question #2. If yes: reuse the same services with an `actingAs` parameter, audit every such change with the Admin as actor, and self-service behavior for the employee is otherwise unaffected.

## 7. Migrations

Numbers below assume **V47 is still the next free version** — that was true as of the RMG phase commit (`feature/rmg`, which added V45/V46), but this plan doesn't re-verify it at the moment of writing this sentence. **Before creating any migration file, re-run `ls backend/src/main/resources/db/migration | sort -V | tail -5` (or equivalent) against the actual branch you're building on** — don't trust a number written days earlier in a planning doc, the same way earlier phases double-checked `flyway_schema_history` rather than assuming.

| Version | Purpose |
|---|---|
| V47 | `ALTER TABLE bench_history ADD COLUMN pause_started_at TIMESTAMP` |
| V48 | `ALTER TABLE skills ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`; same for `certifications` |
| V49 | *(only if §4 is built now)* `ALTER TABLE employee_certifications ADD COLUMN file_name, storage_key, content_type, file_size` — the four file columns only, per §4's corrected data model (no `certificate_title`/`description`, those stayed in the first draft by mistake and were never actually removed from this table until now) |
| V50 | Seed permissions: `EMPLOYEE_PROFILE_UPDATE`, `EMPLOYEE_SKILL_MANAGE`, `EMPLOYEE_CERTIFICATION_MANAGE`, `EMPLOYEE_PREFERENCE_MANAGE`, `EMPLOYEE_AVAILABILITY_REQUEST`, `EMPLOYEE_AVAILABILITY_VERIFY`, `SKILL_CATALOG_READ`, `SKILL_CATALOG_MANAGE`, `CERTIFICATION_CATALOG_READ`, `CERTIFICATION_CATALOG_MANAGE` |
| V51 | Grant: the six self-service permissions + both catalog `_READ` permissions to all four roles; `EMPLOYEE_AVAILABILITY_VERIFY` to RMG + Admin; both catalog `_MANAGE` permissions to Admin only |

(Numbers shift down by one from V49 onward if §4 is deferred, since V49 drops out entirely rather than staying reserved.)

## 8. New repositories

`EmployeeSkillRepository`, `EmployeeCertificationRepository`, `EmployeePreferenceRepository`, `EmployeeAvailabilityRepository`, `SkillRepository`, `CertificationRepository`. `EmployeeAvailabilityRepository` needs a `findByAvailabilityRestorePending()`-style query backing the scheduled job (`Employee` rows where `availabilityStatus = 'UNAVAILABLE' AND availableFromDate <= CURRENT_DATE` — this one actually lives on `EmployeeRepository`, since it queries `Employee` directly, not the history table) and the RMG pending-queue lookup, scoped with the same "own associates + unassigned" rule used throughout the RMG phase.

## 9. New services

- **`EmployeeProfileService`** — `getMine()`, `updateMine(phone)`.
- **`EmployeeSkillService`** — `listMine()`, `addMine(...)`, `updateMine(id, ...)`, `removeMine(id)`. DB's own unique-constraint violation surfaces as `DuplicateEntityException`.
- **`EmployeeCertificationService`** — same CRUD shape; `isValid` always derived. If §4 is built: handles the multipart file alongside the JSON fields, owns the replace-then-cleanup sequencing described there.
- **`EmployeePreferenceService`** — `getMine()` (creates an empty row on first access), `updateMine(...)` (any field settable back to `null` to clear it).
- **`EmployeeAvailabilityService`** — `requestUnavailability(...)`, `approve(id)`, `reject(id, reason)`, `returnEarly()`, `listPendingForMyAssociates()`, plus the private `restore(employee)` shared with:
- **`AvailabilityRestorationJob`** — `@Scheduled` daily, calls `EmployeeAvailabilityService.restore(...)` for every employee the repository query above finds.
- **`SkillCatalogService` / `CertificationCatalogService`** — `list(activeOnly)`, `create`, `update`, `retire` (sets `is_active = false`; no hard delete).

## 10. Controllers (endpoint count depends on §4's answer — see the guide)

- `AssociateProfileController` (`/api/associate/profile`, `/skills`, `/certifications`, `/preferences`, `/availability`) — every endpoint resolves the caller from `RequirementAccessGuard.currentEmployee()`; no `{employeeId}` path parameter anywhere in this controller, by construction, so there's no cross-employee access to accidentally allow.
- `RmgAvailabilityVerificationController` (`/api/rmg/availability-requests`) — mirrors `AllocationRequestController`'s shape (pending list, approve, reject).
- `AdminSkillCatalogController` (`/api/admin/skills`), `AdminCertificationCatalogController` (`/api/admin/certifications`) — includes the retire action.

## 11. Audit coverage (updated — broadened per review)

Every write path above gets an `auditLogService.logAction(...)` call, same as every other phase — skill add/update/remove, certification add/update/file-replace/remove, preference update, catalog create/update/retire, and all three availability decisions (request, approve, reject) plus both restoration paths (scheduled and early-return). This was under-specified in the first draft; it's not new work, just making sure every service method above actually includes the call when it's written.

## 12. Verification plan

Same discipline as every phase so far: `mvn compile` after each batch; build and test on a disposable scratch database; curl/Postman pass as an Associate, an RMG, and Admin. Specifically covering: duplicate-skill 409, expired-certification `isValid`, the full availability loop including both the scheduled restoration path (fast-forward by backdating `availableFromDate` in the test DB rather than waiting a real day) and the early-return path, catalog retirement hiding an entry from new selections while existing employee records keep displaying it, and — if §4 is built — upload/replace/delete file-safety cases (oversized file rejected, wrong content-type rejected, replace failure doesn't orphan the DB row).

## 13. Open questions (down to the two things only you can answer — see the guide for full wording)

1. **Does the deployment target have persistent, backed-up file storage?** This is the only real gate on §4 (certification upload) — it's an infrastructure fact, not a design choice, so it can't be resolved by more planning. Yes → build upload now, with the field rules confirmed in §4. No / not sure → defer it, ship everything else, add it later once storage is sorted out.
2. Allow Admin to edit an employee's profile/skills/certifications/preferences directly, with audit (§6)? (Independent of this: Admin can always *read* a certificate document either way, per §4.)

Everything else raised across both review rounds is already resolved and folded into this revision: the availability-restoration mechanism (§5, including the two-dates bug the second review round caught), catalog retirement, basic-profile scope, audit coverage, the endpoint-count arithmetic (corrected in the guide to 28 built / 27 deferred — both earlier counts were slips, not real disagreements about scope), the migration-baseline re-check (§7), and the scheduler's production safeguards (§5: idempotency, per-employee transactions, explicit timezone, missed-run behavior, and the stated policy for the gap between a due date and the job actually running). Nice-to-haves flagged as beyond the BRD in the first review round (profile completeness %, expiry reminders, document verification workflow) are still deliberately out of this phase.
