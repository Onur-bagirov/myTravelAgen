import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import "./showTrain.css";
import PaymentModal from "../PymetModal/pyMod";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";

const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function getUserRole() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload["role"] ||
      payload["roles"] ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null
    );
  } catch { return null; }
}

const isAdmin   = (role) => role === "Admin";
const isCompany = (role) => role === "Company";

const getUserId = () => {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.uid || payload.sub || null;
  } catch { return null; }
};

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

function fmt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

const PALETTE = ["#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#facc15"];

/* ── Variant colour map (same style as plane page) ── */
const VARIANT_COLORS = {
  "first class": { accent: "#c9a84c", bg: "rgba(201,168,76,0.15)",   label: "✦ First Class" },
  business:      { accent: "#7eb8f7", bg: "rgba(126,184,247,0.15)", label: "◈ Business"   },
  economy:       { accent: "#a0a8c0", bg: "rgba(160,168,192,0.15)", label: "◇ Economy"    },
};

function getVariantMeta(name = "") {
  return (
    VARIANT_COLORS[name.toLowerCase().trim()] || {
      accent: "#ff8080",
      bg:     "rgba(255,128,128,0.12)",
      label:  name,
    }
  );
}

function parseSeatName(name) {
  const m = name?.match(/^(\d+)([A-K])$/);
  if (!m) return { row: 0, col: 0 };
  return { row: parseInt(m[1], 10), col: m[2].charCodeAt(0) - 65 };
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

/* ══════════════════════════════════════════════════════════
   ── VariantBadgeRow — fetches seats & shows all variants ──
   ══════════════════════════════════════════════════════════ */
function VariantBadgeRow({ ticketId }) {
  const [variantNames, setVariantNames] = useState([]);

  useEffect(() => {
    fetch(
      `${BASE_URL}/Seat/by-ticket?TicketId=${ticketId}&TicketType=train`,
      { headers: authHeaders() }
    )
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const unique = [...new Set(list.map(s => s.variantName).filter(Boolean))];
        setVariantNames(unique);
      })
      .catch(() => {});
  }, [ticketId]);

  if (variantNames.length === 0) return null;

  return (
    <>
      {variantNames.map(name => {
        const meta  = getVariantMeta(name);
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        return (
          <span
            key={name}
            className="st-variant-badge"
            style={{
              color:       meta.accent,
              background:  meta.bg,
              borderColor: meta.accent + "55",
            }}
          >
            {meta.label || label}
          </span>
        );
      })}
    </>
  );
}

function LocationSelect({ label, value, onChange, locations, placeholder = "— All Locations —" }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const ref        = useRef(null);
  const triggerRef = useRef(null);

  const selected = locations.find(l => String(l.id) === String(value));

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
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

  const handleOpen   = () => { updatePos(); setOpen(o => !o); };
  const handleSelect = (id) => { onChange(id); setOpen(false); setSearch(""); };

  const filtered = locations.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.country?.toLowerCase().includes(search.toLowerCase())
  );

  const dropdown = open ? createPortal(
    <div className="loc-dropdown" style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, bottom: "auto" }}>
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
          const meta     = getCountryMeta(loc.country || "");
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

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`st-toast st-toast--${type}`}>
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span>{message}</span>
      <button className="st-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

