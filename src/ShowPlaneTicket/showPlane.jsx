import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./showPlane.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function getUserRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload["role"] ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null
    );
  } catch {
    return null;
  }
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d)
    .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function countdown(d) {
  if (!d) return "—";
  const now = new Date();
  const target = new Date(d);
  if (isNaN(target.getTime())) return "—";

  const nowDay    = new Date(now.getFullYear(),    now.getMonth(),    now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const days = Math.round((targetDay - nowDay) / 86400000);

  if (days < 0)  return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

function isExpired(dueDate) {
  return dueDate && new Date(dueDate) < new Date();
}

function toDatetimeLocal(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const offset = dt.getTimezoneOffset() * 60000;
  const local  = new Date(dt.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

const VARIANT_COLORS = {
  "first class": { accent: "#c9a84c", bg: "rgba(201,168,76,0.15)", label: "✦ First Class" },
  business:      { accent: "#7eb8f7", bg: "rgba(126,184,247,0.15)", label: "◈ Business" },
  economy:       { accent: "#a0a8c0", bg: "rgba(160,168,192,0.15)", label: "◇ Economy" },
};

function getVariantMeta(name = "") {
  return (
    VARIANT_COLORS[name.toLowerCase()] || {
      accent: "#ff8080",
      bg: "rgba(255,128,128,0.12)",
      label: name,
    }
  );
}

function stateBadge(state) {
  const s = (STATE_NUM_TO_NAME[state] ?? state ?? "").toString().toLowerCase();
  if (s === "pending")   return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", label: "⏳ Pending" };
  if (s === "available") return { color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.35)", label: "✅ Available" };
  if (s === "booked")    return { color: "#7eb8f7", bg: "rgba(126,184,247,0.15)", border: "rgba(126,184,247,0.35)", label: "🔒 Booked" };
  if (s === "canceled")  return { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)", label: "❌ Canceled" };
  return { color: "#a0a8c0", bg: "rgba(160,168,192,0.1)", border: "rgba(160,168,192,0.3)", label: state };
}

const STATE_MAP = { Pending: 0, Available: 1, Booked: 2, Canceled: 4 };
const STATE_NUM_TO_NAME = { 0: "Pending", 1: "Available", 2: "Booked", 4: "Canceled" };

function normalizeState(state) {
  if (typeof state === "number") return STATE_NUM_TO_NAME[state] ?? "Available";
  if (typeof state === "string" && state in STATE_MAP) return state;
  const n = parseInt(state, 10);
  if (!isNaN(n) && n in STATE_NUM_TO_NAME) return STATE_NUM_TO_NAME[n];
  return state ?? "Available";
}

const COUNTRY_DATA = {
  france:       { code: "FR", flag: "🇫🇷" },
  turkey:       { code: "TR", flag: "🇹🇷" },
  türkiye:      { code: "TR", flag: "🇹🇷" },
  turkiye:      { code: "TR", flag: "🇹🇷" },
  azerbaijan:   { code: "AZ", flag: "🇦🇿" },
  azerbaycan:   { code: "AZ", flag: "🇦🇿" },
  germany:      { code: "DE", flag: "🇩🇪" },
  uk:           { code: "GB", flag: "🇬🇧" },
  "united kingdom": { code: "GB", flag: "🇬🇧" },
  russia:       { code: "RU", flag: "🇷🇺" },
  usa:          { code: "US", flag: "🇺🇸" },
  "united states": { code: "US", flag: "🇺🇸" },
  italy:        { code: "IT", flag: "🇮🇹" },
  spain:        { code: "ES", flag: "🇪🇸" },
  china:        { code: "CN", flag: "🇨🇳" },
  japan:        { code: "JP", flag: "🇯🇵" },
  uae:          { code: "AE", flag: "🇦🇪" },
  "united arab emirates": { code: "AE", flag: "🇦🇪" },
  georgia:      { code: "GE", flag: "🇬🇪" },
  netherlands:  { code: "NL", flag: "🇳🇱" },
  belgium:      { code: "BE", flag: "🇧🇪" },
  switzerland:  { code: "CH", flag: "🇨🇭" },
  austria:      { code: "AT", flag: "🇦🇹" },
  poland:       { code: "PL", flag: "🇵🇱" },
  czechia:      { code: "CZ", flag: "🇨🇿" },
  ukraine:      { code: "UA", flag: "🇺🇦" },
  kazakhstan:   { code: "KZ", flag: "🇰🇿" },
  iran:         { code: "IR", flag: "🇮🇷" },
};

function getCountryMeta(countryName = "") {
  const key = countryName.toLowerCase().trim();
  return COUNTRY_DATA[key] || { code: countryName.slice(0, 2).toUpperCase(), flag: "🌐" };
}

function extractVariants(ticket) {
  const names = new Set();
  if (Array.isArray(ticket.seatGroups)) ticket.seatGroups.forEach(g => { if (g.variantName) names.add(g.variantName.trim()); });
  if (Array.isArray(ticket.variantGroups)) ticket.variantGroups.forEach(g => { if (g.variantName || g.name) names.add((g.variantName || g.name).trim()); });
  if (Array.isArray(ticket.variants)) ticket.variants.forEach(v => { if (v.name) names.add(v.name.trim()); });
  if (names.size === 0 && ticket.variantName?.trim()) names.add(ticket.variantName.trim());
  return [...names];
}

function LocationSelect({ label, value, onChange, locations, placeholder = "— All Locations —" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const selected = locations.find(l => String(l.id) === String(value));

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const updatePos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePos();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  const handleOpen = () => { updatePos(); setOpen(o => !o); };
  const filtered = locations.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.country?.toLowerCase().includes(search.toLowerCase())
  );
  const handleSelect = (id) => { onChange(id); setOpen(false); setSearch(""); };

  const dropdown = open ? createPortal(
    <div className="loc-dropdown" style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
      <div className="loc-search-wrap">
        <span className="loc-search-icon">🔍</span>
        <input className="loc-search-input" placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
      </div>
      <div className="loc-list">
        <button type="button" className={`loc-item loc-item--all ${!value ? "loc-item--active" : ""}`} onClick={() => handleSelect("")}>
          <span className="loc-item-icon">🌍</span>
          <div className="loc-item-text"><span className="loc-item-all-label">All Locations</span></div>
          {!value && <span className="loc-item-check">✓</span>}
        </button>
        {filtered.length === 0 && <div className="loc-no-results">No locations found</div>}
        {filtered.map(loc => {
          const meta = getCountryMeta(loc.country || "");
          const isActive = String(loc.id) === String(value);
          return (
            <button type="button" key={loc.id} className={`loc-item ${isActive ? "loc-item--active" : ""}`} onClick={() => handleSelect(String(loc.id))}>
              <span className="loc-item-avatar" data-code={meta.code}>{meta.flag}</span>
              <div className="loc-item-text">
                <span className="loc-item-country">{(loc.country || "").toUpperCase()}</span>
                <span className="loc-item-city">{loc.name}</span>
              </div>
              {isActive && <span className="loc-item-check">✓</span>}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="loc-select-wrap" ref={ref}>
      <label className="loc-select-label">{label}</label>
      <button ref={triggerRef} type="button" className={`loc-select-trigger ${open ? "loc-select-trigger--open" : ""}`} onClick={handleOpen}>
        {selected ? (
          <span className="loc-trigger-inner">
            <span className="loc-trigger-flag">{getCountryMeta(selected.country || "").flag}</span>
            <span className="loc-trigger-name">{selected.name}</span>
          </span>
        ) : (
          <span className="loc-trigger-placeholder">{placeholder}</span>
        )}
        <span className={`loc-trigger-chevron ${open ? "loc-trigger-chevron--up" : ""}`}>›</span>
      </button>
      {dropdown}
    </div>
  );
}

function ConfirmDeleteModal({ ticketId, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-modal-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">🗑️</div>
        <div className="confirm-title">Delete Ticket</div>
        <div className="confirm-desc">
          Are you sure you want to delete <strong>Ticket #{ticketId}</strong>?<br />
          This action cannot be undone.
        </div>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="confirm-delete-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`spt-toast spt-toast--${type}`}>
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span>{message}</span>
      <button className="spt-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

function EditModal({ ticket, onClose, onSaved }) {
  const currentStateName = normalizeState(ticket.state);

  const [form, setForm] = useState({
    id:        ticket.id,
    airline:   ticket.airline   || "",
    gate:      ticket.gate      || "",
    plane:     ticket.plane     || "",
    meal:      ticket.meal      || "",
    luggageKg: ticket.luggageKg ?? 0,
    state:     currentStateName,
    dueDate:   toDatetimeLocal(ticket.dueDate),
  });
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.airline.trim()) errs.airline = "Airline is required.";
    else if (form.airline.trim().length < 2) errs.airline = "Airline must be at least 2 characters.";
    else if (form.airline.trim().length > 60) errs.airline = "Airline must be at most 60 characters.";
    else if (!/^[a-zA-Z0-9 .'\-&]+$/.test(form.airline.trim())) errs.airline = "Airline contains invalid characters.";

    if (!form.gate.trim()) errs.gate = "Gate is required.";
    else if (form.gate.trim().length > 10) errs.gate = "Gate must be at most 10 characters.";
    else if (!/^[A-Za-z0-9\-]+$/.test(form.gate.trim())) errs.gate = "Gate must be letters and numbers only (e.g. A12).";

    if (!form.plane.trim()) errs.plane = "Plane is required.";
    else if (form.plane.trim().length < 2) errs.plane = "Plane must be at least 2 characters.";
    else if (form.plane.trim().length > 60) errs.plane = "Plane must be at most 60 characters.";

    if (!form.meal.trim()) errs.meal = "Meal is required (e.g. Standard, Vegetarian).";
    else if (form.meal.trim().length > 50) errs.meal = "Meal must be at most 50 characters.";

    const kg = Number(form.luggageKg);
    if (String(form.luggageKg).trim() === "" || isNaN(kg)) errs.luggageKg = "Luggage must be a number.";
    else if (kg < 0) errs.luggageKg = "Luggage cannot be negative.";
    else if (kg > 500) errs.luggageKg = "Luggage cannot exceed 500 kg.";
    else if (!Number.isInteger(kg * 10)) errs.luggageKg = "Max 1 decimal place allowed (e.g. 23.5).";

    if (!form.dueDate) errs.dueDate = "Flight date and time is required.";
    else {
      const dt = new Date(form.dueDate);
      if (isNaN(dt.getTime())) errs.dueDate = "Invalid date and time.";
    }

    return errs;
  };

  const handleSubmit = async () => {
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setValidationErrors(errs); return; }
    setValidationErrors({});
    setSaving(true);
    try {
      const newDueDate = new Date(form.dueDate).toISOString();

      const body = {
        airline:   ticket.airline,
        plane:     ticket.plane,
        gate:      ticket.gate,
        meal:      ticket.meal,
        luggageKg: ticket.luggageKg ?? 0,
        dueDate:   ticket.dueDate,
        fromId:    ticket.fromId,
        toId:      ticket.toId,
        variantId: ticket.variantId ?? null,

        newAirline:   form.airline.trim(),
        newGate:      form.gate.trim(),
        newMeal:      form.meal.trim() || "Standard",
        newLuggageKg: parseFloat(form.luggageKg) || 0,
        newState:     STATE_MAP[form.state] ?? 1,
        newDueDate:   newDueDate,
      };

      const res = await fetch(`${BASE_URL}/PlaneTicket`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || (json?.errors ? JSON.stringify(json.errors) : "Update failed."));

      onSaved({
        id:          ticket.id,
        airline:     form.airline.trim(),
        gate:        form.gate.trim(),
        plane:       form.plane.trim(),
        meal:        form.meal.trim() || "Standard",
        luggageKg:   parseFloat(form.luggageKg) || 0,
        variantId:   ticket.variantId,
        variantName: ticket.variantName,
        state:       form.state,
        dueDate:     newDueDate,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const stateOptions = Object.keys(STATE_MAP);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box edit-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="edit-modal-title">✏️ Edit Ticket #{ticket.id}</div>
        {error && <div className="seatmap-error">⚠ {error}</div>}
        <div className="edit-form">
          <div className="edit-field">
            <label>Airline <span className="edit-required">*</span></label>
            <input name="airline" value={form.airline} onChange={handleChange} placeholder="e.g. AZAL"
              className={validationErrors.airline ? "edit-input--error" : ""} />
            {validationErrors.airline && <span className="edit-field-error">{validationErrors.airline}</span>}
          </div>

          <div className="edit-field">
            <label>Gate <span className="edit-required">*</span></label>
            <input name="gate" value={form.gate} onChange={handleChange} placeholder="e.g. A12"
              className={validationErrors.gate ? "edit-input--error" : ""} />
            {validationErrors.gate && <span className="edit-field-error">{validationErrors.gate}</span>}
          </div>

          <div className="edit-field">
            <label>Plane <span className="edit-required">*</span></label>
            <input name="plane" value={form.plane} onChange={handleChange} placeholder="e.g. Boeing 737"
              className={validationErrors.plane ? "edit-input--error" : ""} />
            {validationErrors.plane && <span className="edit-field-error">{validationErrors.plane}</span>}
          </div>

          <div className="edit-field">
            <label>Meal</label>
            <input name="meal" value={form.meal} onChange={handleChange} placeholder="e.g. Vegetarian"
              className={validationErrors.meal ? "edit-input--error" : ""} />
            {validationErrors.meal && <span className="edit-field-error">{validationErrors.meal}</span>}
          </div>

          <div className="edit-field">
            <label>Luggage (kg)</label>
            <input name="luggageKg" type="number" min={0} value={form.luggageKg} onChange={handleChange}
              className={validationErrors.luggageKg ? "edit-input--error" : ""} />
            {validationErrors.luggageKg && <span className="edit-field-error">{validationErrors.luggageKg}</span>}
          </div>

          <div className="edit-field">
            <label>Flight Date &amp; Time <span className="edit-required">*</span></label>
            <input name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleChange}
              className={validationErrors.dueDate ? "edit-input--error" : ""} />
            {validationErrors.dueDate && <span className="edit-field-error">{validationErrors.dueDate}</span>}
          </div>

          <div className="edit-field edit-field--full">
            <label>State</label>
            <div className="state-option-list state-option-list--inline">
              {stateOptions.map(opt => {
                const sb       = stateBadge(opt);
                const isActive = opt === form.state;
                return (
                  <button key={opt} type="button"
                    className={`state-option-btn${isActive ? " state-option-btn--active" : ""}`}
                    style={{ "--s-color": sb.color, "--s-bg": sb.bg, "--s-border": sb.border }}
                    onClick={() => setForm(f => ({ ...f, state: opt }))}>
                    {sb.label}
                    {isActive && <span className="state-option-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="edit-actions">
          <button className="edit-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="edit-save-btn" onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function SeatButton({ seat }) {
  const meta = getVariantMeta(seat.variantName);
  return (
    <div className="seat-wrapper">
      <button
        className={`seat-btn ${seat.isOccupied ? "seat--occupied" : "seat--free"}`}
        style={{ "--accent": meta.accent, "--accent-bg": meta.bg }}
        aria-label={`${seat.name} - ${seat.variantName} - ${seat.isOccupied ? "Occupied" : "Available"}`}
      >
        <span className="seat-label">{seat.name}</span>
        {seat.isOccupied
          ? <span className="seat-booked-label">BOOKED</span>
          : <span className="seat-dot" />
        }
      </button>
    </div>
  );
}

function SeatMapModal({ ticket, onClose }) {
  const [seats,   setSeats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=plane`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Seats could not be loaded");
        const data = await res.json();
        const list = data?.data ?? data ?? [];
        setSeats(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticket.id]);

  const parsedSeats  = seats.map(s => {
    const match = s.name.match(/^(\d+)([A-Z]+)$/);
    return { ...s, row: match ? parseInt(match[1]) : 0, col: match ? match[2] : "" };
  });
  const maxRow       = parsedSeats.reduce((m, s) => Math.max(m, s.row), 0);
  const cols         = [...new Set(parsedSeats.map(s => s.col))].sort();
  const displayCols  = cols.length >= 6 ? [cols[0], cols[1], cols[2], "", cols[3], cols[4], cols[5]] : cols;
  const seatIndex    = {};
  parsedSeats.forEach(s => { seatIndex[s.name] = s; });
  const variantLegend = [...new Set(seats.map(s => s.variantName))];
  const available     = seats.filter(s => !s.isOccupied).length;
  const occupied      = seats.filter(s =>  s.isOccupied).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <div className="modal-airline">{ticket.airline}</div>
          <div className="modal-route">
            <span>{(ticket.from || "—").split(",")[0]}</span>
            <span className="modal-plane-icon">✈</span>
            <span>{(ticket.to   || "—").split(",")[0]}</span>
          </div>
          <div className="modal-meta">
            <span>Gate: <strong>{ticket.gate}</strong></span>
            <span>{fmtDate(ticket.dueDate)} · {fmtTime(ticket.dueDate)}</span>
          </div>
        </div>
        <div className="modal-stats">
          <div className="modal-stat modal-stat--free">🟢 {available} Available</div>
          <div className="modal-stat modal-stat--occ">🔴 {occupied} Occupied</div>
          <div className="modal-stat">💺 {seats.length} Total</div>
        </div>
        {variantLegend.length > 0 && (
          <div className="seatmap-legend">
            {variantLegend.map(v => {
              const m = getVariantMeta(v);
              return (
                <div key={v} className="legend-item">
                  <span className="legend-dot" style={{ background: m.accent }} />
                  {m.label}
                </div>
              );
            })}
            <div className="legend-item">
              <span className="legend-dot legend-dot--occ" />
              Occupied
            </div>
          </div>
        )}
        {loading && <div className="seatmap-loading">Loading seats...</div>}
        {error   && <div className="seatmap-error">⚠ {error}</div>}
        {!loading && !error && seats.length > 0 && (
          <div className="seatmap-cabin">
            <div className="seat-row seat-row--header">
              <span className="row-num" />
              {displayCols.map((col, ci) =>
                col === ""
                  ? <span key={`aisle-${ci}`} className="aisle-spacer" />
                  : <span key={col} className="col-header">{col}</span>
              )}
            </div>
            {Array.from({ length: maxRow }, (_, ri) => {
              const rowNum = ri + 1;
              return (
                <div key={rowNum} className="seat-row">
                  <span className="row-num">{rowNum}</span>
                  {displayCols.map((col, ci) => {
                    if (col === "") return <span key={`aisle-${ci}`} className="aisle-spacer" />;
                    const name = `${rowNum}${col}`;
                    const seat = seatIndex[name];
                    if (!seat) return <span key={name} className="seat-empty" />;
                    return <SeatButton key={name} seat={seat} />;
                  })}
                </div>
              );
            })}
          </div>
        )}
        {!loading && !error && seats.length === 0 && <div className="seatmap-empty">No seats found for this ticket.</div>}
      </div>
    </div>
  );
}

function VariantBadgeRow({ ticket }) {
  const [variantNames, setVariantNames] = useState(() => extractVariants(ticket));

  useEffect(() => {
    fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=plane`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const list   = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const unique = [...new Set(list.map(s => s.variantName).filter(Boolean))];
        if (unique.length > 0) setVariantNames(unique);
      })
      .catch(() => {});
  }, [ticket.id]);

  if (variantNames.length === 0) return null;
  return (
    <>
      {variantNames.map(name => {
        const meta  = getVariantMeta(name);
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        return (
          <span key={name} className="spt-variant-badge"
            style={{ color: meta.accent, background: meta.bg, borderColor: meta.accent + "55" }}>
            {meta.label || label}
          </span>
        );
      })}
    </>
  );
}

function TicketCard({ ticket, isNew, role, onDeleted, onEdited, onStateChanged, onToast }) {
  const [showSeats,    setShowSeats]    = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [currentState, setCurrentState] = useState(() => normalizeState(ticket.state));

  const editedDueDateRef = useRef(null);
  const displayDueDate = editedDueDateRef.current ?? ticket.dueDate;

  const prevTicketIdRef = useRef(ticket.id);
  useEffect(() => {
    if (prevTicketIdRef.current !== ticket.id) {
      prevTicketIdRef.current = ticket.id;
      editedDueDateRef.current = null;
    }
  }, [ticket.id]);

  useEffect(() => {
    setCurrentState(normalizeState(ticket.state));
  }, [ticket.state]);

  const isAdmin   = role === "Admin";
  const isCompany = role === "Company";
  const sb        = stateBadge(currentState);

  const handleDeleteConfirmed = async () => {
    setShowConfirm(false);
    setDeleting(true);
    try {
      const res  = await fetch(`${BASE_URL}/PlaneTicket/${ticket.id}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to delete ticket #${ticket.id}.`);
      onToast(`Ticket #${ticket.id} has been successfully deleted.`, "success");
      onDeleted(ticket.id);
    } catch (err) {
      onToast(`Failed to delete ticket: ${err.message}`, "error");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className={`spt-card ${isNew ? "spt-card--new" : ""}`}>
        {isNew && <div className="spt-card-new-badge">NEW</div>}

        <div className="spt-card-topbar">
          <div className="spt-card-airline">{ticket.airline}</div>
          {(isAdmin || isCompany) && (
            <div className="spt-card-actions">
              <button className="spt-action-btn spt-action-btn--edit" onClick={() => setShowEdit(true)} title="Edit Ticket">✏️</button>
              {isAdmin && (
                <button className="spt-action-btn spt-action-btn--delete" onClick={() => setShowConfirm(true)} disabled={deleting} title="Delete Ticket">
                  {deleting ? "…" : "🗑️"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="spt-card-state-row">
          <span className="spt-state-badge" style={{ color: sb.color, background: sb.bg, borderColor: sb.border }}>
            {sb.label}
          </span>
          <VariantBadgeRow ticket={ticket} />
        </div>

        <div className="spt-card-route">
          <div className="spt-card-city">
            <span className="spt-card-city-code">{(ticket.from || "—").split(",")[0].slice(0, 3).toUpperCase()}</span>
            <span className="spt-card-city-name">{(ticket.from || "—").split(",")[0]}</span>
          </div>
          <div className="spt-card-route-line">
            <div className="spt-card-route-dot" />
            <div className="spt-card-route-dash" />
            <span className="spt-card-plane">✈</span>
            <div className="spt-card-route-dash" />
            <div className="spt-card-route-dot" />
          </div>
          <div className="spt-card-city spt-card-city--right">
            <span className="spt-card-city-code">{(ticket.to || "—").split(",")[0].slice(0, 3).toUpperCase()}</span>
            <span className="spt-card-city-name">{(ticket.to || "—").split(",")[0]}</span>
          </div>
        </div>

        <div className="spt-card-info">
          {[
            ["DATE",    fmtDate(displayDueDate)],
            ["TIME",    fmtTime(displayDueDate)],
            ["GATE",    ticket.gate],
            ["PLANE",   ticket.plane],
            ["MEAL",    ticket.meal || "—"],
            ["LUGGAGE", `${ticket.luggageKg ?? "—"} kg`],
            ["PRICE",   ticket.price > 0 ? `${ticket.price} ₼` : "—", "price"],
            ["SEATS",   ticket.availableSeats, ticket.availableSeats < 5 ? "low" : "ok"],
          ].map(([label, val, mod]) => (
            <div key={label} className="spt-info-item">
              <span className="spt-info-label">{label}</span>
              <span className={`spt-info-val${mod ? ` spt-info-val--${mod}` : ""}`}>{val}</span>
            </div>
          ))}
        </div>

        <div className="spt-card-countdown">🕐 {countdown(displayDueDate)}</div>

        <button className="spt-seatmap-btn" onClick={() => setShowSeats(true)}>
          💺 Seat Map
        </button>
      </div>

      {showSeats && (
        <SeatMapModal
          ticket={{ ...ticket, dueDate: displayDueDate }}
          onClose={() => setShowSeats(false)}
        />
      )}

      {showEdit && (
        <EditModal
          ticket={{ ...ticket, state: currentState, dueDate: displayDueDate }}
          onClose={() => setShowEdit(false)}
          onSaved={updatedBody => {
            const newState = normalizeState(updatedBody.state);
            setCurrentState(newState);
            if (updatedBody.dueDate) {
              editedDueDateRef.current = updatedBody.dueDate;
            }
            onEdited({ ...updatedBody, state: newState });
          }}
        />
      )}

      {showConfirm && (
        <ConfirmDeleteModal
          ticketId={ticket.id}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export default function ShowPlaneTicket() {
  const navigate = useNavigate();
  const role     = getUserRole();

  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [toast,      setToast]      = useState(null);

  const [airline,    setAirline]    = useState("");
  const [fromId,     setFromId]     = useState("");
  const [toId,       setToId]       = useState("");
  const [date,       setDate]       = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [locations, setLocations] = useState([]);
  const [newTicketId] = useState(() => {
    const v = sessionStorage.getItem("newPlaneTicketId");
    if (v) sessionStorage.removeItem("newPlaneTicketId");
    return v ? parseInt(v) : null;
  });
  const [highlightId, setHighlightId] = useState(newTicketId);

  const editedMap = useRef({});

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  const triggerFetch = useCallback(() => setFetchTrigger(n => n + 1), []);

  const airlineRef    = useRef(airline);
  const fromIdRef     = useRef(fromId);
  const toIdRef       = useRef(toId);
  const dateRef       = useRef(date);
  const pageNumberRef = useRef(pageNumber);
  useEffect(() => { airlineRef.current    = airline;    }, [airline]);
  useEffect(() => { fromIdRef.current     = fromId;     }, [fromId]);
  useEffect(() => { toIdRef.current       = toId;       }, [toId]);
  useEffect(() => { dateRef.current       = date;       }, [date]);
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

  const fetchTickets = useCallback(async () => {
    const _airline    = airlineRef.current;
    const _fromId     = fromIdRef.current;
    const _toId       = toIdRef.current;
    const _date       = dateRef.current;
    const _pageNumber = pageNumberRef.current;

    if (_airline.length > 50) { setError("Airline name is too long."); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("PageNumber", _pageNumber);
      params.set("PageSize",   pageSize);
      if (_airline.trim()) params.set("Airline", _airline.trim());
      if (_fromId) params.set("FromLocationId", _fromId);
      if (_toId)   params.set("ToLocationId",   _toId);
      if (_date) {
        const d = new Date(_date);
        if (!isNaN(d.getTime())) params.set("Date", d.toISOString());
      }
      const res = await fetch(`${BASE_URL}/PlaneTicket?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      const data     = await res.json();
      const all      = Array.isArray(data?.data) ? data.data : [];
      const filtered = all.filter(t => !isExpired(t.dueDate));

      const merged = filtered.map(t => {
        const edited = editedMap.current[t.id];
        if (!edited) return t;
        return { ...t, ...edited };
      });

      setTickets(merged);
      setTotalCount((data?.totalDataCount ?? 0) - (all.length - filtered.length));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTrigger, fetchTickets]);
  useEffect(() => { triggerFetch(); }, [pageNumber]); // eslint-disable-line

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 5000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const showToast  = (message, type = "success") => setToast({ message, type });

  return (
    <div className="spt-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="spt-header">
        <div className="spt-title-block">
          <span className="spt-icon">✈️</span>
          <div>
            <h1 className="spt-title">Plane Tickets</h1>
            <p className="spt-meta">{totalCount} tickets found</p>
          </div>
        </div>
      </div>

      <div className="spt-filters">
        <div className="spt-filter-grid">
          <div className="spt-filter-group">
            <label>Airline</label>
            <input type="text" placeholder="e.g. AZAL" value={airline} onChange={e => setAirline(e.target.value)} />
          </div>
          <LocationSelect label="From" value={fromId} onChange={setFromId} locations={locations} />
          <LocationSelect label="To"   value={toId}   onChange={setToId}   locations={locations} />
          <div className="spt-filter-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="spt-filter-actions">
          <button className="spt-search-btn" onClick={() => { setPageNumber(1); triggerFetch(); }}>Search</button>
          <button className="spt-reset-btn"  onClick={() => { setAirline(""); setFromId(""); setToId(""); setDate(""); setPageNumber(1); triggerFetch(); }}>Reset</button>
        </div>
      </div>

      <div className="spt-content">
        {loading && (
          <div className="spt-state">
            <div className="spt-spinner" /><p>Loading...</p>
          </div>
        )}
        {error && !loading && (
          <div className="spt-state spt-error">
            <span>⚠️</span><p>{error}</p>
            <button onClick={triggerFetch}>Try Again</button>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="spt-state">
            <span className="spt-empty-icon">✈️</span>
            <p>No tickets found.</p>
          </div>
        )}
        {!loading && !error && tickets.length > 0 && (
          <div className="spt-grid">
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isNew={ticket.id === highlightId}
                role={role}
                onDeleted={id => {
                  delete editedMap.current[id];
                  setTickets(prev => prev.filter(t => t.id !== id));
                  setTotalCount(prev => prev - 1);
                }}
                onEdited={updatedBody => {
                  const newState = normalizeState(updatedBody.state);
                  editedMap.current[updatedBody.id] = {
                    airline:     updatedBody.airline,
                    gate:        updatedBody.gate,
                    plane:       updatedBody.plane,
                    meal:        updatedBody.meal,
                    luggageKg:   updatedBody.luggageKg,
                    variantId:   updatedBody.variantId,
                    variantName: updatedBody.variantName,
                    state:       newState,
                    dueDate:     updatedBody.dueDate,
                  };
                  setTickets(prev => prev.map(t =>
                    t.id === updatedBody.id
                      ? {
                          ...t,
                          airline:     updatedBody.airline,
                          gate:        updatedBody.gate,
                          plane:       updatedBody.plane,
                          meal:        updatedBody.meal,
                          luggageKg:   updatedBody.luggageKg,
                          variantId:   updatedBody.variantId,
                          variantName: updatedBody.variantName ?? t.variantName,
                          state:       newState,
                          dueDate:     updatedBody.dueDate ?? t.dueDate,
                        }
                      : t
                  ));
                  showToast(`Ticket #${updatedBody.id} updated successfully.`, "success");
                }}
                onStateChanged={updated => {
                  setTickets(prev => prev.map(t =>
                    t.id === updated.id ? { ...t, state: normalizeState(updated.state) } : t
                  ));
                }}
                onToast={showToast}
              />
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="spt-pagination">
            <button disabled={pageNumber <= 1}          onClick={() => setPageNumber(p => p - 1)}>← Previous</button>
            <span>{pageNumber} / {totalPages}</span>
            <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}