import { useState, useEffect } from "react";
import "./bookTrainT.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");

const getUserId = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.uid || null;
  } catch {
    return null;
  }
};

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

export default function TrainBooking({ train, fromLabel, toLabel, onBack, onSuccess }) {
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [hasPet, setHasPet] = useState(false);
  const [hasChild, setHasChild] = useState(false);
  const [luggageKg, setLuggageKg] = useState(0);
  const [note, setNote] = useState("");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const variantGroups = seats.reduce((acc, s) => {
    const key = s.variantName;
    if (!acc[key]) acc[key] = { name: key, price: s.variantPrice, seats: [] };
    acc[key].seats.push(s);
    return acc;
  }, {});

  useEffect(() => {
    // Əgər train prop yoxdursa (standalone route kimi açılıbsa), heç nə etmə
    if (!train?.id) {
      setSeatsLoading(false);
      return;
    }
    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${train.id}&TicketType=train`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error("Oturacaqlar yüklənmədi.");
        const data = await res.json();
        setSeats(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setSeatsLoading(false);
      }
    };
    fetchSeats();
  }, [train?.id]);

  async function handleBuy() {
    if (!selectedSeat) {
      setError("Zəhmət olmasa bir oturacaq seçin.");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("Sessiya vaxtı bitib. Zəhmət olmasa yenidən daxil olun.");
      return;
    }

    setBuying(true);
    setError("");

    try {
      const body = {
        id: Number(selectedSeat.trainTicketId ?? train.id),
        userId: Number(userId),
        dueDate: train.dueDate,
        chosenSeatId: Number(selectedSeat.id),
        hasPet: Boolean(hasPet),
        hasChild: Boolean(hasChild),
        luggageCount: 1,
        totalLuggageKg: Number(luggageKg),
        state: 1,
        note: note.trim() || null,
      };

      const res = await fetch(`${API_BASE}/TrainTicket/fill`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      const rawText = await res.text();
      let result = null;
      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch {
        result = null;
      }

      if (!res.ok) {
        let errMsg = result?.message || result?.title || `Server xətası: ${res.status}`;
        if (result?.errors) {
          errMsg = Object.values(result.errors).flat().join(", ");
        }
        setSeats((prev) =>
          prev.map((s) =>
            s.id === selectedSeat.id ? { ...s, isOccupied: true } : s
          )
        );
        setSelectedSeat(null);
        throw new Error(errMsg);
      }

      if (!result?.data) {
        setSeats((prev) =>
          prev.map((s) =>
            s.id === selectedSeat.id ? { ...s, isOccupied: true } : s
          )
        );
        setSelectedSeat(null);
        throw new Error("Bu oturacaq artıq alınıb. Zəhmət olmasa başqa oturacaq seçin.");
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(result?.data ?? {}), 2000);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBuying(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "--:--";
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("az-AZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ✅ Məbləğ hesabı:
  // basePrice  = train.price (ən aşağı qiymət)
  // seatExtra  = variantPrice - basePrice (sinif fərqi, mənfi ola bilməz)
  // luggageExtra = limit (30kg) aşıldıqda hər 5kg üçün +5₼
  // totalPrice = basePrice + seatExtra + luggageExtra
  const basePrice = Number(train?.price || 0);
  const seatExtra = selectedSeat
    ? Math.max(0, Number(selectedSeat.variantPrice || 0) - basePrice)
    : 0;
  const luggageLimit = Number(train?.luggageKg || 30);
  const luggageExtra =
    luggageKg > luggageLimit
      ? Math.ceil((luggageKg - luggageLimit) / 5) * 5
      : 0;
  const totalPrice = selectedSeat
    ? (basePrice + seatExtra + luggageExtra).toFixed(2)
    : "—";

  // ── Uğur ekranı ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="tb-page">
        <div className="tb-noise" />
        <div className="tb-inner tb-success-screen">
          <div className="tb-success-circle">✓</div>
          <h2 className="tb-success-title">Bilet Alındı!</h2>
          <p className="tb-success-sub">
            {fromLabel} → {toLabel} qatar biletiniz təsdiqləndi.
          </p>
          <p className="tb-success-seat">
            Oturacaq: <strong>{selectedSeat?.name}</strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Əgər train yoxdursa (standalone route) ───────────────────────────────
  if (!train) {
    return (
      <div className="tb-page">
        <div className="tb-noise" />
        <div className="tb-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "var(--tb-muted)" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🚂</p>
            <p>Bu səhifəyə birbaşa daxil olmaq mümkün deyil.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Zəhmət olmasa <a href="/ticket/train" style={{ color: "var(--tb-accent)" }}>Qatar Biletləri</a> səhifəsindən daxil olun.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Əsas ekran ────────────────────────────────────────────────────────────
  return (
    <div className="tb-page">
      <div className="tb-noise" />
      <div className="tb-inner">
        {onBack && (
          <button className="tb-back" onClick={onBack}>← Geri</button>
        )}

        {/* Bilet xülasəsi */}
        <div className="tb-summary">
          <div className="tb-summary-top">
            <span className="tb-eyebrow">🚄 {train.trainCompany}</span>
            <span className="tb-train-badge">{train.trainNumber}</span>
          </div>
          <div className="tb-route">
            <div className="tb-route-block">
              <span className="tb-route-time">{formatTime(train.dueDate)}</span>
              <span className="tb-route-city">{fromLabel || train.from}</span>
            </div>
            <div className="tb-route-mid">
              <span className="tb-train-line">
                <span className="tb-dot" />
                <span className="tb-dash" />
                <span className="tb-train-icon">🚂</span>
                <span className="tb-dash" />
                <span className="tb-dot" />
              </span>
              <span className="tb-dur-tag">Birbaşa</span>
            </div>
            <div className="tb-route-block tb-route-block--right">
              <span className="tb-route-city">{toLabel || train.to}</span>
              <span className="tb-route-date">{formatDate(train.dueDate)}</span>
            </div>
          </div>
          <div className="tb-summary-meta">
            <span>🚃 Vaqon {train.vagonNumber}</span>
            <span>💺 {train.availableSeats} boş yer</span>
            <span>💰 {basePrice.toFixed(2)} ₼</span>
          </div>
        </div>

        {/* 01 — Oturacaq seçimi */}
        <div className="tb-section">
          <h3 className="tb-section-title">
            <span className="tb-section-num">01</span>Oturacaq Seçin
          </h3>

          {seatsLoading ? (
            <div className="tb-seats-loading">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="tb-seat-skeleton" />
              ))}
            </div>
          ) : seats.length === 0 ? (
            <div className="tb-seats-empty">Oturacaq məlumatı tapılmadı.</div>
          ) : (
            <div className="tb-cabin">
              <div className="tb-cabin-front"><span>🚂 Ön</span></div>

              {Object.values(variantGroups).map((group) => (
                <div key={group.name} className="tb-variant-group">
                  <div className="tb-variant-label">
                    <span className="tb-variant-name">{group.name}</span>
                    <span className="tb-variant-price">{Number(group.price).toFixed(2)} ₼</span>
                  </div>
                  <div className="tb-seats-grid">
                    {group.seats.map((seat) => (
                      <button
                        key={seat.id}
                        disabled={seat.isOccupied}
                        className={`tb-seat ${seat.isOccupied ? "tb-seat--occupied" : "tb-seat--free"} ${selectedSeat?.id === seat.id ? "tb-seat--selected" : ""}`}
                        onClick={() => !seat.isOccupied && setSelectedSeat(seat)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="tb-seat-icon">
                          <path
                            d="M4 16V8a2 2 0 012-2h12a2 2 0 012 2v8M4 16h16M4 16v2M20 16v2M7 22h10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <rect x="6" y="6" width="12" height="8" rx="1.5" fill="currentColor" opacity="0.2" />
                        </svg>
                        <span className="tb-seat-num">{seat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="tb-legend">
                <span className="tb-legend-item">
                  <span className="tb-legend-dot tb-legend-dot--free" />Boş
                </span>
                <span className="tb-legend-item">
                  <span className="tb-legend-dot tb-legend-dot--occupied" />Dolu
                </span>
                <span className="tb-legend-item">
                  <span className="tb-legend-dot tb-legend-dot--selected" />Seçilmiş
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 02 — Əlavələr */}
        <div className="tb-section">
          <h3 className="tb-section-title">
            <span className="tb-section-num">02</span>Əlavələr
          </h3>
          <div className="tb-options">
            <div className="tb-option">
              <div className="tb-option-info">
                <span className="tb-option-icon">🐾</span>
                <span className="tb-option-name">Ev heyvanı</span>
              </div>
              <div
                className={`tb-toggle${hasPet ? " tb-toggle--on" : ""}`}
                onClick={() => setHasPet(!hasPet)}
              >
                <span className="tb-toggle-knob" />
              </div>
            </div>

            <div className="tb-option">
              <div className="tb-option-info">
                <span className="tb-option-icon">👶</span>
                <span className="tb-option-name">Uşaq</span>
              </div>
              <div
                className={`tb-toggle${hasChild ? " tb-toggle--on" : ""}`}
                onClick={() => setHasChild(!hasChild)}
              >
                <span className="tb-toggle-knob" />
              </div>
            </div>

            <div className="tb-option">
              <div className="tb-option-info">
                <span className="tb-option-icon">🧳</span>
                <span className="tb-option-name">Bagaj çəkisi</span>
              </div>
              <div className="tb-counter">
                <button
                  className="tb-counter-btn"
                  onClick={() => setLuggageKg(Math.max(0, luggageKg - 5))}
                >−</button>
                <span className="tb-counter-val">{luggageKg} kg</span>
                <button
                  className="tb-counter-btn"
                  onClick={() => setLuggageKg(luggageKg + 5)}
                >+</button>
              </div>
            </div>
          </div>

          <textarea
            className="tb-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Xüsusi qeyd..."
          />
        </div>

        {/* Sifariş xülasəsi */}
        {selectedSeat && (
          <div className="tb-order-summary">
            <div className="tb-order-row">
              <span>Baza qiyməti</span>
              <span>{basePrice.toFixed(2)} ₼</span>
            </div>
            {seatExtra > 0 && (
              <div className="tb-order-row">
                <span>Sinif fərqi ({selectedSeat.variantName})</span>
                <span>+{seatExtra.toFixed(2)} ₼</span>
              </div>
            )}
            {luggageExtra > 0 && (
              <div className="tb-order-row">
                <span>Əlavə bagaj ({luggageKg - luggageLimit} kg)</span>
                <span>+{luggageExtra.toFixed(2)} ₼</span>
              </div>
            )}
            <div className="tb-order-total">
              <span>Cəmi</span>
              <span>{totalPrice} ₼</span>
            </div>
          </div>
        )}

        {error && (
          <div className="tb-error">
            <span>⚠</span> {error}
          </div>
        )}

        <button
          className={`tb-buy-btn ${buying ? "tb-buy-btn--loading" : ""} ${!selectedSeat ? "tb-buy-btn--disabled" : ""}`}
          onClick={handleBuy}
          disabled={buying || !selectedSeat}
        >
          {buying ? "Emal edilir..." : `Bilet Al · ${totalPrice} ₼`}
        </button>
      </div>
    </div>
  );
}