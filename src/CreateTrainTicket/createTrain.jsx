import { useState, useEffect, useRef, useContext, createContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./createTrain.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function toLocalISOString(str) {
  if (!str) return "";
  return str.length === 16 ? str + ":00" : str;
}

function fmtDate(str) {
  if (!str) return "—";
  const [d] = str.split("T");
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = ["","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${day} ${months[parseInt(m, 10)]} ${y}`;
}

function fmtTime(str) {
  if (!str) return "";
  const parts = str.split("T");
  if (parts.length < 2) return str.includes(":") ? str.slice(0, 5) : "";
  return parts[1].slice(0, 5);
}

function getNowLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

const DropdownContext = createContext(null);

function DropdownProvider({ children }) {
  const [openId, setOpenId] = useState(null);
  const close  = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id) => setOpenId(prev => (prev === id ? null : id)), []);
  return (
    <DropdownContext.Provider value={{ openId, toggle, close }}>
      {children}
    </DropdownContext.Provider>
  );
}

const countryColors = {
  FR: { bg: "#1a3a6b", text: "#4a9eff" },
  TR: { bg: "#6b1a1a", text: "#ff6b6b" },
  AZ: { bg: "#1a3a1a", text: "#4aff6b" },
  DE: { bg: "#3a3a1a", text: "#ffd700" },
  GB: { bg: "#1a2a5a", text: "#6699ff" },
  US: { bg: "#1a2a4a", text: "#66aaff" },
  RU: { bg: "#2a1a3a", text: "#cc88ff" },
  IT: { bg: "#1a3a2a", text: "#55cc88" },
  ES: { bg: "#3a2a1a", text: "#ffaa44" },
  DEFAULT: { bg: "#2a2a3a", text: "#9090c0" },
};

function getCountryCode(location) {
  if (!location) return "??";
  if (location.countryCode) return location.countryCode.toUpperCase();
  const country = (location.country || "").toUpperCase();
  const map = {
    FRANSA: "FR", FRANCE: "FR",
    TURKIYE: "TR", TURKEY: "TR", "TÜRKİYE": "TR",
    AZERBAIJAN: "AZ", AZERBAYCAN: "AZ",
    GERMANY: "DE", DEUTSCHLAND: "DE",
    "UNITED KINGDOM": "GB", UK: "GB",
    "UNITED STATES": "US", USA: "US",
    RUSSIA: "RU", ITALY: "IT", ITALIA: "IT",
    SPAIN: "ES", ESPANA: "ES",
  };
  return map[country] || country.slice(0, 2) || "??";
}

function LocationAvatar({ location }) {
  const code   = getCountryCode(location);
  const colors = countryColors[code] || countryColors.DEFAULT;
  return (
    <div className="loc-avatar" style={{ background: colors.bg, color: colors.text, border: `1.5px solid ${colors.text}30` }}>
      {code.slice(0, 2)}
    </div>
  );
}

