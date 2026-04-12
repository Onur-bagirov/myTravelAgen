import { useState, useEffect, useCallback } from "react";
import "./showTrain.css";
import PaymentModal from "../PymetModal/pyMod";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";

const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

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
  } catch { return false; }
};

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

function parseSeatName(name) {
  const m = name?.match(/^(\d+)([A-K])$/);
  if (!m) return { row: 0, col: 0 };
  return { row: parseInt(m[1], 10), col: m[2].charCodeAt(0) - 65 };
}

/* ─── Seat Map ─── */
function SeatMap({ seats, selectedSeatId, onSelect }) {
  if (!seats.length) return <p className="st-no-seats">No seats found for this ticket.</p>;

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

  const variantColors = {};
  let colorIdx = 0;
  seats.forEach((s) => {
    if (s.variantId !== undefined && !variantColors[s.variantId])
      variantColors[s.variantId] = PALETTE[colorIdx++ % PALETTE.length];
  });

  const available = seats.filter((s) => !s.isOccupied).length;
  const occupied  = seats.filter((s) => s.isOccupied).length;

  return (
    <>
      <div className="st-modal-stats">
        <div className="st-modal-stat st-modal-stat--free">🟢 {available} Available</div>
        <div className="st-modal-stat st-modal-stat--occ">🔴 {occupied} Occupied</div>
        <div className="st-modal-stat">💺 {seats.length} Total</div>
      </div>

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
                    className={[
                      "st-seat-btn",
                      seat.isOccupied ? "st-seat--occupied" : "st-seat--free",
                      isSelected ? "st-seat--selected" : "",
                    ].filter(Boolean).join(" ")}
                    style={
                      !seat.isOccupied && !isSelected
                        ? { "--seat-color": color, "--seat-bg": `${color}22` }
                        : {}
                    }
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

/* ─── Booking Modal ─── */
function BookingModal({ ticket, onClose }) {
  const [seats, setSeats]               = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatsError, setSeatsError]     = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [buying, setBuying]             = useState(false);
  const [buyError, setBuyError]         = useState(null);
  const [success, setSuccess]           = useState(false);
  const [showPayment, setShowPayment]   = useState(false);

  // ── Düzəliş: qiymət yalnız seat-in variantPrice-ından gəlir ──
  const totalPrice = selectedSeat
    ? Number(selectedSeat.variantPrice ?? 0).toFixed(2)
    : "—";

  useEffect(() => {
    if (!ticket?.id) return;
    setLoadingSeats(true);
    fetch(`${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=train`)
      .then((r) => r.json())
      .then((d) => setSeats(Array.isArray(d?.data) ? d.data : []))
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
      const res = await fetch(`${BASE_URL}/TrainTicket/fill`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
      });
      const rawText = await res.text();
      let result = null;
      try { result = rawText ? JSON.parse(rawText) : null; } catch { result = null; }
      if (!res.ok) {
        let errMsg = result?.message || result?.title || `Server error: ${res.status}`;
        if (result?.errors) errMsg = Object.values(result.errors).flat().join(", ");
        setSeats((prev) =>
          prev.map((s) => s.id === selectedSeat.id ? { ...s, isOccupied: true } : s)
        );
        setSelectedSeat(null);
        throw new Error(errMsg);
      }
      if (!result?.data) {
        setSeats((prev) =>
          prev.map((s) => s.id === selectedSeat.id ? { ...s, isOccupied: true } : s)
        );
        setSelectedSeat(null);
        throw new Error("This seat is already taken. Please choose another.");
      }
      setSuccess(true);
    } catch (e) { setBuyError(e.message); } finally { setBuying(false); }
  }

  const fromName = ticket.from?.split(",")[0] ?? "—";
  const toName   = ticket.to?.split(",")[0]   ?? "—";

  if (success) return (
    <div className="st-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
      <div className="st-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
            <div className="st-state" style={{ padding: "32px 0" }}>
              <div className="st-spinner" />
            </div>
          ) : seatsError ? (
            <div className="st-error-banner">{seatsError}</div>
          ) : (
            <SeatMap
              seats={seats}
              selectedSeatId={selectedSeat?.id}
              onSelect={setSelectedSeat}
            />
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

/* ─── Ticket Card ─── */
function TicketCard({ ticket, onClick, onDelete, adminMode }) {
  const seats = ticket.availableSeats;
  const seatsClass =
    seats <= 5  ? "st-info-val--low" :
    seats <= 15 ? "st-info-val--warn" :
                  "st-info-val--ok";

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete ticket "${ticket.trainCompany} — ${ticket.trainNumber}"?`))
      onDelete(ticket.id);
  };

  const fromCode = (ticket.from?.split(",")[0] ?? "???").slice(0, 3).toUpperCase();
  const toCode   = (ticket.to?.split(",")[0]   ?? "???").slice(0, 3).toUpperCase();
  const fromFull = ticket.from?.split(",")[0] ?? "";
  const toFull   = ticket.to?.split(",")[0]   ?? "";

  // Qiymət 0-dırsa "—" göstər
  const displayPrice =
    ticket.minPrice && Number(ticket.minPrice) > 0
      ? `from ${Number(ticket.minPrice).toFixed(2)} ₼`
      : ticket.price && Number(ticket.price) > 0
        ? `${ticket.price} ₼`
        : "—";

  return (
    <div className="st-card">
      <div className="st-card-header">
        <div className="st-card-company">{ticket.trainCompany}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="st-card-status">⏳ Pending</span>
          {adminMode && (
            <button className="st-delete-btn" onClick={handleDelete} title="Delete">🗑</button>
          )}
        </div>
      </div>

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

      <button className="st-seatmap-btn" onClick={onClick}>
        💺 Seat Map
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
const PAGE_SIZE = 9;
const EMPTY_FILTERS = { trainCompany: "", date: "", fromLocationId: "", toLocationId: "" };

export default function ShowTrainTickets() {
  const [tickets, setTickets]           = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [locations, setLocations]       = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [deleteError, setDeleteError]   = useState(null);
  const adminMode = isAdmin();

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`)
      .then((r) => r.json())
      .then((d) => setLocations(Array.isArray(d?.data) ? d.data : []));
  }, []);

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ PageNumber: String(p), PageSize: String(PAGE_SIZE) });
      if (filters.trainCompany)   params.set("TrainCompany", filters.trainCompany);
      if (filters.date)           params.set("Date", new Date(filters.date).toISOString());
      if (filters.fromLocationId) params.set("FromLocationId", filters.fromLocationId);
      if (filters.toLocationId)   params.set("ToLocationId", filters.toLocationId);

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

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchTickets(1);
  };

  const handleDelete = async (id) => {
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/TrainTicket?id=${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete ticket.");
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setTotalCount((c) => c - 1);
    } catch (e) { setDeleteError(e.message); }
  };

  return (
    <div className="st-page">
      {/* Header */}
      <div className="st-header">
        <div className="st-title-block">
          <div className="st-icon">🚂</div>
          <div>
            <h1 className="st-title">Train Tickets</h1>
            <p className="st-meta">{totalCount} tickets found</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="st-filters">
        <div className="st-filter-grid">
          <div className="st-filter-group">
            <label>Company</label>
            <input
              type="text"
              placeholder="e.g. ADY"
              value={filters.trainCompany}
              onChange={(e) => setFilters({ ...filters, trainCompany: e.target.value })}
            />
          </div>
          <div className="st-filter-group">
            <label>From</label>
            <select
              className="st-filter-select"
              value={filters.fromLocationId}
              onChange={(e) => setFilters({ ...filters, fromLocationId: e.target.value })}
            >
              <option value="">— All Locations —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="st-filter-group">
            <label>To</label>
            <select
              className="st-filter-select"
              value={filters.toLocationId}
              onChange={(e) => setFilters({ ...filters, toLocationId: e.target.value })}
            >
              <option value="">— All Locations —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="st-filter-group">
            <label>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
        </div>
        <div className="st-filter-actions">
          <button className="st-search-btn" onClick={handleSearch}>Search</button>
          <button className="st-reset-btn" onClick={handleReset}>Reset</button>
        </div>
      </div>

      {deleteError && <div className="st-error-banner">{deleteError}</div>}

      <div className="st-content">
        {loading && (
          <div className="st-state">
            <div className="st-spinner" />
            <p>Loading...</p>
          </div>
        )}

        {error && !loading && (
          <div className="st-state st-state-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={() => fetchTickets(page)}>Try Again</button>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="st-state">
            <span className="st-empty-icon">🚂</span>
            <p>No tickets found.</p>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
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

        {!loading && totalPages > 1 && (
          <div className="st-pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>

      {activeTicket && (
        <BookingModal ticket={activeTicket} onClose={() => setActiveTicket(null)} />
      )}
    </div>
  );
}