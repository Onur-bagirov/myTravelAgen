import React, { useState, useEffect, useCallback } from "react";
import "./showTrain.css";

// ─── Konfiqurasiya ────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const PAGE_SIZE = 9;

// ─── Token & Auth köməkçiləri ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem("userToken");

const isAdmin = () => {
  try {
    const token = getToken();
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role =
      payload["role"] ||
      payload["roles"] ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      "";
    if (Array.isArray(role)) return role.includes("Admin");
    return role === "Admin";
  } catch {
    return false;
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const fmt = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("az-AZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const parseSeatName = (name) => {
  const match = name?.match(/^(\d+)([A-K])$/);
  if (!match) return { row: 0, col: 0 };
  return {
    row: parseInt(match[1], 10),
    col: match[2].charCodeAt(0) - 65,
  };
};

// ─── SeatMap Komponenti ──────────────────────────────────────────────────────
function SeatMap({ seats, selectedSeatId, onSelect }) {
  if (!seats.length) {
    return <p className="st-no-seats">Bu bilet üçün oturacaq tapılmadı.</p>;
  }

  const maxRow = Math.max(...seats.map((s) => parseSeatName(s.name).row));
  const maxCol = Math.max(...seats.map((s) => parseSeatName(s.name).col));

  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol + 1 }, (_, ci) =>
      seats.find((s) => {
        const p = parseSeatName(s.name);
        return p.row === ri + 1 && p.col === ci;
      }) ?? null
    )
  );

  const palette = ["#38bdf8", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#facc15"];
  const variantColors = {};
  let colorIdx = 0;
  seats.forEach((s) => {
    if (s.variantId !== undefined && !variantColors[s.variantId]) {
      variantColors[s.variantId] = palette[colorIdx++ % palette.length];
    }
  });

  return (
    <div className="st-seatmap">
      <div className="st-seatmap-legend">
        {Object.entries(variantColors).map(([vid, color]) => {
          const sample = seats.find((s) => String(s.variantId) === String(vid));
          if (!sample) return null;
          return (
            <span key={vid} className="st-legend-item">
              <span className="st-legend-dot" style={{ background: color }} />
              {sample.variantName} — {sample.variantPrice} ₼
            </span>
          );
        })}
        <span className="st-legend-item">
          <span className="st-legend-dot" style={{ background: "#374151" }} /> Dolu
        </span>
      </div>

      <div className="st-train-nose">🚂 Lokomotiv (Baş tərəf)</div>

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
                  className={[
                    "st-seat",
                    seat.isOccupied ? "st-seat--occupied" : "st-seat--free",
                    isSelected ? "st-seat--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={!seat.isOccupied && !isSelected ? { "--seat-color": color } : {}}
                  disabled={seat.isOccupied}
                  onClick={() => !seat.isOccupied && onSelect(seat)}
                  title={`${seat.name} — ${seat.variantName}`}
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

// ─── BookingModal Komponenti (Düymə Silinib) ──────────────────────────────────
function BookingModal({ ticket, onClose }) {
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatsError, setSeatsError] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    if (!ticket?.id) return;
    setLoadingSeats(true);
    fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=train`)
      .then((r) => r.json())
      .then((d) => {
        setSeats(Array.isArray(d?.data) ? d.data : []);
      })
      .catch(() => setSeatsError("Oturacaqlar yüklənmədi."))
      .finally(() => setLoadingSeats(false));
  }, [ticket?.id]);

  return (
    <div className="st-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="st-modal">
        <div className="st-modal-header">
          <div className="st-modal-route">
            <span>{ticket.from?.split(",")[0]}</span>
            <span className="st-modal-arrow">→</span>
            <span>{ticket.to?.split(",")[0]}</span>
          </div>
          <button className="st-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="st-modal-body">
          <div className="st-modal-meta">
            🚆 {ticket.trainCompany} | 🚃 Vaqon {ticket.vagonNumber} | 📅 {fmt(ticket.dueDate)}
          </div>

          {loadingSeats ? (
            <div className="st-spinner-wrap"><span className="st-spinner" /></div>
          ) : seatsError ? (
            <div className="st-error">{seatsError}</div>
          ) : (
            <SeatMap seats={seats} selectedSeatId={selectedSeat?.id} onSelect={setSelectedSeat} />
          )}

          {selectedSeat && (
            <div className="st-selected-banner">
              💺 Seçildi: <strong>{selectedSeat.name}</strong> | Qiymət: <strong>{selectedSeat.variantPrice} ₼</strong>
            </div>
          )}
          
          {/* TƏSDİQLƏ DÜYMƏSİ BURADAN SİLİNDİ */}
        </div>
      </div>
    </div>
  );
}

// ─── TicketCard Komponenti ──────────────────────────────────────────────────
function TicketCard({ ticket, onClick, onDelete, adminMode }) {
  const urgency = ticket.availableSeats <= 5 ? "critical" : ticket.availableSeats <= 15 ? "low" : "ok";

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`"${ticket.trainCompany} — ${ticket.trainNumber}" biletini silmək istəyirsiniz?`)) {
      onDelete(ticket.id);
    }
  };

  return (
    <div className="st-card" onClick={onClick}>
      <div className="st-card-header">
        <span className="st-card-company">{ticket.trainCompany}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="st-card-number">{ticket.trainNumber}</span>
          {adminMode && (
            <button className="st-delete-btn" onClick={handleDelete} title="Bileti sil">🗑</button>
          )}
        </div>
      </div>
      <div className="st-card-route">
        <div className="st-card-city">
          <span className="st-card-city-name">{ticket.from?.split(",")[0]}</span>
        </div>
        <div className="st-card-track">
          <div className="st-card-track-line" />
          <span>🚆</span>
        </div>
        <div className="st-card-city st-card-city--right">
          <span className="st-card-city-name">{ticket.to?.split(",")[0]}</span>
        </div>
      </div>
      <div className="st-card-footer">
        <div className="st-card-info">
          <span>📅 {fmt(ticket.dueDate)}</span>
          <span>🚃 Vaqon {ticket.vagonNumber}</span>
        </div>
        <div className="st-card-bottom">
          <div className={`st-seats-badge st-seats-badge--${urgency}`}>
            {ticket.availableSeats} yer
          </div>
          <span className="st-card-price"><strong>{ticket.price.toFixed(2)} ₼</strong></span>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Komponent — ShowTrainTickets ─────────────────────────────────────────
export default function ShowTrainTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locations, setLocations] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const adminMode = isAdmin();

  const [filters, setFilters] = useState({
    trainCompany: "",
    date: "",
    fromLocationId: "",
    toLocationId: "",
  });

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`)
      .then((r) => r.json())
      .then((d) => setLocations(Array.isArray(d?.data) ? d.data : []));
  }, []);

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ PageNumber: String(p), PageSize: String(PAGE_SIZE) });
      if (filters.trainCompany) params.set("TrainCompany", filters.trainCompany);
      if (filters.date) params.set("Date", new Date(filters.date).toISOString());
      if (filters.fromLocationId) params.set("FromLocationId", filters.fromLocationId);
      if (filters.toLocationId) params.set("ToLocationId", filters.toLocationId);

      const res = await fetch(`${BASE_URL}/TrainTicket?${params}`);
      const json = await res.json();
      setTickets(json.data || []);
      setTotalPages(Math.ceil((json.totalDataCount || 0) / PAGE_SIZE));
    } catch (e) {
      setError("Biletlər tapılmadı.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTickets(page); }, [page, fetchTickets]);

  const handleDelete = async (id) => {
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/TrainTicket?id=${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Silinmə zamanı xəta baş verdi.");
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setDeleteError(e.message);
    }
  };

  return (
    <div className="st-page">
      <div className="st-container">
        <header className="st-header">
          <h1 className="st-title">Qatar Biletləri</h1>
        </header>

        <form className="st-filters" onSubmit={(e) => { e.preventDefault(); setPage(1); fetchTickets(1); }}>
          <input className="st-filter-input" placeholder="Şirkət..." value={filters.trainCompany} onChange={(e) => setFilters({...filters, trainCompany: e.target.value})} />
          <input className="st-filter-input" type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
          <select className="st-filter-select" value={filters.fromLocationId} onChange={(e) => setFilters({...filters, fromLocationId: e.target.value})}>
            <option value="">📍 Haradan...</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select className="st-filter-select" value={filters.toLocationId} onChange={(e) => setFilters({...filters, toLocationId: e.target.value})}>
            <option value="">🏁 Haraya...</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button className="st-filter-btn" type="submit">Axtar</button>
        </form>

        {deleteError && <div className="st-error" style={{ marginBottom: "1rem" }}>{deleteError}</div>}

        {loading ? (
          <div className="st-loading">Yüklənir...</div>
        ) : error ? (
          <div className="st-error">{error}</div>
        ) : (
          <div className="st-grid">
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onClick={() => setActiveTicket(t)}
                onDelete={handleDelete}
                adminMode={adminMode}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="st-pagination">
            <button className="st-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Əvvəl</button>
            <span>{page} / {totalPages}</span>
            <button className="st-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sonra</button>
          </div>
        )}
      </div>

      {activeTicket && (
        <BookingModal
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
        />
      )}
    </div>
  );
}