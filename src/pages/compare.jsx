// Compare — matrix of topics × jurisdictions (FED baseline)
window.Pages = window.Pages || {};
window.Pages.Compare = function Compare({ onNav, openDrawer, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;

  const jurs     = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);
  const settings = useMemo(() => window.Store.getSettings(), [storeVersion]);

  const [setting, setSetting] = useState('SNF');
  const [role,    setRole]    = useState(null);

  const allJurNames = useMemo(() =>
    ['Federal', ...jurs.filter(j => j.name !== 'Federal').map(j => j.name)],
    [jurs]
  );

  // All unique topic_tags for this setting
  const tags = useMemo(() => {
    const rows = window.Store.getRows({ hstm_setting: setting });
    const seen = new Set();
    rows.forEach(r => { if (r.topic_tag) seen.add(r.topic_tag); });
    return [...seen].sort();
  }, [storeVersion, setting]);

  // Build matrix: { tag → { jurName → row[] } }
  const matrix = useMemo(() => {
    const m = {};
    for (const tag of tags) {
      m[tag] = {};
      for (const jur of allJurNames) {
        m[tag][jur] = window.Store.getRows({ jurisdiction: jur, hstm_setting: setting, topic_tag: tag });
      }
    }
    return m;
  }, [storeVersion, setting, tags, allJurNames]);

  const cellVal = (rows) => {
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    if (r.hours_required && r.hours_required !== 'NR') return r.hours_required + ' hr';
    if (r.explicit_training) return '✓';
    return r.frequency?.slice(0,12) || '✓';
  };

  const isEmpty = window.Store.getStats().total === 0;

  if (isEmpty) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><I.Layers size={24}/></div>
        <div className="t-h3">No data to compare</div>
        <div className="t-body" style={{maxWidth:380}}>Import data to compare across jurisdictions.</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Browse · Compare</div>
          <h1 className="t-h1">Compare matrix</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:560}}>
            Federal floor as baseline. State columns show what they require relative to FED.
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div className="seg">
            {(settings.length > 0 ? settings : ['SNF','ALF']).map(s => (
              <button key={s} className={setting===s?'active':''} onClick={() => setSetting(s)}>{s}</button>
            ))}
          </div>
          <button className="btn ghost sm"><I.Download size={13}/> Export</button>
        </div>
      </div>

      {tags.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{minHeight:240}}>
            <div className="t-h3">No topic tags for {setting}</div>
            <div className="t-meta">Import rows with <code>topic_tag</code> fields to populate the matrix.</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          <div className="card-h">
            <div>
              <div className="t-h3">{setting} · all jurisdictions</div>
              <div className="t-meta" style={{marginTop:2}}>FED = federal baseline · click any cell to open drawer</div>
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="ri-table">
              <thead>
                <tr>
                  <th style={{minWidth:200}}>Topic</th>
                  {allJurNames.map(j => (
                    <th key={j} style={{
                      textAlign:'center',minWidth:90,
                      background: j==='Federal' ? 'var(--hs-streamblue-800)' : undefined,
                      color: j==='Federal' ? '#fff' : undefined,
                    }}>
                      {j === 'Federal' ? 'FED (baseline)' : j.slice(0,2).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, i) => (
                  <tr key={tag}>
                    <td>
                      <div style={{fontWeight:500}}>{tag.replace(/_/g,' ')}</div>
                    </td>
                    {allJurNames.map(j => {
                      const rows = matrix[tag]?.[j] || [];
                      const val = cellVal(rows);
                      const isFed = j === 'Federal';
                      const row = rows[0];
                      const stale = row ? window.Store.isStale(row) : false;
                      return (
                        <td key={j} style={{
                          textAlign:'center',
                          background: isFed ? 'var(--hs-streamblue-100)' :
                                      !val ? 'var(--hs-gray-200)' : undefined,
                          cursor: val ? 'pointer' : 'default'
                        }} onClick={() => row && openDrawer(row)}>
                          {val ? (
                            <span style={{
                              fontSize:12,fontWeight:600,
                              color: isFed ? 'var(--hs-streamblue-800)' : 'var(--text)'
                            }}>
                              {val}
                              {stale && <span style={{marginLeft:4,fontSize:10,color:'var(--hs-orange-500)'}}>⚠</span>}
                            </span>
                          ) : (
                            <span style={{fontSize:12,color:'var(--hs-gray-400)'}}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px 18px',background:'var(--hs-gray-200)',borderTop:'1px solid var(--border)',display:'flex',gap:16,flexWrap:'wrap'}}>
            {[
              ['— no data',           'var(--hs-gray-200)'],
              ['value = hours or ✓',  '#fff'],
              ['⚠ stale row',         'var(--hs-orange-100)'],
            ].map(([label, bg]) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:18,height:12,borderRadius:3,background:bg,border:'1px solid var(--border)'}}/>
                <span style={{fontSize:11,color:'var(--text-3)'}}>{label}</span>
              </div>
            ))}
            <span style={{fontSize:11,color:'var(--text-3)',marginLeft:'auto'}}>Click any cell to open drawer</span>
          </div>
        </div>
      )}
    </>
  );
};
