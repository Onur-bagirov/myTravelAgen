import { useState, useEffect, useRef } from "react";
import "./ticket.css";
import FlightBooking from "../BookTicket/bookT";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const COUNTRY_FLAGS = {
  france: "🇫🇷", turkiye: "🇹🇷", turkey: "🇹🇷", azerbaijan: "🇦🇿",
  germany: "🇩🇪", england: "🇬🇧", "united kingdom": "🇬🇧", uae: "🇦🇪",
  russia: "🇷🇺", italy: "🇮🇹", spain: "🇪🇸", netherlands: "🇳🇱",
  usa: "🇺🇸", "united states": "🇺🇸", qatar: "🇶🇦", georgia: "🇬🇪",
  ukraine: "🇺🇦", poland: "🇵🇱", austria: "🇦🇹", switzerland: "🇨🇭",
  china: "🇨🇳", japan: "🇯🇵", kazakhstan: "🇰🇿", egypt: "🇪🇬", thailand: "🇹🇭",
};

function getFlag(country = "") {
  const key = Object.keys(COUNTRY_FLAGS).find((k) =>
    country.toLowerCase().includes(k)
  );
  return key ? COUNTRY_FLAGS[key] : "🌍";
}

/* ── Custom location dropdown ── */
function LocationSelect({ locations, value, onChange, loading, label, dotClass }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = locations.find((l) => String(l.id) === String(value));

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="ls-wrap">
        <div className="fs-label">
          <span className={`fs-label-dot ${dotClass}`} />
          {label}
        </div>
        <div className="fs-skeleton" />
      </div>
    );
  }

  return (
    <div className="ls-wrap" ref={ref}>
      <label className="fs-label">
        <span className={`fs-label-dot ${dotClass}`} />
        {label}
      </label>

      <button
        type="button"
        className={`ls-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="ls-trigger-left">
          <div className="ls-flag">{selected ? getFlag(selected.country) : "✈"}</div>
          <div className="ls-text">
            <span className="ls-country">{selected?.country ?? "Select"}</span>
            <span className="ls-city">{selected?.name ?? "—"}</span>
          </div>
        </div>
        <span className={`ls-chevron${open ? " open" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="ls-dropdown">
          {locations.map((l) => {
            const isSel = String(l.id) === String(value);
            return (
              <div
                key={l.id}
                className={`ls-option${isSel ? " selected" : ""}`}
                onClick={() => { onChange(String(l.id)); setOpen(false); }}
              >
                <div className="ls-option-flag">{getFlag(l.country)}</div>
                <div className="ls-option-text">
                  <span className="ls-option-country">{l.country}</span>
                  <span className="ls-option-city">{l.name}</span>
                </div>
                <span className="ls-selected-dot" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Barcode decoration ── */
function Barcode({ seed = 0 }) {
  const heights = [14,20,10,28,16,22,12,26,18,14,24,10,20,16,28,12,22,18,10,26];
  return (
    <div className="ft-barcode">
      {heights.map((h, i) => (
        <div key={i} className="ft-barcode-bar" style={{ height: `${((h + seed) % 24) + 6}px` }} />
      ))}
    </div>
  );
}

export default function PlanetTicket() {
  const [locations, setLocations]       = useState([]);
  const [locLoading, setLocLoading]     = useState(true);
  const [variants, setVariants]         = useState([]);
  const [fromId, setFromId]             = useState("");
  const [toId, setToId]                 = useState("");
  // FIX: date optional - boş başlasın ki istifadəçi seçsin
  const [date, setDate]                 = useState("");
  const [searching, setSearching]       = useState(false);
  const [flights, setFlights]           = useState(null);
  const [error, setError]               = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${API_BASE}/Location?Page=1&Limit=100`, { headers: getHeaders() });
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
        const res = await fetch(`${API_BASE}/Variant?Page=1&Limit=100`, { headers: getHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setVariants(list);
      } catch (_) {}
    };

    fetchLocations();
    fetchVariants();
  }, []);

  const fromLoc = locations.find((l) => String(l.id) === fromId);
  const toLoc   = locations.find((l) => String(l.id) === toId);

  async function search() {
    if (!fromId || !toId) { setError("Please select both locations."); return; }
    if (fromId === toId)  { setError("Departure and arrival locations cannot be the same."); return; }
    setSearching(true); setFlights(null); setError("");
    try {
      // FIX: date yalnız seçilibsə əlavə et
      const params = new URLSearchParams({
        PageNumber: 1,
        PageSize: 50,
        FromLocationId: fromId,
        ToLocationId: toId,
      });
      if (date) params.append("Date", date);

      const res = await fetch(`${API_BASE}/PlaneTicket?${params.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("No flights found or server error.");
      const result = await res.json();

      // FIX: expired filter yumşaldıldı — yalnız keçmişdə olan biletləri çıxart (deyil, hamısını göstər)
      const list = result.data || [];

      setFlights({
        list,
        fromLabel: fromLoc?.name,
        toLabel:   toLoc?.name,
        dateStr:   date ? new Date(date).toLocaleDateString("en-US") : "All dates",
      });
    } catch (e) {
      setError("An error occurred while fetching flights: " + e.message);
    } finally {
      setSearching(false);
    }
  }

  function swap() { setFromId(toId); setToId(fromId); setFlights(null); }

  function formatTime(dateStr) {
    if (!dateStr) return "--:--";
    const s = String(dateStr);
    const match = s.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    const d = new Date(s);
    if (isNaN(d.getTime())) return "--:--";
    return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
  }
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
  }
  function getFlightVariant(flight) {
    if (!variants.length) return null;
    return (flight.variantId ? variants.find((v) => v.id === flight.variantId) : null) || variants[0];
  }
  function getCardModifier(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("first"))   return "ft-card--first";
    if (n.includes("economy")) return "ft-card--economy";
    return "ft-card--business";
  }

  if (selectedFlight) {
    return (
      <FlightBooking
        flight={selectedFlight.flight}
        fromLabel={selectedFlight.fromLabel}
        toLabel={selectedFlight.toLabel}
        onBack={() => setSelectedFlight(null)}
        onSuccess={() => setTimeout(() => setSelectedFlight(null), 3000)}
      />
    );
  }

  return (
    <div className="fs-page">
      <div className="fs-inner">

        {/* HEADER */}
        <div className="fs-header">
          <span className="fs-eyebrow">✦ StepTravel</span>
          <h1 className="fs-title">Plan Your <span className="fs-title-accent">Flight</span></h1>
          <p className="fs-subtitle">Find your ticket at the best price</p>
        </div>

        {/* SEARCH CARD */}
        <div className="fs-card">
          <div className="fs-route-row">

            {/* FROM */}
            <LocationSelect
              locations={locations}
              value={fromId}
              onChange={setFromId}
              loading={locLoading}
              label="From"
              dotClass="from-dot"
            />

            {/* SWAP */}
            <button className="fs-swap" onClick={swap} title="Swap">
              <span className="fs-swap-icon">⇌</span>
            </button>

            {/* TO */}
            <LocationSelect
              locations={locations}
              value={toId}
              onChange={setToId}
              loading={locLoading}
              label="To"
              dotClass="to-dot"
            />
          </div>

          {/* DATE — optional */}
          <div className="fs-date-row">
            <label className="fs-label">
              <span className="fs-label-icon">◈</span> Flight Date <span style={{ opacity: 0.45, fontSize: "11px" }}>(optional)</span>
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
              <><span className="fs-spinner" />Searching...</>
            ) : (
              <><span className="fs-btn-icon">✈</span>Search Tickets</>
            )}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="fs-error">
            <span className="fs-error-icon">⚠</span> {error}
          </div>
        )}

        {/* RESULTS */}
        {flights && (
          <div className="fs-results">
            <div className="fs-results-header">
              <div className="fs-results-route">
                <span className="fs-results-from">{flights.fromLabel}</span>
                <span className="fs-results-arrow">→</span>
                <span className="fs-results-to">{flights.toLabel}</span>
              </div>
              <span className="fs-results-count">{flights.list.length} flights</span>
            </div>

            {flights.list.length === 0 ? (
              <div className="fs-empty">
                <span className="fs-empty-icon">✈</span>
                <p>No flights found for this route{date ? " on this date" : ""}.</p>
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
                      onClick={() => setSelectedFlight({ flight: f, fromLabel: flights.fromLabel, toLabel: flights.toLabel })}
                    >
                      <div className="ft-card-body">
                        <div className="ft-top">
                          <div className="ft-airline-block">
                            <div className="ft-airline-logo">
                              <span className="ft-airline-initial">{(f.airline || "A")[0]}</span>
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

                        <div className="ft-route">
                          <div className="ft-time-block">
                            <span className="ft-time">{formatTime(f.dueDate)}</span>
                            <span className="ft-city">{f.from || flights.fromLabel}</span>
                          </div>
                          <div className="ft-route-center">
                            <span className="ft-duration">Direct</span>
                            <div className="ft-line">
                              <span className="ft-line-dot" />
                              <span className="ft-line-bar" />
                              <span className="ft-plane-fly">✈</span>
                              <span className="ft-line-bar" />
                              <span className="ft-line-dot" />
                            </div>
                          </div>
                          <div className="ft-time-block ft-time-block--right">
                            {/* FIX: endDate varsa göstər, yoxsa tire */}
                            <span className="ft-time">
                              {f.endDate ? formatTime(f.endDate) : "--:--"}
                            </span>
                            <span className="ft-city">{f.to || flights.toLabel}</span>
                          </div>
                        </div>

                        <div className="ft-divider" />

                        <div className="ft-bottom">
                          <div className="ft-bottom-left">
                            <div className="ft-tags">
                              <span className="ft-tag"><span className="ft-tag-dot green" />{f.availableSeats} seats</span>
                              <span className="ft-tag">🧳 {f.luggageKg} kg</span>
                              <span className="ft-tag">🍽 {f.meal}</span>
                              <span className="ft-tag">Gate {f.gate}</span>
                            </div>
                          </div>
                          <div className="ft-price-block">
                            <span className="ft-price-label">from</span>
                            <span className="ft-price">{totalPrice} <span className="ft-price-currency">₼</span></span>
                            <span className="ft-select-arrow">→</span>
                          </div>
                        </div>
                      </div>

                      <div className="ft-card-side">
                        {variant && (
                          <div className="ft-variant-pill">
                            {variant.name}
                            {isPromo && <span className="ft-promo-badge">promo</span>}
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