// Roles — role-first view of store data
window.Pages = window.Pages || {};
window.Pages.Roles = function Roles({ onNav, openDrawer, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;

  const jurs = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);

  // Unique roles across all data
  const roles = useMemo(() => {
    const set = new Set();
    window.Store.getAll().forEach(r => {
      if (Array.isArray(r.hstm_role)) r.hstm_role.forEach(rr => set.add(rr));
      else if (r.hstm_role) set.add(r.hstm_role);
    });
    return [...set].sort();
  }, [storeVersion]);

  const [activeRole, setActiveRole] = useState(null);
  const selectedRole = activeRole || roles[0] || null;

  const roleRows = useMemo(() =>
    selectedRole ? window.Store.getRows({ role: selectedRole }) : [],
    [storeVersion, selectedRole]
  );

  // Group by jurisdiction
  const byJur = useMemo(() => {
    const map = {};
    for (const r of roleRows) {
      const jur = r.jurisdiction || '?';
      if (!map[jur]) map[jur] = [];
      map[jur].push(r);
    }
    return map;
  }, [roleRows]);

  const isEmpty = window.Store.getStats().total === 0;

  if (isEmpty) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><I.IDCard size={24}/></div>
        <div className="t-h3">No data imported</div>
        <div className="t-body" style={{maxWidth:380}}>
          Go to <strong>Data → Import JSON</strong> to populate the role view.
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Browse · Roles</div>
          <h1 className="t-h1">Roles</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:540}}>
            Role-first view of the same imported data. Pick a role to see all requirements across jurisdictions and settings.
          </div>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className="callout warn">
          <I.AlertTriangle size={15} style={{flexShrink:0}}/>
          <div className="callout-body">No <code>hstm_role</code> values found in imported data. Check that your JSON includes the <code>hstm_role</code> field.</div>
        </div>
      ) : (
        <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
          {/* Role list */}
          <div className="card" style={{width:220,flexShrink:0,overflow:'hidden'}}>
            <div className="card-h"><div className="t-h3">Roles <span className="t-meta" style={{marginLeft:6}}>from imported data</span></div></div>
            {roles.map(r => {
              const count = window.Store.getRows({ role: r }).length;
              const isActive = r === selectedRole;
              return (
                <div key={r} onClick={() => setActiveRole(r)} style={{
                  display:'flex',alignItems:'center',gap:10,padding:'11px 18px',
                  cursor:'pointer',borderTop:'1px solid var(--border)',
                  background: isActive ? 'var(--hs-streamblue-100)' : '#fff',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition:'all .1s'
                }}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight: isActive ? 600 : 400,fontSize:13,color:'var(--text)'}}>{r}</div>
                    <div className="t-meta">{count} rows</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role detail */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:14}}>
            {Object.keys(byJur).length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{minHeight:200}}>
                  <div className="t-h3">No rows for {selectedRole}</div>
                </div>
              </div>
            ) : (
              Object.entries(byJur)
                .sort(([a],[b]) => a==='Federal' ? -1 : b==='Federal' ? 1 : a.localeCompare(b))
                .map(([jur, rows]) => (
                  <div className="card" key={jur} style={{overflow:'hidden'}}>
                    <div className="card-h" style={{background: jur==='Federal' ? 'var(--hs-streamblue-800)' : 'var(--hs-gray-200)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        {jur === 'Federal'
                          ? <span style={{fontWeight:700,fontSize:14,color:'#fff'}}>Federal</span>
                          : <span style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{jur}</span>}
                        <span style={{
                          fontSize:11,fontWeight:700,padding:'1px 7px',borderRadius:10,
                          background: jur==='Federal' ? 'rgba(255,255,255,.15)' : 'var(--hs-gray-300)',
                          color: jur==='Federal' ? '#fff' : 'var(--text-3)'
                        }}>{rows.length}</span>
                      </div>
                    </div>
                    {rows.map((r, i) => (
                      <div key={r.record_id} className="req-row" style={{borderTop: i > 0 ? '1px solid var(--border)' : 'none'}} onClick={() => openDrawer(r)}>
                        <div style={{width:3,height:28,borderRadius:2,background: r.jurisdiction==='Federal' ? 'var(--hs-streamblue-500)' : 'var(--hs-streamblue-200)',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{r.training_topic}</div>
                          <div className="t-meta">{r.citation} · {r.hstm_setting}</div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                          {r.hours_required && r.hours_required !== 'NR' && (
                            <span style={{fontSize:11,fontWeight:600,background:'var(--hs-streamblue-100)',color:'var(--hs-streamblue-800)',padding:'2px 7px',borderRadius:10}}>
                              {r.hours_required} hr
                            </span>
                          )}
                          {window.Store.isStale(r) && <span className="badge warn" style={{padding:'1px 6px'}}>stale</span>}
                          <I.ChevronRight size={13} style={{color:'var(--hs-gray-400)'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
