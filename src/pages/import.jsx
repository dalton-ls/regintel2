// Import page — real file upload, validation, diff, merge
window.Pages = window.Pages || {};
window.Pages.Import = function Import({ onNav, toast, refresh }) {
  const { useState, useCallback } = React;
  const I = window.I;
  const [stage, setStage] = useState('drop'); // drop | validating | preview | done
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [validation, setValidation] = useState(null); // { valid, invalid[] }
  const [diff, setDiff] = useState(null);             // { added, conflicts, skipped }
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState({});

  const processFile = useCallback((f) => {
    setFile(f);
    setError(null);
    setStage('validating');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result.trim();
        let parsed;
        // Support both JSON array and JSONL (newline-delimited JSON)
        if (text.startsWith('[')) {
          parsed = JSON.parse(text);
        } else {
          parsed = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        }
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('File must be a JSON array or JSONL with at least one row.');
        const v = window.Store.validateBatch(parsed);
        const d = window.Store.importRows(parsed);
        setRows(parsed);
        setValidation(v);
        setDiff(d);
        setStage('preview');
      } catch (err) {
        setError('Parse error: ' + err.message);
        setStage('drop');
      }
    };
    reader.onerror = () => { setError('Could not read file.'); setStage('drop'); };
    reader.readAsText(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleConfirm = () => {
    // Rows already imported by importRows(); just navigate away
    refresh();
    toast(`${diff.added.length} rows added · ${diff.conflicts.length} conflicts queued · ${diff.skipped} skipped`, 'success');
    setStage('done');
  };

  const acceptConflict = (record_id) => {
    window.Store.acceptConflict(record_id);
    setAccepting(a => ({ ...a, [record_id]: 'accepted' }));
    refresh();
  };
  const keepConflict = (record_id) => {
    window.Store.keepConflict(record_id);
    setAccepting(a => ({ ...a, [record_id]: 'kept' }));
  };

  // ── Render: done ──
  if (stage === 'done') return (
    <div className="empty-state">
      <div className="empty-icon" style={{background:'var(--hs-green-100)'}}>
        <I.Check size={28} style={{color:'var(--hs-green-400)'}}/>
      </div>
      <div className="t-h1">Import complete</div>
      <div className="t-body" style={{maxWidth:440}}>
        {diff?.added.length} rows merged. {diff?.conflicts.length} conflicts queued in Updates.
        Researcher notes were preserved.
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn secondary" onClick={() => { setStage('drop'); setFile(null); setDiff(null); }}>Import another file</button>
        <button className="btn primary" onClick={() => onNav('updates')}><I.Refresh size={14}/> Review conflicts</button>
        <button className="btn ghost" onClick={() => onNav('coverage')}><I.PieChart size={14}/> Back to coverage</button>
      </div>
    </div>
  );

  // ── Render: drop ──
  if (stage === 'drop') return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Data</div>
          <h1 className="t-h1">Import JSON</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:540}}>
            Drop a JSON array or JSONL file parsed from your OpenLaws source.
            Rows merge by <code>record_id</code> — duplicates are skipped, conflicts are queued for review. Researcher notes are never overwritten.
          </div>
        </div>
      </div>

      {error && (
        <div className="callout danger" style={{marginBottom:0}}>
          <I.AlertTriangle size={16} style={{flexShrink:0,marginTop:1}}/>
          <div className="callout-body">{error}</div>
        </div>
      )}

      <div
        onDrop={onDrop} onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById('ri-file-input').click()}
        style={{
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          gap:14,padding:64,border:'2px dashed var(--hs-gray-400)',borderRadius:'var(--r-xl)',
          background:'#fff',cursor:'pointer',textAlign:'center',transition:'border-color .15s,background .15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.background='var(--hs-streamblue-100)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--hs-gray-400)'; e.currentTarget.style.background='#fff'; }}
      >
        <div style={{width:56,height:56,borderRadius:'var(--r-l)',background:'var(--hs-streamblue-100)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <I.FileJson size={28} style={{color:'var(--primary)'}}/>
        </div>
        <div>
          <div className="t-h3">Drop JSON or JSONL file here</div>
          <div className="t-body" style={{marginTop:4}}>or click to browse · .json or .txt</div>
        </div>
        <input id="ri-file-input" type="file" accept=".json,.jsonl,.txt" style={{display:'none'}} onChange={onDrop}/>
      </div>

      {/* Schema reference */}
      <div className="two-col" style={{gap:14}}>
        <div className="card">
          <div className="card-h"><div className="t-h3">Expected format</div></div>
          <div className="card-b">
            <div className="callout blue" style={{marginBottom:12}}>
              <I.Info size={15} style={{flexShrink:0}}/>
              <div className="callout-body">JSON array <code>[{'{...}'}]</code> or JSONL (one object per line). Each object must match the v1 schema.</div>
            </div>
            <pre style={{margin:0,background:'var(--hs-gray-200)',borderRadius:'var(--r-m)',padding:'12px 16px',fontSize:11,lineHeight:1.7,color:'var(--text-2)',overflowX:'auto'}}>
{`[
  {
    "record_id":      "FED-CFR-483.95-01",
    "jurisdiction":   "Federal",
    "hstm_setting":   "SNF",
    "hstm_role":      ["All Staff"],
    "citation":       "42 CFR § 483.95(g)(1)",
    "training_topic": "Abuse, neglect, and exploitation",
    "topic_tag":      "staff_abuse_prevention",
    "hours_required": "NR",
    "frequency":      "Ongoing",
    "source_url":     "https://ecfr.gov/...",
    "source_record":  { "current_as_of": "2026-01-27", ... },
    ...
  }
]`}
            </pre>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div className="t-h3">Merge rules</div></div>
          <div className="card-b tight" style={{display:'flex',flexDirection:'column',gap:0}}>
            {[
              ['Match key',      'record_id (primary) + citation + jurisdiction (fallback)'],
              ['Duplicate',      'Silently skipped — no change'],
              ['Changed field',  'Queued in Updates for review'],
              ['New row',        'Merged immediately'],
              ['Researcher notes','Always preserved on existing rows'],
              ['Staleness',      'Flagged if source_record.current_as_of > 6 months'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:8,padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                <span className="t-eyebrow" style={{alignSelf:'center'}}>{k}</span>
                <span className="t-sm">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ── Render: validating ──
  if (stage === 'validating') return (
    <div className="empty-state">
      <I.Loader size={32} style={{color:'var(--primary)',animation:'spin 1s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="t-h3">Parsing {file?.name}…</div>
    </div>
  );

  // ── Render: preview ──
  const pendingConflicts = diff?.conflicts?.filter(c => !accepting[c.record_id]) || [];

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Data · Import · Review</div>
          <h1 className="t-h1">{file?.name}</h1>
          <div className="t-body" style={{marginTop:4}}>{rows.length} rows parsed from file</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn ghost" onClick={() => { setStage('drop'); setFile(null); }}>Change file</button>
          <button className="btn primary" onClick={handleConfirm}><I.Check size={14}/> Confirm &amp; load</button>
        </div>
      </div>

      {/* Validation warnings */}
      {validation && !validation.valid && (
        <div className="callout warn">
          <I.AlertTriangle size={15} style={{flexShrink:0}}/>
          <div className="callout-body">
            <strong>{validation.invalid.length} rows missing required fields</strong> — they were still imported but may not display correctly.
            {' '}{validation.invalid.slice(0,3).map(r => r.record_id).join(', ')}{validation.invalid.length > 3 ? ` + ${validation.invalid.length-3} more` : ''}.
          </div>
        </div>
      )}

      {/* Coverage delta */}
      <div className="card">
        <div className="card-h"><div className="t-h3">Coverage impact</div></div>
        <div className="card-b">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              { label:'New rows',   n: diff?.added.length,     bg:'var(--hs-green-100)',   color:'var(--hs-green-400)' },
              { label:'Conflicts',  n: diff?.conflicts.length, bg:'var(--hs-orange-100)',  color:'var(--hs-orange-500)' },
              { label:'Skipped',    n: diff?.skipped,          bg:'var(--hs-gray-200)',    color:'var(--text-3)' },
            ].map(t => (
              <div key={t.label} style={{textAlign:'center',padding:'16px 0',background:t.bg,borderRadius:'var(--r-m)'}}>
                <div style={{fontSize:28,fontWeight:700,color:t.color,letterSpacing:'-.02em'}}>{t.n}</div>
                <div className="t-meta" style={{color:t.color,marginTop:2}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {diff?.conflicts.length > 0 && (
        <div className="card" style={{overflow:'hidden'}}>
          <div className="card-h">
            <div>
              <div className="t-h3">Conflicts — review required</div>
              <div className="t-meta" style={{marginTop:2}}>Existing values vs incoming. Researcher notes are never overwritten.</div>
            </div>
            {pendingConflicts.length === 0 && <span className="badge success"><span className="dot"/>All resolved</span>}
          </div>
          {diff.conflicts.map((c, i) => {
            const resolved = accepting[c.record_id];
            return (
              <div key={c.record_id} style={{
                display:'flex',gap:14,padding:'14px 18px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: resolved ? 'var(--hs-gray-200)' : '#fff',
                opacity: resolved ? 0.6 : 1,
                transition:'all .2s'
              }}>
                <div style={{width:3,borderRadius:2,background:'var(--hs-orange-300)',alignSelf:'stretch',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div className="t-sm" style={{fontWeight:700,marginBottom:6}}>{c.record_id}</div>
                  {c.changes.map(ch => (
                    <div key={ch.field} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                      <span className="t-eyebrow">{ch.field}:</span>
                      <span style={{fontSize:12,background:'var(--hs-gray-200)',padding:'2px 8px',borderRadius:4,textDecoration:'line-through',color:'var(--text-3)'}}>
                        {JSON.stringify(ch.old)}
                      </span>
                      <I.ArrowRight size={12} style={{color:'var(--text-3)'}}/>
                      <span style={{fontSize:12,background:'var(--hs-orange-100)',color:'var(--hs-orange-500)',padding:'2px 8px',borderRadius:4,fontWeight:600}}>
                        {JSON.stringify(ch.incoming)}
                      </span>
                    </div>
                  ))}
                </div>
                {!resolved ? (
                  <div style={{display:'flex',gap:6,alignItems:'flex-start',flexShrink:0}}>
                    <button className="btn ghost sm" onClick={() => keepConflict(c.record_id)}>Keep current</button>
                    <button className="btn secondary sm" onClick={() => acceptConflict(c.record_id)}><I.Check size={12}/> Accept</button>
                  </div>
                ) : (
                  <span className="badge success"><I.Check size={11}/> {resolved}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Row preview */}
      <div className="card" style={{overflow:'hidden'}}>
        <div className="card-h">
          <div className="t-h3">Row preview <span className="t-meta" style={{marginLeft:8}}>first 10 of {rows.length}</span></div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="ri-table">
            <thead>
              <tr>
                {['record_id','jurisdiction','hstm_setting','hstm_role','citation','hours_required','topic_tag'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0,10).map((r, i) => (
                <tr key={i}>
                  <td><code style={{fontSize:11}}>{r.record_id}</code></td>
                  <td>{r.jurisdiction}</td>
                  <td>{r.hstm_setting}</td>
                  <td>{Array.isArray(r.hstm_role) ? r.hstm_role.join(', ') : r.hstm_role}</td>
                  <td style={{maxWidth:220,wordBreak:'break-all',fontSize:11}}>{r.citation}</td>
                  <td style={{textAlign:'center'}}>{r.hours_required || '—'}</td>
                  <td><span style={{fontSize:11,background:'var(--hs-streamblue-100)',color:'var(--hs-streamblue-800)',padding:'1px 6px',borderRadius:4}}>{r.topic_tag || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
