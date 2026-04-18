import { useState, useEffect, useRef, useContext, createContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ticket.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DropdownContext = createContext(null);

function DropdownProvider({ children }) {
  const [openId, setOpenId] = useState(null);
  const close = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id) => setOpenId(prev => (prev === id ? null : id)), []);
  return (
    <DropdownContext.Provider value={{ openId, toggle, close }}>
      {children}
    </DropdownContext.Provider>
  );
}

const rules = {
  airline: (v) => {
    if (!v?.trim()) return "Airline name is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 100) return "Maximum 100 characters";
    if (!/^[a-zA-Z0-9 \-&().]+$/i.test(v.trim())) return "Only letters, numbers and - & ( ) .";
    return null;
  },
  gate: (v) => {
    if (!v?.trim()) return "Gate is required";
    if (v.length > 10) return "Maximum 10 characters";
    if (!/^[A-Za-z0-9\-]+$/.test(v.trim())) return "Only letters and numbers";
    return null;
  },
  plane: (v) => {
    if (!v?.trim()) return "Plane model is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 50) return "Maximum 50 characters";
    return null;
  },
  meal: (v) => {
    if (!v?.trim()) return "Meal type is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 50) return "Maximum 50 characters";
    return null;
  },
  luggageKg: (v) => {
    if (v === "" || v == null) return "Luggage amount is required";
    const n = Number(v);
    if (isNaN(n)) return "Enter a number";
    if (n < 0) return "Luggage cannot be negative";
    if (n > 100) return "Maximum 100 kg";
    return null;
  },
  dueDate: (v) => {
    if (!v) return "Flight date is required";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "Enter a valid date";
    if (d <= new Date()) return "Flight date must be in the future";
    const max = new Date();
    max.setFullYear(max.getFullYear() + 2);
    if (d > max) return "Date cannot be more than 2 years ahead";
    return null;
  },
  locationId: (v) => {
    if (!v || Number(v) < 1) return "Select a departure location";
    return null;
  },
  toLocationId: (v, form) => {
    if (!v || Number(v) < 1) return "Select an arrival location";
    if (form && String(v) === String(form.locationId)) return "Departure and arrival cannot be the same";
    return null;
  },
  variantId: (v) => {
    if (!v || Number(v) < 1) return "Select a variant";
    return null;
  },
  rowCount: (v) => {
    if (v === "" || v == null) return "Row count is required";
    const n = Number(v);
    if (!Number.isInteger(n) || isNaN(n)) return "Enter a whole number";
    if (n < 1) return "At least 1 row required";
    if (n > 50) return "Maximum 50 rows";
    return null;
  },
  seatsPerRow: (v) => {
    if (v === "" || v == null) return "Seats per row is required";
    const n = Number(v);
    if (!Number.isInteger(n) || isNaN(n)) return "Enter a whole number";
    if (n < 1) return "At least 1 seat per row";
    if (n > 12) return "Maximum 12 seats per row";
    return null;
  },
};

const ALL_FIELDS = [
  "airline","gate","plane","meal","luggageKg",
  "dueDate","locationId","toLocationId","variantId","rowCount","seatsPerRow",
];

function parseLocations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
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
  return parts.length < 2 ? "" : parts[1].slice(0, 5);
}

function toISO(str) {
  if (!str) return "";
  return str.length === 16 ? str + ":00.000Z" : str + ".000Z";
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
    FRANSA:"FR",FRANCE:"FR",TURKIYE:"TR",TURKEY:"TR","TÜRKİYE":"TR",
    AZERBAIJAN:"AZ",AZERBAYCAN:"AZ",GERMANY:"DE",DEUTSCHLAND:"DE",
    "UNITED KINGDOM":"GB",UK:"GB","UNITED STATES":"US",USA:"US",
    RUSSIA:"RU",ITALY:"IT",ITALIA:"IT",SPAIN:"ES",ESPANA:"ES",
  };
  return map[country] || country.slice(0,2) || "??";
}

function LocationAvatar({ location }) {
  const code = getCountryCode(location);
  const colors = countryColors[code] || countryColors.DEFAULT;
  return (
    <div className="loc-avatar" style={{ background: colors.bg, color: colors.text, border: `1.5px solid ${colors.text}30` }}>
      {code.slice(0,2)}
    </div>
  );
}

