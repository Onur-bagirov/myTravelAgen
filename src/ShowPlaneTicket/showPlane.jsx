import { useState, useEffect, useCallback } from "react";
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
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return "Passed";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

const VARIANT_COLORS = {
  "first class": { accent: "#c9a84c", bg: "rgba(201,168,76,0.15)", label: "✦ First Class" },
  business:      { accent: "#7eb8f7", bg: "rgba(126,184,247,0.15)", label: "◈ Business" },
  economy:       { accent: "#a0a8c0", bg: "rgba(160,168,192,0.15)", label: "◇ Economy" },
};

function getVariantMeta(name = "") {
  return (
    VARIANT_COLORS[name.toLowerCase()] || {
      accent: "#a0a8c0",
      bg: "rgba(160,168,192,0.1)",
      label: name,
    }
  );
}

function stateBadge(state) {
  const s = (state || "").toLowerCase();
  if (s === "pending")   return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", label: "⏳ Pending" };
  if (s === "available") return { color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.35)", label: "✅ Available" };
  if (s === "booked")    return { color: "#7eb8f7", bg: "rgba(126,184,247,0.15)", border: "rgba(126,184,247,0.35)", label: "🔒 Booked" };
  if (s === "canceled")  return { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)", label: "❌ Canceled" };
  return { color: "#a0a8c0", bg: "rgba(160,168,192,0.1)", border: "rgba(160,168,192,0.3)", label: state };
}

const STATE_MAP = { Pending: 0, Available: 1, Booked: 2, Canceled: 4 };
const STATE_OPTIONS = Object.keys(STATE_MAP);

