// Drawer — detail view for a real row object from the store
window.Pages = window.Pages || {};
window.Pages.Drawer = function Drawer({ row, onClose, toast }) {
  const I = window.I;
  const { useState } = React;
  const [tab, setTab] = useState('stack');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(row?.notes || '');

  if (!row) return null;

  const isFed = row.jurisdiction === 'Federal';
  const stale = window.Store.isStale(row);

  const saveNotes = () => {
    window.Store.updateNotes(row.record_id, notesText);
    setEditingNotes(false);
    toast('Notes saved');
  };

  const fedRows = window.Store.getFedRows(row.hstm_setting || 'SNF')
    .filter(r => r.topic_tag && r.topic_tag === row.topic_tag && r.record_id !== row.record_id);

  const TABS = ['stack','detail','notes','source'];

  return (
    <>
      {/* Header */}
      <div className="drawer-header">
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
            {isFed && <span className="badge fed">FED</span>}
            <span className="badge brand">{row.hstm_setting}</span>
            {row.explicit_training && <span className="badge success"><span className="dot"/>Explicit training</span>}
            {stale && <span className="badge warn"><span className="dot"/>Stale</span>}
          </div>
          <div style={{fontWeight:700,fontSize:15,color:'var(--text)',lineHeight:1.35}}>{row.training_topic}</div>
          <div className="t-meta" style={{marginTop:4}}>{row.citation}</div>
        </div>
        <button className="btn ghost sm" style={{padding:0,width:32,height:32,justifyContent:'center'}} onClick={onClose}>
          <I.X size={16}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="drawer-tabs">
        {TABS.map(t => (
          <button key={t} className={'drawer-tab' + (tab===t?' active':'')} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="drawer-body">

        {tab === 'stack' && (
          <>
            <div style={{display:'grid',gridTemplateColumns: isFed ? '1fr' : '1fr 1fr',gap:12}}>
              {/* Federal floor */}
              <div style={{borderRadius:'var(--r-l)',border:'1px solid var(--hs-streamblue-300)',overflow:'hidden'}}>
                <div style={{padding:'10px 14px',background:'var(--hs-streamblue-800)',color:'#fff',fontSize:11,fontWeight:700}}>
                  {isFed ? 'FEDERAL REQUIREMENT' : 'FED FLOOR · ' + (fedRows[0]?.citation || 'no matching federal row')}
                </div>
                <div style={{padding:14}}>
                  <div style={{fontSize:22,fontWeight:700,color:'var(--hs-streamblue-800)',letterSpacing:'-.02em'}}>
                    {isFed ? (row.hours_required || 'NR') : (fedRows[0]?.hours_required || '—')}
                    {row.hours_required && row.hours_required !== 'NR' && !isFed ? '' : (isFed ? ' hr' : '')}
                  </div>
                  <div className="t-sm" style={{marginTop:4}}>
                    {isFed ? row.frequency : (fedRows[0]?.training_topic?.slice(0,60) || 'No matching federal row')}
                  </div>
                </div>
              </div>

              {/* State delta (only if not federal row) */}
              {!isFed && (
                <div style={{borderRadius:'var(--r-l)',border:'1px solid var(--hs-orange-300)',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'var(--hs-sunflower-100)',color:'var(--hs-orange-500)',fontSize:11,fontWeight:700,borderBottom:'1px solid var(--hs-orange-300)'}}>
                    {row.jurisdiction.toUpperCase()} STATE LAYER
                  </div>
                  <div style={{padding:14}}>
                    <div style={{fontSize:22,fontWeight:700,color:'var(--text)',letterSpacing:'-.02em'}}>
                      {row.hours_required || 'NR'} {row.hours_required && row.hours_required !== 'NR' ? 'hr' : ''}
                    </div>
                    <div className="t-sm" style={{marginTop:4}}>{row.frequency}</div>
                    {row.approval_required === 'Yes' && (
                      <div className="t-meta" style={{marginTop:6}}>Approved provider required</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Effective requirement (state only) */}
            {!isFed && (
              <div style={{background:'var(--hs-streamblue-100)',borderRadius:'var(--r-m)',padding:14,border:'1px solid var(--hs-streamblue-300)'}}>
                <div className="t-eyebrow" style={{color:'var(--hs-streamblue-700)',marginBottom:6}}>Effective requirement · {row.jurisdiction} {row.hstm_setting}</div>
                <div style={{fontSize:15,fontWeight:600,color:'var(--hs-streamblue-800)'}}>
                  {row.hours_required || 'NR'} {row.hours_required && row.hours_required !== 'NR' ? 'hr' : ''}
                  {row.frequency ? ' · ' + row.frequency : ''}
                </div>
                <div className="t-meta" style={{marginTop:4}}>
                  {row.hstm_role ? (Array.isArray(row.hstm_role) ? row.hstm_role.join(', ') : row.hstm_role) : 'All staff'}
                </div>
              </div>
            )}

            {/* Staleness warning */}
            {stale && (
              <div className="callout warn">
                <I.Clock size={15} style={{flexShrink:0}}/>
                <div className="callout-body">
                  <strong>Stale:</strong> source confirmed {row.source_record?.current_as_of || 'unknown'}.
                  Re-verify at the source link before using this in a product.
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'detail' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              ['Jurisdiction',      row.jurisdiction],
              ['Care setting',      row.hstm_setting],
              ['Role',              Array.isArray(row.hstm_role) ? row.hstm_role.join(', ') : row.hstm_role],
              ['Citation',          row.citation],
              ['Topic tag',         row.topic_tag],
              ['Hours required',    row.hours_required],
              ['Frequency',         row.frequency],
              ['Purpose',           row.purpose],
              ['Approval required', row.approval_required],
              ['Requirement level', row.requirement_level],
              ['Relationship',      row.relationship],
              ['Parent ID',         row.parent_record_id],
              ['Effective date',    row.effective_date],
              ['Oversight agency',  row.oversight_agency],
              ['Last confirmed',    row.source_record?.current_as_of],
            ].filter(([,v]) => v != null && v !== '').map(([k,v]) => (
              <div key={k} style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:8}}>
                <span className="t-eyebrow" style={{alignSelf:'start',paddingTop:1}}>{k}</span>
                <span className="t-sm" style={{color:'var(--text)',wordBreak:'break-word'}}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>
              Researcher notes are preserved across re-imports and never overwritten by incoming JSON.
            </div>
            {editingNotes ? (
              <>
                <textarea
                  className="ri-textarea"
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Add research flags, caveats, verification notes…"
                  rows={6}
                  autoFocus
                />
                <div style={{display:'flex',gap:8}}>
                  <button className="btn primary sm" onClick={saveNotes}><I.Check size={12}/> Save</button>
                  <button className="btn ghost sm" onClick={() => { setEditingNotes(false); setNotesText(row?.notes||''); }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                {notesText ? (
                  <div style={{padding:'12px 14px',background:'var(--hs-sunflower-100)',borderRadius:'var(--r-m)',border:'1px solid var(--hs-orange-300)',fontSize:13,lineHeight:1.6}}>
                    {notesText}
                  </div>
                ) : (
                  <div className="t-meta">No notes yet.</div>
                )}
                <button className="btn secondary sm" onClick={() => setEditingNotes(true)}>
                  {notesText ? <><I.Edit size={12}/> Edit notes</> : <><I.Plus size={12}/> Add note</>}
                </button>
              </>
            )}
          </div>
        )}

        {tab === 'source' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',gap:12,padding:'14px',border:'1px solid var(--border)',borderRadius:'var(--r-m)'}}>
              <I.External size={16} style={{color:'var(--text-3)',flexShrink:0,marginTop:1}}/>
              <div style={{flex:1}}>
                <div className="t-sm" style={{fontWeight:600,marginBottom:4}}>{row.citation}</div>
                <div style={{fontSize:12,color:'var(--text-3)',wordBreak:'break-all'}}>{row.source_url}</div>
              </div>
              <a href={row.source_url} target="_blank" rel="noopener" className="btn secondary sm">Open</a>
            </div>
            {row.source_record?.openlaws_web_url && (
              <div style={{display:'flex',gap:12,padding:'14px',border:'1px solid var(--border)',borderRadius:'var(--r-m)'}}>
                <I.External size={16} style={{color:'var(--text-3)',flexShrink:0,marginTop:1}}/>
                <div style={{flex:1}}>
                  <div className="t-sm" style={{fontWeight:600,marginBottom:4}}>OpenLaws source</div>
                  <div style={{fontSize:12,color:'var(--text-3)',wordBreak:'break-all'}}>{row.source_record.openlaws_web_url}</div>
                  <div className="t-meta" style={{marginTop:4}}>
                    Confirmed {row.source_record.current_as_of} · Updated {row.source_record.updated_at || '—'}
                  </div>
                </div>
                <a href={row.source_record.openlaws_web_url} target="_blank" rel="noopener" className="btn ghost sm">Open</a>
              </div>
            )}
            <div style={{padding:'12px 14px',background:'var(--hs-gray-200)',borderRadius:'var(--r-m)'}}>
              <div className="t-eyebrow" style={{marginBottom:6}}>Record ID</div>
              <code style={{fontSize:12}}>{row.record_id}</code>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
