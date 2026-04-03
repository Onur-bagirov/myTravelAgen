import { useState, useEffect, useRef } from "react";
import "./SeatMap.css";

// ─── mock fetch – swap this for your real API call ───────────────────────────
async function fetchSeats() {
  // Expected shape from backend:
  // { rows: number, cols: string[], seats: SeatDTO[] }
  //
  // SeatDTO {
  //   name: string        – e.g. "3B"  (row number + col letter)
  //   variant: string     – "Business" | "Economy" | "First Class" | …
  //   isOccupied: boolean
  //   occupiedBy: string  – passenger name, empty when free
  // }
  //
  // The `name` field is the simplest approach: the backend sets it once
  // (e.g. "3B") and the UI just reads it.  If your backend doesn't have
  // it yet, see the helper below.

  return {
    rows: 6,
    cols: ["A", "B", "C", "", "D", "E", "F"],
    seats: [
      // Row 1 – First Class
      { name: "1A", variant: "First Class", isOccupied: false, occupiedBy: "" },
      { name: "1B", variant: "First Class", isOccupied: true,  occupiedBy: "James Harlow" },
      { name: "1C", variant: "First Class", isOccupied: false, occupiedBy: "" },
      { name: "1D", variant: "First Class", isOccupied: false, occupiedBy: "" },
      { name: "1E", variant: "First Class", isOccupied: true,  occupiedBy: "Nadia Voss" },
      { name: "1F", variant: "First Class", isOccupied: false, occupiedBy: "" },
      // Row 2 – Business
      { name: "2A", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "2B", variant: "Business", isOccupied: true,  occupiedBy: "Omar Khalil" },
      { name: "2C", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "2D", variant: "Business", isOccupied: true,  occupiedBy: "Sara Lund" },
      { name: "2E", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "2F", variant: "Business", isOccupied: false, occupiedBy: "" },
      // Row 3 – Business
      { name: "3A", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "3B", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "3C", variant: "Business", isOccupied: true,  occupiedBy: "Lena Müller" },
      { name: "3D", variant: "Business", isOccupied: false, occupiedBy: "" },
      { name: "3E", variant: "Business", isOccupied: true,  occupiedBy: "Ethan Blake" },
      { name: "3F", variant: "Business", isOccupied: false, occupiedBy: "" },
      // Row 4 – Economy
      { name: "4A", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "4B", variant: "Economy", isOccupied: true,  occupiedBy: "Priya Sharma" },
      { name: "4C", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "4D", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "4E", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "4F", variant: "Economy", isOccupied: true,  occupiedBy: "Kenji Ito" },
      // Row 5 – Economy
      { name: "5A", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "5B", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "5C", variant: "Economy", isOccupied: true,  occupiedBy: "Anya Petrov" },
      { name: "5D", variant: "Economy", isOccupied: true,  occupiedBy: "Carlos Reyes" },
      { name: "5E", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "5F", variant: "Economy", isOccupied: false, occupiedBy: "" },
      // Row 6 – Economy
      { name: "6A", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "6B", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "6C", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "6D", variant: "Economy", isOccupied: false, occupiedBy: "" },
      { name: "6E", variant: "Economy", isOccupied: true,  occupiedBy: "Mia Chen" },
      { name: "6F", variant: "Economy", isOccupied: false, occupiedBy: "" },
    ],
  };
}

function deriveName(rowIndex, colLetter) { return `${rowIndex + 1}${colLetter}`; }

// ─── Variant colour tokens ────────────────────────────────────────────────────
const VARIANT_META = {
  "First Class": { accent: "#c9a84c", label: "✦ First Class" },
  "Business":    { accent: "#7eb8f7", label: "◈ Business" },
  "Economy":     { accent: "#a0a8c0", label: "◇ Economy" },
};

