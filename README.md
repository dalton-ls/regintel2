# RegIntel

Regulatory Intelligence research tool. Self-contained, browser-only, JSON-driven. No server required.

## Running locally

Open `index.html` directly in a browser. No build step, no server.

```bash
# macOS / Linux
open index.html

# Or serve locally if you hit CORS issues with file:// protocol
npx serve .
# then visit http://localhost:3000
```

## Usage

### 1. Import data

Go to **Data → Import JSON** in the sidebar. Drop a JSON file (array) or JSONL file (one object per line) parsed from your OpenLaws source.

```json
[
  {
    "record_id": "FED-CFR-483.95-01",
    "jurisdiction": "Federal",
    "hstm_setting": "SNF",
    "hstm_role": ["Nurse Aide (CNA)"],
    "citation": "42 CFR § 483.95(g)(1)",
    "training_topic": "Abuse, neglect, and exploitation",
    "topic_tag": "staff_abuse_prevention",
    "hours_required": "NR",
    "frequency": "Ongoing",
    "source_url": "https://ecfr.gov/...",
    "source_record": { "current_as_of": "2026-01-27", ... },
    ...
  }
]
```

Start with the **Federal baseline** (`sample-data/fed-snf-sample.json`) — it sets the denominator for all state coverage percentages.

### 2. Add state data

Import additional JSON files for each state × care setting combination. Each import merges into the existing dataset. Researcher notes are never overwritten.

### 3. Check coverage

The **Coverage** screen shows a heatmap of all imported data:
- Rows = jurisdictions (Federal + states)
- Columns = care settings
- Color = coverage strength (lighter = fewer rows, darker = more rows)

**Coverage % formula:** `state rows ÷ federal rows for same setting`

### 4. Review updates

After re-importing a refreshed JSON file, go to **Data → Updates** to review conflicts (changed field values) and stale rows (source not confirmed in 6+ months).

---

## File structure

```
index.html              Main app entry
src/
  store.js              localStorage data layer (vanilla JS)
  icons.jsx             Icon set (React)
  pages/
    coverage.jsx        Coverage dashboard
    workspace.jsx       Jurisdiction tree + requirement rows
    import.jsx          JSON file upload + diff review
    updates.jsx         Conflict and stale row review
    compare.jsx         Cross-jurisdiction comparison matrix
    drawer.jsx          Requirement detail (slide-out panel)
    roles.jsx           Role-first view
    jobstudy.jsx        New-hire requirement bundle
    gaps.jsx            Missing, stale, conflict gap analysis
fonts/
  GreycliffCF-*.woff2   HealthStream Greycliff CF font files
sample-data/
  fed-snf-sample.json   Federal SNF baseline (6 rows — use to test import)
schema/
  schema.json           JSON Schema (Draft 2020-12) for validation
```

---

## JSON schema

See `schema/schema.json` for the full JSON Schema spec. Required fields for a valid import:

| Field | Description |
|---|---|
| `record_id` | Stable identifier. Format: `[JUR]-[LAW]-[SECTION]-[IDX]` |
| `jurisdiction` | `"Federal"` or full state name (e.g. `"California"`) |
| `hstm_setting` | Care setting from controlled vocabulary (e.g. `"SNF"`) |
| `citation` | Full regulatory citation |
| `training_topic` | Exact statutory language |
| `source_url` | Direct link to primary source |
| `source_record` | Object with `current_as_of` (date) and `openlaws_path` |
| `extraction_metadata` | Object with `parsed_by`, `parsed_at`, `source_file`, `review_status` |

### Key optional fields

| Field | Description |
|---|---|
| `hstm_role` | Array of HealthStream role labels |
| `topic_tag` | Normalized cross-state comparison key (see `schema/topic-tags.md`) |
| `hours_required` | Hours as string, or `"NR"` if not specified |
| `frequency` | `"One-time"`, `"Annual"`, `"Ongoing"`, etc. |
| `effective_date` | ISO date if requirement is not yet in force |
| `parent_record_id` | Links child rows to their parent |

---

## Data persistence

All data is stored in `localStorage` under the key `regintel_v1_rows`. Researcher notes are stored separately under `regintel_v1_notes` and survive re-imports.

**Capacity:** localStorage is typically capped at 5–10 MB per origin. At ~1 KB per row, this supports 5,000–10,000 rows. For larger datasets, a future version may move to IndexedDB.

**Clearing data:** Open browser DevTools → Application → Local Storage → delete `regintel_v1_*` keys.

---

## Match key (deduplication)

When you import a file, RegIntel compares incoming rows against stored rows using `record_id` as the primary match key. If a stored row has the same `record_id` and no fields have changed, it's silently skipped. If fields changed, the row is queued as a conflict for your review.

Researcher notes (`notes` field) are **never overwritten** by import — they are preserved regardless of incoming data.

---

## Coverage formula

```
coverage % = rows imported for (jurisdiction × setting) ÷ federal rows for same setting
```

- Import the Federal baseline first — it sets the denominator.
- States with more rows than Federal (e.g. CA adds implicit bias requirement) will show >100%. This is expected.
- A cell with no federal rows has no denominator and shows "—".

---

## topic_tag vocabulary

See `schema/topic-tags.md` for the full controlled vocabulary. Key tags:

```
cna_initial_training_hrs    cna_inservice_annual        cna_dementia_annual
cna_competency_eval         lvn_ce_continuing           admin_licensure_initial
staff_abuse_prevention      staff_residents_rights      staff_infection_control
staff_hipaa_privacy         staff_fire_emergency        implicit_bias
human_trafficking           qapi_participation          emergency_preparedness
```

---

## GitHub deployment

This app works as a static GitHub Pages site:

1. Push to a GitHub repository
2. Enable Pages: Settings → Pages → Source → Deploy from branch → `main` → `/ (root)`
3. Visit `https://[username].github.io/[repo]/`

No build step or CI required.

---

## Tech stack

- **React 18** + **Babel standalone** (in-browser JSX transpilation — no build step)
- **HealthStream OH! design system** (Greycliff CF font, StreamBlue tokens)
- **localStorage** for persistence (no server, no database)
- **Vanilla JS store** (`src/store.js`) — framework-agnostic data layer

---

*RegIntel v1 · HealthStream · 2026*
