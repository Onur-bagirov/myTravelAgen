import React, { useState, useEffect, useCallback } from "react";
import "./showTrain.css";

// ─── Konfiqurasiya ────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const PAGE_SIZE = 9;

// ─── Token & Auth köməkçiləri ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem("userToken");

/**
 * JWT payload-dan userId oxuyur.
 * Backend "uid" claim-i ilə yazır (LoginUserCommandHandler.cs-ə bax).
 */
const getUserId = () => {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Backend "uid" key-i ilə yazır
    return (
      payload["uid"] ||
      payload["nameid"] ||
      payload["sub"] ||
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

// ─── Tarix formatı (az-AZ) ────────────────────────────────────────────────────
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

// ─── Oturacaq adından sıra/sütun parse ───────────────────────────────────────
// Format: "3B" → row=3, col=1 (B=1)
const parseSeatName = (name) => {
  const match = name?.match(/^(\d+)([A-K])$/);
  if (!match) return { row: 0, col: 0 };
  return {
    row: parseInt(match[1], 10),
    col: match[2].charCodeAt(0) - 65, // A=0, B=1 ...
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SeatMap komponenti
// Backend endpoint: GET /api/Seat/by-ticket?TicketId=X&TicketType=train
// Cavab: ResponseModel<List<GetSeatsByTicketQueryResponse>>
//   → { data: [ { id, name, isOccupied, variantId, variantName, variantPrice } ] }
// ─────────────────────────────────────────────────────────────────────────────
function SeatMap({ seats, selectedSeatId, onSelect }) {
  if (!seats.length) {
    return <p className="st-no-seats">Bu bilet üçün oturacaq tapılmadı.</p>;
  }

  // Grid üçün maksimum sıra/sütun hesabla
  const maxRow = Math.max(...seats.map((s) => parseSeatName(s.name).row));
  const maxCol = Math.max(...seats.map((s) => parseSeatName(s.name).col));

  // 2D grid qur
  const grid = Array.from({ length: maxRow }, (_, ri) =>
    Array.from({ length: maxCol + 1 }, (_, ci) =>
      seats.find((s) => {
        const p = parseSeatName(s.name);
        return p.row === ri + 1 && p.col === ci;
      }) ?? null
    )
  );

  // Variant rəngləri
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
      {/* Rəng izahı */}
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
          <span className="st-legend-dot" style={{ background: "#374151" }} />
          Dolu
        </span>
        <span className="st-legend-item">
          <span className="st-legend-dot st-legend-selected" />
          Seçildi
        </span>
      </div>

      {/* Lokomotiv başlığı */}
      <div className="st-train-nose">🚂 Lokomotiv</div>

      {/* Oturacaq şəbəkəsi */}
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

// ─────────────────────────────────────────────────────────────────────────────
// BookingModal komponenti
// Backend endpoint: PUT /api/TrainTicket/fill
// Body: { id, userId, chosenSeatId, hasPet, hasChild,
//         luggageCount, totalLuggageKg, isRoundTrip, note }
// ─────────────────────────────────────────────────────────────────────────────
function BookingModal({ ticket, onClose, onBooked }) {
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatsError, setSeatsError] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [form, setForm] = useState({
    hasPet: false,
    hasChild: false,
    luggageCount: 0,
    totalLuggageKg: 0,
    note: "",
  });

  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Oturacaqları yüklə
  useEffect(() => {
    if (!ticket?.id) return;
    setLoadingSeats(true);
    setSeatsError(null);

    fetch(
      `${BASE_URL}/Seat/by-ticket?TicketId=${ticket.id}&TicketType=train`
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        // ResponseModel<List<...>> → { data: [...] }
        const list = Array.isArray(d?.data) ? d.data : [];
        setSeats(list);
        if (list.length === 0) setSeatsError("Bu bilet üçün oturacaq mövcud deyil.");
      })
      .catch((e) => setSeatsError(`Oturacaqlar yüklənmədi: ${e.message}`))
      .finally(() => setLoadingSeats(false));
  }, [ticket?.id]);

  const handleBook = async () => {
    if (!selectedSeat) {
      setBookError("Zəhmət olmasa oturacaq seçin.");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setBookError("Sifariş etmək üçün hesabınıza daxil olun.");
      return;
    }

    setBooking(true);
    setBookError(null);

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
          note: form.note.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || json?.errors?.[0] || `Server xətası (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onBooked?.();
        onClose();
      }, 1800);
    } catch (e) {
      setBookError(e.message);
    } finally {
      setBooking(false);
    }
  };

  // ESC ilə bağla
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="st-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="st-modal" role="dialog" aria-modal="true">
        {/* Modal başlığı */}
        <div className="st-modal-header">
          <div className="st-modal-route">
            <span className="st-modal-city">
              {ticket.from?.split(",")[0] ?? "—"}
            </span>
            <span className="st-modal-arrow">
              <svg viewBox="0 0 60 12" fill="none">
                <path d="M0 6 H52" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M48 1 L58 6 L48 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="st-modal-city">
              {ticket.to?.split(",")[0] ?? "—"}
            </span>
          </div>

          <div className="st-modal-meta">
            <span>
              🚆 {ticket.trainCompany} · {ticket.trainNumber}
            </span>
            <span>🚃 Vaqon {ticket.vagonNumber}</span>
            <span>📅 {fmt(ticket.dueDate)}</span>
          </div>

          <button
            className="st-modal-close"
            onClick={onClose}
            aria-label="Bağla"
          >
            ✕
          </button>
        </div>

        {/* Modal gövdəsi */}
        <div className="st-modal-body">
          {/* Oturacaq xəritəsi */}
          {loadingSeats ? (
            <div className="st-spinner-wrap">
              <span className="st-spinner" />
              <p>Oturacaqlar yüklənir...</p>
            </div>
          ) : seatsError ? (
            <div className="st-error">⚠️ {seatsError}</div>
          ) : (
            <SeatMap
              seats={seats}
              selectedSeatId={selectedSeat?.id}
              onSelect={setSelectedSeat}
            />
          )}

          {/* Seçilmiş oturacaq banner */}
          {selectedSeat && (
            <div className="st-selected-banner">
              💺 Seçildi:{" "}
              <strong>{selectedSeat.name}</strong> —{" "}
              <span className="st-variant-chip">{selectedSeat.variantName}</span>
              <strong>{selectedSeat.variantPrice} ₼</strong>
            </div>
          )}

          {/* Əlavə seçimlər */}
          <div className="st-options-grid">
            <label className="st-toggle">
              <input
                type="checkbox"
                checked={form.hasPet}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hasPet: e.target.checked }))
                }
              />
              <span className="st-toggle-track" />
              <span>🐾 Ev Heyvanı</span>
            </label>

            <label className="st-toggle">
              <input
                type="checkbox"
                checked={form.hasChild}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hasChild: e.target.checked }))
                }
              />
              <span className="st-toggle-track" />
              <span>👶 Uşaq</span>
            </label>

            <div className="st-num-field">
              <span>🧳 Baqaj sayı</span>
              <input
                type="number"
                min={0}
                max={10}
                value={form.luggageCount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, luggageCount: e.target.value }))
                }
              />
            </div>

            <div className="st-num-field">
              <span>⚖️ Baqaj kq</span>
              <input
                type="number"
                min={0}
                step={0.5}
                max={100}
                value={form.totalLuggageKg}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    totalLuggageKg: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Qeyd sahəsi */}
          <textarea
            className="st-note"
            placeholder="Qeyd (istəyə görə)..."
            maxLength={500}
            value={form.note}
            onChange={(e) =>
              setForm((p) => ({ ...p, note: e.target.value }))
            }
          />

          {/* Xəta / Uğur mesajları */}
          {bookError && <div className="st-error">⚠️ {bookError}</div>}
          {success && (
            <div className="st-success">✅ Bilet uğurla sifariş edildi!</div>
          )}

          {/* Sifariş düyməsi */}
          <button
            className="st-book-btn"
            onClick={handleBook}
            disabled={booking || success || !selectedSeat || loadingSeats}
          >
            {booking ? (
              <>
                <span className="st-spinner st-spinner--sm" /> Gözləyin...
              </>
            ) : success ? (
              "✅ Uğurlu!"
            ) : (
              `🎫 BİLETİ SİFARİŞ ET${
                selectedSeat ? ` — ${selectedSeat.variantPrice} ₼` : ""
              }`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TicketCard komponenti
// Backend cavabı: GetAllTrainTicketQueryResponse
//   { id, trainCompany, trainNumber, vagonNumber, dueDate,
//     from, to, availableSeats, price }
// ─────────────────────────────────────────────────────────────────────────────
function TicketCard({ ticket, onClick }) {
  const urgency =
    ticket.availableSeats <= 5
      ? "critical"
      : ticket.availableSeats <= 15
      ? "low"
      : "ok";

  return (
    <div className="st-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>

      <div className="st-card-header">
        <span className="st-card-company">{ticket.trainCompany}</span>
        <span className="st-card-number">{ticket.trainNumber}</span>
      </div>

      <div className="st-card-route">
        <div className="st-card-city">
          <span className="st-card-city-name">
            {ticket.from?.split(",")[0] ?? "—"}
          </span>
          <span className="st-card-city-country">
            {ticket.from?.split(",")[1]?.trim()}
          </span>
        </div>
        <div className="st-card-track">
          <div className="st-card-track-line" />
          <span className="st-card-track-icon">🚆</span>
        </div>
        <div className="st-card-city st-card-city--right">
          <span className="st-card-city-name">
            {ticket.to?.split(",")[0] ?? "—"}
          </span>
          <span className="st-card-city-country">
            {ticket.to?.split(",")[1]?.trim()}
          </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Ana komponent — ShowTrainTickets
// Backend endpoint: GET /api/TrainTicket?PageNumber=X&PageSize=Y&...
// Cavab: Pagination<GetAllTrainTicketQueryResponse>
//   { data: [...], totalDataCount, page, size }
// ─────────────────────────────────────────────────────────────────────────────
export default function ShowTrainTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locations, setLocations] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);

  const [filters, setFilters] = useState({
    trainCompany: "",
    date: "",
    fromLocationId: "",
    toLocationId: "",
  });

  // ── Lokasiyaları bir dəfə yüklə ──────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`)
      .then((r) => r.json())
      .then((d) => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {}); // lokasiya xətası kritik deyil
  }, []);

  // ── Biletləri yüklə ───────────────────────────────────────────────────────
  const fetchTickets = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          PageNumber: String(p),
          PageSize: String(PAGE_SIZE),
        });

        if (filters.trainCompany.trim())
          params.set("TrainCompany", filters.trainCompany.trim());
        if (filters.date)
          params.set("Date", new Date(filters.date).toISOString());
        if (filters.fromLocationId)
          params.set("FromLocationId", filters.fromLocationId);
        if (filters.toLocationId)
          params.set("ToLocationId", filters.toLocationId);

        const res = await fetch(`${BASE_URL}/TrainTicket?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        // Pagination<T> → { data: [...], totalDataCount }
        const items = Array.isArray(json?.data) ? json.data : [];
        const total = typeof json?.totalDataCount === "number" ? json.totalDataCount : 0;

        setTickets(items);
        setTotalPages(total > 0 ? Math.ceil(total / PAGE_SIZE) : 1);
      } catch (e) {
        setError(`Biletlər yüklənə bilmədi: ${e.message}`);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchTickets(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets(1);
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="st-page">
      {/* Dekorativ arxa fon relsləri */}
      <div className="st-bg-rail" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="st-bg-sleeper"
            style={{ left: `${i * 5.5}%` }}
          />
        ))}
      </div>

      <div className="st-container">
        {/* Başlıq */}
        <header className="st-header">
          <div className="st-header-icon">🚆</div>
          <h1 className="st-title">Qatar Biletləri</h1>
          <p className="st-subtitle">
            Mövcud biletlər — oturacaq seçib sifariş edin
          </p>
        </header>

        {/* Filterlər */}
        <form className="st-filters" onSubmit={handleSearch}>
          <input
            className="st-filter-input"
            placeholder="🔍 Şirkət adı..."
            value={filters.trainCompany}
            onChange={(e) =>
              handleFilterChange("trainCompany", e.target.value)
            }
          />

          <input
            className="st-filter-input"
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
          />

          <select
            className="st-filter-select"
            value={filters.fromLocationId}
            onChange={(e) =>
              handleFilterChange("fromLocationId", e.target.value)
            }
          >
            <option value="">📍 Haradan...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            className="st-filter-select"
            value={filters.toLocationId}
            onChange={(e) =>
              handleFilterChange("toLocationId", e.target.value)
            }
          >
            <option value="">🏁 Haraya...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <button className="st-filter-btn" type="submit">
            Axtar
          </button>

          {/* Filterləri sıfırla */}
          {(filters.trainCompany ||
            filters.date ||
            filters.fromLocationId ||
            filters.toLocationId) && (
            <button
              type="button"
              className="st-filter-btn st-filter-btn--reset"
              onClick={() => {
                setFilters({
                  trainCompany: "",
                  date: "",
                  fromLocationId: "",
                  toLocationId: "",
                });
                setPage(1);
                // Qısa timeout: state güncəllənsin, sonra fetch
                setTimeout(() => fetchTickets(1), 0);
              }}
            >
              ✕ Sıfırla
            </button>
          )}
        </form>

        {/* Məzmun */}
        {loading ? (
          <div className="st-loading">
            <span className="st-spinner st-spinner--lg" />
            <p>Yüklənir...</p>
          </div>
        ) : error ? (
          <div className="st-error-block">
            <p>⚠️ {error}</p>
            <button
              className="st-filter-btn"
              onClick={() => fetchTickets(page)}
            >
              Yenidən cəhd et
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="st-empty">
            <span>🚉</span>
            <p>Heç bir bilet tapılmadı.</p>
          </div>
        ) : (
          <>
            <div className="st-grid">
              {tickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onClick={() => setActiveTicket(t)}
                />
              ))}
            </div>

            {/* Səhifələmə */}
            {totalPages > 1 && (
              <div className="st-pagination">
                <button
                  className="st-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Əvvəl
                </button>
                <span className="st-page-info">
                  {page} / {totalPages}
                </span>
                <button
                  className="st-page-btn"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                >
                  Sonra →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sifariş modeli */}
      {activeTicket && (
        <BookingModal
          ticket={activeTicket}
          onClose={() => setActiveTicket(null)}
          onBooked={() => {
            fetchTickets(page);
            setActiveTicket(null);
          }}
        />
      )}
    </div>
  );
}