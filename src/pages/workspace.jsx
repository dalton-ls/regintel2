// Workspace — jurisdiction tree + real rows from store
window.Pages = window.Pages || {};
window.Pages.Workspace = function Workspace({ onNav, openDrawer, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;

  const jurs     = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);
  const settings = useMemo(() => window.Store.getSettings(), [storeVersion]);

  // Active selection
  const [activeJur, setActiveJur]     = useState(null);
  const [activeSetting, setActiveSetting] = useState(null);
  const [activeRole, setActiveRole]   = useState(null);

  // Set default when store loads
  const firstJur = jurs[0]?.name || null;
  const firstSetting = jurs[0]?.settings[0] || null;

  const selectedJur     = activeJur     || firstJur;
  const selectedSetting = activeSetting || firstSetting;

  const rows = useMemo(() =>
    selectedJur && selectedSetting
      ? window.Store.getRows({ jurisdiction: selectedJur, hstm_setting: selectedSetting })
      : [],
    [storeVersion, selectedJur, selectedSetting]
  );

  // Get unique roles across rows
  const roles = useMemo(() => {
    const set = new Set();
    rows.forEach(r => {
      if (Array.isArray(r.hstm_role)) r.hstm_role.forEach(rr => set.add(rr));
      else if (r.hstm_role) set.add(r.hstm_role);
    });
    return [...set].sort();
  }, [rows]);

  const selectedRole = activeRole || roles[0] || null;

  const visibleRows = useMemo(() =>
    selectedRole ? rows.filter(r =>
      Array.isArray(r.hstm_role) ? r.hstm_role.includes(selectedRole) : r.hstm_role === selectedRole
    ) : rows,
    [rows, selectedRole]
  );

  const fedCount = useMemo(() =>
    window.Store.getFedRows(selectedSetting || 'SNF').length,
    [storeVersion, selectedSetting]
  );

  const isEmpty = window.Store.getStats().total === 0;

  if (isEmpty) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><I.Building size={24}/></div>
        <div className="t-h3">No data imported</div>
        <div className="t-body" style={{maxWidth:380}}>
          The workspace populates automatically from imported JSON.
          Go to <strong>Data → Import JSON</strong> in the sidebar to get started.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',gap:0,margin:'-24px -28px',height:'calc(100vh - 60px)',overflow:'hidden'}}>
      {/* Jurisdiction tree */}
      <aside style={{
        width:220,flexShrink:0,background:'#fff',
        borderRight:'1px solid var(--border)',
        overflowY:'auto',display:'flex',flexDirection:'column'
      }}>
        <div style={{padding:'10px 14px 8px',background:'var(--hs-streamblue-100)',borderBottom:'1px solid var(--hs-streamblue-200)'}}>
          <div className="t-eyebrow" style={{color:'var(--hs-streamblue-700)',marginBottom:3}}>Auto-populated from JSON</div>
          <div style={{fontSize:11,color:'var(--hs-streamblue-600)',lineHeight:1.4}}>Nodes appear as you import files.</div>
        </div>

        {jurs.map(j => (
          <div key={j.name}>
            <div style={{
              padding:'8px 14px 4px',
              display:'flex',alignItems:'center',gap:6,
              fontSize:12,fontWeight:700,
              color: j.name==='Federal' ? 'var(--hs-streamblue-700)' : 'var(--text-2)'
            }}>
              {j.name === 'Federal' && (
                <span style={{fontSize:9,fontWeight:700,background:'var(--hs-streamblue-100)',color:'var(--hs-streamblue-700)',padding:'1px 5px',borderRadius:3}}>FED</span>
              )}
              {j.name}
            </div>
            {j.settings.map(s => {
              const isActive = j.name===selectedJur && s===selectedSetting;
              return (
                <div key={s}
                  onClick={() => { setActiveJur(j.name); setActiveSetting(s); setActiveRole(null); }}
                  style={{
                    display:'flex',alignItems:'center',gap:8,
                    padding:'7px 14px 7px 28px',fontSize:13,cursor:'pointer',
                    background: isActive ? 'var(--hs-streamblue-100)' : 'transparent',
                    color: isActive ? 'var(--hs-streamblue-800)' : 'var(--text-2)',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition:'all .1s'
                  }}
                >
                  <I.Building size={12}/> {s}
                </div>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Main workspace */}
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
        {/* Workspace header */}
        <div style={{
          background:'#fff',borderBottom:'1px solid var(--border)',
          padding:'12px 24px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',
          flexShrink:0
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {selectedJur && <span style={{fontSize:11,fontWeight:700,background:'var(--hs-streamblue-100)',color:'var(--hs-streamblue-700)',padding:'2px 8px',borderRadius:10}}>
              {selectedJur === 'Federal' ? 'FED' : selectedJur}
            </span>}
            {selectedSetting && <span style={{fontSize:11,fontWeight:700,background:'var(--hs-sunflower-100)',color:'var(--hs-orange-500)',padding:'2px 8px',borderRadius:10}}>{selectedSetting}</span>}
            <span style={{fontSize:12,color:'var(--text-3)'}}>{rows.length} rows · {fedCount} federal rows for this setting</span>
          </div>
          <button className="btn ghost sm" style={{marginLeft:'auto'}} onClick={() => onNav('compare')}><I.Layers size={13}/> Compare</button>
        </div>

        {/* Role tabs */}
        {roles.length > 0 && (
          <div style={{background:'#fff',borderBottom:'1px solid var(--border)',padding:'0 24px',display:'flex',gap:0,flexShrink:0}}>
            <button
              onClick={() => setActiveRole(null)}
              style={{
                height:42,padding:'0 14px',border:'none',fontFamily:'inherit',cursor:'pointer',
                borderBottom: !selectedRole ? '2px solid var(--primary)' : '2px solid transparent',
                background:'transparent',fontSize:13,fontWeight: !selectedRole ? 600 : 400,
                color: !selectedRole ? 'var(--hs-streamblue-800)' : 'var(--text-2)'
              }}
            >All <span className="t-meta" style={{marginLeft:4}}>{rows.length}</span></button>
            {roles.map(r => {
              const count = rows.filter(row => Array.isArray(row.hstm_role) ? row.hstm_role.includes(r) : row.hstm_role === r).length;
              const isActive = selectedRole === r;
              return (
                <button key={r} onClick={() => setActiveRole(r)} style={{
                  height:42,padding:'0 14px',border:'none',fontFamily:'inherit',cursor:'pointer',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  background:'transparent',fontSize:13,fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--hs-streamblue-800)' : 'var(--text-2)'
                }}>
                  {r} <span className="t-meta" style={{marginLeft:4}}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Rows */}
        <div style={{padding:'14px 24px',flex:1}}>
          {visibleRows.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{minHeight:240}}>
                <div className="empty-icon"><I.FileJson size={22}/></div>
                <div className="t-h3">No rows for this selection</div>
                <div className="t-meta">Import a JSON file with {selectedJur} · {selectedSetting} rows to populate this view.</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{overflow:'hidden'}}>
              {/* Group by relationship (parents first) */}
              {visibleRows
                .sort((a, b) => {
                  if (a.relationship === 'Parent' && b.relationship !== 'Parent') return -1;
                  if (b.relationship === 'Parent' && a.relationship !== 'Parent') return 1;
                  return 0;
                })
                .map((r, i) => {
                  const isChild = r.relationship === 'Child';
                  const isFed   = r.jurisdiction === 'Federal';
                  const stale   = window.Store.isStale(r);
                  return (
                    <div
                      key={r.record_id || i}
                      className="req-row"
                      style={{paddingLeft: isChild ? 32 : 16}}
                      onClick={() => openDrawer(r)}
                    >
                      <div style={{
                        width:3,height:32,borderRadius:2,flexShrink:0,
                        background: isFed ? 'var(--hs-streamblue-500)' : 'var(--hs-streamblue-200)'
                      }}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight: r.relationship==='Parent' ? 600 : 400,color:'var(--text)',whiteSpace:'normal',lineHeight:1.4}}>
                          {r.training_topic}
                        </div>
                        <div className="t-meta" style={{marginTop:2}}>{r.citation}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                        {r.hours_required && r.hours_required !== 'NR' && (
                          <span style={{fontSize:11,fontWeight:600,background:'var(--hs-streamblue-100)',color:'var(--hs-streamblue-800)',padding:'2px 7px',borderRadius:10}}>
                            {r.hours_required} hr
                          </span>
                        )}
                        {r.explicit_training && (
                          <span className="badge brand" style={{padding:'1px 6px'}}><span className="dot"/>explicit</span>
                        )}
                        {stale && <span className="badge warn" style={{padding:'1px 6px'}}>stale</span>}
                        {isFed && <span className="badge fed" style={{padding:'1px 6px'}}>FED</span>}
                        <I.ChevronRight size={14} style={{color:'var(--hs-gray-400)'}}/>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