function ConfirmDeleteModal({ ticketId, onConfirm, onCancel }) {
  return (
    <div className="st-modal-overlay" onClick={onCancel}>
      <div className="st-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="st-confirm-icon">🗑️</div>
        <div className="st-confirm-title">Delete Ticket</div>
        <div className="st-confirm-desc">
          Are you sure you want to delete <strong>Ticket #{ticketId}</strong>?<br />
          This action cannot be undone.
        </div>
        <div className="st-confirm-actions">
          <button className="st-confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="st-confirm-delete-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ ticket, onClose, onSaved }) {
  const [form, setForm] = useState({
    id:           ticket.id,
    trainCompany: ticket.trainCompany || "",
    trainNumber:  ticket.trainNumber  || "",
    vagonNumber:  ticket.vagonNumber  ?? "",
  });
  const [saving, setSaving]                     = useState(false);
  const [error, setError]                       = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.trainCompany.trim()) errs.trainCompany = "Train company is required.";
    else if (form.trainCompany.trim().length < 2) errs.trainCompany = "Train company must be at least 2 characters.";
    else if (form.trainCompany.trim().length > 60) errs.trainCompany = "Train company must be at most 60 characters.";
    else if (!/^[a-zA-Z0-9 .\'\-&]+$/.test(form.trainCompany.trim())) errs.trainCompany = "Train company contains invalid characters.";
    if (!form.trainNumber.trim()) errs.trainNumber = "Train number is required.";
    else if (form.trainNumber.trim().length > 20) errs.trainNumber = "Train number must be at most 20 characters.";
    else if (!/^[A-Za-z0-9\-]+$/.test(form.trainNumber.trim())) errs.trainNumber = "Train number must be letters and numbers only.";
    if (form.vagonNumber !== "" && form.vagonNumber !== null) {
      const v = Number(form.vagonNumber);
      if (isNaN(v) || !Number.isInteger(v)) errs.vagonNumber = "Vagon number must be a whole number.";
      else if (v < 1) errs.vagonNumber = "Vagon number must be at least 1.";
      else if (v > 999) errs.vagonNumber = "Vagon number cannot exceed 999.";
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
      const body = {
        id:           form.id,
        trainCompany: form.trainCompany.trim(),
        trainNumber:  form.trainNumber.trim(),
        vagonNumber:  form.vagonNumber !== "" ? parseInt(form.vagonNumber) : null,
        state:        0,
      };
      const res = await fetch(`${BASE_URL}/TrainTicket`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error: ${res.status}`);
      }
      onSaved(body);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="st-modal-close" onClick={onClose}>✕</button>
        <div className="st-edit-modal-title">✏️ Edit Ticket #{ticket.id}</div>
        {error && <div className="st-error-banner">⚠ {error}</div>}
        <div className="st-edit-form">
          <div className="st-edit-field">
            <label>Train Company <span className="st-edit-required">*</span></label>
            <input name="trainCompany" value={form.trainCompany} onChange={handleChange} placeholder="e.g. ADY"
              className={validationErrors.trainCompany ? "st-edit-input--error" : ""} />
            {validationErrors.trainCompany && <span className="st-edit-field-error">{validationErrors.trainCompany}</span>}
          </div>
          <div className="st-edit-field">
            <label>Train Number <span className="st-edit-required">*</span></label>
            <input name="trainNumber" value={form.trainNumber} onChange={handleChange} placeholder="e.g. T-101"
              className={validationErrors.trainNumber ? "st-edit-input--error" : ""} />
            {validationErrors.trainNumber && <span className="st-edit-field-error">{validationErrors.trainNumber}</span>}
          </div>
          <div className="st-edit-field">
            <label>Vagon Number</label>
            <input name="vagonNumber" type="number" min={1} value={form.vagonNumber} onChange={handleChange} placeholder="e.g. 5"
              className={validationErrors.vagonNumber ? "st-edit-input--error" : ""} />
            {validationErrors.vagonNumber && <span className="st-edit-field-error">{validationErrors.vagonNumber}</span>}
          </div>
        </div>
        <div className="st-edit-actions">
          <button className="st-edit-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="st-edit-save-btn" onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function SeatMap({ seats, selectedSeatId, onSelect }) {
  if (!seats.length) return <p className="st-no-seats">No seats found for this ticket.</p>;

  const maxRow = Math.max(...seats.map(s => parseSeatName(s.name).row));
  const maxCol = Math.max(...seats.map(s => parseSeatName(s.name).col));

  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol + 1 }, (_, ci) =>
      seats.find(s => {
        const p = parseSeatName(s.name);
        return p.row === ri + 1 && p.col === ci;
      }) ?? null
    )
  );

  const variantColors = {};
  let colorIdx = 0;
  seats.forEach(s => {
    if (s.variantId !== undefined && !variantColors[s.variantId])
      variantColors[s.variantId] = PALETTE[colorIdx++ % PALETTE.length];
  });

  const available = seats.filter(s => !s.isOccupied).length;
  const occupied  = seats.filter(s =>  s.isOccupied).length;

  return (
    <>
      <div className="st-modal-stats">
        <div className="st-modal-stat st-modal-stat--free">🟢 {available} Available</div>
        <div className="st-modal-stat st-modal-stat--occ">🔴 {occupied} Occupied</div>
        <div className="st-modal-stat">💺 {seats.length} Total</div>
      </div>
      <div className="st-seatmap-legend">
        {Object.entries(variantColors).map(([vid, color]) => {
          const sample = seats.find(s => String(s.variantId) === String(vid));
          if (!sample) return null;
          return (
            <span key={vid} className="st-legend-item">
              <span className="st-legend-dot" style={{ background: color }} />
              {sample.variantName} — {sample.variantPrice} ₼
            </span>
          );
        })}
        <span className="st-legend-item">
          <span className="st-legend-dot st-legend-dot--occ" />
          Occupied
        </span>
      </div>
      <div className="st-seatmap-cabin">
        <div className="st-train-nose">🚂 Locomotive (Front)</div>
        {grid.map((row, ri) => (
          <div key={ri} className="st-seat-row">
            <span className="st-row-num">{ri + 1}</span>
            {row.map((seat, ci) => {
              if (!seat) return <div key={ci} className="st-seat-empty" />;
              const isSelected = seat.id === selectedSeatId;
              const color = variantColors[seat.variantId];
              return (
                <div key={seat.id} className="st-seat-wrapper">
                  <button
                    className={["st-seat-btn", seat.isOccupied ? "st-seat--occupied" : "st-seat--free", isSelected ? "st-seat--selected" : ""].filter(Boolean).join(" ")}
                    style={!seat.isOccupied && !isSelected ? { "--seat-color": color, "--seat-bg": `${color}22` } : {}}
                    disabled={seat.isOccupied}
                    onClick={() => !seat.isOccupied && onSelect(seat)}
                    title={`${seat.name} — ${seat.variantName}`}
                    aria-label={`${seat.name} - ${seat.variantName} - ${seat.isOccupied ? "Occupied" : "Available"}`}
                  >
                    <span className="st-seat-label">{seat.name}</span>
                    <span className="st-seat-dot" />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function BookingModal({ ticket, onClose }) {
  const [seats, setSeats]               = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatsError, setSeatsError]     = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buying, setBuying]             = useState(false);
  const [buyError, setBuyError]         = useState(null);
  const [success, setSuccess]           = useState(false);
  const [showPayment, setShowPayment]   = useState(false);

  const totalPrice = selectedSeat ? Number(selectedSeat.variantPrice ?? 0).toFixed(2) : "—";

  useEffect(() => {
    if (!ticket?.id) return;
    setLoadingSeats(true);
    fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=train`)
      .then(r => r.json())
      .then(d => setSeats(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setSeatsError("Failed to load seats."))
      .finally(() => setLoadingSeats(false));
  }, [ticket?.id]);

  async function handleBuy() {
    if (!selectedSeat) { setBuyError("Please select a seat."); return; }
    const userId = getUserId();
    if (!userId) { setBuyError("Session expired. Please log in again."); return; }
    setBuying(true); setBuyError(null);
    try {
      const body = {
        id: Number(ticket.id), userId: Number(userId),
        dueDate: ticket.dueDate, chosenSeatId: Number(selectedSeat.id), state: 1,
      };
      const res     = await fetch(`${BASE_URL}/TrainTicket/fill`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) });
      const rawText = await res.text();
      let result = null;
      try { result = rawText ? JSON.parse(rawText) : null; } catch { result = null; }
      if (!res.ok) {
        let errMsg = result?.message || result?.title || `Server error: ${res.status}`;
        if (result?.errors) errMsg = Object.values(result.errors).flat().join(", ");
        setSeats(prev => prev.map(s => s.id === selectedSeat.id ? { ...s, isOccupied: true } : s));
        setSelectedSeat(null);
        throw new Error(errMsg);
      }
      if (!result?.data) {
        setSeats(prev => prev.map(s => s.id === selectedSeat.id ? { ...s, isOccupied: true } : s));
        setSelectedSeat(null);
        throw new Error("This seat is already taken. Please choose another.");
      }
      setSuccess(true);
    } catch (e) { setBuyError(e.message); } finally { setBuying(false); }
  }

  const fromName = ticket.from?.split(",")[0] ?? "—";
  const toName   = ticket.to?.split(",")[0]   ?? "—";

  if (success) return (
    <div className="st-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="st-modal">
        <button className="st-modal-close" onClick={onClose}>✕</button>
        <div className="st-modal-company">{ticket.trainCompany}</div>
        <div className="st-modal-route">
          <span>{fromName}</span>
          <span className="st-modal-train-icon">🚆</span>
          <span>{toName}</span>
        </div>
        <div className="st-success-body">
          <div className="st-success-icon">✅</div>
          <h2 className="st-success-title">Ticket Booked!</h2>
          <p className="st-success-sub">{fromName} → {toName}</p>
          <p className="st-success-sub" style={{ fontSize: 14 }}>
            Seat: <strong style={{ color: "#fff" }}>{selectedSeat?.name}</strong>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="st-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="st-modal">
          <button className="st-modal-close" onClick={onClose}>✕</button>
          <div className="st-modal-company">{ticket.trainCompany}</div>
          <div className="st-modal-route">
            <span>{fromName}</span>
            <span className="st-modal-train-icon">🚆</span>
            <span>{toName}</span>
          </div>
          <div className="st-modal-meta">
            <span>Wagon: <strong>{ticket.vagonNumber ?? "—"}</strong></span>
            <span>{fmt(ticket.dueDate)}</span>
          </div>
          {loadingSeats ? (
            <div className="st-state" style={{ padding: "32px 0" }}><div className="st-spinner" /></div>
          ) : seatsError ? (
            <div className="st-error-banner">{seatsError}</div>
          ) : (
            <SeatMap seats={seats} selectedSeatId={selectedSeat?.id} onSelect={setSelectedSeat} />
          )}
          {selectedSeat && (
            <div className="st-selected-banner">
              💺 Selected: <strong>{selectedSeat.name}</strong>
              &nbsp;|&nbsp; Class: <strong>{selectedSeat.variantName}</strong>
              &nbsp;|&nbsp; Total: <strong>{totalPrice} ₼</strong>
            </div>
          )}
          {buyError && <div className="st-error-banner">{buyError}</div>}
          {selectedSeat && (
            <button className="st-book-btn" disabled={buying} onClick={() => setShowPayment(true)}>
              {buying ? "Processing..." : `🎫 Book Ticket · ${totalPrice} ₼`}
            </button>
          )}
        </div>
      </div>
      {showPayment && (
        <PaymentModal
          amount={totalPrice}
          loading={buying}
          onCancel={() => setShowPayment(false)}
          onConfirm={() => { setShowPayment(false); handleBuy(); }}
        />
      )}
    </>
  );
}

