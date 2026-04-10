import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./showPlane.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}
function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function countdown(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return "Keçib";
  if (days === 0) return "Bu gün";
  if (days === 1) return "Sabah";
  return `${days} gün`;
}

const VARIANT_COLORS = {
  "first class": { accent: "#c9a84c", bg: "rgba(201,168,76,0.15)", label: "✦ First Class" },
  "business":    { accent: "#7eb8f7", bg: "rgba(126,184,247,0.15)", label: "◈ Business" },
  "economy":     { accent: "#a0a8c0", bg: "rgba(160,168,192,0.15)", label: "◇ Economy" },
};
function getVariantMeta(name = "") {
  return VARIANT_COLORS[name.toLowerCase()] || { accent: "#a0a8c0", bg: "rgba(160,168,192,0.1)", label: name };
}

// State badge rəngi
function stateBadge(state) {
  const s = (state || "").toLowerCase();
  if (s === "pending")   return { color: "#f59e0b", label: "⏳ Pending" };
  if (s === "available") return { color: "#34d399", label: "✅ Available" };
  if (s === "booked")    return { color: "#7eb8f7", label: "🔒 Booked" };
  if (s === "canceled")  return { color: "#f87171", label: "❌ Canceled" };
  return { color: "#a0a8c0", label: state };
}

// ─── Seat Tooltip ──────────────────────────────────────────────────────────
function Tooltip({ seat, anchorRef }) {
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const meta = getVariantMeta(seat.variantName);

  useEffect(() => {
    if (!anchorRef?.current || !tipRef?.current) return;
    const btn = anchorRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    let top = btn.top + window.scrollY - tip.height - 10;
    let left = btn.left + window.scrollX + btn.width / 2 - tip.width / 2;
    if (left < 8) left = 8;
    if (left + tip.width > window.innerWidth - 8) left = window.innerWidth - 8 - tip.width;
    setPos({ top, left });
  }, [anchorRef]);

  return (
    <div ref={tipRef} className="seat-tooltip" style={{ top: pos.top, left: pos.left, "--accent": meta.accent }}>
      <div className="tooltip-header">
        <span className="tooltip-seat-name">{seat.name}</span>
        <span className="tooltip-variant" style={{ color: meta.accent }}>{meta.label}</span>
      </div>
      <div className="tooltip-row">
        <span>{seat.isOccupied ? "🔴 Tutulub" : "🟢 Boş"}</span>
      </div>
      {!seat.isOccupied && (
        <div className="tooltip-price">{seat.variantPrice} ₼</div>
      )}
    </div>
  );
}

// ─── Seat Button ───────────────────────────────────────────────────────────
function SeatButton({ seat }) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);
  const meta = getVariantMeta(seat.variantName);

  return (
    <div className="seat-wrapper">
      <button
        ref={btnRef}
        className={`seat-btn ${seat.isOccupied ? "seat--occupied" : "seat--free"}`}
        style={{ "--accent": meta.accent, "--accent-bg": meta.bg }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${seat.name} - ${seat.variantName} - ${seat.isOccupied ? "Tutulub" : "Boş"}`}
      >
        <span className="seat-label">{seat.name}</span>
        <span className="seat-dot" />
      </button>
      {hovered && <Tooltip seat={seat} anchorRef={btnRef} />}
    </div>
  );
}

// ─── Seat Map Modal ────────────────────────────────────────────────────────
function SeatMapModal({ ticket, onClose }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=plane`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error("Oturacaqlar yüklənmədi");
        const data = await res.json();
        const list = data?.data ?? data ?? [];
        setSeats(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [ticket.id]);

  const parsedSeats = seats.map(s => {
    const match = s.name.match(/^(\d+)([A-Z]+)$/);
    return { ...s, row: match ? parseInt(match[1]) : 0, col: match ? match[2] : "" };
  });

  const maxRow = parsedSeats.reduce((m, s) => Math.max(m, s.row), 0);
  const cols = [...new Set(parsedSeats.map(s => s.col))].sort();
  const displayCols = cols.length >= 6
    ? [cols[0], cols[1], cols[2], "", cols[3], cols[4], cols[5]]
    : cols;

  const seatIndex = {};
  parsedSeats.forEach(s => { seatIndex[s.name] = s; });

  const variantLegend = [...new Set(seats.map(s => s.variantName))];
  const available = seats.filter(s => !s.isOccupied).length;
  const occupied = seats.filter(s => s.isOccupied).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <div className="modal-airline">{ticket.airline}</div>
          <div className="modal-route">
            <span>{(ticket.from || "—").split(",")[0]}</span>
            <span className="modal-plane-icon">✈</span>
            <span>{(ticket.to || "—").split(",")[0]}</span>
          </div>
          <div className="modal-meta">
            <span>Gate: <strong>{ticket.gate}</strong></span>
            <span>{fmtDate(ticket.dueDate)} · {fmtTime(ticket.dueDate)}</span>
          </div>
        </div>

        <div className="modal-stats">
          <div className="modal-stat modal-stat--free">🟢 {available} Boş</div>
          <div className="modal-stat modal-stat--occ">🔴 {occupied} Tutulub</div>
          <div className="modal-stat">💺 {seats.length} Cəmi</div>
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
              Tutulub
            </div>
          </div>
        )}

        {loading && <div className="seatmap-loading">Yüklənir...</div>}
        {error && <div className="seatmap-error">⚠ {error}</div>}

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
          <div className="seatmap-empty">Bu bilet üçün oturacaq tapılmadı.</div>
        )}
      </div>
    </div>
  );
}

