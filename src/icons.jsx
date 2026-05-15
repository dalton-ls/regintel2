// HSTM OH! icon set — 2px stroke, rounded.
const svg = (children, p = {}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2}
    strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);

const I = {};
I.Search = (p) => svg(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>, p);
I.Bell = (p) => svg(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>, p);
I.PieChart = (p) => svg(<><path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" stroke="none" opacity=".25"/></>, p);
I.Building = (p) => svg(<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2"/></>, p);
I.IDCard = (p) => svg(<><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="9" cy="12" r="3"/><path d="M14 9h5M14 13h5M14 17h3"/></>, p);
I.GraduationCap = (p) => svg(<><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c2 1.5 4 2 6 2s4-.5 6-2v-5"/></>, p);
I.Upload = (p) => svg(<><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></>, p);
I.Refresh = (p) => svg(<><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></>, p);
I.Layers = (p) => svg(<><path d="m2 7 10-5 10 5-10 5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></>, p);
I.AlertTriangle = (p) => svg(<><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>, p);
I.Book = (p) => svg(<><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"/><path d="M4 20h15"/></>, p);
I.ArrowRight = (p) => svg(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>, p);
I.ArrowUp = (p) => svg(<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>, p);
I.ArrowDown = (p) => svg(<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>, p);
I.External = (p) => svg(<><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>, p);
I.Plus = (p) => svg(<><path d="M12 5v14"/><path d="M5 12h14"/></>, p);
I.Check = (p) => svg(<path d="M5 12l4.5 4.5L19 7"/>, p);
I.X = (p) => svg(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>, p);
I.ChevronRight = (p) => svg(<path d="m9 6 6 6-6 6"/>, p);
I.ChevronDown = (p) => svg(<path d="m6 9 6 6 6-6"/>, p);
I.Filter = (p) => svg(<path d="M3 5h18l-7 9v6l-4-2v-4z"/>, p);
I.Clock = (p) => svg(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, p);
I.Database = (p) => svg(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></>, p);
I.Flag = (p) => svg(<><path d="M4 21V4h13l-2 5 2 5H4"/></>, p);
I.MapPin = (p) => svg(<><path d="M12 22s8-7.5 8-13a8 8 0 0 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></>, p);
I.Eye = (p) => svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>, p);
I.Info = (p) => svg(<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>, p);
I.FileJson = (p) => svg(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 14s-1 1-1 2 1 2 1 2M16 14s1 1 1 2-1 2-1 2"/></>, p);
I.Download = (p) => svg(<><path d="M12 3v14"/><path d="m5 14 7 7 7-7"/><path d="M3 21h18"/></>, p);
I.Edit = (p) => svg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, p);

window.I = I;