/* ── Ticket Card ── */
function TicketCard({ ticket, onClick, onDeleted, onEdited, onToast, role }) {
  const [showEdit,    setShowEdit]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  const adminMode   = isAdmin(role);
  const companyMode = isCompany(role);

  const seats      = ticket.availableSeats;
  const seatsClass = seats <= 5 ? "st-info-val--low" : seats <= 15 ? "st-info-val--warn" : "st-info-val--ok";

  const fromCode = (ticket.from?.split(",")[0] ?? "???").slice(0, 3).toUpperCase();
  const toCode   = (ticket.to?.split(",")[0]   ?? "???").slice(0, 3).toUpperCase();
  const fromFull = ticket.from?.split(",")[0] ?? "";
  const toFull   = ticket.to?.split(",")[0]   ?? "";

  const displayPrice =
    ticket.minPrice && Number(ticket.minPrice) > 0
      ? `from ${Number(ticket.minPrice).toFixed(2)} ₼`
      : ticket.price && Number(ticket.price) > 0
        ? `${ticket.price} ₼`
        : "—";

  const handleDeleteConfirmed = async () => {
    setShowConfirm(false);
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/TrainTicket`, {
        method: "DELETE", headers: authHeaders(), body: JSON.stringify({ id: ticket.id }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error: ${res.status}`);
      }
      onToast(`Ticket #${ticket.id} has been successfully deleted.`, "success");
      onDeleted(ticket.id);
    } catch (err) {
      onToast(`Failed to delete ticket: ${err.message}`, "error");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="st-card">
        {/* ── Header: company + badges + actions ── */}
        <div className="st-card-header">
          <div className="st-card-company">{ticket.trainCompany}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(adminMode || companyMode) && (
              <button className="st-action-btn st-action-btn--edit"
                onClick={e => { e.stopPropagation(); setShowEdit(true); }} title="Edit Ticket">✏️</button>
            )}
            {adminMode && (
              <button className="st-action-btn st-action-btn--delete"
                onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
                disabled={deleting} title="Delete Ticket">{deleting ? "…" : "🗑️"}</button>
            )}
          </div>
        </div>

        {/* ── Variant badges row ── */}
        <div className="st-card-badge-row">
          <VariantBadgeRow ticketId={ticket.id} />
        </div>

        {/* ── Route ── */}
        <div className="st-card-route">
          <div className="st-card-city">
            <span className="st-card-code">{fromCode}</span>
            <span className="st-card-city-name">{fromFull}</span>
          </div>
          <div className="st-card-route-line">
            <div className="st-card-route-dot" />
            <div className="st-card-route-dash" />
            <span className="st-card-train-icon">🚆</span>
            <div className="st-card-route-dash" />
            <div className="st-card-route-dot" />
          </div>
          <div className="st-card-city st-card-city--right">
            <span className="st-card-code">{toCode}</span>
            <span className="st-card-city-name">{toFull}</span>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="st-card-info">
          <div className="st-info-item">
            <span className="st-info-label">DATE</span>
            <span className="st-info-val">{fmtDate(ticket.dueDate)}</span>
          </div>
          <div className="st-info-item">
            <span className="st-info-label">TIME</span>
            <span className="st-info-val">{fmtTime(ticket.dueDate)}</span>
          </div>
          <div className="st-info-item">
            <span className="st-info-label">WAGON</span>
            <span className="st-info-val">{ticket.vagonNumber ?? "—"}</span>
          </div>
        </div>
        <div className="st-card-info st-card-info--2col">
          <div className="st-info-item">
            <span className="st-info-label">PRICE</span>
            <span className="st-info-val st-info-val--price">{displayPrice}</span>
          </div>
          <div className="st-info-item">
            <span className="st-info-label">SEATS</span>
            <span className={`st-info-val ${seatsClass}`}>{seats}</span>
          </div>
        </div>

        <button className="st-seatmap-btn" onClick={onClick}>💺 Seat Map</button>
      </div>

      {showEdit && (
        <EditModal ticket={ticket} onClose={() => setShowEdit(false)}
          onSaved={updatedBody => { onEdited(updatedBody); onToast(`Ticket #${updatedBody.id} updated successfully.`, "success"); }} />
      )}
      {showConfirm && (
        <ConfirmDeleteModal ticketId={ticket.id} onConfirm={handleDeleteConfirmed} onCancel={() => setShowConfirm(false)} />
      )}
    </>
  );
}