function LocationDropdown({ id, locations, value, onChange, loading, label, name }) {
  const { openId, toggle, close } = useContext(DropdownContext);
  const open = openId === id;

  const [search, setSearch]         = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const searchRef  = useRef(null);

  const selected = locations.find(l => String(l.id) === String(value));
  const filtered = search.trim()
    ? locations.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        (l.country || "").toLowerCase().includes(search.toLowerCase())
      )
    : locations;

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 99999 });
  };

  const handleToggle = () => {
    if (loading) return;
    if (!open) calcPosition();
    else setSearch("");
    toggle(id);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => calcPosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        !e.target.closest(".loc-portal-panel")
      ) {
        close();
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const handleSelect = (loc) => {
    onChange({ target: { name, value: String(loc.id) } });
    close();
    setSearch("");
  };

  return (
    <div className="ct-field">
      <label>{label}</label>
      <div
        ref={triggerRef}
        className={`loc-trigger${open ? " loc-trigger--open" : ""}`}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); }
          if (e.key === "Escape") { close(); setSearch(""); }
        }}
        role="combobox"
        aria-expanded={open}
      >
        {selected ? (
          <div className="loc-trigger-selected">
            <LocationAvatar location={selected} />
            <div className="loc-trigger-text">
              <span className="loc-trigger-country">{(selected.country || "").toUpperCase()}</span>
              <span className="loc-trigger-city">{selected.name}</span>
            </div>
          </div>
        ) : (
          <span className="loc-trigger-placeholder">{loading ? "Loading..." : "Select city..."}</span>
        )}
        <svg className={`loc-chevron${open ? " loc-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && createPortal(
        <div className="loc-portal-panel" style={panelStyle}>
          <div className="loc-search-wrap">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: "rgba(255,255,255,0.3)" }}>
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              className="loc-search"
              placeholder="Search locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
          <div className="loc-list">
            {filtered.length === 0 && <div className="loc-empty">No locations found</div>}
            {filtered.map(loc => {
              const isSel = String(loc.id) === String(value);
              return (
                <div key={loc.id} className={`loc-item${isSel ? " loc-item--selected" : ""}`} onClick={() => handleSelect(loc)}>
                  <LocationAvatar location={loc} />
                  <div className="loc-item-text">
                    <span className="loc-item-country">{(loc.country || "").toUpperCase()}</span>
                    <span className="loc-item-city">{loc.name}</span>
                  </div>
                  {isSel && (
                    <svg className="loc-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#ff6060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const VARIANT_META = {
  "first class": { icon: "✦", color: "#c9a84c" },
  "business":    { icon: "◈", color: "#7eb8f7" },
  "economy":     { icon: "◇", color: "#a0a8c0" },
};
function getVariantMeta(name = "") {
  return VARIANT_META[name.toLowerCase().trim()] || { icon: "◉", color: "#ff8080" };
}

function VariantSelect({ id, variants, value, onChange, loading }) {
  const { openId, toggle, close } = useContext(DropdownContext);
  const open = openId === id;
  const wrapRef = useRef(null);

  const selected = variants.find(v => String(v.id) === String(value));
  const meta     = selected ? getVariantMeta(selected.name) : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  return (
    <div className="ct-field vs-wrap" ref={wrapRef}>
      <label>Class (Variant)</label>
      <div
        className={`vs-trigger${open ? " vs-trigger--open" : ""}`}
        onClick={() => { if (!loading) toggle(id); }}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(id); } if (e.key === "Escape") close(); }}
        role="combobox"
        aria-expanded={open}
      >
        {selected && meta ? (
          <span className="vs-trigger-inner">
            <span className="vs-trigger-ico" style={{ color: meta.color }}>{meta.icon}</span>
            <span className="vs-trigger-name" style={{ color: meta.color }}>
              {selected.name.charAt(0).toUpperCase() + selected.name.slice(1)}
            </span>
            <span className="vs-trigger-price">{selected.price} ₼</span>
          </span>
        ) : (
          <span className="vs-trigger-placeholder">
            {loading ? "Loading..." : variants.length === 0 ? "— No variants —" : "— Select variant —"}
          </span>
        )}
        <svg className={`loc-chevron${open ? " loc-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && variants.length > 0 && (
        <div className="vs-panel">
          {variants.map(v => {
            const m     = getVariantMeta(v.name);
            const isSel = String(v.id) === String(value);
            return (
              <div
                key={v.id}
                className={`vs-row${isSel ? " vs-row--selected" : ""}`}
                style={{ "--vc": m.color }}
                onClick={() => { onChange(String(v.id)); close(); }}
              >
                <span className="vs-row-ico">{m.icon}</span>
                <span className="vs-row-name">
                  {v.name.charAt(0).toUpperCase() + v.name.slice(1)}
                </span>
                <span className="vs-row-price">{v.price} ₼</span>
                {isSel && (
                  <svg className="vs-row-check" width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke={m.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {variants.length === 0 && !loading && (
        <span className="ct-field-warn">⚠ Create a Variant in Admin panel first!</span>
      )}
    </div>
  );
}

export default function CreateTrainTicket({ onCreated }) {
  const navigate = useNavigate();

  const [locations, setLocations]   = useState([]);
  const [variants, setVariants]     = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [varLoading, setVarLoading] = useState(false);

  const [form, setForm] = useState({
    trainCompany: "",
    trainNumber: "",
    vagonNumber: 1,
    dueDate: "",
    fromId: "",
    toId: "",
  });

  const [seatGroups, setSeatGroups] = useState([
    { variantId: "", rowCount: 5, seatsPerRow: 4 },
  ]);

  const [loading, setLoading]               = useState(false);
  const [serverError, setServerError]       = useState(null);
  const [dateError, setDateError]           = useState("");   // new state for date validation
  const [isGenerated, setIsGenerated]       = useState(false);
  const [createdTicket, setCreatedTicket]   = useState(null);
  const [snapshotForm, setSnapshotForm]     = useState(null);
  const [snapshotGroups, setSnapshotGroups] = useState([]);
  const [fromName, setFromName]             = useState("");
  const [toName, setToName]                 = useState("");

  useEffect(() => {
    setLocLoading(true);
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLocLoading(false));

    setVarLoading(true);
    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setVariants(list);
        if (list.length > 0)
          setSeatGroups([{ variantId: String(list[0].id), rowCount: 5, seatsPerRow: 4 }]);
      })
      .catch(() => {})
      .finally(() => setVarLoading(false));
  }, []);

  const handleForm = e => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === "number" ? Number(value) : value }));

    if (name === "dueDate") {
      if (!value) {
        setDateError("Departure date and time is required.");
      } else if (value < getNowLocal()) {
        setDateError("Departure date cannot be in the past.");
      } else {
        setDateError("");
      }
    }
  };

  const handleGroup = (idx, field, val) =>
    setSeatGroups(prev =>
      prev.map((g, i) => i === idx ? { ...g, [field]: field === "variantId" ? val : Number(val) } : g)
    );

  const addGroup = () =>
    setSeatGroups(p => [
      ...p,
      { variantId: variants[0] ? String(variants[0].id) : "", rowCount: 5, seatsPerRow: 4 },
    ]);

  const removeGroup = idx => setSeatGroups(p => p.filter((_, i) => i !== idx));

  const totalSeats = seatGroups.reduce((s, g) => s + Number(g.rowCount) * Number(g.seatsPerRow), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError(null);

    if (!form.dueDate) {
      setDateError("Departure date and time is required.");
      return;
    }
    if (form.dueDate < getNowLocal()) {
      setDateError("Departure date cannot be in the past.");
      return;
    }

    if (!form.trainCompany.trim() || !form.fromId || !form.toId) {
      setServerError("Please fill in all required fields.");
      return;
    }
    if (form.fromId === form.toId) {
      setServerError("Departure and arrival locations cannot be the same.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        trainCompany: form.trainCompany,
        trainNumber:  form.trainNumber,
        vagonNumber:  Number(form.vagonNumber),
        dueDate:      toLocalISOString(form.dueDate),
        fromId:       Number(form.fromId),
        toId:         Number(form.toId),
        seatGroups:   seatGroups.map(g => ({
          variantId:   Number(g.variantId),
          rowCount:    Number(g.rowCount),
          seatsPerRow: Number(g.seatsPerRow),
        })),
      };

      const res  = await fetch(`${BASE_URL}/TrainTicket`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Server error occurred.");

      setSnapshotForm({ ...form });
      setSnapshotGroups([...seatGroups]);
      setFromName(locations.find(l => String(l.id) === String(form.fromId))?.name || "");
      setToName(locations.find(l => String(l.id) === String(form.toId))?.name || "");
      setCreatedTicket(json?.data ?? json);
      setIsGenerated(true);

      if (onCreated) onCreated(json.data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsGenerated(false);
    setCreatedTicket(null);
    setSnapshotForm(null);
    setSnapshotGroups([]);
    setServerError(null);
    setDateError("");
    setFromName("");
    setToName("");
    setForm({ trainCompany: "", trainNumber: "", vagonNumber: 1, dueDate: "", fromId: "", toId: "" });
    setSeatGroups([{ variantId: variants[0] ? String(variants[0].id) : "", rowCount: 5, seatsPerRow: 4 }]);
  };

  if (isGenerated) {
    const sf          = snapshotForm || form;
    const displayDate = sf.dueDate;
    const totalCreated = createdTicket?.totalTicketsCreated ?? totalSeats;

    return (
      <div className="ct-page">
        <div className="ct-wrapper" style={{ maxWidth: 760 }}>
          <div className="ct-header">
            <div className="ct-header-icon">🚆</div>
            <div>
              <h1 className="ct-title">Ticket Created</h1>
              <p className="ct-subtitle">Your train pass is ready</p>
            </div>
          </div>

          <div className="ct-success-wrap">
            <div className="ct-boarding-pass">
              <div className="ct-pass-left">
                <div className="ct-pass-header">
                  <div>
                    <div className="ct-pass-company">{sf.trainCompany}</div>
                    <div className="ct-pass-type">Train Ticket</div>
                  </div>
                  <div className="ct-pass-id">ID #{createdTicket?.id ?? "—"}</div>
                </div>

                <div className="ct-pass-route">
                  <div className="ct-route-city">
                    <div className="ct-route-code">{(fromName || "—").slice(0, 3).toUpperCase()}</div>
                    <div className="ct-route-name">{fromName}</div>
                  </div>
                  <div className="ct-route-middle">
                    <div className="ct-route-dot"/>
                    <div className="ct-route-dash"/>
                    <span className="ct-route-train">🚆</span>
                    <div className="ct-route-dash"/>
                    <div className="ct-route-dot"/>
                  </div>
                  <div className="ct-route-city ct-route-city--right">
                    <div className="ct-route-code">{(toName || "—").slice(0, 3).toUpperCase()}</div>
                    <div className="ct-route-name">{toName}</div>
                  </div>
                </div>

                <div className="ct-pass-info-grid">
                  {[
                    ["TRAIN NO",  sf.trainNumber || "—"],
                    ["WAGON",     sf.vagonNumber],
                    ["DATE",      fmtDate(displayDate)],
                    ["TIME",      fmtTime(displayDate)],
                    ["SEATS",     totalCreated],
                    ["GROUPS",    snapshotGroups.length],
                    ["COMPANY",   sf.trainCompany],
                    ["STATUS",    "ACTIVE"],
                  ].map(([label, val]) => (
                    <div key={label} className="ct-info-box">
                      <span>{label}</span>
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ct-perforation">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="ct-perf-dot"/>
                ))}
              </div>

              <div className="ct-pass-right">
                <div className="ct-stub-company">{sf.trainCompany}</div>
                <div className="ct-stub-route">
                  {(fromName || "—").slice(0, 3).toUpperCase()} → {(toName || "—").slice(0, 3).toUpperCase()}
                </div>
                {[
                  ["Train No", sf.trainNumber || "—"],
                  ["Wagon",    sf.vagonNumber],
                  ["Date",     fmtDate(displayDate)],
                  ["Time",     fmtTime(displayDate)],
                  ["Seats",    totalCreated],
                ].map(([k, v]) => (
                  <div key={k} className="ct-stub-row">
                    <span className="ct-stub-key">{k}</span>
                    <span className="ct-stub-val">{v}</span>
                  </div>
                ))}
                <div className="ct-barcode">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="ct-bar" style={{ height: `${45 + Math.sin(i * 1.9) * 20}%`, opacity: 0.5 + (i % 4) * 0.12 }}/>
                  ))}
                </div>
              </div>
            </div>

            <div className="ct-actions">
              <button className="ct-action-btn ct-action-btn--primary" onClick={resetForm}>+ New Ticket</button>
              <button className="ct-action-btn" onClick={() => navigate("/Show-Train-T")}>🚆 View Tickets</button>
              <button className="ct-action-btn" onClick={() => navigate("/")}>🏠 Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownProvider>
      <div className="ct-page">
        <div className="ct-wrapper">

          <div className="ct-header">
            <div className="ct-header-icon">🚆</div>
            <div>
              <h1 className="ct-title">Create Train Ticket</h1>
              <p className="ct-subtitle">Fill in travel details — seats will be generated automatically</p>
            </div>
          </div>

          {serverError && <div className="ct-alert ct-alert--error">{serverError}</div>}

          <form className="ct-form" onSubmit={handleSubmit} noValidate>

            <section className="ct-section">
              <h2 className="ct-section-title">🚂 Train Details</h2>
              <div className="ct-grid-2">
                <div className="ct-field">
                  <label>Company</label>
                  <input name="trainCompany" value={form.trainCompany} onChange={handleForm} placeholder="e.g. ADY" required />
                </div>
                <div className="ct-field">
                  <label>Train No</label>
                  <input name="trainNumber" value={form.trainNumber} onChange={handleForm} placeholder="e.g. T-100" />
                </div>

                <div className={`ct-field${dateError ? " ct-field--error" : ""}`}>
                  <label>Departure Date & Time</label>
                  <input
                    name="dueDate"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={handleForm}
                    min={getNowLocal()}
                  />
                  {dateError && (
                    <span className="ct-field-error">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5.3" stroke="#ff4d4d" strokeWidth="1.2"/>
                        <path d="M6 3.6v2.8" stroke="#ff4d4d" strokeWidth="1.3" strokeLinecap="round"/>
                        <circle cx="6" cy="8.4" r="0.6" fill="#ff4d4d"/>
                      </svg>
                      {dateError}
                    </span>
                  )}
                </div>

                <div className="ct-field">
                  <label>Wagon No</label>
                  <input name="vagonNumber" type="number" min={1} value={form.vagonNumber} onChange={handleForm} />
                </div>
              </div>
            </section>

            <section className="ct-section">
              <h2 className="ct-section-title">📍 Route</h2>
              <div className="ct-grid-2">
                <LocationDropdown id="loc-from" label="From" name="fromId" locations={locations} value={form.fromId} onChange={handleForm} loading={locLoading} />
                <LocationDropdown id="loc-to"   label="To"   name="toId"   locations={locations} value={form.toId}   onChange={handleForm} loading={locLoading} />
              </div>
            </section>

            <section className="ct-section">
              <h2 className="ct-section-title">💺 Classes & Seats</h2>

              {seatGroups.map((g, idx) => (
                <div key={idx} className="ct-group-box">
                  <div className="ct-group-header">
                    <span>Group {idx + 1}</span>
                    {seatGroups.length > 1 && (
                      <button type="button" className="ct-remove-btn" onClick={() => removeGroup(idx)}>Remove</button>
                    )}
                  </div>
                  <div className="ct-grid-3">
                    <VariantSelect
                      id={`variant-${idx}`}
                      variants={variants}
                      value={g.variantId}
                      onChange={(val) => handleGroup(idx, "variantId", val)}
                      loading={varLoading}
                    />
                    <div className="ct-field">
                      <label>Row Count</label>
                      <input type="number" min={1} value={g.rowCount} onChange={e => handleGroup(idx, "rowCount", e.target.value)} />
                    </div>
                    <div className="ct-field">
                      <label>Seats / Row</label>
                      <input type="number" min={1} max={12} value={g.seatsPerRow} onChange={e => handleGroup(idx, "seatsPerRow", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="ct-add-group-btn" onClick={addGroup}>+ Add New Class Group</button>
            </section>

            <button type="submit" className="ct-submit-btn" disabled={loading}>
              {loading ? "Creating..." : `🚆 Create Tickets (${totalSeats} seats)`}
            </button>

          </form>
        </div>
      </div>
    </DropdownProvider>
  );
}