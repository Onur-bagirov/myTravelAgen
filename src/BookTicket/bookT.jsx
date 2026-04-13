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

  const variantGroups = seats.reduce((acc, s) => {
    const key = s.variantName;
    if (!acc[key]) acc[key] = { name: key, price: s.variantPrice, seats: [] };
    acc[key].seats.push(s);
    return acc;
  }, {});

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

  const basePrice   = Number(flight.price || 0);
  const seatExtra   = Number(selectedSeat?.variantPrice || 0);
  const luggageExtra = luggageKg > (flight.luggageKg || 20) ? 10 : 0;
  const totalPrice  = selectedSeat ? (basePrice + seatExtra + luggageExtra).toFixed(2) : "—";

  if (success) {
    return (
      <div className="fb-page">
        <div className="fb-noise" />
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

  return (
    <div className="fb-page">
      <div className="fb-noise" />
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
                <span className="fb-dot" /><span className="fb-dash" />
                <span className="fb-plane-fly">✈</span>
                <span className="fb-dash" /><span className="fb-dot" />
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
              {[...Array(12)].map((_, i) => <div key={i} className="fb-seat-skeleton" />)}
            </div>
          ) : seats.length === 0 ? (
            <div className="fb-seats-empty">No seat data found.</div>
          ) : (
            <div className="fb-cabin">
              <div className="fb-cabin-nose"><span>✈ Front</span></div>
              {Object.values(variantGroups).map((group) => (
                <div key={group.name} className="fb-variant-group">
                  <div className="fb-variant-label">
                    <span className="fb-variant-name">{group.name}</span>
                    <span className="fb-variant-price">+{group.price} ₼</span>
                  </div>
                  <div className="fb-seats-grid">
                    {group.seats.map((seat) => (
                      <button
                        key={seat.id}
                        disabled={seat.isOccupied}
                        className={`fb-seat ${seat.isOccupied ? "fb-seat--occupied" : "fb-seat--free"} ${selectedSeat?.id === seat.id ? "fb-seat--selected" : ""}`}
                        onClick={() => !seat.isOccupied && setSelectedSeat(seat)}
                      >
                        <span className="fb-seat-num">{seat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="fb-legend">
                <span className="fb-legend-item"><span className="fb-legend-dot fb-legend-dot--free" />Available</span>
                <span className="fb-legend-item"><span className="fb-legend-dot fb-legend-dot--occupied" />Taken</span>
                <span className="fb-legend-item"><span className="fb-legend-dot fb-legend-dot--selected" />Selected</span>
              </div>
            </div>
          )}
        </div>

        {!isExpired && (
          <div className="fb-section">
            <h3 className="fb-section-title">
              <span className="fb-section-num">02</span>Extras
            </h3>
            <div className="fb-options">
              <div className="fb-option">
                <div className="fb-option-info">
                  <span className="fb-option-icon">🐾</span>
                  <div><span className="fb-option-name">Pet on board</span></div>
                </div>
                <div className={`fb-toggle${hasPet ? " fb-toggle--on" : ""}`} onClick={() => setHasPet(!hasPet)}>
                  <span className="fb-toggle-knob" />
                </div>
              </div>

              <div className="fb-option">
                <div className="fb-option-info">
                  <span className="fb-option-icon">👶</span>
                  <div><span className="fb-option-name">Travelling with child</span></div>
                </div>
                <div className={`fb-toggle${hasChild ? " fb-toggle--on" : ""}`} onClick={() => setHasChild(!hasChild)}>
                  <span className="fb-toggle-knob" />
                </div>
              </div>

              <div className="fb-option fb-option--luggage">
                <div className="fb-option-info">
                  <span className="fb-option-icon">🧳</span>
                  <div><span className="fb-option-name">Luggage weight</span></div>
                </div>
                <div className="fb-counter">
                  <button className="fb-counter-btn" onClick={() => setLuggageKg(Math.max(0, luggageKg - 5))}>−</button>
                  <span className="fb-counter-val">{luggageKg} kg</span>
                  <button className="fb-counter-btn" onClick={() => setLuggageKg(luggageKg + 5)}>+</button>
                </div>
              </div>
            </div>
            <textarea
              className="fb-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special requests or notes..."
            />
          </div>
        )}

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

        {error && <div className="fb-error"><span>⚠</span> {error}</div>}

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
              <><span className="fb-spinner" /> Processing...</>
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