const PAGE_SIZE   = 9;
const EMPTY_FILTERS = { trainCompany: "", date: "", fromLocationId: "", toLocationId: "" };

export default function ShowTrainTickets() {
  const [tickets,     setTickets]     = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [locations,   setLocations]   = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [toast,       setToast]       = useState(null);

  const role = getUserRole();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`)
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []));
  }, []);

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ PageNumber: String(p), PageSize: String(PAGE_SIZE) });
      if (filters.trainCompany)   params.set("TrainCompany",   filters.trainCompany);
      if (filters.date)           params.set("Date",           new Date(filters.date).toISOString());
      if (filters.fromLocationId) params.set("FromLocationId", filters.fromLocationId);
      if (filters.toLocationId)   params.set("ToLocationId",   filters.toLocationId);

      const res  = await fetch(`${BASE_URL}/TrainTicket?${params}`);
      const json = await res.json();
      setTickets(json.data || []);
      setTotalCount(json.totalDataCount || 0);
      setTotalPages(Math.ceil((json.totalDataCount || 0) / PAGE_SIZE));
    } catch {
      setError("Tickets not found.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTickets(page); }, [page, fetchTickets]);

  const handleReset  = () => { setFilters(EMPTY_FILTERS); setPage(1); };
  const handleSearch = () => { setPage(1); fetchTickets(1); };

  return (
    <div className="st-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="st-header">
        <div className="st-title-block">
          <div className="st-icon">🚂</div>
          <div>
            <h1 className="st-title">Train Tickets</h1>
            <p className="st-meta">{totalCount} tickets found</p>
          </div>
        </div>
      </div>

      <div className="st-filters">
        <div className="st-filter-grid">
          <div className="st-filter-group">
            <label>Company</label>
            <input type="text" placeholder="e.g. ADY" value={filters.trainCompany}
              onChange={e => setFilters({ ...filters, trainCompany: e.target.value })} />
          </div>
          <LocationSelect label="From" value={filters.fromLocationId} onChange={val => setFilters({ ...filters, fromLocationId: val })} locations={locations} />
          <LocationSelect label="To"   value={filters.toLocationId}   onChange={val => setFilters({ ...filters, toLocationId: val })}   locations={locations} />
          <div className="st-filter-group">
            <label>Date</label>
            <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </div>
        </div>
        <div className="st-filter-actions">
          <button className="st-search-btn" onClick={handleSearch}>Search</button>
          <button className="st-reset-btn"  onClick={handleReset}>Reset</button>
        </div>
      </div>

      <div className="st-content">
        {loading && <div className="st-state"><div className="st-spinner" /><p>Loading...</p></div>}
        {error && !loading && (
          <div className="st-state st-state-error">
            <span>⚠️</span><p>{error}</p>
            <button onClick={() => fetchTickets(page)}>Try Again</button>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="st-state"><span className="st-empty-icon">🚂</span><p>No tickets found.</p></div>
        )}
        {!loading && !error && tickets.length > 0 && (
          <div className="st-grid">
            {tickets.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                role={role}
                onClick={() => setActiveTicket(t)}
                onDeleted={id => { setTickets(prev => prev.filter(tk => tk.id !== id)); setTotalCount(c => c - 1); }}
                onEdited={updatedBody => {
                  setTickets(prev => prev.map(tk =>
                    tk.id === updatedBody.id
                      ? { ...tk, trainCompany: updatedBody.trainCompany, trainNumber: updatedBody.trainNumber, vagonNumber: updatedBody.vagonNumber }
                      : tk
                  ));
                }}
                onToast={showToast}
              />
            ))}
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="st-pagination">
            <button disabled={page === 1}          onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {activeTicket && <BookingModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />}
    </div>
  );
}