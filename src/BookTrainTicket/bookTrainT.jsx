import { useState, useEffect } from "react";
import PaymentModal from "../PymetModal/pyMod";
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

const getUserName = async () => {
  try {
    const res = await fetch(`${API_BASE}/Auth/me`, { headers: getHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.data ?? data;
    return [u.name, u.surname].filter(Boolean).join(" ") || null;
  } catch {
    return null;
  }
};

// ─── Barcode SVG ──────────────────────────────────────────────────────────────
function BarcodeSVG() {
  const bars = [3, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 3, 2, 1, 4, 1];
  return (
    <svg
      width="72"
      height="14"
      viewBox="0 0 72 14"
      xmlns="http://www.w3.org/2000/svg"
      className="bp-stub-barcode"
    >
      {bars.reduce((acc, w, i) => {
        const x = acc.x;
        if (i % 2 === 0) {
          acc.els.push(
            <rect key={i} x={x} y={0} width={w} height={14} fill="rgba(255,255,255,0.78)" rx="0.5" />
          );
        }
        acc.x += w + 1;
        return acc;
      }, { x: 0, els: [] }).els}
    </svg>
  );
}

// ─── Train Watermark ──────────────────────────────────────────────────────────
function TrainWatermark() {
  return (
    <svg
      className="bp-watermark"
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="30" y="60" width="240" height="100" rx="18" fill="none" stroke="currentColor" strokeWidth="7" />
      <rect x="55"  y="80" width="36" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="105" y="80" width="36" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="160" y="80" width="36" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="210" y="80" width="36" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="80"  cy="170" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="150" cy="170" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="220" cy="170" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
      <line x1="10" y1="188" x2="290" y2="188" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="268" cy="110" r="8" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

// ─── Boarding Pass Card ───────────────────────────────────────────────────────
function BoardingPassCard({ train, fromLabel, toLabel, isExpired, formatTime, formatDate, formatArrivalTime, selectedSeat, displayClass, passengerName }) {
  const departureTime = formatTime(train.dueDate);
  const departureDate = formatDate(train.dueDate);
  const arrivalTime   = formatArrivalTime(train);

  return (
    <div className={`bp-card${isExpired ? " bp-card--expired" : ""}`}>
      {/* LEFT MAIN */}
      <div className="bp-main">
        <TrainWatermark />

        <div className="bp-top-row">
          <div className="bp-title-group">
            <div className="bp-title-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16V8a2 2 0 012-2h12a2 2 0 012 2v8M4 16h16M4 16v2M20 16v2M7 22h10" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                <rect x="6" y="6" width="12" height="8" rx="1.5" fill="white" opacity="0.3"/>
              </svg>
            </div>
            <span className="bp-title-text">Train Ticket</span>
          </div>
          {displayClass && (
            <div className="bp-class-badge">{displayClass}</div>
          )}
        </div>

        <div className="bp-meta-row">
          <div className="bp-meta-item">
            <span className="bp-meta-label">Company</span>
            <span className="bp-meta-value">{train.trainCompany || "—"}</span>
          </div>
          <div className="bp-meta-item">
            <span className="bp-meta-label">Train No</span>
            <span className="bp-meta-value">{train.trainNumber || "—"}</span>
          </div>
          <div className="bp-meta-item">
            <span className="bp-meta-label">Date</span>
            <span className="bp-meta-value">{departureDate}</span>
          </div>
          <div className="bp-meta-item">
            <span className="bp-meta-label">Time</span>
            <span className="bp-meta-value" style={{ color: "#ef4444", fontWeight: 700 }}>{departureTime}</span>
          </div>
        </div>

        <div className="bp-route">
          <div className="bp-city-block">
            <span style={{
              display: "block",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              marginBottom: "6px",
              fontFamily: "'Syne', sans-serif",
            }}>
              {departureTime || "--:--"}
            </span>
            <span className="bp-city">{fromLabel}</span>
          </div>

          <div className="bp-route-mid">
            <div className="bp-dotline">
              <span className="bp-dot" />
              <div className="bp-dash" />
              <svg className="bp-plane-mid" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="12" rx="3" fill="#ef4444" opacity="0.9"/>
                <rect x="5" y="8" width="4" height="4" rx="1" fill="white" opacity="0.7"/>
                <rect x="10" y="8" width="4" height="4" rx="1" fill="white" opacity="0.7"/>
                <circle cx="7"  cy="19" r="2" fill="#ef4444"/>
                <circle cx="17" cy="19" r="2" fill="#ef4444"/>
              </svg>
              <div className="bp-dash" />
              <span className="bp-dot" />
            </div>
            <span className="bp-dur">Direct</span>
          </div>

          <div className="bp-city-block bp-city-block--right">
            <span style={{
              display: "block",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              marginBottom: "6px",
              fontFamily: "'Syne', sans-serif",
              textAlign: "right",
            }}>
              {arrivalTime}
            </span>
            <span className="bp-city" style={{ marginBottom: 4 }}>{toLabel}</span>
          </div>
        </div>

        <div className="bp-info-row">
          <div className="bp-info-item">
            <span className="bp-meta-label">Wagon</span>
            <span className="bp-info-val bp-info-val--accent">{train.vagonNumber ?? "—"}</span>
          </div>
          <div className="bp-info-item">
            <span className="bp-meta-label">Departure</span>
            <span className="bp-info-val bp-info-val--accent">{departureTime}</span>
          </div>
          {selectedSeat && (
            <div className="bp-info-item">
              <span className="bp-meta-label">Seat</span>
              <span className="bp-info-val bp-info-val--accent">{selectedSeat.name}</span>
            </div>
          )}
          <div className="bp-info-item">
            <span className="bp-meta-label">Available</span>
            <span className="bp-info-val">{train.availableSeats ?? "—"}</span>
          </div>
        </div>

        <div className="bp-divider" />

        <div className="bp-pax-row">
          <div className="bp-meta-item">
            <span className="bp-meta-label">Passenger Name</span>
            <span className="bp-meta-value" style={{ fontSize: "15px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              {passengerName || "—"}
            </span>
          </div>
        </div>

        <p className="bp-notice">Please be ready 15 minutes before boarding</p>
      </div>

      {/* TEAR LINE */}
      <div className="bp-tear" />

      {/* RIGHT STUB */}
      <div className="bp-stub">
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Company</span>
          <span className="bp-stub-value">{train.trainCompany || "—"}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Train</span>
          <span className="bp-stub-value">{train.trainNumber || "—"}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Dep.</span>
          <span className="bp-stub-value">{departureTime}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Arr.</span>
          <span className="bp-stub-value">{arrivalTime}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Date</span>
          <span className="bp-stub-value" style={{ fontSize: "10px" }}>{departureDate}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Wagon</span>
          <span className="bp-stub-value" style={{ fontSize: "20px", fontWeight: 700 }}>{train.vagonNumber ?? "—"}</span>
        </div>
        {selectedSeat && (
          <>
            <div className="bp-stub-divider" />
            <div className="bp-stub-meta">
              <span className="bp-stub-label">Seat</span>
              <span className="bp-stub-value" style={{ fontSize: "20px", fontWeight: 700 }}>{selectedSeat.name}</span>
            </div>
          </>
        )}
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Passenger</span>
          <span className="bp-stub-pax">{passengerName || "—"}</span>
        </div>
        <div className="bp-stub-route">{fromLabel} → {toLabel}</div>
        <BarcodeSVG />
      </div>
    </div>
  );
}

// ─── Seat Map ─────────────────────────────────────────────────────────────────
function SeatMapGrid({ seats, selectedSeat, onSelect }) {
  const seatByKey = {};
  seats.forEach((s) => { seatByKey[s.name] = s; });

  const variantGroups = seats.reduce((acc, s) => {
    if (!acc[s.variantName]) acc[s.variantName] = { name: s.variantName, price: s.variantPrice };
    return acc;
  }, {});

  const rows = [...new Set(seats.map((s) => {
    const match = s.name.match(/^(\d+)/);
    return match ? parseInt(match[1]) : null;
  }).filter(Boolean))].sort((a, b) => a - b);

  const ALL_LEFT  = ["A", "B", "C"];
  const ALL_RIGHT = ["D", "E", "F"];
  const usedCols  = new Set(seats.map((s) => s.name.replace(/[0-9]/g, "")));
  const LEFT_COLS  = ALL_LEFT.filter(c => usedCols.has(c));
  const RIGHT_COLS = ALL_RIGHT.filter(c => usedCols.has(c));
  const showAisle = LEFT_COLS.length > 0 && RIGHT_COLS.length > 0;

  return (
    <div className="sm-wrap">
      {Object.values(variantGroups).map((vg) => (
        <div key={vg.name} className="sm-variant-header">
          <span className="sm-class-name">{vg.name}</span>
          <span className="sm-price-tag">+{vg.price} ₼</span>
        </div>
      ))}

      <div className="sm-front">
        <div className="sm-front-line" />
        <span className="sm-front-label">🚂 Front</span>
        <div className="sm-front-line" />
      </div>

      <div className="sm-col-headers">
        <div className="sm-row-num-cell" />
        {LEFT_COLS.map(c => <div key={c} className="sm-col-h">{c}</div>)}
        {showAisle && <div className="sm-aisle-spacer" />}
        {RIGHT_COLS.map(c => <div key={c} className="sm-col-h">{c}</div>)}
      </div>

      {rows.map((row) => (
        <div key={row} className="sm-row">
          <div className="sm-row-num-cell">{row}</div>
          {LEFT_COLS.map((col) => {
            const seatId = `${row}${col}`;
            const seat = seatByKey[seatId];
            if (!seat) return <div key={seatId} className="sm-seat sm-seat--empty" />;
            return <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />;
          })}
          {showAisle && <div className="sm-aisle-spacer" />}
          {RIGHT_COLS.map((col) => {
            const seatId = `${row}${col}`;
            const seat = seatByKey[seatId];
            if (!seat) return <div key={seatId} className="sm-seat sm-seat--empty" />;
            return <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />;
          })}
        </div>
      ))}

      <div className="sm-legend">
        <span className="sm-legend-item"><span className="sm-legend-dot sm-legend-dot--free" /> Available</span>
        <span className="sm-legend-item"><span className="sm-legend-dot sm-legend-dot--taken" /> Taken</span>
        <span className="sm-legend-item"><span className="sm-legend-dot sm-legend-dot--selected" /> Selected</span>
      </div>
    </div>
  );
}

function SeatButton({ seat, seatId, selectedSeat, onSelect }) {
  if (!seat) return <div className="sm-seat sm-seat--empty" />;
  const isSelected = selectedSeat?.id === seat.id;
  const isTaken = seat.isOccupied;
  let stateClass = "sm-seat--free";
  if (isTaken) stateClass = "sm-seat--taken";
  else if (isSelected) stateClass = "sm-seat--selected";
  return (
    <button
      className={`sm-seat ${stateClass}`}
      disabled={isTaken}
      onClick={() => !isTaken && onSelect(seat)}
      aria-label={`Seat ${seatId}`}
    >
      {seatId}
    </button>
  );
}

// ─── Main TrainBooking Component ──────────────────────────────────────────────
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
  const [showPayment, setShowPayment] = useState(false);
  const [passengerName, setPassengerName] = useState("");
  const [displayClass, setDisplayClass] = useState(null);

  // FIX: isExpired yalnız məlumat üçündür, alışı bloklamır
  const isExpired = train?.dueDate ? new Date(train.dueDate) < new Date() : false;

  useEffect(() => {
    if (!train?.id) { setSeatsLoading(false); return; }
    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${train.id}&TicketType=train`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error("Failed to load seats.");
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setSeats(list);
        if (list.length > 0) setDisplayClass(list[0].variantName ?? null);
      } catch (e) {
        setError(e.message);
      } finally {
        setSeatsLoading(false);
      }
    };
    fetchSeats();
    getUserName().then((name) => { if (name) setPassengerName(name); });
  }, [train?.id]);

  useEffect(() => {
    if (selectedSeat) setDisplayClass(selectedSeat.variantName ?? displayClass);
  }, [selectedSeat]);

  async function handleBuy() {
    if (!selectedSeat) { setError("Please select a seat."); return; }
    const userId = getUserId();
    if (!userId) { setError("Session expired. Please log in again."); return; }

    setBuying(true);
    setError("");

    try {
      const luggageLimit = Number(train?.luggageKg || 30);
      const safeTotalKg = luggageKg > 0 ? luggageKg : 1;
      const safeCount = luggageKg > luggageLimit
        ? Math.ceil((luggageKg - luggageLimit) / 5)
        : 1;

      const body = {
        id: parseInt(selectedSeat.trainTicketId ?? train.id, 10),
        userId: parseInt(userId, 10),
        dueDate: train.dueDate,
        chosenSeatId: parseInt(selectedSeat.id, 10),
        hasPet: Boolean(hasPet),
        hasChild: Boolean(hasChild),
        luggageCount: safeCount,
        totalLuggageKg: safeTotalKg,
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
      try { result = rawText ? JSON.parse(rawText) : null; } catch { result = null; }

      if (!res.ok) {
        let errMsg = result?.message || result?.title || `Server error: ${res.status}`;
        if (result?.errors) errMsg = Object.values(result.errors).flat().join(", ");
        setSeats((prev) => prev.map((s) => (s.id === selectedSeat.id ? { ...s, isOccupied: true } : s)));
        setSelectedSeat(null);
        throw new Error(errMsg);
      }

      setSuccess(true);
      if (onSuccess) setTimeout(() => onSuccess(result?.data ?? {}), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBuying(false);
    }
  }

  // UTC-safe time parser
  function formatTime(dateStr) {
    if (!dateStr) return "--:--";
    const s = String(dateStr);
    const match = s.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    const d = new Date(s);
    if (isNaN(d.getTime())) return "--:--";
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  // FIX: Arrival time — endDate varsa göstər, yoxsa dueDate + 3 saat (müvəqqəti fallback)
  function formatArrivalTime(t) {
    if (t.endDate)     return formatTime(t.endDate);
    if (t.arrivalDate) return formatTime(t.arrivalDate);
    if (t.arrivalTime) return formatTime(t.arrivalTime);
    // Fallback: dueDate + 3 saat
    if (t.dueDate) {
      const s = String(t.dueDate);
      const isoMatch = s.match(/T(\d{2}):(\d{2})/);
      if (isoMatch) {
        const totalMin = parseInt(isoMatch[1]) * 60 + parseInt(isoMatch[2]) + 180;
        const hh = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
        const mm = String(totalMin % 60).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    }
    return "--:--";
  }

  const basePrice    = Number(train?.price || 0);
  const seatExtra    = Number(selectedSeat?.variantPrice || 0);
  const luggageLimit = Number(train?.luggageKg || 30);
  const luggageExtra = luggageKg > luggageLimit ? Math.ceil((luggageKg - luggageLimit) / 5) * 5 : 0;
  const totalPrice   = selectedSeat ? (basePrice + seatExtra + luggageExtra).toFixed(2) : "—";

  if (!train) {
    return (
      <div className="tb-page">
        <div className="tb-inner">
          <button className="tb-back" onClick={onBack}>← Back</button>
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "2rem" }}>No ticket selected.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="tb-page">
        <div className="tb-inner tb-success-screen">
          <div className="tb-success-circle">✓</div>
          <h2 className="tb-success-title">Ticket Purchased!</h2>
          <p className="tb-success-sub">Your {fromLabel} → {toLabel} train ticket has been confirmed.</p>
          <p className="tb-success-seat">Seat: <strong>{selectedSeat?.name}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="tb-page">
      <div className="tb-inner">
        {onBack && (
          <button className="tb-back" onClick={onBack}>← Back</button>
        )}

        {isExpired && (
          <div className="tb-expired-banner">
            <span className="tb-expired-icon">🕐</span>
            <div>
              <strong>This ticket has expired</strong>
              <p>Departure date: {formatDate(train.dueDate)} · {formatTime(train.dueDate)}</p>
            </div>
          </div>
        )}

        <BoardingPassCard
          train={train}
          fromLabel={fromLabel}
          toLabel={toLabel}
          isExpired={isExpired}
          formatTime={formatTime}
          formatDate={formatDate}
          formatArrivalTime={formatArrivalTime}
          selectedSeat={selectedSeat}
          displayClass={displayClass}
          passengerName={passengerName}
        />

        {/* 01 — Seat Selection */}
        <div className="tb-section">
          <h3 className="tb-section-title">
            <span className="tb-section-num">01</span>Select Seat
          </h3>
          {seatsLoading ? (
            <div className="tb-seats-loading">
              {[...Array(12)].map((_, i) => <div key={i} className="tb-seat-skeleton" />)}
            </div>
          ) : seats.length === 0 ? (
            <div className="tb-seats-empty">No seat data found.</div>
          ) : (
            <div className="tb-cabin">
              <SeatMapGrid seats={seats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
            </div>
          )}
        </div>

        {/* 02 — Add-ons */}
        <div className="tb-section">
          <h3 className="tb-section-title">
            <span className="tb-section-num">02</span>Add-ons
          </h3>
          <div className="tb-options">
            <div className="tb-option" onClick={() => setHasPet(!hasPet)}>
              <div className="tb-option-info">
                <span className="tb-option-icon">🐾</span>
                <div><span className="tb-option-name">Pet</span></div>
              </div>
              <div className={`tb-toggle${hasPet ? " tb-toggle--on" : ""}`}>
                <span className="tb-toggle-knob" />
              </div>
            </div>

            <div className="tb-option" onClick={() => setHasChild(!hasChild)}>
              <div className="tb-option-info">
                <span className="tb-option-icon">👶</span>
                <div><span className="tb-option-name">Child</span></div>
              </div>
              <div className={`tb-toggle${hasChild ? " tb-toggle--on" : ""}`}>
                <span className="tb-toggle-knob" />
              </div>
            </div>

            <div className="tb-option tb-option--luggage">
              <div className="tb-option-info">
                <span className="tb-option-icon">🧳</span>
                <div>
                  <span className="tb-option-name">Luggage weight</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", display: "block" }}>
                    Included: {luggageLimit} kg
                  </span>
                </div>
              </div>
              <div className="tb-counter">
                <button className="tb-counter-btn" onClick={() => setLuggageKg(Math.max(0, luggageKg - 5))}>−</button>
                <span className="tb-counter-val">{luggageKg} kg</span>
                <button className="tb-counter-btn" onClick={() => setLuggageKg(luggageKg + 5)}>+</button>
              </div>
            </div>
          </div>

          <textarea
            className="tb-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Special note..."
          />
        </div>

        {/* Order summary */}
        {selectedSeat && (
          <div className="tb-order-summary">
            <div className="tb-order-row">
              <span>Base price</span>
              <span>{basePrice.toFixed(2)} ₼</span>
            </div>
            {seatExtra > 0 && (
              <div className="tb-order-row">
                <span>Class ({selectedSeat.variantName})</span>
                <span>+{seatExtra.toFixed(2)} ₼</span>
              </div>
            )}
            {luggageExtra > 0 && (
              <div className="tb-order-row">
                <span>Extra luggage ({luggageKg - luggageLimit} kg)</span>
                <span>+{luggageExtra.toFixed(2)} ₼</span>
              </div>
            )}
            <div className="tb-order-divider" />
            <div className="tb-order-total">
              <span>Total</span>
              <span>{totalPrice} ₼</span>
            </div>
          </div>
        )}

        {error && (
          <div className="tb-error"><span>⚠</span> {error}</div>
        )}

        <button
          className={`tb-buy-btn${buying ? " tb-buy-btn--loading" : ""}${!selectedSeat ? " tb-buy-btn--disabled" : ""}`}
          onClick={() => selectedSeat && setShowPayment(true)}
          disabled={buying || !selectedSeat}
        >
          {buying
            ? <><span className="tb-spinner" /> Processing...</>
            : <>Purchase Ticket · {totalPrice} ₼</>
          }
        </button>
      </div>

      {showPayment && (
        <PaymentModal
          amount={totalPrice}
          loading={buying}
          onCancel={() => setShowPayment(false)}
          onConfirm={() => { setShowPayment(false); handleBuy(); }}
        />
      )}
    </div>
  );
}