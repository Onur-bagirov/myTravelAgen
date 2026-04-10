import React, { useState, useEffect, useCallback } from "react";
import "./showTrain.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getUserId = () => {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload.nameid ||
      payload.sub ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      null
    );
  } catch {
    return null;
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("az-AZ", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const parseSeatName = (name) => {
  const match = name?.match(/^(\d+)([A-K])$/);
  if (!match) return { row: 0, col: 0 };
  return { row: parseInt(match[1]), col: match[2].charCodeAt(0) - 65 };
};

// ─── SeatMap component ────────────────────────────────────────────────────────
function SeatMap({ seats, selectedSeatId, onSelect }) {
  if (!seats.length) return <p className="st-no-seats">Oturacaq tapılmadı.</p>;

  // Build grid
  const maxRow = Math.max(...seats.map((s) => parseSeatName(s.name).row));
  const maxCol = Math.max(...seats.map((s) => parseSeatName(s.name).col));

  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol + 1 }, (_, ci) =>
      seats.find((s) => {
        const p = parseSeatName(s.name);
        return p.row === ri + 1 && p.col === ci;
      }) || null
    )
  );

  // Variant color palette
  const variantColors = {};
  const palette = ["#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#facc15"];
  let colorIdx = 0;
  seats.forEach((s) => {
    if (!variantColors[s.variantId]) {
      variantColors[s.variantId] = palette[colorIdx++ % palette.length];
    }
  });

  return (
    <div className="st-seatmap">
      <div className="st-seatmap-legend">
        {Object.entries(variantColors).map(([vid, color]) => {
          const sample = seats.find((s) => s.variantId === Number(vid));
          return (
            <span key={vid} className="st-legend-item">
              <span className="st-legend-dot" style={{ background: color }} />
              {sample?.variantName} — {sample?.variantPrice} ₼
            </span>
          );
        })}
        <span className="st-legend-item">
          <span className="st-legend-dot" style={{ background: "#374151" }} />
          Dolu
        </span>
        <span className="st-legend-item">
          <span className="st-legend-dot st-legend-selected" />
          Seçildi
        </span>
      </div>

      <div className="st-train-nose">🚂 Lokomotiv</div>

      <div className="st-seat-grid">
        {grid.map((row, ri) => (
          <div key={ri} className="st-seat-row">
            <span className="st-row-label">{ri + 1}</span>
            {row.map((seat, ci) => {
              if (!seat) return <div key={ci} className="st-seat-empty" />;
              const isSelected = seat.id === selectedSeatId;
              const color = variantColors[seat.variantId];
              return (
                <button
                  key={seat.id}
                  className={`st-seat ${seat.isOccupied ? "st-seat--occupied" : "st-seat--free"} ${isSelected ? "st-seat--selected" : ""}`}
                  style={
                    !seat.isOccupied && !isSelected
                      ? { "--seat-color": color }
                      : {}
                  }
                  disabled={seat.isOccupied}
                  onClick={() => !seat.isOccupied && onSelect(seat)}
                  title={`${seat.name} — ${seat.variantName} — ${seat.variantPrice} ₼`}
                >
                  {seat.name}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BookingModal component ───────────────────────────────────────────────────
function BookingModal({ ticket, onClose, onBooked }) {
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [form, setForm] = useState({
    hasPet: false, hasChild: false,
    luggageCount: 0, totalLuggageKg: 0,
    isRoundTrip: false, note: "",
  });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoadingSeats(true);
    fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=train`)
      .then((r) => r.json())
      .then((d) => setSeats(d?.data || []))
      .catch(() => setSeats([]))
      .finally(() => setLoadingSeats(false));
  }, [ticket.id]);

  const handleBook = async () => {
    if (!selectedSeat) { setError("Oturacaq seçin."); return; }
    const userId = getUserId();
    if (!userId) { setError("Giriş etməyiniz tələb olunur."); return; }
    setBooking(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/TrainTicket/fill`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: ticket.id,
          userId: Number(userId),
          chosenSeatId: selectedSeat.id,
          hasPet: form.hasPet,
          hasChild: form.hasChild,
          luggageCount: Number(form.luggageCount),
          totalLuggageKg: Number(form.totalLuggageKg),
          isRoundTrip: form.isRoundTrip,
          note: form.note || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Server xətası");
      setSuccess(true);
      setTimeout(() => { onBooked?.(); onClose(); }, 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="st-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="st-modal">
        {/* Modal header */}
        <div className="st-modal-header">
          <div className="st-modal-route">
            <span className="st-modal-city">{ticket.from?.split(",")[0]}</span>
            <span className="st-modal-arrow">
              <svg viewBox="0 0 60 12" fill="none">
                <path d="M0 6 H52" stroke="currentColor" strokeWidth="1.5" />
                <path d="M48 1 L58 6 L48 11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="st-modal-city">{ticket.to?.split(",")[0]}</span>
          </div>
          <div className="st-modal-meta">
            <span>🚆 {ticket.trainCompany} · {ticket.trainNumber}</span>
            <span>🚃 Vaqon {ticket.vagonNumber}</span>
            <span>📅 {fmt(ticket.dueDate)}</span>
          </div>
          <button className="st-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Seat map */}
        <div className="st-modal-body">
          {loadingSeats ? (
            <div className="st-spinner-wrap"><span className="st-spinner" /></div>
          ) : (
            <SeatMap seats={seats} selectedSeatId={selectedSeat?.id} onSelect={setSelectedSeat} />
          )}

          {selectedSeat && (
            <div className="st-selected-banner">
              💺 Seçildi: <strong>{selectedSeat.name}</strong> —
              <span className="st-variant-chip">{selectedSeat.variantName}</span>
              <strong>{selectedSeat.variantPrice} ₼</strong>
            </div>
          )}

          {/* Options */}
          <div className="st-options-grid">
            <label className="st-toggle">
              <input type="checkbox" checked={form.hasPet}
                onChange={e => setForm(p => ({ ...p, hasPet: e.target.checked }))} />
              <span className="st-toggle-track" />
              <span>🐾 Ev Heyvanı</span>
            </label>
            <label className="st-toggle">
              <input type="checkbox" checked={form.hasChild}
                onChange={e => setForm(p => ({ ...p, hasChild: e.target.checked }))} />
              <span className="st-toggle-track" />
              <span>👶 Uşaq</span>
            </label>
            <label className="st-toggle">
              <input type="checkbox" checked={form.isRoundTrip}
                onChange={e => setForm(p => ({ ...p, isRoundTrip: e.target.checked }))} />
              <span className="st-toggle-track" />
              <span>🔄 Gedib-Gəlmə</span>
            </label>

            <div className="st-num-field">
              <span>🧳 Baqaj say</span>
              <input type="number" min={0} value={form.luggageCount}
                onChange={e => setForm(p => ({ ...p, luggageCount: e.target.value }))} />
            </div>
            <div className="st-num-field">
              <span>⚖️ Baqaj kg</span>
              <input type="number" min={0} step={0.5} value={form.totalLuggageKg}
                onChange={e => setForm(p => ({ ...p, totalLuggageKg: e.target.value }))} />
            </div>
          </div>

          <textarea className="st-note" placeholder="Qeyd (istəyə görə)..."
            value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />

          {error && <div className="st-error">⚠️ {error}</div>}
          {success && <div className="st-success">✅ Bilet uğurla sifariş edildi!</div>}

          <button className="st-book-btn" onClick={handleBook} disabled={booking || success || !selectedSeat}>
            {booking ? <><span className="st-spinner st-spinner--sm" /> Gözləyin...</>
              : success ? "✅ Uğurlu!"
              : `🎫 BİLETİ SİFARİŞ ET${selectedSeat ? ` — ${selectedSeat.variantPrice} ₼` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShowTrainTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    trainCompany: "", date: "",
    fromLocationId: "", toLocationId: "",
  });
  const [locations, setLocations] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);

  const PAGE_SIZE = 9;

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({
        PageNumber: p, PageSize: PAGE_SIZE,
        ...(filters.trainCompany && { TrainCompany: filters.trainCompany }),
        ...(filters.date && { Date: new Date(filters.date).toISOString() }),
        ...(filters.fromLocationId && { FromLocationId: filters.fromLocationId }),
        ...(filters.toLocationId && { ToLocationId: filters.toLocationId }),
      });
      const res = await fetch(`${BASE_URL}/TrainTicket?${params}`);
      const json = await res.json();
      const items = json?.items || json?.data?.items || json?.data || [];
      const total = json?.totalCount ?? json?.totalPages ?? 1;
      setTickets(Array.isArray(items) ? items : []);
      setTotalPages(
        total > PAGE_SIZE ? Math.ceil(total / PAGE_SIZE) : total
      );
    } catch {
      setError("Ticketlər yüklənə bilmədi.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`)
      .then(r => r.json())
      .then(d => setLocations(d?.data?.items || d?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTickets(page); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets(1);
  };

  return (
    <div className="st-page">
      {/* Background decoration */}
      <div className="st-bg-rail" aria-hidden>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="st-bg-sleeper" style={{ left: `${i * 5.5}%` }} />
        ))}
      </div>

      <div className="st-container">
        {/* Page title */}
        <header className="st-header">
          <div className="st-header-icon">🚆</div>
          <h1 className="st-title">Qatar Biletləri</h1>
          <p className="st-subtitle">Mövcud biletlər — oturacaq seçib sifariş edin</p>
        </header>

        {/* Filters */}
        <form className="st-filters" onSubmit={handleSearch}>
          <input className="st-filter-input" placeholder="🔍 Şirkət adı..."
            value={filters.trainCompany}
            onChange={e => setFilters(p => ({ ...p, trainCompany: e.target.value }))} />
          <input className="st-filter-input" type="date"
            value={filters.date}
            onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
          <select className="st-filter-select"
            value={filters.fromLocationId}
            onChange={e => setFilters(p => ({ ...p, fromLocationId: e.target.value }))}>
            <option value="">📍 Haradan...</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select className="st-filter-select"
            value={filters.toLocationId}
            onChange={e => setFilters(p => ({ ...p, toLocationId: e.target.value }))}>
            <option value="">🏁 Haraya...</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button className="st-filter-btn" type="submit">Axtar</button>
        </form>

        {/* Content */}
        {loading ? (
          <div className="st-loading">
            <span className="st-spinner st-spinner--lg" />
            <p>Yüklənir...</p>
          </div>
        ) : error ? (
          <div className="st-error-block">⚠️ {error}</div>
        ) : tickets.length === 0 ? (
          <div className="st-empty">
            <span>🚉</span>
            <p>Heç bir bilet tapılmadı.</p>
          </div>
        ) : (
          <>
            <div className="st-grid">
              {tickets.map((t) => (
                <TicketCard key={t.id} ticket={t} onClick={() => setActiveTicket(t)} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="st-pagination">
                <button className="st-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  ← Əvvəl
                </button>
                <span className="st-page-info">{page} / {totalPages}</span>
                <button className="st-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Sonra →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking modal */}
      {activeTicket && (
        <BookingModal
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          onBooked={() => { fetchTickets(page); setActiveTicket(null); }}
        />
      )}
    </div>
  );
}

// ─── TicketCard ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, onClick }) {
  const urgency = ticket.availableSeats <= 5 ? "critical"
    : ticket.availableSeats <= 15 ? "low" : "ok";

  return (
    <div className="st-card" onClick={onClick}>
      <div className="st-card-header">
        <span className="st-card-company">{ticket.trainCompany}</span>
        <span className="st-card-number">{ticket.trainNumber}</span>
      </div>

      <div className="st-card-route">
        <div className="st-card-city">
          <span className="st-card-city-name">{ticket.from?.split(",")[0]}</span>
          <span className="st-card-city-country">{ticket.from?.split(",")[1]?.trim()}</span>
        </div>
        <div className="st-card-track">
          <div className="st-card-track-line" />
          <span className="st-card-track-icon">🚆</span>
        </div>
        <div className="st-card-city st-card-city--right">
          <span className="st-card-city-name">{ticket.to?.split(",")[0]}</span>
          <span className="st-card-city-country">{ticket.to?.split(",")[1]?.trim()}</span>
        </div>
      </div>

      <div className="st-card-footer">
        <div className="st-card-info">
          <span className="st-card-date">📅 {fmt(ticket.dueDate)}</span>
          <span className="st-card-vagon">🚃 Vaqon {ticket.vagonNumber}</span>
        </div>
        <div className="st-card-bottom">
          <div className={`st-seats-badge st-seats-badge--${urgency}`}>
            <span className="st-seats-count">{ticket.availableSeats}</span>
            <span className="st-seats-label">oturacaq</span>
          </div>
          {ticket.price > 0 && (
            <span className="st-card-price">
              <span className="st-price-from">dan</span>
              <strong>{ticket.price.toFixed(2)} ₼</strong>
            </span>
          )}
        </div>
      </div>

      <div className="st-card-cta">Oturacaq seç →</div>
    </div>
  );
}