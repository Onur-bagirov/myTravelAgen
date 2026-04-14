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

// ─── Seat Map Sub-component ───────────────────────────────────────────────────
function SeatMapGrid({ seats, selectedSeat, onSelect }) {
  // Build a lookup: "rowNum+col" -> seat object
  // Seat names expected like "1A", "2F", "10C" etc.
  const seatByKey = {};
  seats.forEach((s) => {
    seatByKey[s.name] = s;
  });

  // Detect all unique variant groups to show class label + price
  const variantGroups = seats.reduce((acc, s) => {
    if (!acc[s.variantName]) acc[s.variantName] = { name: s.variantName, price: s.variantPrice };
    return acc;
  }, {});

  // Detect row count dynamically from seat names
  const rows = [...new Set(seats.map((s) => parseInt(s.name)))].sort((a, b) => a - b);
  const COLS = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="sm-wrap">
      {/* Per-variant class labels */}
      {Object.values(variantGroups).map((vg) => (
        <div key={vg.name} className="sm-variant-header">
          <span className="sm-class-name">{vg.name}</span>
          <span className="sm-price-tag">+{vg.price} ₼</span>
        </div>
      ))}

      {/* Front label */}
      <div className="sm-front">
        <span className="sm-front-line" />
        <span className="sm-front-label">✈ ÖN</span>
        <span className="sm-front-line" />
      </div>

      {/* Column headers */}
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

      {/* Seat rows */}
      {rows.map((row) => (
        <div key={row} className="sm-row">
          <div className="sm-row-num-cell">{row}</div>
          {COLS.map((col, ci) => {
            const seatId = `${row}${col}`;
            const seat = seatByKey[seatId];

            if (ci === 3) {
              // Insert aisle spacer before col D
              return [
                <div key="aisle" className="sm-aisle-spacer" />,
                <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />,
              ];
            }
            return (
              <SeatButton key={seatId} seat={seat} seatId={seatId} selectedSeat={selectedSeat} onSelect={onSelect} />
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="sm-legend">
        <span className="sm-legend-item">
          <span className="sm-legend-dot sm-legend-dot--free" /> Free
        </span>
        <span className="sm-legend-item">
          <span className="sm-legend-dot sm-legend-dot--taken" /> Occupied
        </span>
        <span className="sm-legend-item">
          <span className="sm-legend-dot sm-legend-dot--selected" /> Selected
        </span>
      </div>
    </div>
  );
}

function SeatButton({ seat, seatId, selectedSeat, onSelect }) {
  if (!seat) {
    // Empty cell (no seat data for this position)
    return <div className="sm-seat sm-seat--empty" />;
  }

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
  const [luggageKg, setLuggageKg] = useState(0);
  const [note, setNote] = useState("");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const isExpired = flight?.dueDate ? new Date(flight.dueDate) < new Date() : false;

  useEffect(() => {
    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${flight.id}&TicketType=plane`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error("Seats could not be loaded.");
        const data = await res.json();
        setSeats(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setSeatsLoading(false);
      }
    };
    fetchSeats();
  }, [flight.id]);

  async function handleBuy() {
    if (isExpired) {
      setError("This flight has already departed. Please select another flight.");
      return;
    }
    if (!selectedSeat) {
      setError("Please select a seat.");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("Session expired. Please log in again.");
      return;
    }

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
      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch {
        result = null;
      }

      if (!res.ok) {
        let errMsg = result?.message || result?.title || `Server error: ${res.status}`;
        if (result?.errors) {
          errMsg = Object.values(result.errors).flat().join(", ");
        }
        setSeats((prev) =>
          prev.map((s) => (s.id === selectedSeat.id ? { ...s, isOccupied: true } : s))
        );
        setSelectedSeat(null);
        throw new Error(errMsg);
      }

      if (!result?.data) {
        setSeats((prev) =>
          prev.map((s) => (s.id === selectedSeat.id ? { ...s, isOccupied: true } : s))
        );
        setSelectedSeat(null);
        throw new Error("This seat is already taken. Please choose another seat.");
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
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  function formatArrival(dateStr) {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + 2);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const basePrice    = Number(flight.price || 0);
  const seatExtra    = Number(selectedSeat?.variantPrice || 0);
  const luggageExtra = luggageKg > (flight.luggageKg || 20) ? 10 : 0;
  const totalPrice   = selectedSeat ? (basePrice + seatExtra + luggageExtra).toFixed(2) : "—";

  // ── Success screen ──
  if (success) {
    return (
      <div className="fb-page">
        <div className="fb-inner fb-success-screen">
          <div className="fb-success-circle">✓</div>
          <h2 className="fb-success-title">Ticket Booked!</h2>
          <p className="fb-success-sub">
            Your flight from {fromLabel} → {toLabel} is confirmed.
          </p>
          <p className="fb-success-seat">
            Seat: <strong>{selectedSeat?.name}</strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Main screen ──
  return (
    <div className="fb-page">
      <div className="fb-inner">
        <button className="fb-back" onClick={onBack}>← Back</button>

        {/* Expired banner */}
        {isExpired && (
          <div className="fb-expired-banner">
            <span className="fb-expired-icon">🕐</span>
            <div>
              <strong>This flight has already departed</strong>
              <p>Flight date: {formatDate(flight.dueDate)} · {formatTime(flight.dueDate)}</p>
            </div>
          </div>
        )}

        {/* Flight summary card */}
        <div className={`fb-summary${isExpired ? " fb-summary--expired" : ""}`}>
          <div className="fb-summary-top">
            <span className="fb-eyebrow">✦ {flight.airline}</span>
            <span className="fb-flight-badge">{flight.plane}</span>
          </div>
          <div className="fb-route">
            <div className="fb-route-block">
              <span className="fb-route-time">{formatTime(flight.dueDate)}</span>
              <span className="fb-route-city">{fromLabel}</span>
            </div>
            <div className="fb-route-mid">
              <span className="fb-flight-dot-line">
                <span className="fb-dot" />
                <span className="fb-dash" />
                <span className="fb-plane-fly">✈</span>
                <span className="fb-dash" />
                <span className="fb-dot" />
              </span>
              <span className="fb-dur-tag">~2h · Direct</span>
            </div>
            <div className="fb-route-block fb-route-block--right">
              <span className="fb-route-time">{formatArrival(flight.dueDate)}</span>
              <span className="fb-route-city">{toLabel}</span>
            </div>
          </div>
          <div className="fb-summary-meta">
            <span>📅 {formatDate(flight.dueDate)}</span>
            <span>🚪 Gate {flight.gate}</span>
            <span>🍽 {flight.meal}</span>
            <span>🧳 {flight.luggageKg} kg</span>
          </div>
        </div>

        {/* Section 01: Seat selection */}
        <div className={`fb-section${isExpired ? " fb-section--disabled" : ""}`}>
          <h3 className="fb-section-title">
            <span className="fb-section-num">01</span>Select a Seat
          </h3>

          {isExpired ? (
            <div className="fb-seats-empty">
              This flight has departed. Seat selection is unavailable.
            </div>
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
              <SeatMapGrid
                seats={seats}
                selectedSeat={selectedSeat}
                onSelect={setSelectedSeat}
              />
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
                  <div>
                    <span className="fb-option-name">Pet on board</span>
                  </div>
                </div>
                <div className={`fb-toggle${hasPet ? " fb-toggle--on" : ""}`}>
                  <span className="fb-toggle-knob" />
                </div>
              </div>

              <div className="fb-option" onClick={() => setHasChild(!hasChild)}>
                <div className="fb-option-info">
                  <span className="fb-option-icon">👶</span>
                  <div>
                    <span className="fb-option-name">Travelling with child</span>
                  </div>
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
                  </div>
                </div>
                <div className="fb-counter">
                  <button
                    className="fb-counter-btn"
                    onClick={() => setLuggageKg(Math.max(0, luggageKg - 5))}
                  >
                    −
                  </button>
                  <span className="fb-counter-val">{luggageKg} kg</span>
                  <button
                    className="fb-counter-btn"
                    onClick={() => setLuggageKg(Math.min(50, luggageKg + 5))}
                  >
                    +
                  </button>
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

        {/* Order summary */}
        {selectedSeat && !isExpired && (
          <div className="fb-order-summary">
            <div className="fb-order-row">
              <span>Base + Class</span>
              <span>{(basePrice + seatExtra).toFixed(2)} ₼</span>
            </div>
            {luggageExtra > 0 && (
              <div className="fb-order-row">
                <span>Extra luggage</span>
                <span>+{luggageExtra} ₼</span>
              </div>
            )}
            <div className="fb-order-divider" />
            <div className="fb-order-row fb-order-total">
              <span>Total</span>
              <span>{totalPrice} ₼</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fb-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* CTA button */}
        {isExpired ? (
          <button className="fb-buy-btn fb-buy-btn--expired" disabled>
            🕐 Flight has departed
          </button>
        ) : (
          <button
            className={`fb-buy-btn${buying ? " fb-buy-btn--loading" : ""}${!selectedSeat ? " fb-buy-btn--disabled" : ""}`}
            onClick={() => !isExpired && selectedSeat && setShowPayment(true)}
            disabled={buying || !selectedSeat}
          >
            {buying ? (
              <>
                <span className="fb-spinner" /> Processing...
              </>
            ) : (
              <>Book Now · {totalPrice} ₼</>
            )}
          </button>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          amount={totalPrice}
          loading={buying}
          onCancel={() => setShowPayment(false)}
          onConfirm={() => {
            setShowPayment(false);
            handleBuy();
          }}
        />
      )}
    </div>
  );
}