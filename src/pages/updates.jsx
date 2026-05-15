// Updates — review pending conflicts from store
window.Pages = window.Pages || {};
window.Pages.Updates = function Updates({ onNav, toast, refresh, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;

  const conflicts = useMemo(() => window.Store.getPendingConflicts(), [storeVersion]);
  const staleRows = useMemo(() =>
    window.Store.getAll().filter(r => window.Store.isStale(r)),
    [storeVersion]
  );

  const [resolved, setResolved] = useState({});

  const accept = (record_id) => {
    window.Store.acceptConflict(record_id);
    setResolved(r => ({...r, [record_id]: 'accepted'}));
    refresh();
    toast('Accepted — row updated', 'success');
  };

  const keep = (record_id) => {
    window.Store.keepConflict(record_id);
    setResolved(r => ({...r, [record_id]: 'kept'}));
    refresh();
    toast('Kept current value');
  };

  const totalItems = conflicts.length + staleRows.length;
  const resolvedCount = Object.keys(resolved).length;

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Data · Updates</div>
          <h1 className="t-h1">Regulatory update review</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:560}}>
            Conflicts and stale rows from your imports. Accept incoming changes or keep your current values.
            Researcher notes are never overwritten.
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn ghost" onClick={() => onNav('import')}><I.Upload size={14}/> Drop new JSONL</button>
          {totalItems > 0 && (
            <span className="badge warn" style={{padding:'4px 12px',fontSize:13}}>
              {resolvedCount}/{totalItems} resolved
            </span>
          )}
        </div>
      </div>

      <div className="callout blue">
        <I.Info size={15} style={{flexShrink:0,marginTop:1}}/>
        <div className="callout-body">
          <strong>How updates are detected:</strong> drop a new OpenLaws JSON export into the Import screen.
          RegIntel diffs it row-by-row using <code>record_id</code> as the match key.
          Changed values and stale records appear here. Nothing updates automatically — you review each item.
        </div>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          { label:'Conflicts', n: conflicts.length, bg:'var(--hs-orange-100)', color:'var(--hs-orange-500)' },
          { label:'Stale rows', n: staleRows.length, bg:'var(--hs-gray-200)', color:'var(--text-3)' },
          { label:'Resolved', n: resolvedCount, bg:'var(--hs-streamblue-100)', color:'var(--hs-streamblue-700)' },
        ].map(t => (
          <div key={t.label} style={{background:t.bg,border:'1px solid var(--border)',borderRadius:'var(--r-l)',padding:'14px 18px'}}>
            <div style={{fontSize:28,fontWeight:700,color:t.color,letterSpacing:'-.02em'}}>{t.n}</div>
            <div style={{fontSize:12,fontWeight:600,color:t.color,marginTop:2}}>{t.label}</div>
          </div>
        ))}
      </div>

      {totalItems === 0 && (
        <div className="card">
          <div className="empty-state" style={{minHeight:280}}>
            <div className="empty-icon" style={{background:'var(--hs-green-100)'}}>
              <I.Check size={24} style={{color:'var(--hs-green-400)'}}/>
            </div>
            <div className="t-h3">Nothing to review</div>
            <div className="t-body" style={{maxWidth:380}}>
              No conflicts or stale rows. Drop a new JSONL export to check for changes.
            </div>
            <button className="btn secondary" onClick={() => onNav('import')}><I.Upload size={14}/> Import JSON</button>
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="card" style={{overflow:'hidden'}}>
          <div className="card-h">
            <div>
              <div className="t-h3">Conflicts</div>
              <div className="t-meta" style={{marginTop:2}}>Incoming value differs from stored — pick one</div>
            </div>
          </div>
          {conflicts.map((c, i) => {
            const r = resolved[c.record_id];
            return (
              <div key={c.record_id} style={{
                display:'flex',gap:14,padding:'14px 18px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: r ? 'var(--hs-gray-200)' : '#fff',
                opacity: r ? 0.65 : 1, transition:'all .2s'
              }}>
                <div style={{width:3,borderRadius:2,background: r ? 'var(--hs-gray-400)' : 'var(--hs-orange-300)',alignSelf:'stretch',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div className="t-sm" style={{fontWeight:700,marginBottom:4}}>
                    {c.record_id}
                    <span className="t-meta" style={{marginLeft:10}}>{c.old.jurisdiction} · {c.old.hstm_setting}</span>
                  </div>
                  {c.changes.map(ch => (
                    <div key={ch.field} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                      <span className="t-eyebrow">{ch.field}:</span>
                      <span style={{fontSize:12,background:'var(--hs-gray-200)',padding:'2px 8px',borderRadius:4,textDecoration:'line-through',color:'var(--text-3)'}}>
                        {String(ch.old).slice(0,80)}
                      </span>
                      <I.ArrowRight size={12} style={{color:'var(--text-3)',flexShrink:0}}/>
                      <span style={{fontSize:12,background:'var(--hs-orange-100)',color:'var(--hs-orange-500)',padding:'2px 8px',borderRadius:4,fontWeight:600}}>
                        {String(ch.incoming).slice(0,80)}
                      </span>
                    </div>
                  ))}
                </div>
                {!r ? (
                  <div style={{display:'flex',gap:6,alignItems:'flex-start',flexShrink:0}}>
                    <button className="btn ghost sm" onClick={() => keep(c.record_id)}>Keep current</button>
                    <button className="btn secondary sm" onClick={() => accept(c.record_id)}><I.Check size={12}/> Accept</button>
                  </div>
                ) : (
                  <span className="badge success"><I.Check size={11}/> {r}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stale rows */}
      {staleRows.length > 0 && (
        <div className="card" style={{overflow:'hidden'}}>
          <div className="card-h">
            <div>
              <div className="t-h3" style={{color:'var(--text-3)'}}>Stale rows</div>
              <div className="t-meta" style={{marginTop:2}}>source_record.current_as_of is older than 6 months — re-verify recommended</div>
            </div>
            <span className="badge neutral"><span className="dot"/>{staleRows.length}</span>
          </div>
          {staleRows.slice(0,10).map((r, i) => (
            <div key={r.record_id} style={{
              display:'flex',gap:12,padding:'12px 18px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{width:3,borderRadius:2,background:'var(--hs-gray-400)',alignSelf:'stretch',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div className="t-sm" style={{fontWeight:600}}>{r.jurisdiction} · {r.hstm_setting} · {r.citation}</div>
                <div className="t-meta" style={{marginTop:2}}>
                  {r.training_topic?.slice(0,80)} · last confirmed {r.source_record?.current_as_of || 'unknown'}
                </div>
              </div>
              <a href={r.source_url} target="_blank" rel="noopener" className="btn ghost sm">
                <I.External size={12}/> Verify
              </a>
            </div>
          ))}
          {staleRows.length > 10 && (
            <div style={{padding:'10px 18px',borderTop:'1px solid var(--border)',color:'var(--text-3)',fontSize:12}}>
              + {staleRows.length - 10} more stale rows
            </div>
          )}
        </div>
      )}
    </>
  );
};
