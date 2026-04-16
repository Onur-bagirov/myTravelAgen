import { useState, useEffect } from "react";
import "./ticket.css";
import FlightBooking from "../BookTicket/bookT";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

/* Barcode decoration — random-ish bars seeded by flight id */
function Barcode({ seed = 0 }) {
  const heights = [14,20,10,28,16,22,12,26,18,14,24,10,20,16,28,12,22,18,10,26];
  return (
    <div className="ft-barcode">
      {heights.map((h, i) => (
        <div
          key={i}
          className="ft-barcode-bar"
          style={{ height: `${((h + seed) % 24) + 6}px` }}
        />
      ))}
    </div>
  );
}

export default function PlanetTicket() {
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [variants, setVariants] = useState([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searching, setSearching] = useState(false);
  const [flights, setFlights] = useState(null);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${API_BASE}/Location?Page=1&Limit=100`, {
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error("Locations could not be loaded.");
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
    };

    const fetchVariants = async () => {
      try {
        const res = await fetch(`${API_BASE}/Variant?Page=1&Limit=100`, {
          headers: getHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setVariants(list);
      } catch (_) {}
    };

    fetchLocations();
    fetchVariants();
  }, []);

  const fromLoc = locations.find((l) => String(l.id) === fromId);
  const toLoc   = locations.find((l) => String(l.id) === toId);

  async function search() {
    if (!fromId || !toId) {
      setError("Please select both locations.");
      return;
    }
    if (fromId === toId) {
      setError("Departure and arrival locations cannot be the same.");
      return;
    }
    setSearching(true);
    setFlights(null);
    setError("");
    try {
      const params = new URLSearchParams({
        PageNumber: 1,
        PageSize: 20,
        Date: date,
        FromLocationId: fromId,
        ToLocationId: toId,
      });
      const res = await fetch(`${API_BASE}/PlaneTicket?${params.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("No flights found or server error.");
      const result = await res.json();
      const now = new Date();
      setFlights({
        list: (result.data || []).filter((f) => new Date(f.dueDate) >= now),
        fromLabel: fromLoc?.name,
        toLabel:   toLoc?.name,
        dateStr:   new Date(date).toLocaleDateString("en-US"),
      });
    } catch (e) {
      setError("An error occurred while fetching flights: " + e.message);
    } finally {
      setSearching(false);
    }
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
    setFlights(null);
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatArrival(dateStr, durationHours = 2) {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + durationHours);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function getFlightVariant(flight) {
    if (!variants.length) return null;
    const matched = flight.variantId
      ? variants.find((v) => v.id === flight.variantId)
      : null;
    return matched || variants[0];
  }

  function getCardModifier(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("first"))    return "ft-card--first";
    if (n.includes("economy"))  return "ft-card--economy";
    return "ft-card--business";
  }

  /* ── Booking view ── */
  if (selectedFlight) {
    return (
      <FlightBooking
        flight={selectedFlight.flight}
        fromLabel={selectedFlight.fromLabel}
        toLabel={selectedFlight.toLabel}
        onBack={() => setSelectedFlight(null)}
        onSuccess={() => {
          setTimeout(() => setSelectedFlight(null), 3000);
        }}
      />
    );
  }

  /* ── Main view ── */
  return (
    <div className="fs-page">
      <div className="fs-inner">

        {/* ── HEADER ── */}
        <div className="fs-header">
          <span className="fs-eyebrow">✦ StepTravel</span>
          <h1 className="fs-title">
            Plan Your <span className="fs-title-accent">Flight</span>
          </h1>
          <p className="fs-subtitle">Find your ticket at the best price</p>
        </div>

        {/* ── SEARCH CARD ── */}
        <div className="fs-card">
          <div className="fs-route-row">

            {/* FROM */}
            <div className="fs-field">
              <label className="fs-label">
                <span className="fs-label-dot from-dot" />
                From
              </label>
              <div className="fs-select-wrap">
                {locLoading ? (
                  <div className="fs-skeleton" />
                ) : (
                  <select
                    className="fs-select"
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}, {l.country?.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="fs-chevron">▾</span>
              </div>
            </div>

            {/* SWAP */}
            <button className="fs-swap" onClick={swap} title="Swap">
              <span className="fs-swap-icon">⇌</span>
            </button>

            {/* TO */}
            <div className="fs-field">
              <label className="fs-label">
                <span className="fs-label-dot to-dot" />
                To
              </label>
              <div className="fs-select-wrap">
                {locLoading ? (
                  <div className="fs-skeleton" />
                ) : (
                  <select
                    className="fs-select"
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}, {l.country?.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="fs-chevron">▾</span>
              </div>
            </div>
          </div>

          {/* DATE */}
          <div className="fs-date-row">
            <label className="fs-label">
              <span className="fs-label-icon">◈</span> Flight Date
            </label>
            <input
              className="fs-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* SEARCH BUTTON */}
          <button
            className={`fs-btn${searching ? " fs-btn--loading" : ""}`}
            onClick={search}
            disabled={searching}
          >
            {searching ? (
              <>
                <span className="fs-spinner" />
                Searching...
              </>
            ) : (
              <>
                <span className="fs-btn-icon">✈</span>
                Find Tickets
              </>
            )}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="fs-error">
            <span className="fs-error-icon">⚠</span> {error}
          </div>
        )}

        {/* ── RESULTS ── */}
        {flights && (
          <div className="fs-results">
            <div className="fs-results-header">
              <div className="fs-results-route">
                <span className="fs-results-from">{flights.fromLabel}</span>
                <span className="fs-results-arrow">→</span>
                <span className="fs-results-to">{flights.toLabel}</span>
              </div>
              <span className="fs-results-count">
                {flights.list.length} flights
              </span>
            </div>

            {flights.list.length === 0 ? (
              <div className="fs-empty">
                <span className="fs-empty-icon">✈</span>
                <p>No flights found for this date.</p>
              </div>
            ) : (
              <div className="fs-flight-list">
                {flights.list.map((f, i) => {
                  const variant      = getFlightVariant(f);
                  const cardModifier = variant ? getCardModifier(variant.name) : "ft-card--business";
                  const totalPrice   = variant
                    ? Math.round(Number(f.price) + Number(variant.price))
                    : Math.round(Number(f.price));
                  const isPromo = variant?.isPromo || false;

                  return (
                    <button
                      key={f.id}
                      className={`ft-card ${cardModifier}`}
                      style={{ animationDelay: `${i * 0.07}s` }}
                      onClick={() =>
                        setSelectedFlight({
                          flight:    f,
                          fromLabel: flights.fromLabel,
                          toLabel:   flights.toLabel,
                        })
                      }
                    >
                      {/* ── LEFT BODY ── */}
                      <div className="ft-card-body">

                        {/* TOP */}
                        <div className="ft-top">
                          <div className="ft-airline-block">
                            <div className="ft-airline-logo">
                              <span className="ft-airline-initial">
                                {(f.airline || "A")[0]}
                              </span>
                            </div>
                            <div className="ft-airline-info">
                              <span className="ft-airline-name">{f.airline}</span>
                              <span className="ft-plane-model">{f.plane}</span>
                            </div>
                          </div>
                          <div className="ft-flight-meta">
                            <span className="ft-flight-date">{formatDate(f.dueDate)}</span>
                            <span className="ft-flight-num">{f.flightNumber || "—"}</span>
                          </div>
                        </div>

                        {/* ROUTE */}
                        <div className="ft-route">
                          <div className="ft-time-block">
                            <span className="ft-time">{formatTime(f.dueDate)}</span>
                            <span className="ft-city">{f.from || flights.fromLabel}</span>
                          </div>

                          <div className="ft-route-center">
                            <span className="ft-duration">~2h · Direct</span>
                            <div className="ft-line">
                              <span className="ft-line-dot" />
                              <span className="ft-line-bar" />
                              <span className="ft-plane-fly">✈</span>
                              <span className="ft-line-bar" />
                              <span className="ft-line-dot" />
                            </div>
                          </div>

                          <div className="ft-time-block ft-time-block--right">
                            <span className="ft-time">{formatArrival(f.dueDate)}</span>
                            <span className="ft-city">{f.to || flights.toLabel}</span>
                          </div>
                        </div>

                        {/* DIVIDER */}
                        <div className="ft-divider" />

                        {/* BOTTOM */}
                        <div className="ft-bottom">
                          <div className="ft-bottom-left">
                            <div className="ft-tags">
                              <span className="ft-tag">
                                <span className="ft-tag-dot green" />
                                {f.availableSeats} seats
                              </span>
                              <span className="ft-tag">🧳 {f.luggageKg} kg</span>
                              <span className="ft-tag">🍽 {f.meal}</span>
                              <span className="ft-tag">Gate {f.gate}</span>
                            </div>
                          </div>

                          <div className="ft-price-block">
                            <span className="ft-price-label">from</span>
                            <span className="ft-price">
                              {totalPrice}{" "}
                              <span className="ft-price-currency">₼</span>
                            </span>
                            <span className="ft-select-arrow">→</span>
                          </div>
                        </div>

                      </div>

                      {/* ── RIGHT SIDE STRIP ── */}
                      <div className="ft-card-side">
                        {variant && (
                          <div className="ft-variant-pill">
                            {variant.name}
                            {isPromo && (
                              <span className="ft-promo-badge">promo</span>
                            )}
                          </div>
                        )}

                        <div className="ft-side-row">
                          <span className="ft-side-label">Flight</span>
                          <span className="ft-side-value">{f.plane}</span>
                        </div>

                        <div className="ft-side-row">
                          <span className="ft-side-label">Date</span>
                          <span className="ft-side-value">{formatDate(f.dueDate)}</span>
                        </div>

                        <div className="ft-side-row">
                          <span className="ft-side-label">Gate</span>
                          <span className="ft-side-value">{f.gate}</span>
                        </div>

                        <Barcode seed={f.id || i} />
                      </div>

                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}