// ─── Ticket Card ───────────────────────────────────────────────────────────
function TicketCard({ ticket, isNew }) {
  const [showSeats, setShowSeats] = useState(false);
  const sb = stateBadge(ticket.state);

  return (
    <>
      <div className={`spt-card ${isNew ? "spt-card--new" : ""}`}>
        {isNew && <div className="spt-card-new-badge">YENİ</div>}

        <div className="spt-card-header">
          <div className="spt-card-airline">{ticket.airline}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: sb.color }}>{sb.label}</span>
            <div className="spt-card-id">#{ticket.id}</div>
          </div>
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
            <span className="spt-info-label">TARİX</span>
            <span className="spt-info-val">{fmtDate(ticket.dueDate)}</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">SAAT</span>
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
            <span className="spt-info-label">BAGAJ</span>
            <span className="spt-info-val">{ticket.luggageKg ?? "—"} kg</span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">QİYMƏT</span>
            <span className="spt-info-val spt-info-val--price">
              {ticket.price > 0 ? `${ticket.price} ₼` : "—"}
            </span>
          </div>
          <div className="spt-info-item">
            <span className="spt-info-label">BOŞ YER</span>
            <span className={`spt-info-val ${ticket.availableSeats < 5 ? "spt-info-val--low" : "spt-info-val--ok"}`}>
              {ticket.availableSeats}
            </span>
          </div>
        </div>

        <div className="spt-card-countdown">
          🕐 {countdown(ticket.dueDate)}
        </div>

        <button className="spt-seatmap-btn" onClick={() => setShowSeats(true)}>
          💺 Oturacaq Xəritəsi
        </button>
      </div>

      {showSeats && <SeatMapModal ticket={ticket} onClose={() => setShowSeats(false)} />}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ShowPlaneTicket() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [airline, setAirline] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState("");
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
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("PageNumber", pageNumber);
      params.set("PageSize", pageSize);
      if (airline.trim()) params.set("Airline", airline.trim());
      if (fromId) params.set("FromLocationId", fromId);
      if (toId) params.set("ToLocationId", toId);
      if (date) params.set("Date", new Date(date).toISOString());

      const res = await fetch(`${BASE_URL}/PlaneTicket?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server xətası: ${res.status}`);
      const data = await res.json();
      // Backend Pagination<T> shape: { data: [...], totalDataCount, page, size }
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
            <p className="spt-meta">{totalCount} bilet tapıldı</p>
          </div>
        </div>
        <button className="spt-create-btn" onClick={() => navigate("/create-plane-ticket")}>
          ＋ Bilet Yarat
        </button>
      </div>

      {newTicketId && (
        <div className="spt-new-banner">
          ✅ Bilet <strong>#{newTicketId}</strong> uğurla yaradıldı!
        </div>
      )}

      <div className="spt-filters">
        <div className="spt-filter-grid">
          <div className="spt-filter-group">
            <label>Airline</label>
            <input type="text" placeholder="məs. AZAL" value={airline} onChange={e => setAirline(e.target.value)} />
          </div>
          <div className="spt-filter-group">
            <label>Haradan</label>
            <select value={fromId} onChange={e => setFromId(e.target.value)} className="spt-select">
              <option value="">— Hamısı —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>Haraya</label>
            <select value={toId} onChange={e => setToId(e.target.value)} className="spt-select">
              <option value="">— Hamısı —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="spt-filter-group">
            <label>Tarix</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="spt-filter-actions">
          <button className="spt-search-btn" onClick={() => { setPageNumber(1); fetchTickets(); }}>Axtar</button>
          <button className="spt-reset-btn" onClick={() => { setAirline(""); setFromId(""); setToId(""); setDate(""); setPageNumber(1); }}>Sıfırla</button>
        </div>
      </div>

      <div className="spt-content">
        {loading && (
          <div className="spt-state">
            <div className="spt-spinner" />
            <p>Yüklənir...</p>
          </div>
        )}
        {error && !loading && (
          <div className="spt-state spt-error">
            <span>⚠️</span><p>{error}</p>
            <button onClick={fetchTickets}>Yenidən cəhd et</button>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="spt-state">
            <span className="spt-empty-icon">✈️</span>
            <p>Bilet tapılmadı.</p>
            <button className="spt-create-btn" onClick={() => navigate("/create-plane-ticket")}>
              ＋ Bilet Yarat
            </button>
          </div>
        )}
        {!loading && !error && tickets.length > 0 && (
          <div className="spt-grid">
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} isNew={ticket.id === highlightId} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="spt-pagination">
            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>← Əvvəl</button>
            <span>{pageNumber} / {totalPages}</span>
            <button disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => p + 1)}>Növbəti →</button>
          </div>
        )}
      </div>
    </div>
  );
}