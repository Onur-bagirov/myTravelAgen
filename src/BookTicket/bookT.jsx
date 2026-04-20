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
  } catch { return null; }
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
  } catch { return null; }
};

function BarcodeSide({ seed = 0 }) {
  const heights = [14,20,10,28,16,22,12,26,18,14,24,10,20,16,28,12,22,18,10,26,14,20,10];
  return (
    <div className="bp-barcode-side">
      {heights.map((v, i) => (
        <div
          key={i}
          className="bp-barcode-bar"
          style={{ height: `${((v + seed) % 24) + 6}px` }}
        />
      ))}
    </div>
  );
}

function cardAccentClass(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("first"))    return "ft-card--first";
  if (n.includes("economy"))  return "ft-card--economy";
  return                             "ft-card--business";
}

function variantMeta(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("first"))   return { color: "#f59e0b" };
  if (n.includes("economy")) return { color: "#22c55e" };
  return                            { color: "#ef4444" };
}

function TicketCard({
  flight, fromLabel, toLabel, isExpired,
  formatTime, formatArrivalFromFlight, formatDate,
  passengerName, displayClass, selectedSeat,
  seats, onSelectVariant,
}) {
  const accentClass = cardAccentClass(displayClass);
  const initial = (flight?.airline || "A")[0].toUpperCase();
  const departTime  = formatTime(flight?.dueDate);
  const arrivalTime = formatArrivalFromFlight(flight);

  const variantMap = new Map();
  (seats || []).forEach(s => {
    if (!variantMap.has(s.variantId)) {
      variantMap.set(s.variantId, {
        id:    s.variantId,
        name:  s.variantName,
        price: s.variantPrice ?? 0,
      });
    }
  });
  const variants = [...variantMap.values()];
  const basePrice = Number(flight?.price || 0);

  return (
    <div className={`ft-card ${accentClass}${isExpired ? " bp-card--expired" : ""}`}
         style={{ marginBottom: "1.5rem", cursor: "default" }}
         onClick={e => e.stopPropagation()}>

      <div className="ft-card-body">
        <div className="ft-top">
          <div className="ft-airline-block">
            <div className="ft-airline-logo">
              <span className="ft-airline-initial">{initial}</span>
            </div>
            <div className="ft-airline-info">
              <span className="ft-airline-name">{flight?.airline || "—"}</span>
              <span className="ft-plane-model">{flight?.plane || "—"}</span>
            </div>
          </div>
          <div className="ft-flight-meta">
            <span className="ft-flight-date">{formatDate(flight?.dueDate)}</span>
            <span className="ft-flight-num">{flight?.gate || "—"}</span>
          </div>
        </div>

        <div className="ft-route">
          <div className="ft-time-block">
            <span className="ft-time">{departTime ?? "--:--"}</span>
            <span className="ft-city">{(fromLabel || flight?.from || "—").toUpperCase()}</span>
          </div>

          <div className="ft-route-center">
            <span className="ft-duration">DIRECT</span>
            <div className="ft-line">
              <span className="ft-line-dot" />
              <span className="ft-line-bar" />
              <span className="ft-plane-fly">✈</span>
              <span className="ft-line-bar" />
              <span className="ft-line-dot" />
            </div>
          </div>

          <div className="ft-time-block ft-time-block--right">
            <span className="ft-time">{arrivalTime ?? "--:--"}</span>
            <span className="ft-city ft-city--arrival">{(toLabel || flight?.to || "—").toUpperCase()}</span>
          </div>
        </div>

        <div className="ft-divider" />

        {variants.length > 0 && (
          <div className="ft-variants-section">
            <span className="ft-variants-label">Select Class</span>
            <div className="ft-variants-row">
              {variants.map(v => {
                const meta     = variantMeta(v.name);
                const isActive = (displayClass || "").toLowerCase() === (v.name || "").toLowerCase();
                const vPrice   = Math.round(basePrice + Number(v.price));
                return (
                  <button key={v.id} type="button"
                    className={`vbtn${isActive ? " active" : ""}`}
                    style={{ "--vcolor": meta.color }}
                    onClick={() => onSelectVariant && onSelectVariant(v)}>
                    <span className="vbtn-dot" style={{ background: meta.color }} />
                    <span className="vbtn-name">{v.name}</span>
                    <span className="vbtn-price">{vPrice} ₼</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="ft-divider" />

        <div className="ft-bottom">
          <div className="ft-tags">
            {flight?.availableSeats != null && (
              <span className="ft-tag">
                <span className="ft-tag-dot green" />
                {flight.availableSeats} seats
              </span>
            )}
            {flight?.luggageKg != null && (
              <span className="ft-tag">🧳 {flight.luggageKg} kg</span>
            )}
            {flight?.meal && (
              <span className="ft-tag">🍽 {flight.meal}</span>
            )}
            {flight?.gate && (
              <span className="ft-tag">Gate {flight.gate}</span>
            )}
            {selectedSeat && (
              <span className="ft-tag" style={{ color: "#fff", borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.12)" }}>
                ✦ Seat {selectedSeat.name}
              </span>
            )}
            {passengerName && (
              <span className="ft-tag" style={{ fontStyle: "italic", opacity: 0.7 }}>{passengerName}</span>
            )}
          </div>
        </div>

        {isExpired && (
          <div className="bp-expired-overlay">
            <span>EXPIRED</span>
          </div>
        )}
      </div>

      <div className="ft-card-side">
        <div className="ft-side-row">
          <span className="ft-side-label">PLANE</span>
          <span className="ft-side-value">{flight?.plane || "—"}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">DATE</span>
          <span className="ft-side-value">{formatDate(flight?.dueDate)}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">GATE</span>
          <span className="ft-side-value">{flight?.gate || "—"}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">DEP.</span>
          <span className="ft-side-value">{departTime || "--:--"}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">ARR.</span>
          <span className="ft-side-value">{arrivalTime || "--:--"}</span>
        </div>
        <BarcodeSide seed={flight?.id || 0} />
      </div>
    </div>
  );
}
const THEMES = [
  {
    accent: "#f59e0b", freeBg: "rgba(245,158,11,0.08)", freeBorder: "rgba(245,158,11,0.32)",
    selBg: "rgba(245,158,11,0.22)", selBorder: "#f59e0b", selShadow: "rgba(245,158,11,0.35)",
    zoneBg: "rgba(245,158,11,0.03)", zoneBorder: "rgba(245,158,11,0.14)",
    headBg: "rgba(245,158,11,0.05)", priceBg: "rgba(245,158,11,0.08)",
  },
  {
    accent: "#ef4444", freeBg: "rgba(239,68,68,0.08)", freeBorder: "rgba(239,68,68,0.30)",
    selBg: "rgba(239,68,68,0.22)", selBorder: "#ef4444", selShadow: "rgba(239,68,68,0.35)",
    zoneBg: "rgba(239,68,68,0.03)", zoneBorder: "rgba(239,68,68,0.14)",
    headBg: "rgba(239,68,68,0.05)", priceBg: "rgba(239,68,68,0.08)",
  },
  {
    accent: "#22c55e", freeBg: "rgba(34,197,94,0.07)", freeBorder: "rgba(34,197,94,0.28)",
    selBg: "rgba(34,197,94,0.22)", selBorder: "#22c55e", selShadow: "rgba(34,197,94,0.35)",
    zoneBg: "rgba(34,197,94,0.02)", zoneBorder: "rgba(34,197,94,0.13)",
    headBg: "rgba(34,197,94,0.04)", priceBg: "rgba(34,197,94,0.07)",
  },
];
const getTheme = (idx) => THEMES[Math.min(idx, THEMES.length - 1)];

const CLASS_ICONS = { BUSINESS: "◆", FIRST: "★", ECONOMY: "●" };
function classIcon(name) {
  if (!name) return "●";
  const u = name.toUpperCase();
  return Object.entries(CLASS_ICONS).find(([k]) => u.includes(k))?.[1] ?? "●";
}

function SeatBtn({ seat, seatId, selectedSeat, onSelect, theme }) {
  if (!seat) return <div className="sb-empty" />;
  const isSelected = selectedSeat?.id === seat.id;
  const isTaken    = seat.isOccupied;
  let style = {};
  if (!isTaken) {
    if (isSelected) {
      style = {
        background: theme.selBg,
        borderColor: theme.selBorder,
        boxShadow: `0 0 0 1px ${theme.selBorder}, 0 4px 12px ${theme.selShadow}`,
      };
    } else {
      style = {
        background: theme.freeBg,
        borderColor: theme.freeBorder,
      };
    }
  }

  return (
    <button
      className={`sb${isTaken ? " sb--taken" : ""}${isSelected ? " sb--selected" : ""}`}
      style={style}
      disabled={isTaken}
      onClick={() => !isTaken && onSelect(seat)}
      aria-label={`Seat ${seatId}${isTaken ? " — occupied" : ""}`}
    >
      <span className="sb-id">{seatId}</span>
      {isSelected && <span className="sb-check">✓</span>}
    </button>
  );
}

function VariantBlock({ variantName, variantPrice, seats, selectedSeat, onSelect, themeIdx }) {
  const theme = getTheme(themeIdx);
  const byKey = {};
  seats.forEach(s => { byKey[s.name] = s; });

  const rows = [
    ...new Set(
      seats.map(s => { const m = s.name.match(/^(\d+)/); return m ? parseInt(m[1]) : null; }).filter(Boolean)
    ),
  ].sort((a, b) => a - b);

  const ALL_LEFT  = ["A", "B", "C"];
  const ALL_RIGHT = ["D", "E", "F"];
  const used      = new Set(seats.map(s => s.name.replace(/[0-9]/g, "")));
  const LEFT      = ALL_LEFT.filter(c => used.has(c));
  const RIGHT     = ALL_RIGHT.filter(c => used.has(c));
  const showAisle = LEFT.length > 0 && RIGHT.length > 0;

  const tpl = [
    "20px",
    ...LEFT.map(() => "1fr"),
    showAisle ? "12px" : null,
    ...RIGHT.map(() => "1fr"),
  ].filter(Boolean).join(" ");

  return (
    <div className="vb" style={{
      "--accent": theme.accent, "--zone-bg": theme.zoneBg,
      "--zone-border": theme.zoneBorder, "--head-bg": theme.headBg, "--price-bg": theme.priceBg,
    }}>
      <div className="vb-header">
        <div className="vb-header-left">
          <span className="vb-icon">{classIcon(variantName)}</span>
          <span className="vb-header-name">{variantName}</span>
        </div>
        {variantPrice > 0 && <span className="vb-header-price">+{variantPrice} ₼</span>}
      </div>

      <div className="vb-grid">
        <div className="vb-grid-row vb-col-header-row" style={{ "--tpl": tpl }}>
          <div />
          {LEFT.map(c  => <div key={c}  className="vb-col-h">{c}</div>)}
          {showAisle   && <div />}
          {RIGHT.map(c => <div key={c}  className="vb-col-h">{c}</div>)}
        </div>
        {rows.map(row => (
          <div key={row} className="vb-grid-row" style={{ "--tpl": tpl }}>
            <div className="vb-row-num">{row}</div>
            {LEFT.map(col => {
              const id = `${row}${col}`, s = byKey[id];
              return s
                ? <SeatBtn key={id} seat={s} seatId={id} selectedSeat={selectedSeat} onSelect={onSelect} theme={theme} />
                : <div key={id} className="sb-empty" />;
            })}
            {showAisle && <div className="vb-aisle" />}
            {RIGHT.map(col => {
              const id = `${row}${col}`, s = byKey[id];
              return s
                ? <SeatBtn key={id} seat={s} seatId={id} selectedSeat={selectedSeat} onSelect={onSelect} theme={theme} />
                : <div key={id} className="sb-empty" />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatMapGrid({ seats, selectedSeat, onSelect }) {
  const groups = {};
  seats.forEach(s => {
    const k = s.variantName || "ECONOMY";
    if (!groups[k]) groups[k] = { name: k, price: s.variantPrice ?? 0, seats: [] };
    groups[k].seats.push(s);
  });
  const sorted = Object.values(groups).sort((a, b) => b.price - a.price);

  return (
    <div className="sm-outer">
      <div className="sm-front-bar">
        <span className="sm-front-line" />
        <span className="sm-front-lbl">
          <span className="sm-front-icon">
            <svg viewBox="0 0 24 24" fill="#ef4444" width="11" height="11">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </span>
          Front of plane
        </span>
        <span className="sm-front-line" />
      </div>

      {sorted.map((vg, idx) => (
        <div key={vg.name}>
          <VariantBlock
            variantName={vg.name} variantPrice={vg.price}
            seats={vg.seats} selectedSeat={selectedSeat}
            onSelect={onSelect} themeIdx={idx}
          />
          {idx < sorted.length - 1 && (
            <div className="sm-sep">
              <span className="sm-sep-line" />
              <span className="sm-sep-txt">· · · · ·</span>
              <span className="sm-sep-line" />
            </div>
          )}
        </div>
      ))}

      <div className="sm-legend">
        {sorted.map((vg, idx) => {
          const t = getTheme(idx);
          return (
            <span key={vg.name} className="sm-leg">
              <span className="sm-leg-dot" style={{ background: t.freeBg, borderColor: t.freeBorder }} />
              {vg.name}
            </span>
          );
        })}
        <span className="sm-leg">
          <span className="sm-leg-dot" style={{ background: "rgba(239,68,68,0.14)", borderColor: "rgba(239,68,68,0.38)" }} />
          Taken
        </span>
        <span className="sm-leg">
          <span className="sm-leg-dot" style={{ background: "rgba(239,68,68,0.22)", borderColor: "#ef4444" }} />
          Selected
        </span>
      </div>
    </div>
  );
}

export default function FlightBooking({ flight, fromLabel, toLabel, onBack, onSuccess }) {
  const [seats,         setSeats]         = useState([]);
  const [seatsLoading,  setSeatsLoading]  = useState(true);
  const [selectedSeat,  setSelectedSeat]  = useState(null);
  const [hasPet,        setHasPet]        = useState(false);
  const [hasChild,      setHasChild]      = useState(false);
  const [luggageKg,     setLuggageKg]     = useState(flight?.luggageKg ?? 0);
  const [note,          setNote]          = useState("");
  const [buying,        setBuying]        = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);
  const [showPayment,   setShowPayment]   = useState(false);
  const [passengerName, setPassengerName] = useState(flight?.passengerName ?? "");
  const [displayClass,  setDisplayClass]  = useState(flight?.variantName ?? null);

  const isExpired = flight?.dueDate ? new Date(flight.dueDate) < new Date() : false;

  useEffect(() => {
    if (!flight?.id) return;
    (async () => {
      setSeatsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${flight.id}&TicketType=plane`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error("Seats could not be loaded.");
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setSeats(list);
        if (!flight?.variantName && list.length > 0) setDisplayClass(list[0].variantName ?? null);
      } catch (e) { setError(e.message); }
      finally { setSeatsLoading(false); }
    })();
    getUserName().then(n => { if (n) setPassengerName(n); });
  }, [flight?.id]);

  useEffect(() => {
    if (selectedSeat) setDisplayClass(selectedSeat.variantName ?? displayClass);
    else setDisplayClass(flight?.variantName ?? seats[0]?.variantName ?? null);
  }, [selectedSeat]);

  function handleVariantSelect(variant) {
    setDisplayClass(variant.name);
    if (selectedSeat && selectedSeat.variantName !== variant.name) {
      setSelectedSeat(null);
    }
  }

  async function handleBuy() {
    if (isExpired)    { setError("This flight has already departed."); return; }
    if (!selectedSeat){ setError("Please select a seat."); return; }
    const userId = getUserId();
    if (!userId)      { setError("Session expired. Please log in again."); return; }

    setBuying(true); setError("");
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
        method: "PUT", headers: getHeaders(), body: JSON.stringify(body),
      });
      const raw = await res.text();
      let result = null;
      try { result = raw ? JSON.parse(raw) : null; } catch {}

      if (!res.ok) {
        let msg = result?.message || result?.title || `Error ${res.status}`;
        if (result?.errors) msg = Object.values(result.errors).flat().join(", ");
        setSeats(p => p.map(s => s.id === selectedSeat.id ? { ...s, isOccupied: true } : s));
        setSelectedSeat(null);
        throw new Error(msg);
      }

      setSuccess(true);
      if (onSuccess) setTimeout(() => onSuccess(result?.data ?? {}), 2000);
    } catch (e) { setError(e.message); }
    finally { setBuying(false); }
  }

  function formatTime(d) {
    if (!d) return "--:--";
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  }

  function formatArrivalFromFlight(f) {
    if (!f) return "--:--";
    if (f.arrivalDate) return formatTime(f.arrivalDate);
    if (f.dueDate) {
      const dt = new Date(f.dueDate);
      dt.setMinutes(dt.getMinutes() + (f.durationMinutes || 120));
      return `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
    }
    return "--:--";
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const basePrice       = Number(flight?.price || 0);
  const seatExtra       = Number(selectedSeat?.variantPrice || 0);
  const includedLuggage = flight?.luggageKg ?? 20;
  const luggageExtra    = luggageKg > includedLuggage ? (luggageKg - includedLuggage) * 2 : 0;
  const totalPrice      = selectedSeat ? (basePrice + seatExtra + luggageExtra).toFixed(2) : "—";

  if (!flight) return (
    <div className="fb-page">
      <div className="fb-inner">
        <button className="fb-back" onClick={onBack}>← Back</button>
        <p style={{ color: "rgba(255,255,255,0.28)", textAlign: "center", marginTop: "2rem" }}>No flight selected.</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="fb-page">
      <div className="fb-inner fb-success-screen">
        <div className="fb-success-circle">✓</div>
        <h2 className="fb-success-title">Ticket Booked!</h2>
        <p className="fb-success-sub">Your flight from {fromLabel} → {toLabel} is confirmed.</p>
        <p className="fb-success-seat">Seat: <strong>{selectedSeat?.name}</strong></p>
      </div>
    </div>
  );

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

        <TicketCard
          flight={flight}
          fromLabel={fromLabel}
          toLabel={toLabel}
          isExpired={isExpired}
          formatTime={formatTime}
          formatArrivalFromFlight={formatArrivalFromFlight}
          formatDate={formatDate}
          passengerName={passengerName}
          displayClass={displayClass}
          selectedSeat={selectedSeat}
          seats={seats}
          onSelectVariant={handleVariantSelect}
        />
        <div className={`fb-section${isExpired ? " fb-section--disabled" : ""}`}>
          <h3 className="fb-section-title">
            <span className="fb-section-num">01</span>Select a Seat
          </h3>
          {isExpired ? (
            <div className="fb-seats-empty">This flight has departed. Seat selection is unavailable.</div>
          ) : seatsLoading ? (
            <div className="fb-seats-loading">
              {[...Array(18)].map((_, i) => <div key={i} className="fb-seat-skeleton" />)}
            </div>
          ) : seats.length === 0 ? (
            <div className="fb-seats-empty">No seat data found.</div>
          ) : (
            <div className="fb-cabin">
              <SeatMapGrid seats={seats} selectedSeat={selectedSeat} onSelect={setSelectedSeat} />
            </div>
          )}
        </div>

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
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", display: "block" }}>
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
              className="fb-note" rows={3} value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Special requests or notes..."
            />
          </div>
        )}

        {selectedSeat && !isExpired && (
          <div className="fb-order-summary">
            <div className="fb-order-row">
              <span>Base price</span><span>{basePrice.toFixed(2)} ₼</span>
            </div>
            {seatExtra > 0 && (
              <div className="fb-order-row">
                <span>Seat class ({displayClass})</span><span>+{seatExtra.toFixed(2)} ₼</span>
              </div>
            )}
            {luggageExtra > 0 && (
              <div className="fb-order-row">
                <span>Extra luggage ({luggageKg - includedLuggage} kg)</span><span>+{luggageExtra.toFixed(2)} ₼</span>
              </div>
            )}
            <div className="fb-order-divider" />
            <div className="fb-order-total">
              <span>Total</span><span>{totalPrice} ₼</span>
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
          amount={totalPrice} loading={buying}
          onCancel={() => setShowPayment(false)}
          onConfirm={() => { setShowPayment(false); handleBuy(); }}
        />
      )}
    </div>
  );
}