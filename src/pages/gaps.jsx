// Gap analysis — missing rows, stale rows, conflicts
window.Pages = window.Pages || {};
window.Pages.Gaps = function Gaps({ onNav, openDrawer, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;
  const [filter, setFilter] = useState('all');

  const staleRows  = useMemo(() => window.Store.getAll().filter(r => window.Store.isStale(r)), [storeVersion]);
  const conflicts  = useMemo(() => window.Store.getPendingConflicts(), [storeVersion]);
  const jurs       = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);
  const settings   = useMemo(() => window.Store.getSettings(), [storeVersion]);

  // "Missing" = jurisdictions that have no rows for a setting where Federal has rows
  const missingCells = useMemo(() => {
    const ALL_SETTINGS = ['SNF','ALF','Hospital','Home Health'];
    const gaps = [];
    for (const s of ALL_SETTINGS) {
      const fedCount = window.Store.getFedRows(s).length;
      if (fedCount === 0) continue;
      for (const jur of jurs) {
        if (jur.name === 'Federal') continue;
        const count = window.Store.getRows({ jurisdiction: jur.name, hstm_setting: s }).length;
        if (count === 0) {
          gaps.push({ jur: jur.name, setting: s, fedCount, desc: `No rows imported for ${jur.name} × ${s} (federal has ${fedCount} rows)` });
        }
      }
    }
    return gaps;
  }, [storeVersion, jurs]);

  const counts = { all: missingCells.length + staleRows.length + conflicts.length, missing: missingCells.length, stale: staleRows.length, conflict: conflicts.length };

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Manage · Gap analysis</div>
          <h1 className="t-h1">Gap analysis</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:540}}>
            Three types: <strong>missing</strong> cells with no imported data, <strong>stale</strong> rows not re-verified in 6 months, and <strong>conflicts</strong> from re-imports.
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {[['all','All'],['missing','Missing'],['stale','Stale'],['conflict','Conflicts']].map(([id, label]) => (
          <button key={id} className={'btn' + (filter===id ? ' primary' : ' ghost')} onClick={() => setFilter(id)}>
            {label}
            <span style={{
              fontSize:11,fontWeight:700,padding:'1px 7px',borderRadius:10,marginLeft:4,
              background: filter===id ? 'rgba(255,255,255,.2)' : 'var(--hs-gray-200)',
              color: filter===id ? '#fff' : 'var(--text-3)'
            }}>{counts[id]}</span>
          </button>
        ))}
      </div>

      {counts.all === 0 && (
        <div className="card">
          <div className="empty-state" style={{minHeight:280}}>
            <div className="empty-icon" style={{background:'var(--hs-green-100)'}}>
              <I.Check size={24} style={{color:'var(--hs-green-400)'}}/>
            </div>
            <div className="t-h3">No gaps detected</div>
            <div className="t-body" style={{maxWidth:360}}>All imported cells have data, no stale rows, and no pending conflicts.</div>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'start'}}>
        {/* Missing */}
        {(filter==='all'||filter==='missing') && missingCells.length > 0 && (
          <div className="card" style={{overflow:'hidden'}}>
            <div className="card-h" style={{background:'var(--hs-gray-200)'}}>
              <div>
                <div className="t-h3">Missing rows</div>
                <div className="t-meta" style={{marginTop:2}}>Cells with federal rows but no state data imported</div>
              </div>
              <span className="badge neutral"><span className="dot"/>{missingCells.length}</span>
            </div>
            {missingCells.map((g, i) => (
              <div key={i} style={{
                display:'flex',alignItems:'flex-start',gap:12,padding:'12px 18px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{g.jur} · {g.setting}</div>
                  <div className="t-meta">{g.desc}</div>
                </div>
                <span style={{fontSize:11,color:'var(--text-3)',padding:'2px 8px',background:'var(--hs-gray-200)',borderRadius:10,whiteSpace:'nowrap'}}>needs import</span>
              </div>
            ))}
          </div>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Stale */}
          {(filter==='all'||filter==='stale') && staleRows.length > 0 && (
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-h" style={{background:'var(--hs-orange-100)'}}>
                <div>
                  <div className="t-h3" style={{color:'var(--hs-orange-500)'}}>Stale rows</div>
                  <div className="t-meta" style={{marginTop:2}}>Not re-verified in &gt;6 months</div>
                </div>
                <span className="badge warn"><span className="dot"/>{staleRows.length}</span>
              </div>
              {staleRows.slice(0,8).map((r, i) => (
                <div key={r.record_id} style={{
                  display:'flex',alignItems:'flex-start',gap:12,padding:'12px 18px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor:'pointer'
                }} onClick={() => openDrawer(r)}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{r.jurisdiction} · {r.hstm_setting}</div>
                    <div className="t-meta">{r.citation} · confirmed {r.source_record?.current_as_of || '?'}</div>
                  </div>
                  <a href={r.source_url} target="_blank" rel="noopener" className="btn ghost sm" onClick={e=>e.stopPropagation()}>
                    <I.External size={11}/> Verify
                  </a>
                </div>
              ))}
              {staleRows.length > 8 && (
                <div style={{padding:'8px 18px',borderTop:'1px solid var(--border)',color:'var(--text-3)',fontSize:12}}>
                  + {staleRows.length - 8} more
                </div>
              )}
            </div>
          )}

          {/* Conflicts */}
          {(filter==='all'||filter==='conflict') && conflicts.length > 0 && (
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-h" style={{background:'var(--hs-red-100)'}}>
                <div>
                  <div className="t-h3" style={{color:'var(--hs-red-400)'}}>Pending conflicts</div>
                  <div className="t-meta" style={{marginTop:2}}>Resolve in the Updates screen</div>
                </div>
                <span className="badge danger"><span className="dot"/>{conflicts.length}</span>
              </div>
              {conflicts.slice(0,6).map((c, i) => (
                <div key={c.record_id} style={{
                  display:'flex',alignItems:'flex-start',gap:12,padding:'12px 18px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{c.record_id}</div>
                    <div className="t-meta">{c.changes?.length} field(s) changed</div>
                  </div>
                  <button className="btn ghost sm" onClick={() => onNav('updates')}><I.Check size={11}/> Resolve</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
