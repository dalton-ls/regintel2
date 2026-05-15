// Job study — new-hire requirement bundle for role × jurisdiction × setting
window.Pages = window.Pages || {};
window.Pages.JobStudy = function JobStudy({ onNav, openDrawer, storeVersion }) {
  const I = window.I;
  const { useState, useMemo } = React;

  const jurs     = useMemo(() => window.Store.getJurisdictions(), [storeVersion]);
  const settings = useMemo(() => window.Store.getSettings(), [storeVersion]);
  const roles    = useMemo(() => {
    const set = new Set();
    window.Store.getAll().forEach(r => {
      if (Array.isArray(r.hstm_role)) r.hstm_role.forEach(rr => set.add(rr));
      else if (r.hstm_role) set.add(r.hstm_role);
    });
    return [...set].sort();
  }, [storeVersion]);

  const [role,    setRole]    = useState(null);
  const [jur,     setJur]     = useState(null);
  const [setting, setSetting] = useState(null);

  const selRole    = role    || roles[0]    || null;
  const selJur     = jur     || jurs.filter(j=>j.name!=='Federal')[0]?.name || null;
  const selSetting = setting || settings[0] || null;

  const allRows = useMemo(() =>
    selJur && selSetting && selRole
      ? window.Store.getRows({ jurisdiction: selJur, hstm_setting: selSetting, role: selRole })
      : [],
    [storeVersion, selJur, selSetting, selRole]
  );

  const fedRows = useMemo(() =>
    selSetting && selRole
      ? window.Store.getRows({ jurisdiction: 'Federal', hstm_setting: selSetting, role: selRole })
      : [],
    [storeVersion, selSetting, selRole]
  );

  // Classify rows into initial vs annual
  const isInitial = (r) => {
    const f = (r.frequency || '').toLowerCase();
    const t = (r.training_topic || '').toLowerCase();
    return f.includes('one-time') || f.includes('initial') || f.includes('upon hire') || f.includes('before') || t.includes('initial');
  };
  const isAnnual = (r) => {
    const f = (r.frequency || '').toLowerCase();
    return f.includes('annual') || f.includes('/yr') || f.includes('ongoing') || f.includes('biennial');
  };

  const combined = [...fedRows, ...allRows.filter(r => r.jurisdiction !== 'Federal')];
  const initialRows = combined.filter(r => isInitial(r) || (!isInitial(r) && !isAnnual(r)));
  const annualRows  = combined.filter(r => isAnnual(r) && !isInitial(r));

  const totalInitialHrs = initialRows.reduce((s,r) => {
    const n = parseFloat(r.hours_required);
    return isNaN(n) ? s : s + n;
  }, 0);
  const totalAnnualHrs = annualRows.reduce((s,r) => {
    const n = parseFloat(r.hours_required);
    return isNaN(n) ? s : s + n;
  }, 0);

  const isEmpty = window.Store.getStats().total === 0;

  if (isEmpty) return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><I.GraduationCap size={24}/></div>
        <div className="t-h3">No data imported</div>
        <div className="t-body" style={{maxWidth:380}}>Import JSON to build a job study bundle.</div>
      </div>
    </div>
  );

  const RowItem = ({ r, accent }) => (
    <div style={{
      display:'flex',alignItems:'flex-start',gap:10,padding:'10px 0',
      borderBottom:'1px solid var(--border)',cursor:'pointer'
    }} onClick={() => openDrawer(r)}>
      <div style={{width:3,height:28,borderRadius:2,background:accent,flexShrink:0,marginTop:2}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{r.training_topic}</div>
        <div className="t-meta">{r.citation}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0}}>
        {r.hours_required && r.hours_required !== 'NR' && (
          <span style={{fontSize:12,fontWeight:700,color:accent}}>{r.hours_required} hr</span>
        )}
        <span style={{
          fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10,
          background: r.jurisdiction==='Federal' ? 'var(--hs-streamblue-100)' : 'var(--hs-orange-100)',
          color: r.jurisdiction==='Federal' ? 'var(--hs-streamblue-700)' : 'var(--hs-orange-500)'
        }}>{r.jurisdiction==='Federal'?'FED':selJur}</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-h">
        <div>
          <div className="t-eyebrow" style={{marginBottom:6}}>Browse · Job study</div>
          <h1 className="t-h1">Job study</h1>
          <div className="t-body" style={{marginTop:4,maxWidth:540}}>
            New-hire requirement bundle assembled from imported data — federal floor + state layer.
            Toggle role, jurisdiction, and setting to see how requirements differ.
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {roles.length > 0 && (
            <select className="ri-input" style={{width:'auto',height:30,padding:'0 8px',fontSize:12}}
              value={selRole||''} onChange={e => setRole(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          {jurs.filter(j=>j.name!=='Federal').length > 0 && (
            <select className="ri-input" style={{width:'auto',height:30,padding:'0 8px',fontSize:12}}
              value={selJur||''} onChange={e => setJur(e.target.value)}>
              {jurs.filter(j=>j.name!=='Federal').map(j => <option key={j.name} value={j.name}>{j.name}</option>)}
            </select>
          )}
          {settings.length > 0 && (
            <select className="ri-input" style={{width:'auto',height:30,padding:'0 8px',fontSize:12}}
              value={selSetting||''} onChange={e => setSetting(e.target.value)}>
              {settings.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {combined.length === 0 ? (
        <div className="callout warn">
          <I.AlertTriangle size={15} style={{flexShrink:0}}/>
          <div className="callout-body">
            No rows found for <strong>{selRole}</strong> in <strong>{selJur} · {selSetting}</strong>.
            Import data for this combination to build a job study bundle.
          </div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'start'}}>
          {/* Initial */}
          <div className="card" style={{overflow:'hidden'}}>
            <div className="card-h" style={{background:'var(--hs-streamblue-100)'}}>
              <div>
                <div className="t-h3" style={{color:'var(--hs-streamblue-700)'}}>Initial / onboarding</div>
                <div className="t-meta" style={{marginTop:2}}>{selJur} · {selSetting} · federal + state</div>
              </div>
              {totalInitialHrs > 0 && (
                <span style={{fontSize:22,fontWeight:700,color:'var(--hs-streamblue-800)'}}>{totalInitialHrs} hr</span>
              )}
            </div>
            <div className="card-b tight" style={{paddingTop:0,paddingBottom:0}}>
              {initialRows.length === 0
                ? <div className="t-meta" style={{padding:'12px 0'}}>No initial training rows found.</div>
                : initialRows.map(r => <RowItem key={r.record_id} r={r} accent="var(--hs-streamblue-500)"/>)
              }
            </div>
          </div>

          {/* Annual */}
          <div className="card" style={{overflow:'hidden'}}>
            <div className="card-h" style={{background:'var(--hs-lime-100)'}}>
              <div>
                <div className="t-h3" style={{color:'var(--hs-lime-300)'}}>Annual / ongoing</div>
                <div className="t-meta" style={{marginTop:2}}>Recurring requirements</div>
              </div>
              {totalAnnualHrs > 0 && (
                <span style={{fontSize:22,fontWeight:700,color:'var(--hs-lime-300)'}}>{totalAnnualHrs} hr/yr</span>
              )}
            </div>
            <div className="card-b tight" style={{paddingTop:0,paddingBottom:0}}>
              {annualRows.length === 0
                ? <div className="t-meta" style={{padding:'12px 0'}}>No annual training rows found.</div>
                : annualRows.map(r => <RowItem key={r.record_id} r={r} accent="var(--hs-lime-300)"/>)
              }
            </div>
          </div>
        </div>
      )}

      <div className="callout blue">
        <I.Info size={15} style={{flexShrink:0,marginTop:1}}/>
        <div className="callout-body">
          Bundle is assembled from imported JSON rows. Initial vs annual classification is based on the <code>frequency</code> field.
          Rows classified as both are shown under initial. Click any row to open the drawer.
        </div>
      </div>
    </>
  );
};
