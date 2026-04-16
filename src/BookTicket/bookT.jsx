import { useState, useEffect } from "react";
import PaymentModal from "../PymetModal/pyMod";
import "./bookT.css";

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
function BarcodeSVG({ vertical = false }) {
  const bars = [3, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 3, 2, 1, 4, 1];

  if (vertical) {
    return (
      <svg
        width="72"
        height="14"
        viewBox="0 0 72 14"
        xmlns="http://www.w3.org/2000/svg"
        className="bp-stub-barcode"
      >
        {bars.reduce(
          (acc, w, i) => {
            const x = acc.x;
            if (i % 2 === 0) {
              acc.els.push(
                <rect key={i} x={x} y={0} width={w} height={14} fill="rgba(255,255,255,0.78)" rx="0.5" />
              );
            }
            acc.x += w + 1;
            return acc;
          },
          { x: 0, els: [] }
        ).els}
      </svg>
    );
  }

  return null;
}

// ─── Plane Watermark ──────────────────────────────────────────────────────────
function PlaneWatermark() {
  return (
    <svg
      className="bp-watermark"
      viewBox="0 0 300 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="150" cy="110" rx="120" ry="28" fill="none" stroke="currentColor" strokeWidth="8" />
      <path d="M80 110 L20 160 L100 140 Z" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M220 110 L280 160 L200 140 Z" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M255 100 L290 60 L270 100 Z" fill="none" stroke="currentColor" strokeWidth="6" />
      <ellipse cx="38" cy="113" rx="18" ry="10" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="100" cy="103" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="125" cy="101" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="150" cy="100" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="175" cy="100" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="200" cy="101" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

// ─── Boarding Pass Card ───────────────────────────────────────────────────────
function BoardingPassCard({ flight, fromLabel, toLabel, isExpired, formatTime, formatArrival, formatDate }) {
  return (
    <div className={`bp-card${isExpired ? " bp-card--expired" : ""}`}>
      {/* ── LEFT MAIN ── */}
      <div className="bp-main">
        <PlaneWatermark />

        <div className="bp-top-row">
          <div className="bp-title-group">
            <div className="bp-title-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <span className="bp-title-text">Boarding Pass</span>
          </div>
          {flight.ticketClass && (
            <div className="bp-class-badge">{flight.ticketClass}</div>
          )}
        </div>

        <div className="bp-meta-row">
          <div className="bp-meta-item">
            <span className="bp-meta-label">Airline</span>
            {/* FIX: boş deyilsə göstər, yoxsa "—" */}
            <span className="bp-meta-value">{flight.airline || "—"}</span>
          </div>
          <div className="bp-meta-item">
            <span className="bp-meta-label">Flight</span>
            <span className="bp-meta-value">{flight.plane || "—"}</span>
          </div>
          <div className="bp-meta-item">
            <span className="bp-meta-label">Date</span>
            <span className="bp-meta-value">{formatDate(flight.dueDate)}</span>
          </div>
        </div>

        <div className="bp-route">
          <div className="bp-city-block">
            <span className="bp-time">{formatTime(flight.dueDate)}</span>
            <span className="bp-city">{fromLabel}</span>
          </div>

          <div className="bp-route-mid">
            <div className="bp-dotline">
              <span className="bp-dot" />
              <div className="bp-dash" />
              <svg className="bp-plane-mid" width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="bp-dash" />
              <span className="bp-dot" />
            </div>
            {/* FIX: duration API-dan gəlirsə göstər, yoxsa ~2h */}
            <span className="bp-dur">
              {flight.durationMinutes
                ? `~${Math.floor(flight.durationMinutes / 60)}h${flight.durationMinutes % 60 > 0 ? ` ${flight.durationMinutes % 60}m` : ""} · Direct`
                : "~2h · Direct"}
            </span>
          </div>

          <div className="bp-city-block bp-city-block--right">
            <span className="bp-time">{formatArrival(flight.dueDate, flight.durationMinutes)}</span>
            <span className="bp-city">{toLabel}</span>
          </div>
        </div>

        <div className="bp-info-row">
          <div className="bp-info-item">
            <span className="bp-meta-label">Gate</span>
            <span className="bp-info-val bp-info-val--accent">{flight.gate ?? "—"}</span>
          </div>
          <div className="bp-info-item">
            <span className="bp-meta-label">Boarding</span>
            <span className="bp-info-val bp-info-val--accent">{formatTime(flight.dueDate)}</span>
          </div>
          {flight.meal && (
            <div className="bp-info-item">
              <span className="bp-meta-label">Meal</span>
              <span className="bp-info-val">{flight.meal}</span>
            </div>
          )}
          {flight.luggageKg != null && (
            <div className="bp-info-item">
              <span className="bp-meta-label">Luggage</span>
              <span className="bp-info-val">{flight.luggageKg} kg</span>
            </div>
          )}
          {/* FIX: seçilmiş oturacaq boarding pass-da göstərilir */}
          {flight.seatNo && (
            <div className="bp-info-item">
              <span className="bp-meta-label">Seat</span>
              <span className="bp-info-val bp-info-val--accent">{flight.seatNo}</span>
            </div>
          )}
        </div>

        <div className="bp-divider" />

        <div className="bp-pax-row">
          <div className="bp-meta-item">
            <span className="bp-meta-label">Passenger Name</span>
            <span className="bp-meta-value" style={{ fontSize: "15px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              {flight.passengerName || "—"}
            </span>
          </div>
        </div>

        <p className="bp-notice">Gate closes 40 minutes before departure</p>
      </div>

      {/* ── TEAR LINE ── */}
      <div className="bp-tear" />

      {/* ── RIGHT STUB ── */}
      <div className="bp-stub">
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Airline</span>
          <span className="bp-stub-value">{flight.airline || "—"}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Flight</span>
          <span className="bp-stub-value">{flight.plane || "—"}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Date</span>
          <span className="bp-stub-value" style={{ fontSize: "10px" }}>{formatDate(flight.dueDate)}</span>
        </div>
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Gate</span>
          <span className="bp-stub-value" style={{ fontSize: "20px", fontWeight: 700 }}>{flight.gate ?? "—"}</span>
        </div>
        {/* FIX: stub-da da seat göstər */}
        {flight.seatNo && (
          <>
            <div className="bp-stub-divider" />
            <div className="bp-stub-meta">
              <span className="bp-stub-label">Seat</span>
              <span className="bp-stub-value" style={{ fontSize: "20px", fontWeight: 700 }}>{flight.seatNo}</span>
            </div>
          </>
        )}
        <div className="bp-stub-divider" />
        <div className="bp-stub-meta">
          <span className="bp-stub-label">Passenger</span>
          <span className="bp-stub-pax">{flight.passengerName || "—"}</span>
        </div>
        <div className="bp-stub-route">{fromLabel} → {toLabel}</div>
        <BarcodeSVG vertical />
      </div>
    </div>
  );
}

// ─── Seat Map Sub-component ───────────────────────────────────────────────────
function SeatMapGrid({ seats, selectedSeat, onSelect }) {
  const seatByKey = {};
  seats.forEach((s) => { seatByKey[s.name] = s; });

  const variantGroups = seats.reduce((acc, s) => {
    if (!acc[s.variantName]) acc[s.variantName] = { name: s.variantName, price: s.variantPrice };
    return acc;
  }, {});

  const rows = [...new Set(seats.map((s) => parseInt(s.name)))].sort((a, b) => a - b);
  const COLS = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="sm-wrap">
      {Object.values(variantGroups).map((vg) => (
        <div key={vg.name} className="sm-variant-header">
          <span className="sm-class-name">{vg.name}</span>
          <span className="sm-price-tag">+{vg.price} ₼</span>
        </div>
      ))}

      <div className="sm-col-headers">
        <div className="sm-row-num-cell" />
        <div className="sm-col-h">A</div>
        <div className="sm-col-h">B</div>
        <div className="sm-col-h">C</div>
        <div className="sm-aisle-spacer" />
        <div className="sm-col-h">D</div>
        <div className="sm-col-h">E</div>
        <div className="sm-col-h">F</div>
      </div>

      {rows.map((row) => (
        <div key={row} className="sm-row">
          <div className="sm-row-num-cell">{row}</div>
          {COLS.map((col, ci) => {
            const seatId = `${row}${col}`;
            const seat = seatByKey[seatId];
            if (ci === 3) {
              return [
                <div key="aisle" className="sm-aisle-spacer" />,
                <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />,
              ];
            }
            return <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />;
          })}
        </div>
      ))}

      <div className="sm-legend">
        <span className="sm-legend-item"><span className="sm-legend-dot sm-legend-dot--free" /> Free</span>
        <span className="sm-legend-item"><span className="sm-legend-dot sm-legend-dot--taken" /> Occupied</span>
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
      aria-label={`Oturacaq ${seatId}`}
    >
      {seatId}
    </button>
  );
}

// ─── Main FlightBooking Component ─────────────────────────────────────────────
export default function FlightBooking({ flight, fromLabel, toLabel, onBack, onSuccess }) {
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [hasPet, setHasPet] = useState(false);
  const [hasChild, setHasChild] = useState(false);
  // FIX: luggageKg başlanğıcda flight.luggageKg-dan götür (0 deyil)
  const [luggageKg, setLuggageKg] = useState(flight?.luggageKg ?? 0);
  const [note, setNote] = useState("");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [passengerName, setPassengerName] = useState(flight?.passengerName ?? "");

  // FIX: displayClass — seats gəlməmişdən əvvəl flight.variantName-dən başla
  const [displayClass, setDisplayClass] = useState(flight?.variantName ?? null);

  const isExpired = flight?.dueDate ? new Date(flight.dueDate) < new Date() : false;

  useEffect(() => {
    if (!flight?.id) return;

    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${flight.id}&TicketType=plane`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error("Seats could not be loaded.");
        const data = await res.json();
        const fetchedSeats = Array.isArray(data.data) ? data.data : [];
        setSeats(fetchedSeats);

        // FIX: displayClass yalnız hələ null-dursa seats-dən götür,
        // flight.variantName varsa üzərinə yazma
        if (!flight?.variantName && fetchedSeats.length > 0) {
          setDisplayClass(fetchedSeats[0].variantName ?? null);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setSeatsLoading(false);
      }
    };

    fetchSeats();

    getUserName().then((name) => {
      if (name) setPassengerName(name);
    });
  }, [flight?.id]);

  // FIX: seat seçiləndə displayClass və seatNo boarding pass-a yazılır
  useEffect(() => {
    if (selectedSeat) {
      setDisplayClass(selectedSeat.variantName ?? displayClass);
    } else {
      setDisplayClass(flight?.variantName ?? seats[0]?.variantName ?? null);
    }
  }, [selectedSeat]);

  async function handleBuy() {
    if (isExpired) { setError("This flight has already departed. Please select another flight."); return; }
    if (!selectedSeat) { setError("Please select a seat."); return; }
    const userId = getUserId();
    if (!userId) { setError("Session expired. Please log in again."); return; }

    setBuying(true);
    setError("");

    try {
      const body = {
        id: Number(selectedSeat.planeTicketId ?? flight.id),
        userId: Number(userId),
        dueDate: flight.dueDate,
        chosenSeatId: Number(selectedSeat.id),
        hasPet: Boolean(hasPet),
        hasChild: Boolean(hasChild),
        luggageCount: 1,
        totalLuggageKg: Number(luggageKg),
        state: 1,
        note: note.trim() || null,
      };

      const res = await fetch(`${API_BASE}/PlaneTicket/fill`, {
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

      if (!result?.data) {
        setSeats((prev) => prev.map((s) => (s.id === selectedSeat.id ? { ...s, isOccupied: true } : s)));
        setSelectedSeat(null);
        throw new Error("This seat is already taken. Please choose another seat.");
      }

      setSuccess(true);
      if (onSuccess) setTimeout(() => onSuccess(result?.data ?? {}), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBuying(false);
    }
  }

  function formatTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // FIX: durationMinutes varsa ondan hesabla, yoxsa default 120 dəq (2 saat)
  function formatArrival(dateStr, durationMinutes = 120) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() + (durationMinutes || 120));
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  }

  const basePrice    = Number(flight?.price || 0);
  const seatExtra    = Number(selectedSeat?.variantPrice || 0);
  // FIX: flight.luggageKg-dan artıq hissəyə extra ücret tətbiq et
  const includedLuggage = flight?.luggageKg ?? 20;
  const luggageExtra = luggageKg > includedLuggage ? (luggageKg - includedLuggage) * 2 : 0;
  const totalPrice   = selectedSeat ? (basePrice + seatExtra + luggageExtra).toFixed(2) : "—";

  // ── Guard ──
  if (!flight) {
    return (
      <div className="fb-page">
        <div className="fb-inner">
          <button className="fb-back" onClick={onBack}>← Back</button>
          <p style={{ color: "#aaa", textAlign: "center", marginTop: "2rem" }}>No flight selected.</p>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="fb-page">
        <div className="fb-inner fb-success-screen">
          <div className="fb-success-circle">✓</div>
          <h2 className="fb-success-title">Ticket Booked!</h2>
          <p className="fb-success-sub">Your flight from {fromLabel} → {toLabel} is confirmed.</p>
          <p className="fb-success-seat">Seat: <strong>{selectedSeat?.name}</strong></p>
        </div>
      </div>
    );
  }

  // ── Main screen ──
  return (
    <div className="fb-page">
      <div className="fb-inner">
        <button className="fb-back" onClick={onBack}>← Back</button>

        {isExpired && (
          <div className="fb-expired-banner">
            <span className="fb-expired-icon">🕐</span>
            <div>
              <strong>This flight has already departed</strong>
              <p>Flight date: {formatDate(flight.dueDate)} · {formatTime(flight.dueDate)}</p>
            </div>
          </div>
        )}

        {/* FIX: seatNo — selectedSeat.name boarding pass-a ötürülür */}
        <BoardingPassCard
          flight={{
            ...flight,
            passengerName,
            ticketClass: displayClass,
            seatNo: selectedSeat?.name ?? null,
          }}
          fromLabel={fromLabel}
          toLabel={toLabel}
          isExpired={isExpired}
          formatTime={formatTime}
          formatArrival={formatArrival}
          formatDate={formatDate}
        />

        {/* Section 01: Seat selection */}
        <div className={`fb-section${isExpired ? " fb-section--disabled" : ""}`}>
          <h3 className="fb-section-title">
            <span className="fb-section-num">01</span>Select a Seat
          </h3>
          {isExpired ? (
            <div className="fb-seats-empty">This flight has departed. Seat selection is unavailable.</div>
          ) : seatsLoading ? (
            <div className="fb-seats-loading">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="fb-seat-skeleton" />
              ))}
            </div>
          ) : seats.length === 0 ? (
            <div className="fb-seats-empty">No seat data found.</div>
          ) : (
            <div className="fb-cabin">
              <SeatMapGrid seats={seats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
            </div>
          )}
        </div>

        {/* Section 02: Extras */}
        {!isExpired && (
          <div className="fb-section">
            <h3 className="fb-section-title">
              <span className="fb-section-num">02</span>Extras
            </h3>
            <div className="fb-options">
              <div className="fb-option" onClick={() => setHasPet(!hasPet)}>
                <div className="fb-option-info">
                  <span className="fb-option-icon">🐾</span>
                  <div><span className="fb-option-name">Pet on board</span></div>
                </div>
                <div className={`fb-toggle${hasPet ? " fb-toggle--on" : ""}`}>
                  <span className="fb-toggle-knob" />
                </div>
              </div>

              <div className="fb-option" onClick={() => setHasChild(!hasChild)}>
                <div className="fb-option-info">
                  <span className="fb-option-icon">👶</span>
                  <div><span className="fb-option-name">Travelling with child</span></div>
                </div>
                <div className={`fb-toggle${hasChild ? " fb-toggle--on" : ""}`}>
                  <span className="fb-toggle-knob" />
                </div>
              </div>

              <div className="fb-option fb-option--luggage">
                <div className="fb-option-info">
                  <span className="fb-option-icon">🧳</span>
                  <div>
                    <span className="fb-option-name">Luggage weight</span>
                    {/* FIX: neçə kg-ın daxil olduğunu göstər */}
                    <span style={{ fontSize: "12px", color: "#888", display: "block" }}>
                      Included: {includedLuggage} kg
                    </span>
                  </div>
                </div>
                <div className="fb-counter">
                  <button className="fb-counter-btn" onClick={() => setLuggageKg(Math.max(0, luggageKg - 5))}>−</button>
                  <span className="fb-counter-val">{luggageKg} kg</span>
                  <button className="fb-counter-btn" onClick={() => setLuggageKg(Math.min(50, luggageKg + 5))}>+</button>
                </div>
              </div>
            </div>

            <textarea
              className="fb-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special requests or notes..."
            />
          </div>
        )}

        {selectedSeat && !isExpired && (
          <div className="fb-order-summary">
            <div className="fb-order-row">
              <span>Base price</span>
              <span>{basePrice.toFixed(2)} ₼</span>
            </div>
            {seatExtra > 0 && (
              <div className="fb-order-row">
                <span>Seat class ({displayClass})</span>
                <span>+{seatExtra.toFixed(2)} ₼</span>
              </div>
            )}
            {luggageExtra > 0 && (
              <div className="fb-order-row">
                <span>Extra luggage ({luggageKg - includedLuggage} kg)</span>
                <span>+{luggageExtra.toFixed(2)} ₼</span>
              </div>
            )}
            <div className="fb-order-divider" />
            <div className="fb-order-row fb-order-total">
              <span>Total</span>
              <span>{totalPrice} ₼</span>
            </div>
          </div>
        )}

        {error && <div className="fb-error"><span>⚠</span> {error}</div>}

        {isExpired ? (
          <button className="fb-buy-btn fb-buy-btn--expired" disabled>🕐 Flight has departed</button>
        ) : (
          <button
            className={`fb-buy-btn${buying ? " fb-buy-btn--loading" : ""}${!selectedSeat ? " fb-buy-btn--disabled" : ""}`}
            onClick={() => !isExpired && selectedSeat && setShowPayment(true)}
            disabled={buying || !selectedSeat}
          >
            {buying ? (<><span className="fb-spinner" /> Processing...</>) : (<>Book Now · {totalPrice} ₼</>)}
          </button>
        )}
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