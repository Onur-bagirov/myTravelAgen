import { useState, useEffect } from "react";
import "./ticket.css";
import FlightBooking from "../BookTicket/bookT"; 

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

export default function PlanetTicket() {
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
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
    fetchLocations();
  }, []);

  const fromLoc = locations.find((l) => String(l.id) === fromId);
  const toLoc = locations.find((l) => String(l.id) === toId);

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
      
      setFlights({
        list: result.data || [],
        fromLabel: fromLoc?.name,
        toLabel: toLoc?.name,
        dateStr: new Date(date).toLocaleDateString("en-US"),
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

  function formatArrival(dateStr) {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + 2);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

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

  return (
    <div className="fs-page">
      <div className="fs-noise" />
      <div className="fs-inner">
        <div className="fs-header">
          <span className="fs-eyebrow">✦ StepTravel</span>
          <h1 className="fs-title">
            Plan Your<br />
            <span className="fs-title-accent">Flight</span>
          </h1>
          <p className="fs-subtitle">Find your ticket at the best price</p>
        </div>
        <div className="fs-card">
          <div className="fs-route-row">
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

            <button className="fs-swap" onClick={swap} title="Swap">
              <span className="fs-swap-icon">⇌</span>
            </button>

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

        {error && (
          <div className="fs-error">
            <span className="fs-error-icon">⚠</span> {error}
          </div>
        )}

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
                {flights.list.map((f, i) => (
                  <button
                    key={f.id}
                    className="fs-flight"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() =>
                      setSelectedFlight({
                        flight: f,
                        fromLabel: flights.fromLabel,
                        toLabel: flights.toLabel,
                      })
                    }
                  >
                    <div className="fs-flight-top">
                      <div className="fs-airline">
                        <span className="fs-airline-dot" />
                        <span className="fs-airline-name">{f.airline}</span>
                        <span className="fs-plane-badge">{f.plane}</span>
                      </div>
                      <span className="fs-price">{Number(f.price).toFixed(2)} ₼</span>
                    </div>

                    <div className="fs-flight-mid">
                      <div className="fs-time-block">
                        <span className="fs-time">{formatTime(f.dueDate)}</span>
                        <span className="fs-city">{f.from}</span>
                      </div>
                      <div className="fs-route-line">
                        <span className="fs-duration">~2h</span>
                        <div className="fs-line">
                          <span className="fs-plane-icon">✈</span>
                        </div>
                        <span className="fs-direct">Direct</span>
                      </div>
                      <div className="fs-time-block fs-time-block--right">
                        <span className="fs-time">{formatArrival(f.dueDate)}</span>
                        <span className="fs-city">{f.to}</span>
                      </div>
                    </div>

                    <div className="fs-flight-bot">
                      <span className="fs-tag">
                        <span className="fs-tag-dot" />
                        {f.availableSeats} seats
                      </span>
                      <span className="fs-tag fs-tag--meal">🍽 {f.meal}</span>
                      <span className="fs-tag">🧳 {f.luggageKg} kg</span>
                      <span className="fs-tag fs-tag--gate">Gate {f.gate}</span>
                      <span className="fs-select-btn">Select →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}