// ── Edit Modal ───────────────────────────────────────────────
function EditModal({ ticket, onClose, onSaved }) {
  const [form, setForm] = useState({
    id:        ticket.id,
    airline:   ticket.airline  || "",
    gate:      ticket.gate     || "",
    plane:     ticket.plane    || "",
    meal:      ticket.meal     || "",
    luggageKg: ticket.luggageKg ?? 0,
    state:     ticket.state    || "Available",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        id:        form.id,
        airline:   form.airline,
        gate:      form.gate,
        plane:     form.plane,
        meal:      form.meal,
        luggageKg: parseFloat(form.luggageKg) || 0,
        state:     STATE_MAP[form.state] ?? 1,
      };
      const res = await fetch(`${BASE_URL}/PlaneTicket`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box edit-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="edit-modal-title">✏️ Edit Ticket #{ticket.id}</div>

        {error && <div className="seatmap-error">⚠ {error}</div>}

        <div className="edit-form">
          <div className="edit-field">
            <label>Airline</label>
            <input name="airline" value={form.airline} onChange={handleChange} placeholder="e.g. AZAL" />
          </div>
          <div className="edit-field">
            <label>Gate</label>
            <input name="gate" value={form.gate} onChange={handleChange} placeholder="e.g. A12" />
          </div>
          <div className="edit-field">
            <label>Plane</label>
            <input name="plane" value={form.plane} onChange={handleChange} placeholder="e.g. Boeing 737" />
          </div>
          <div className="edit-field">
            <label>Meal</label>
            <input name="meal" value={form.meal} onChange={handleChange} placeholder="e.g. Vegetarian" />
          </div>
          <div className="edit-field">
            <label>Luggage (kg)</label>
            <input name="luggageKg" type="number" min={0} value={form.luggageKg} onChange={handleChange} />
          </div>
          <div className="edit-field">
            <label>State</label>
            <select name="state" value={form.state} onChange={handleChange} className="edit-select">
              {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="edit-actions">
          <button className="edit-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="edit-save-btn"   onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Seat Map Modal ───────────────────────────────────────────
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
        <span className="seat-dot" />
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
        const res = await fetch(
          `${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=plane`,
          { headers: authHeaders() }
        );
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

  const parsedSeats = seats.map(s => {
    const match = s.name.match(/^(\d+)([A-Z]+)$/);
    return { ...s, row: match ? parseInt(match[1]) : 0, col: match ? match[2] : "" };
  });

  const maxRow = parsedSeats.reduce((m, s) => Math.max(m, s.row), 0);
  const cols   = [...new Set(parsedSeats.map(s => s.col))].sort();
  const displayCols =
    cols.length >= 6
      ? [cols[0], cols[1], cols[2], "", cols[3], cols[4], cols[5]]
      : cols;

  const seatIndex = {};
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

        {loading && <div className="seatmap-loading">Loading...</div>}
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

        {!loading && !error && seats.length === 0 && (
          <div className="seatmap-empty">No seats found for this ticket.</div>
        )}
      </div>
    </div>
  );
}

// ── Ticket Card ──────────────────────────────────────────────
function TicketCard({ ticket, isNew, role, onDeleted, onEdited }) {
  const [showSeats, setShowSeats] = useState(false);
  const [showEdit,  setShowEdit]  = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const isAdmin   = role === "Admin";
  const isCompany = role === "Company";
  const sb        = stateBadge(ticket.state);

  const handleDelete = async () => {
    if (!window.confirm(`Ticket #${ticket.id} silinsin?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/PlaneTicket?id=${ticket.id}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      onDeleted(ticket.id);
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className={`spt-card ${isNew ? "spt-card--new" : ""}`}>
        {isNew && <div className="spt-card-new-badge">NEW</div>}

        {/* ── TOP BAR: airline (sol) + action buttons (sağ) ── */}
        <div className="spt-card-topbar">
          <div className="spt-card-airline">{ticket.airline}</div>

          {(isAdmin || isCompany) && (
            <div className="spt-card-actions">
              <button
                className="spt-action-btn spt-action-btn--edit"
                onClick={() => setShowEdit(true)}
                title="Edit"
              >✏️</button>
              {isAdmin && (
                <button
                  className="spt-action-btn spt-action-btn--delete"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Delete"
                >{deleting ? "…" : "🗑️"}</button>
              )}
            </div>
          )}
        </div>

        {/* ── STATE BADGE — airline-in altında, ayrı sıra ── */}
        <div className="spt-card-state-row">
          <span
            className="spt-state-badge"
            style={{
              color:       sb.color,
              background:  sb.bg,
              borderColor: sb.border,
            }}
          >
            {sb.label}
          </span>
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
          <div className="spt-info-item">
            <span className="spt-info-label">DATE</span>
            <span className="spt-info-val">{fmtDate(ticket.dueDate)}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">TIME</span>
            <span className="spt-info-val">{fmtTime(ticket.dueDate)}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">GATE</span>
            <span className="spt-info-val">{ticket.gate}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">PLANE</span>
            <span className="spt-info-val">{ticket.plane}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">MEAL</span>
            <span className="spt-info-val">{ticket.meal || "—"}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">LUGGAGE</span>
            <span className="spt-info-val">{ticket.luggageKg ?? "—"} kg</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">PRICE</span>
            <span className="spt-info-val spt-info-val--price">
              {ticket.price > 0 ? `${ticket.price} ₼` : "—"}
            </span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">SEATS</span>
            <span className={`spt-info-val ${ticket.availableSeats < 5 ? "spt-info-val--low" : "spt-info-val--ok"}`}>
              {ticket.availableSeats}
            </span>
          </div>
        </div>

        <div className="spt-card-countdown">🕐 {countdown(ticket.dueDate)}</div>

        <button className="spt-seatmap-btn" onClick={() => setShowSeats(true)}>
          💺 Seat Map
        </button>
      </div>

      {showSeats && <SeatMapModal ticket={ticket} onClose={() => setShowSeats(false)} />}
      {showEdit  && (
        <EditModal
          ticket={ticket}
          onClose={() => setShowEdit(false)}
          onSaved={onEdited}
        />
      )}
    </>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function ShowPlaneTicket() {
  const navigate = useNavigate();
  const role     = getUserRole();

  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [totalCount, setTotalCount] = useState(0);

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

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {});
  }, []);

  const fetchTickets = useCallback(async () => {
    if (airline.length > 50) { setError("Airline name is too long."); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("PageNumber", pageNumber);
      params.set("PageSize",   pageSize);
      if (airline.trim()) params.set("Airline", airline.trim());
      if (fromId) params.set("FromLocationId", fromId);
      if (toId)   params.set("ToLocationId",   toId);
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) params.set("Date", d.toISOString());
      }
      const res = await fetch(`${BASE_URL}/PlaneTicket?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      const data = await res.json();
      setTickets(Array.isArray(data?.data) ? data.data : []);
      setTotalCount(data?.totalDataCount ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [airline, fromId, toId, date, pageNumber]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 5000);
    return () => clearTimeout(t);
  }, [highlightId]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="spt-page">
      <div className="spt-header">
        <div className="spt-title-block">
          <span className="spt-icon">✈️</span>
          <div>
            <h1 className="spt-title">Plane Tickets</h1>
            <p className="spt-meta">{totalCount} tickets found</p>
          </div>
        </div>
      </div>

      {newTicketId && (
        <div className="spt-new-banner">
          ✅ Ticket <strong>#{newTicketId}</strong> created successfully!
        </div>
      )}

      <div className="spt-filters">
        <div className="spt-filter-grid">
          <div className="spt-filter-group">
            <label>Airline</label>
            <input type="text" placeholder="e.g. AZAL" value={airline} onChange={e => setAirline(e.target.value)} />
          </div>
          <div className="spt-filter-group">
            <label>From</label>
            <select value={fromId} onChange={e => setFromId(e.target.value)} className="spt-select">
              <option value="">— All Locations —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>To</label>
            <select value={toId} onChange={e => setToId(e.target.value)} className="spt-select">
              <option value="">— All Locations —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="spt-filter-actions">
          <button className="spt-search-btn" onClick={() => { setPageNumber(1); fetchTickets(); }}>Search</button>
          <button className="spt-reset-btn"  onClick={() => { setAirline(""); setFromId(""); setToId(""); setDate(""); setPageNumber(1); }}>Reset</button>
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
            <button onClick={fetchTickets}>Try Again</button>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="spt-state">
            <span className="spt-empty-icon">✈️</span>
            <p>No tickets found.</p>
            <button className="spt-create-btn" onClick={() => navigate("/create-plane-ticket")}>
              ＋ Create First Ticket
            </button>
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
                onDeleted={id  => setTickets(prev => prev.filter(t => t.id !== id))}
                onEdited={fetchTickets}
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