function variantAccent(variant) {
  return (VARIANT_META[variant] || { accent: "#a0a8c0" }).accent;
}
function variantLabel(variant) {
  return (VARIANT_META[variant] || { label: variant }).label;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ seat, onBuy, anchorRef }) {
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef?.current || !tipRef?.current) return;
    const btn = anchorRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = btn.top + scrollY - tip.height - 12;
    let left = btn.left + scrollX + btn.width / 2 - tip.width / 2;

    // keep inside viewport horizontally
    if (left < 8) left = 8;
    if (left + tip.width > window.innerWidth - 8)
      left = window.innerWidth - 8 - tip.width;

    setPos({ top, left });
  }, [anchorRef]);

  return (
    <div
      ref={tipRef}
      className="seat-tooltip"
      style={{ top: pos.top, left: pos.left, "--accent": variantAccent(seat.variant) }}
    >
      <div className="tooltip-header">
        <span className="tooltip-seat-name">{seat.name}</span>
        <span className="tooltip-variant">{variantLabel(seat.variant)}</span>
      </div>

      <div className="tooltip-row">
        <span className="tooltip-icon">{seat.isOccupied ? "🔴" : "🟢"}</span>
        <span className="tooltip-status">
          {seat.isOccupied ? `Occupied by ${seat.occupiedBy}` : "Available"}
        </span>
      </div>

      <button
        className="tooltip-buy-btn"
        disabled={seat.isOccupied}
        onClick={() => onBuy(seat)}
      >
        {seat.isOccupied ? "Unavailable" : "Buy Seat"}
      </button>
    </div>
  );
}

// ─── Single seat button ───────────────────────────────────────────────────────
function SeatButton({ seat, onBuy }) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);

  const stateClass = seat.isOccupied ? "seat--occupied" : "seat--free";
  const variantClass = `seat--${seat.variant.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="seat-wrapper">
      <button
        ref={btnRef}
        className={`seat-btn ${stateClass} ${variantClass}`}
        style={{ "--accent": variantAccent(seat.variant) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Seat ${seat.name}, ${seat.variant}, ${seat.isOccupied ? "occupied" : "free"}`}
      >
        <span className="seat-label">{seat.name}</span>
        <span className="seat-dot" />
      </button>

      {hovered && (
        <Tooltip seat={seat} onBuy={onBuy} anchorRef={btnRef} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SeatMap() {
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    fetchSeats().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  function handleBuy(seat) {
    setToast(`Purchasing seat ${seat.name} (${seat.variant})…`);
    setTimeout(() => setToast(null), 3000);
    // 👉 call your real purchase API here
  }

  if (loading) return <div className="seatmap-loading">Loading cabin…</div>;

  const { rows, cols, seats } = config;

  // Index seats by name for O(1) lookup
  const seatIndex = {};
  seats.forEach((s) => (seatIndex[s.name] = s));

  return (
    <div className="seatmap-root">
      {/* ── Header ── */}
      <header className="seatmap-header">
        <div className="plane-icon">✈</div>
        <h1 className="seatmap-title">Cabin Seat Map</h1>
        <p className="seatmap-subtitle">Hover a seat to preview · Click Buy to reserve</p>
      </header>

      {/* ── Legend ── */}
      <div className="legend">
        {Object.entries(VARIANT_META).map(([v, m]) => (
          <div key={v} className="legend-item">
            <span className="legend-dot" style={{ background: m.accent }} />
            {m.label}
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-dot legend-dot--occupied" />
          Occupied
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="seatmap-cabin">
        {/* column headers */}
        <div className="seat-row seat-row--header">
          <span className="row-num" />
          {cols.map((col, ci) =>
            col === "" ? (
              <span key={`aisle-${ci}`} className="aisle-spacer" />
            ) : (
              <span key={col} className="col-header">{col}</span>
            )
          )}
        </div>

        {/* seat rows */}
        {Array.from({ length: rows }, (_, ri) => {
          const rowNum = ri + 1;
          return (
            <div key={rowNum} className="seat-row">
              <span className="row-num">{rowNum}</span>
              {cols.map((col, ci) => {
                if (col === "")
                  return <span key={`aisle-${ci}`} className="aisle-spacer" />;
                const name = `${rowNum}${col}`;
                const seat = seatIndex[name];
                if (!seat) return <span key={name} className="seat-empty" />;
                return <SeatButton key={name} seat={seat} onBuy={handleBuy} />;
              })}
            </div>
          );
        })}
      </div>

      {/* ── Toast ── */}
      {toast && <div className="seatmap-toast">{toast}</div>}
    </div>
  );
}