function LocationDropdown({ id, locations, value, onChange, onBlur, loading, error, touched, label }) {
  const { openId, toggle, close } = useContext(DropdownContext);
  const open = openId === id;
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const selected = locations.find(l => String(l.id) === String(value));
  const filtered = search.trim()
    ? locations.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        (l.country || "").toLowerCase().includes(search.toLowerCase())
      )
    : locations;

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        if (open) {
          close();
          setSearch("");
          if (onBlur) onBlur();
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close, onBlur]);

  const handleSelect = (loc) => {
    onChange({ target: { value: String(loc.id) } });
    close();
    setSearch("");
  };

  const handleToggle = () => {
    if (!loading) {
      if (open) setSearch("");
      toggle(id);
    }
  };

  return (
    <div className="cpt-field loc-field-wrap" ref={wrapRef}>
      <label>{label}</label>
      <div
        className={`loc-trigger${open ? " loc-trigger--open" : ""}${touched && error ? " cpt-input--error" : ""}`}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); } }}
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
          <span className="loc-trigger-placeholder">{loading ? "Loading..." : "— Select location —"}</span>
        )}
        <svg className={`loc-chevron${open ? " loc-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && (
        <div className="loc-panel">
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
        </div>
      )}
      {touched && error && <span className="cpt-field-error">⚠ {error}</span>}
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

function VariantSelect({ id, variants, value, onChange, onBlur, loading, error, touched }) {
  const { openId, toggle, close } = useContext(DropdownContext);
  const open = openId === id;
  const wrapRef = useRef(null);

  const selected = variants.find(v => String(v.id) === String(value));
  const meta = selected ? getVariantMeta(selected.name) : null;

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        if (open) {
          close();
          if (onBlur) onBlur();
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close, onBlur]);

  const handleToggle = () => {
    if (!loading) toggle(id);
  };

  return (
    <div className="cpt-field var-wrap" ref={wrapRef}>
      <label>Class (Variant)</label>

      <div
        className={`var-trigger${open ? " var-trigger--open" : ""}${touched && error ? " cpt-input--error" : ""}`}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); } }}
        role="combobox"
        aria-expanded={open}
      >
        {selected && meta ? (
          <span className="var-trigger-inner">
            <span className="var-trigger-icon" style={{ color: meta.color }}>{meta.icon}</span>
            <span className="var-trigger-name" style={{ color: meta.color }}>
              {selected.name.charAt(0).toUpperCase() + selected.name.slice(1)}
            </span>
            <span className="var-trigger-price">{selected.price} ₼</span>
          </span>
        ) : (
          <span className="var-trigger-placeholder">
            {loading ? "Loading..." : variants.length === 0 ? "— No variants —" : "— Select variant —"}
          </span>
        )}
        <svg className={`loc-chevron${open ? " loc-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && variants.length > 0 && (
        <div className="var-panel">
          {variants.map(v => {
            const m = getVariantMeta(v.name);
            const isSel = String(v.id) === String(value);
            return (
              <div
                key={v.id}
                className={`var-row${isSel ? " var-row--selected" : ""}`}
                style={{ "--vc": m.color }}
                onClick={() => { onChange(String(v.id)); close(); }}
              >
                <span className="var-row-icon">{m.icon}</span>
                <span className="var-row-name">
                  {v.name.charAt(0).toUpperCase() + v.name.slice(1)}
                </span>
                <span className="var-row-price">{v.price} ₼</span>
                {isSel && (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginLeft: 2 }}>
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke={m.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {touched && error && <span className="cpt-field-error">⚠ {error}</span>}
      {variants.length === 0 && !loading && (
        <span className="cpt-field-error" style={{ color: "#f59e0b" }}>⚠ Create a Variant in Admin panel first!</span>
      )}
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, min, max, step, value, onChange, onBlur, error, touched }) {
  return (
    <div className="cpt-field">
      <label>{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange} onBlur={onBlur}
        placeholder={placeholder} min={min} max={max} step={step} autoComplete="off"
        className={error && touched ? "cpt-input--error" : ""}
      />
      {touched && error && <span className="cpt-field-error">⚠ {error}</span>}
    </div>
  );
}

function SectionTitle({ icon, text }) {
  return <div className="cpt-section-title"><span>{icon}</span>{text}</div>;
}

export default function CreatePlaneTicket() {
  const navigate = useNavigate();
  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [touched, setTouched]   = useState({});
  const [errors, setErrors]     = useState({});
  const [locations, setLocations]   = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [variants, setVariants]     = useState([]);
  const [varLoading, setVarLoading] = useState(false);
  const [fromName, setFromName]     = useState("");
  const [toName, setToName]         = useState("");

  const [form, setForm] = useState({
    airline:"",gate:"",plane:"",meal:"",
    luggageKg:23,dueDate:"",
    locationId:"",toLocationId:"",
    variantId:"",rowCount:10,seatsPerRow:6,
  });

  useEffect(() => {
    setLocLoading(true);
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setLocations(parseLocations(d))).catch(() => {}).finally(() => setLocLoading(false));

    setVarLoading(true);
    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json()).then(d => {
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setVariants(list);
        if (list.length > 0) setForm(p => ({ ...p, variantId: list[0].id }));
      }).catch(() => {}).finally(() => setVarLoading(false));
  }, []);

  const validate = (name, value, currentForm) => {
    const fn = rules[name];
    return fn ? fn(String(value ?? ""), currentForm ?? form) : null;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const coerced = type === "number" ? (value === "" ? "" : Number(value)) : value;
    const newForm = { ...form, [name]: coerced };
    setForm(newForm);
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate(name, coerced, newForm) }));
    if (name === "locationId" && touched.toLocationId)
      setErrors(p => ({ ...p, toLocationId: validate("toLocationId", newForm.toLocationId, newForm) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };

  const handleFromLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, locationId: id };
    setForm(newForm);
    setFromName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(p => ({ ...p, locationId: true }));
    setErrors(p => ({
      ...p,
      locationId: validate("locationId", id, newForm),
      ...(touched.toLocationId ? { toLocationId: validate("toLocationId", newForm.toLocationId, newForm) } : {}),
    }));
  };

  const handleToLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, toLocationId: id };
    setForm(newForm);
    setToName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(p => ({ ...p, toLocationId: true }));
    setErrors(p => ({ ...p, toLocationId: validate("toLocationId", id, newForm) }));
  };

  const validateAll = () => {
    const newErrors = {}; const newTouched = {};
    ALL_FIELDS.forEach(f => { newTouched[f] = true; newErrors[f] = validate(f, String(form[f] ?? ""), form); });
    setTouched(newTouched); setErrors(newErrors);
    return Object.values(newErrors).every(e => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setServerError(null);
    if (!validateAll()) return;
    setLoading(true);
    const payload = {
      airline: form.airline.trim(), gate: form.gate.trim(), plane: form.plane.trim(), meal: form.meal.trim(),
      luggageKg: Number(form.luggageKg), dueDate: toISO(form.dueDate),
      fromId: Number(form.locationId), toId: Number(form.toLocationId),
      seatGroups: [{ variantId: Number(form.variantId), rowCount: Number(form.rowCount), seatsPerRow: Number(form.seatsPerRow) }],
    };
    try {
      const res = await fetch(`${BASE_URL}/PlaneTicket`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Server error: ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j?.errors) msg = Object.entries(j.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(", ") : e}`).join(" | ");
          else msg = j?.message || j?.title || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = JSON.parse(text); const ticket = data?.data ?? data;
      ticket._fromName = fromName; ticket._toName = toName; ticket._localDueDate = form.dueDate;
      setCreatedTicket(ticket); setIsGenerated(true);
    } catch (err) {
      setServerError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsGenerated(false); setCreatedTicket(null); setServerError(null);
    setTouched({}); setErrors({}); setFromName(""); setToName("");
    setForm({ airline:"",gate:"",plane:"",meal:"",luggageKg:23,dueDate:"",locationId:"",toLocationId:"",variantId:variants[0]?.id??"",rowCount:10,seatsPerRow:6 });
  };

  const displayDate = createdTicket?._localDueDate || form.dueDate;
  const displayFrom = createdTicket?._fromName || fromName;
  const displayTo   = createdTicket?._toName || toName;
  const totalSeats  = createdTicket?.totalTicketsCreated ?? (Number(form.rowCount) * Number(form.seatsPerRow));

  if (!isGenerated) return (
    <DropdownProvider>
      <div className="cpt-page">
        <div className="cpt-wrapper">
          <div className="cpt-header">
            <div className="cpt-header-icon">✈️</div>
            <div>
              <h1 className="cpt-title">Create Plane Ticket</h1>
              <p className="cpt-subtitle">Fill in flight details — seats will be generated automatically</p>
            </div>
          </div>

          {serverError && <div className="cpt-alert cpt-alert--error">⚠️ {serverError}</div>}

          <div className="cpt-form-card">
            <form onSubmit={handleSubmit} noValidate>

              <SectionTitle icon="✈" text="Flight Details" />
              <div className="cpt-grid-2">
                <Field label="Airline" name="airline" placeholder="e.g. AZAL" value={form.airline} onChange={handleChange} onBlur={handleBlur} error={errors.airline} touched={touched.airline}/>
                <Field label="Gate" name="gate" placeholder="e.g. A12" value={form.gate} onChange={handleChange} onBlur={handleBlur} error={errors.gate} touched={touched.gate}/>
                <Field label="Plane Model" name="plane" placeholder="e.g. Boeing 737" value={form.plane} onChange={handleChange} onBlur={handleBlur} error={errors.plane} touched={touched.plane}/>
                <Field label="Meal Type" name="meal" placeholder="e.g. Standard" value={form.meal} onChange={handleChange} onBlur={handleBlur} error={errors.meal} touched={touched.meal}/>
              </div>
              <div className="cpt-grid-2" style={{ marginTop: 14 }}>
                <Field label="Luggage (kg) — max 100" name="luggageKg" type="number" min="0" max="100" step="0.5" value={form.luggageKg} onChange={handleChange} onBlur={handleBlur} error={errors.luggageKg} touched={touched.luggageKg}/>
                <Field label="Departure Date & Time" name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleChange} onBlur={handleBlur} error={errors.dueDate} touched={touched.dueDate}/>
              </div>
              {form.dueDate && !errors.dueDate && (
                <div className="cpt-hint-banner">🗓 {fmtDate(form.dueDate)} at {fmtTime(form.dueDate)}</div>
              )}

              <SectionTitle icon="📍" text="Route" />
              <div className="cpt-grid-2">
                <LocationDropdown
                  id="loc-from"
                  label="From"
                  locations={locations}
                  value={form.locationId}
                  onChange={handleFromLocation}
                  onBlur={() => { setTouched(p => ({ ...p, locationId: true })); setErrors(p => ({ ...p, locationId: validate("locationId", form.locationId) })); }}
                  loading={locLoading}
                  error={errors.locationId}
                  touched={touched.locationId}
                />
                <LocationDropdown
                  id="loc-to"
                  label="To"
                  locations={locations}
                  value={form.toLocationId}
                  onChange={handleToLocation}
                  onBlur={() => { setTouched(p => ({ ...p, toLocationId: true })); setErrors(p => ({ ...p, toLocationId: validate("toLocationId", form.toLocationId, form) })); }}
                  loading={locLoading}
                  error={errors.toLocationId}
                  touched={touched.toLocationId}
                />
              </div>

              <SectionTitle icon="💺" text="Seat Configuration" />
              <div className="cpt-grid-3">
                <VariantSelect
                  id="variant-select"
                  variants={variants}
                  value={form.variantId}
                  onChange={(val) => { setForm(p => ({ ...p, variantId: val })); if (touched.variantId) setErrors(p => ({ ...p, variantId: validate("variantId", val) })); }}
                  onBlur={() => { setTouched(p => ({ ...p, variantId: true })); setErrors(p => ({ ...p, variantId: validate("variantId", form.variantId) })); }}
                  loading={varLoading}
                  error={errors.variantId}
                  touched={touched.variantId}
                />
                <Field label="Row Count (max 50)" name="rowCount" type="number" min="1" max="50" value={form.rowCount} onChange={handleChange} onBlur={handleBlur} error={errors.rowCount} touched={touched.rowCount}/>
                <Field label="Seats / Row (max 12)" name="seatsPerRow" type="number" min="1" max="12" value={form.seatsPerRow} onChange={handleChange} onBlur={handleBlur} error={errors.seatsPerRow} touched={touched.seatsPerRow}/>
              </div>

              {!errors.rowCount && !errors.seatsPerRow && form.rowCount && form.seatsPerRow && (
                <div className="cpt-hint-banner" style={{ marginTop: 10 }}>
                  💺 {Number(form.rowCount) * Number(form.seatsPerRow)} seats will be created ({form.rowCount} rows × {form.seatsPerRow} seats)
                </div>
              )}

              <button type="submit" className="cpt-submit-btn" disabled={loading}>
                {loading ? <><span className="cpt-spinner"/> Creating...</> : "✈ Create Ticket"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DropdownProvider>
  );

  return (
    <div className="cpt-page">
      <div className="cpt-wrapper" style={{ maxWidth: 760 }}>
        <div className="cpt-header">
          <div className="cpt-header-icon">✈️</div>
          <div>
            <h1 className="cpt-title">Ticket Created</h1>
            <p className="cpt-subtitle">Your boarding pass is ready</p>
          </div>
        </div>
        <div className="cpt-success-wrap">
          <div className="cpt-boarding-pass">
            <div className="cpt-pass-left">
              <div className="cpt-pass-header">
                <div>
                  <div className="cpt-pass-airline">{createdTicket?.airline || form.airline}</div>
                  <div className="cpt-pass-type">Boarding Pass</div>
                </div>
                <div className="cpt-pass-id">ID #{createdTicket?.id ?? "—"}</div>
              </div>
              <div className="cpt-pass-route">
                <div className="cpt-route-city">
                  <div className="cpt-route-code">{(displayFrom || "—").slice(0,3).toUpperCase()}</div>
                  <div className="cpt-route-name">{displayFrom}</div>
                </div>
                <div className="cpt-route-middle">
                  <div className="cpt-route-dot"/><div className="cpt-route-dash"/>
                  <span className="cpt-route-plane">✈</span>
                  <div className="cpt-route-dash"/><div className="cpt-route-dot"/>
                </div>
                <div className="cpt-route-city cpt-route-city--right">
                  <div className="cpt-route-code">{(displayTo || "—").slice(0,3).toUpperCase()}</div>
                  <div className="cpt-route-name">{displayTo}</div>
                </div>
              </div>
              <div className="cpt-pass-info-grid">
                {[
                  ["GATE", createdTicket?.gate || form.gate],
                  ["PLANE", createdTicket?.plane || form.plane],
                  ["MEAL", createdTicket?.meal || form.meal],
                  ["LUGGAGE", `${createdTicket?.luggageKg ?? form.luggageKg} kg`],
                  ["DATE", fmtDate(displayDate)],
                  ["TIME", fmtTime(displayDate)],
                  ["SEATS", totalSeats],
                  ["STATUS", "ACTIVE"],
                ].map(([label, val]) => (
                  <div key={label} className="cpt-info-box"><span>{label}</span><strong>{val}</strong></div>
                ))}
              </div>
            </div>
            <div className="cpt-perforation">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="cpt-perf-dot"/>)}
            </div>
            <div className="cpt-pass-right">
              <div className="cpt-stub-airline">{createdTicket?.airline || form.airline}</div>
              <div className="cpt-stub-route">{(displayFrom || "—").slice(0,3).toUpperCase()} → {(displayTo || "—").slice(0,3).toUpperCase()}</div>
              {[
                ["Gate", createdTicket?.gate || form.gate],
                ["Plane", createdTicket?.plane || form.plane],
                ["Date", fmtDate(displayDate)],
                ["Time", fmtTime(displayDate)],
                ["Seats", totalSeats],
              ].map(([k, v]) => (
                <div key={k} className="cpt-stub-row">
                  <span className="cpt-stub-key">{k}</span>
                  <span className="cpt-stub-val">{v}</span>
                </div>
              ))}
              <div className="cpt-barcode">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="cpt-bar" style={{ height: `${45 + Math.sin(i * 1.9) * 20}%`, opacity: 0.5 + (i % 4) * 0.12 }}/>
                ))}
              </div>
            </div>
          </div>
          <div className="cpt-actions">
            <button className="cpt-action-btn cpt-action-btn--primary" onClick={resetForm}>+ New Ticket</button>
            <button className="cpt-action-btn" onClick={() => navigate("/show-plane-ticket")}>✈ View Tickets</button>
            <button className="cpt-action-btn" onClick={() => navigate("/")}>🏠 Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}