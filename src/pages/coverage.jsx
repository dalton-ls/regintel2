// Coverage dashboard — reads from window.Store
window.Pages = window.Pages || {};
window.Pages.Coverage = function Coverage({ onNav, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;
  const [activeSetting, setActiveSetting] = useState('SNF');

  const stats    = useMemo(() => window.Store.getStats(), [storeVersion]);
  const settings = useMemo(() => window.Store.getSettings(), [storeVersion]);
  const jurs     = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);
  const log      = useMemo(() => window.Store.getImportLog(), [storeVersion]);
  const coverage = useMemo(() => window.Store.getCoverage(activeSetting), [storeVersion, activeSetting]);

  // Heatmap: rows = jurisdictions (Federal first), cols = settings
  const ALL_SETTINGS = ['SNF','ALF','Hospital','Home Health','Hospice','ICF/IID','PRTF','ASC','All Settings'];
  const displaySettings = settings.length > 0
    ? ALL_SETTINGS.filter(s => settings.includes(s))
    : ALL_SETTINGS;

  const heatLevel = (jur, setting) => {
    const cov = window.Store.getCoverage(setting);
    const pct = cov[jur]?.pct;
    if (!pct) return 0;
    if (pct >= 100) return 5;
    if (pct >= 75)  return 4;
    if (pct >= 50)  return 3;
    if (pct >= 25)  return 2;
    return 1;
  };

  const isEmpty = stats.total === 0;

  const kpiCards = [
    { label:'Federal floor coverage', value: coverage['Federal']?.pct != null ? coverage['Federal'].pct + '%' : '—', note: activeSetting + ' setting' },
    { label:'Jurisdictions with data', value: jurs.length, note: stats.total + ' rows total' },
    { label:'Settings covered',        value: settings.length || '—', note: 'of ' + ALL_SETTINGS.length + ' known settings' },
    { label:'Stale rows (>6mo)',        value: stats.stale || '—', note: stats.conflicts > 0 ? stats.conflicts + ' conflicts pending' : 'no conflicts' },
  ];

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Home</div>
          <h1 className="t-display">Coverage overview</h1>
          <div className="t-body" style={{marginTop:6,maxWidth:560}}>
            Federal floor + all imported jurisdictions × care settings.
            Coverage % = state rows ÷ federal rows for the same setting.
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn ghost"><I.Filter size={14}/> Filters</button>
          <button className="btn primary" onClick={() => onNav('updates')}><I.Refresh size={14}/> Check for updates</button>
        </div>
      </div>

      {isEmpty ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><I.Database size={24}/></div>
            <div className="t-h3">No data imported yet</div>
            <div className="t-body" style={{maxWidth:400}}>
              Import a JSON or JSONL file to populate the coverage matrix.
              Start with the Federal SNF baseline — it sets the denominator for all state coverage percentages.
            </div>
            <button className="btn primary" onClick={() => onNav('import')}><I.Upload size={14}/> Import JSON</button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="kpi-grid">
            {kpiCards.map(k => (
              <div className="kpi" key={k.label}>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value t-num">{k.value}</div>
                <div className="kpi-delta">{k.note}</div>
              </div>
            ))}
          </div>

          {/* Coverage % explanation */}
          <div className="callout blue">
            <I.Info size={15} style={{flexShrink:0,marginTop:1}}/>
            <div className="callout-body">
              <strong>Coverage %</strong> = rows imported for a jurisdiction ÷ federal rows for the same setting.
              Populate Federal first — it sets the denominator. States with more rows than Federal show &gt;100%.
            </div>
          </div>

          <div className="two-col">
            {/* Heatmap */}
            <div className="card">
              <div className="card-h">
                <div>
                  <div className="t-h3">Coverage matrix</div>
                  <div className="t-meta" style={{marginTop:2}}>Click any cell to open workspace · darker = more rows imported</div>
                </div>
                <div className="seg">
                  {['SNF','ALF','Hospital'].map(s => (
                    <button key={s} className={activeSetting===s?'active':''} onClick={() => setActiveSetting(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="card-b">
                {jurs.length === 0 ? (
                  <div style={{padding:'20px 0',textAlign:'center',color:'var(--text-3)'}}>Import data to see the matrix.</div>
                ) : (
                  <>
                    {/* Column headers */}
                    <div style={{display:'grid',gridTemplateColumns:'52px repeat(' + displaySettings.length + ', 1fr)',gap:4,marginBottom:6}}>
                      <span/>
                      {displaySettings.map(s => (
                        <span key={s} className="t-meta" style={{
                          textAlign:'center',
                          fontWeight: s===activeSetting ? 700 : 500,
                          color: s===activeSetting ? 'var(--hs-streamblue-800)' : 'var(--text-3)',
                          background: s===activeSetting ? 'var(--hs-streamblue-100)' : 'transparent',
                          borderRadius:4,padding:'3px 0',fontSize:10
                        }}>{s}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    {['Federal', ...jurs.filter(j=>j.name!=='Federal').map(j=>j.name)].map(jurName => (
                      <div key={jurName} style={{display:'grid',gridTemplateColumns:'52px repeat(' + displaySettings.length + ', 1fr)',gap:4,alignItems:'center',padding:'3px 0'}}>
                        <span style={{
                          fontSize:11,fontWeight: jurName==='Federal' ? 700 : 600,
                          color: jurName==='Federal' ? 'var(--hs-streamblue-800)' : 'var(--text-2)',
                          paddingLeft:4
                        }}>
                          {jurName === 'Federal' ? 'FED' : jurName.slice(0,2).toUpperCase()}
                        </span>
                        {displaySettings.map((s, i) => {
                          const lvl = heatLevel(jurName, s);
                          const cov = window.Store.getCoverage(s);
                          const pct = cov[jurName]?.pct;
                          return (
                            <div
                              key={i}
                              className={'heat-cell heat-' + lvl}
                              onClick={() => lvl > 0 && onNav('workspace')}
                              title={jurName + ' · ' + s + (pct != null ? ' · ' + pct + '%' : ' · no data')}
                            />
                          );
                        })}
                      </div>
                    ))}
                    {/* Legend */}
                    <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,justifyContent:'flex-end',fontSize:11,color:'var(--text-3)'}}>
                      <span>Empty</span>
                      {[0,1,2,3,4,5].map(l => <div key={l} className={'heat-cell heat-' + l} style={{width:14,height:10,aspectRatio:'unset'}}/>)}
                      <span>Full</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Side rail */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Federal floor card */}
              <div className="card">
                <div className="card-h">
                  <div>
                    <div className="t-h3">Federal floor</div>
                    <div className="t-meta" style={{marginTop:2}}>These rows apply in all states. Populate Federal first.</div>
                  </div>
                  <span className="badge fed">FED</span>
                </div>
                <div className="card-b tight">
                  {['SNF','ALF','Hospital','Home Health'].map(s => {
                    const fedRows = window.Store.getFedRows(s).length;
                    return fedRows > 0 ? (
                      <div key={s} className="prog-row">
                        <span className="prog-label" style={{width:90}}>{s}</span>
                        <span className="t-meta">{fedRows} rows</span>
                      </div>
                    ) : null;
                  }).filter(Boolean)}
                  {window.Store.getFedRows('SNF').length === 0 && (
                    <div className="t-meta" style={{padding:'8px 0'}}>No federal rows yet — import Federal baseline first.</div>
                  )}
                </div>
              </div>

              {/* State progress */}
              {jurs.filter(j => j.name !== 'Federal').length > 0 && (
                <div className="card">
                  <div className="card-h">
                    <div className="t-h3">State progress · {activeSetting}</div>
                    <button className="btn ghost sm" onClick={() => onNav('workspace')}>Open workspace</button>
                  </div>
                  <div className="card-b tight">
                    {jurs.filter(j => j.name !== 'Federal').map(j => {
                      const cov = coverage[j.name] || {};
                      const pct = cov.pct ?? 0;
                      return (
                        <div key={j.name} className="prog-row" style={{cursor:'pointer'}} onClick={() => onNav('workspace')}>
                          <span className="prog-label">{j.name.slice(0,2).toUpperCase()}</span>
                          <div className="prog"><span style={{width: Math.min(pct,100) + '%'}}/></div>
                          <span className="prog-val">{pct ? pct + '%' : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Import log */}
              <div className="card">
                <div className="card-h">
                  <div className="t-h3">Import log</div>
                  <div className="t-meta">{log.length} events</div>
                </div>
                <div className="card-b tight" style={{padding:'4px 18px 14px'}}>
                  {log.length === 0 && <div className="t-meta" style={{padding:'8px 0'}}>No imports yet.</div>}
                  {log.slice(0,5).map((l, i) => (
                    <div key={i} style={{
                      display:'flex',gap:10,padding:'10px 0',
                      borderBottom: i < Math.min(log.length,5)-1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:'var(--primary)',marginTop:5,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="t-sm" style={{color:'var(--text)'}}>
                          +{l.added} rows · {l.conflicts} conflicts · {l.skipped} skipped
                        </div>
                        <div className="t-meta" style={{marginTop:2}}>
                          {new Date(l.ts).toLocaleString()} · {l.source}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
