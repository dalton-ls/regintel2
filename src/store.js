/**
 * RegIntel store — localStorage data layer
 * All row data lives under regintel_v1_rows.
 * Researcher notes stored separately so they survive re-imports.
 * Import events logged under regintel_v1_log.
 *
 * Store API exposed on window.Store:
 *   getAll()                     → row[]
 *   getRows(filter)              → filtered row[]
 *   getJurisdictions()           → { code, label, settings[] }[]
 *   getCoverage(setting)         → { [jur]: { count, fedCount, pct } }
 *   getFedRows(setting)          → row[] (federal baseline)
 *   getImportLog()               → log[]
 *   isStale(row)                 → boolean (current_as_of > 6 months ago)
 *   importRows(rows)             → { added, conflicts, skipped }
 *   acceptConflict(record_id, incoming) → void
 *   keepConflict(record_id)      → void
 *   updateNotes(record_id, text) → void
 *   getNotes(record_id)          → string|null
 *   clearAll()                   → void
 *   getStats()                   → { total, jurisdictions, settings, stale }
 */

(function () {
  const ROWS_KEY  = 'regintel_v1_rows';
  const LOG_KEY   = 'regintel_v1_log';
  const NOTES_KEY = 'regintel_v1_notes';
  const CONFLICT_KEY = 'regintel_v1_conflicts';

  /* ─── Helpers ─── */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
  }
  function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  /* ─── Raw read / write ─── */
  function getAll() {
    return load(ROWS_KEY) || [];
  }
  function saveAll(rows) {
    save(ROWS_KEY, rows);
  }

  /* ─── Filtered reads ─── */
  function getRows({ jurisdiction, hstm_setting, role, topic_tag, explicit_only } = {}) {
    let rows = getAll();
    if (jurisdiction)  rows = rows.filter(r => r.jurisdiction === jurisdiction);
    if (hstm_setting)  rows = rows.filter(r => r.hstm_setting === hstm_setting);
    if (role)          rows = rows.filter(r => Array.isArray(r.hstm_role) ? r.hstm_role.includes(role) : r.hstm_role === role);
    if (topic_tag)     rows = rows.filter(r => r.topic_tag === topic_tag);
    if (explicit_only) rows = rows.filter(r => r.explicit_training === true);
    return rows;
  }

  /* ─── Jurisdictions + settings in the store ─── */
  function getJurisdictions() {
    const rows = getAll();
    const map = {};
    for (const r of rows) {
      if (!r.jurisdiction) continue;
      if (!map[r.jurisdiction]) map[r.jurisdiction] = { name: r.jurisdiction, settings: new Set() };
      if (r.hstm_setting) map[r.jurisdiction].settings.add(r.hstm_setting);
    }
    return Object.values(map).map(j => ({ name: j.name, settings: [...j.settings] }))
      .sort((a, b) => a.name === 'Federal' ? -1 : b.name === 'Federal' ? 1 : a.name.localeCompare(b.name));
  }

  function getSettings() {
    const rows = getAll();
    return [...new Set(rows.map(r => r.hstm_setting).filter(Boolean))].sort();
  }

  /* ─── Federal baseline for a setting ─── */
  function getFedRows(hstm_setting) {
    return getRows({ jurisdiction: 'Federal', hstm_setting });
  }

  /* ─── Coverage % per cell ─── */
  function getCoverage(hstm_setting) {
    const fedCount = getFedRows(hstm_setting).length;
    const rows = getAll().filter(r => r.hstm_setting === hstm_setting);
    const byJur = {};
    for (const r of rows) {
      if (!r.jurisdiction) continue;
      byJur[r.jurisdiction] = (byJur[r.jurisdiction] || 0) + 1;
    }
    const result = {};
    for (const [jur, count] of Object.entries(byJur)) {
      result[jur] = {
        count,
        fedCount,
        pct: fedCount > 0 ? Math.round((count / fedCount) * 100) : null,
      };
    }
    return result;
  }

  /* ─── Staleness: current_as_of > 6 months ago ─── */
  function isStale(row) {
    if (!row?.source_record?.current_as_of) return false;
    const d = new Date(row.source_record.current_as_of);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return d < sixMonthsAgo;
  }

  /* ─── Import pipeline ─── */
  function importRows(incoming) {
    const existing = getAll();
    const map = new Map(existing.map(r => [r.record_id, r]));

    const added = [];
    const conflicts = [];
    let skipped = 0;

    for (const row of incoming) {
      if (!row.record_id) continue;
      const old = map.get(row.record_id);
      if (!old) {
        added.push(row);
        continue;
      }
      // Compare — ignore notes (researcher-owned) and extraction_metadata
      const IGNORE = new Set(['notes', 'extraction_metadata']);
      const changes = [];
      for (const key of Object.keys(row)) {
        if (IGNORE.has(key)) continue;
        if (JSON.stringify(old[key]) !== JSON.stringify(row[key])) {
          changes.push({ field: key, old: old[key], incoming: row[key] });
        }
      }
      if (changes.length === 0) { skipped++; continue; }
      conflicts.push({ record_id: row.record_id, old, incoming: row, changes });
    }

    // Save pending conflicts for the updates screen
    const pendingConflicts = load(CONFLICT_KEY) || {};
    for (const c of conflicts) pendingConflicts[c.record_id] = c;
    save(CONFLICT_KEY, pendingConflicts);

    // Immediately apply the new rows (no conflict) and preserve researcher notes
    const notes = load(NOTES_KEY) || {};
    for (const row of added) {
      const rowWithNotes = { ...row };
      if (notes[row.record_id]) rowWithNotes.notes = notes[row.record_id];
      map.set(row.record_id, rowWithNotes);
    }
    saveAll([...map.values()]);

    // Log the import
    const log = load(LOG_KEY) || [];
    log.unshift({
      ts: new Date().toISOString(),
      added: added.length,
      conflicts: conflicts.length,
      skipped,
      source: incoming[0]?.extraction_metadata?.source_file || 'unknown',
    });
    save(LOG_KEY, log.slice(0, 50)); // keep last 50 events

    return { added, conflicts, skipped };
  }

  function getPendingConflicts() {
    return Object.values(load(CONFLICT_KEY) || {});
  }

  function acceptConflict(record_id) {
    const pending = load(CONFLICT_KEY) || {};
    const c = pending[record_id];
    if (!c) return;
    const rows = getAll();
    const idx = rows.findIndex(r => r.record_id === record_id);
    // Preserve researcher notes
    const notes = load(NOTES_KEY) || {};
    const row = { ...c.incoming };
    if (notes[record_id]) row.notes = notes[record_id];
    if (idx >= 0) rows[idx] = row; else rows.push(row);
    saveAll(rows);
    delete pending[record_id];
    save(CONFLICT_KEY, pending);
  }

  function keepConflict(record_id) {
    const pending = load(CONFLICT_KEY) || {};
    delete pending[record_id];
    save(CONFLICT_KEY, pending);
  }

  /* ─── Researcher notes ─── */
  function updateNotes(record_id, text) {
    const notes = load(NOTES_KEY) || {};
    notes[record_id] = text;
    save(NOTES_KEY, notes);
    // Also update inline on the row
    const rows = getAll();
    const row = rows.find(r => r.record_id === record_id);
    if (row) { row.notes = text; saveAll(rows); }
  }
  function getNotes(record_id) {
    return (load(NOTES_KEY) || {})[record_id] || null;
  }

  /* ─── Import log ─── */
  function getImportLog() {
    return load(LOG_KEY) || [];
  }

  /* ─── Stats ─── */
  function getStats() {
    const rows = getAll();
    const jurs = new Set(rows.map(r => r.jurisdiction).filter(Boolean));
    const settings = new Set(rows.map(r => r.hstm_setting).filter(Boolean));
    const stale = rows.filter(isStale).length;
    const conflicts = Object.keys(load(CONFLICT_KEY) || {}).length;
    return { total: rows.length, jurisdictions: jurs.size, settings: settings.size, stale, conflicts };
  }

  /* ─── Clear ─── */
  function clearAll() {
    localStorage.removeItem(ROWS_KEY);
    localStorage.removeItem(LOG_KEY);
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(CONFLICT_KEY);
  }

  /* ─── Schema validation (lightweight) ─── */
  function validate(row) {
    const required = ['record_id', 'jurisdiction', 'citation', 'training_topic', 'hstm_setting', 'source_url'];
    const missing = required.filter(f => !row[f]);
    return { valid: missing.length === 0, missing };
  }

  function validateBatch(rows) {
    const invalid = [];
    for (const row of rows) {
      const r = validate(row);
      if (!r.valid) invalid.push({ record_id: row.record_id || '?', missing: r.missing });
    }
    return { valid: invalid.length === 0, invalid };
  }

  /* ─── Expose ─── */
  window.Store = {
    getAll, getRows, getJurisdictions, getSettings,
    getFedRows, getCoverage,
    isStale, getPendingConflicts,
    importRows, acceptConflict, keepConflict,
    updateNotes, getNotes,
    getImportLog, getStats,
    clearAll, validate, validateBatch,
  };
})();
