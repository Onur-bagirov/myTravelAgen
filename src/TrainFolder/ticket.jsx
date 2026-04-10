import { useState, useEffect } from "react";
import "./ticket.css";
import TrainBooking from "../BookTrainTicket/bookTrainT";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

export default function TrainTicket() {
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searching, setSearching] = useState(false);
  const [trains, setTrains] = useState(null);
  const [error, setError] = useState("");

  // Seat modal state
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState("");
  const [chosenSeat, setChosenSeat] = useState(null);

  // ✅ YENİ: bookTrain komponentinə keçid
  const [bookingTrain, setBookingTrain] = useState(null);

  useEffect(() => {
    (async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${API_BASE}/Location?Page=1&Limit=100`, {
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error("Lokasiyalar yüklənmədi.");
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setLocations(list);
        if (list.length > 0) setFromId(String(list[0].id));
        if (list.length > 1) setToId(String(list[1].id));
      } catch (e) {
        setError(e.message);
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  async function search() {
    if (!fromId || !toId) { setError("Zəhmət olmasa hər iki lokasiyanı seçin."); return; }
    if (fromId === toId) { setError("Çıxış və gəliş lokasiyaları eyni ola bilməz."); return; }
    setSearching(true);
    setTrains(null);
    setError("");
    try {
      const params = new URLSearchParams({
        PageNumber: 1, PageSize: 20,
        Date: date, FromLocationId: fromId, ToLocationId: toId,
      });
      const res = await fetch(`${API_BASE}/TrainTicket?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Qatar tapılmadı və ya server xətası.");
      const result = await res.json();
      setTrains(result.data || []);
    } catch (e) {
      setError("Qatarlar gətirilərkən problem yarandı: " + e.message);
    } finally {
      setSearching(false);
    }
  }

  async function openSeats(train) {
    setSelectedTrain(train);
    setSeats([]);
    setChosenSeat(null);
    setSeatsError("");
    setSeatsLoading(true);
    try {
      const params = new URLSearchParams({ TicketId: train.id, TicketType: "train" });
      const res = await fetch(`${API_BASE}/Seat/by-ticket?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Oturacaqlar yüklənmədi.");
      const result = await res.json();
      setSeats(Array.isArray(result.data) ? result.data : []);
    } catch (e) {
      setSeatsError(e.message);
    } finally {
      setSeatsLoading(false);
    }
  }

  function closeModal() {
    setSelectedTrain(null);
    setSeats([]);
    setChosenSeat(null);
    setSeatsError("");
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
    setTrains(null);
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("az-AZ", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  // ✅ DÜZƏLİŞ: Seçilmiş lokasiya adlarını tap (bookTrain-ə göndərmək üçün)
  const fromLabel = locations.find(l => String(l.id) === String(fromId))?.name || "";
  const toLabel = locations.find(l => String(l.id) === String(toId))?.name || "";

  // Group seats by variant
  const seatGroups = seats.reduce((acc, s) => {
    const key = s.variantName || "Standart";
    if (!acc[key]) acc[key] = { price: s.variantPrice, seats: [] };
    acc[key].seats.push(s);
    return acc;
  }, {});

  // ✅ YENİ: Əgər bilet alış ekranına keçilibsə, bookTrain komponentini göstər
  if (bookingTrain) {
    return (
      <TrainBooking
        train={bookingTrain}
        fromLabel={fromLabel}
        toLabel={toLabel}
        onBack={() => setBookingTrain(null)}
        onSuccess={() => {
          setBookingTrain(null);
          closeModal();
        }}
      />
    );
  }

  return (
    <div className="tt-root">
      <div className="tt-bg-decor">
        <div className="tt-bg-rail" />
        <div className="tt-bg-rail tt-bg-rail--2" />
      </div>

      <div className="tt-container">
        {/* Header */}
        <div className="tt-header">
          <span className="tt-logo">🚄</span>
          <div>
            <h1 className="tt-title">Qatar Biletləri</h1>
            <p className="tt-subtitle">Rahatlıqla yol planlaşdırın</p>
          </div>
        </div>

        {/* Search card */}
        <div className="tt-card tt-search-card">
          <div className="tt-route-row">
            <div className="tt-station-block">
              <label className="tt-label">Haradan</label>
              {locLoading ? (
                <div className="tt-skeleton" />
              ) : (
                <select className="tt-select" value={fromId} onChange={e => setFromId(e.target.value)}>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              )}
            </div>

            <button className="tt-swap-btn" onClick={swap} title="Dəyişdir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            <div className="tt-station-block">
              <label className="tt-label">Haraya</label>
              {locLoading ? (
                <div className="tt-skeleton" />
              ) : (
                <select className="tt-select" value={toId} onChange={e => setToId(e.target.value)}>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="tt-date-row">
            <label className="tt-label">Tarix</label>
            <input
              type="date"
              className="tt-date-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="tt-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            className={`tt-search-btn${searching ? " tt-search-btn--loading" : ""}`}
            onClick={search}
            disabled={searching}
          >
            {searching ? (
              <><span className="tt-spinner" /> Axtarılır...</>
            ) : (
              <><span>🔍</span> Bilet Axtar</>
            )}
          </button>
        </div>

        {/* Results */}
        {trains && (
          <div className="tt-results">
            <div className="tt-results-header">
              <span className="tt-results-count">
                {trains.length > 0
                  ? `${trains.length} qatar tapıldı`
                  : "Nəticə tapılmadı"}
              </span>
            </div>

            {trains.length === 0 ? (
              <div className="tt-empty">
                <span className="tt-empty-icon">🚂</span>
                <p>Bu tarixə qatar tapılmadı.</p>
              </div>
            ) : (
              <div className="tt-list">
                {trains.map((t, i) => (
                  <div
                    key={t.id}
                    className="tt-item"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className="tt-item-top">
                      <div className="tt-company">
                        <span className="tt-company-dot" />
                        <span className="tt-company-name">{t.trainCompany}</span>
                        <span className="tt-train-num">{t.trainNumber}</span>
                        <span className="tt-vagon">Vaqon {t.vagonNumber}</span>
                      </div>
                      <div className="tt-price-block">
                        <span className="tt-price-label">Başlayan</span>
                        {/* ✅ DÜZƏLİŞ: ₼ işarəsi düzgün */}
                        <span className="tt-price">
                          {t.price > 0 ? `${Number(t.price).toFixed(2)} ₼` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="tt-item-mid">
                      <div className="tt-time-city">
                        <span className="tt-time">{formatTime(t.dueDate)}</span>
                        <span className="tt-city">{t.from}</span>
                      </div>
                      <div className="tt-route-center">
                        <div className="tt-route-line">
                          <span className="tt-route-dot" />
                          <span className="tt-route-track" />
                          <span className="tt-route-train">🚂</span>
                          <span className="tt-route-track" />
                          <span className="tt-route-dot" />
                        </div>
                        <span className="tt-direct">Birbaşa</span>
                      </div>
                      <div className="tt-time-city tt-time-city--right">
                        <span className="tt-city">{t.to}</span>
                        <span className="tt-date-small">{formatDate(t.dueDate)}</span>
                      </div>
                    </div>

                    <div className="tt-item-bot">
                      <span className="tt-tag tt-tag--seats">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm-1 5a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z" /></svg>
                        {t.availableSeats} boş yer
                      </span>
                      <button
                        className="tt-select-btn"
                        onClick={() => openSeats(t)}
                      >
                        Oturacaq Seç
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seat Modal */}
      {selectedTrain && (
        <div className="tt-modal-overlay" onClick={closeModal}>
          <div className="tt-modal" onClick={e => e.stopPropagation()}>
            <div className="tt-modal-header">
              <div>
                <h2 className="tt-modal-title">Oturacaq Seçimi</h2>
                <p className="tt-modal-subtitle">
                  {selectedTrain.trainCompany} · {selectedTrain.trainNumber} · Vaqon {selectedTrain.vagonNumber}
                </p>
              </div>
              <button className="tt-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="tt-modal-route">
              <span className="tt-modal-city">{selectedTrain.from}</span>
              <span className="tt-modal-arrow">🚂 →</span>
              <span className="tt-modal-city">{selectedTrain.to}</span>
            </div>

            {seatsLoading && (
              <div className="tt-seats-loading">
                <div className="tt-spinner tt-spinner--lg" />
                <p>Oturacaqlar yüklənir...</p>
              </div>
            )}

            {seatsError && (
              <div className="tt-error">⚠️ {seatsError}</div>
            )}

            {!seatsLoading && !seatsError && seats.length === 0 && (
              <div className="tt-empty">
                <span className="tt-empty-icon">💺</span>
                <p>Oturacaq məlumatı tapılmadı.</p>
              </div>
            )}

            {!seatsLoading && Object.entries(seatGroups).map(([variantName, group]) => (
              <div key={variantName} className="tt-seat-group">
                <div className="tt-seat-group-header">
                  <span className="tt-variant-name">{variantName}</span>
                  {/* ✅ DÜZƏLİŞ: ₼ işarəsi düzgün */}
                  <span className="tt-variant-price">{Number(group.price).toFixed(2)} ₼</span>
                </div>
                <div className="tt-seats-grid">
                  {group.seats.map(seat => {
                    const isChosen = chosenSeat?.id === seat.id;
                    return (
                      <button
                        key={seat.id}
                        className={`tt-seat${seat.isOccupied ? " tt-seat--occupied" : ""}${isChosen ? " tt-seat--chosen" : ""}`}
                        disabled={seat.isOccupied}
                        onClick={() => !seat.isOccupied && setChosenSeat(isChosen ? null : seat)}
                        title={seat.isOccupied ? "Tutulub" : seat.name}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 16V8a2 2 0 012-2h12a2 2 0 012 2v8M4 16h16M4 16v2M20 16v2M7 22h10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          <rect x="6" y="6" width="12" height="8" rx="1.5" fill="currentColor" opacity="0.15" />
                        </svg>
                        <span className="tt-seat-name">{seat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            {!seatsLoading && seats.length > 0 && (
              <div className="tt-seat-legend">
                <span className="tt-legend-item"><span className="tt-legend-dot tt-legend-dot--free" />Boş</span>
                <span className="tt-legend-item"><span className="tt-legend-dot tt-legend-dot--occupied" />Tutulub</span>
                <span className="tt-legend-item"><span className="tt-legend-dot tt-legend-dot--chosen" />Seçilmiş</span>
              </div>
            )}

            {/* ✅ DÜZƏLİŞ: "Bilet Al" düyməsi bookTrain komponentini açır */}
            {chosenSeat && (
              <div className="tt-chosen-bar">
                <div className="tt-chosen-info">
                  <span className="tt-chosen-label">Seçilmiş oturacaq</span>
                  <span className="tt-chosen-detail">
                    {chosenSeat.name} · {chosenSeat.variantName} · {Number(chosenSeat.variantPrice).toFixed(2)} ₼
                  </span>
                </div>
                <button
                  className="tt-book-btn"
                  onClick={() => {
                    closeModal();
                    setBookingTrain(selectedTrain);
                  }}
                >
                  Bilet Al →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}