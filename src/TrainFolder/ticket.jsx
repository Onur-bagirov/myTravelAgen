import { useState, useEffect, useRef } from "react";
import "./ticket.css";
import TrainBooking from "../BookTrainTicket/bookTrainT";

const API_BASE = "http://localhost:5251/api";
const getToken   = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const COUNTRY_FLAGS = {
  france:"🇫🇷", turkiye:"🇹🇷", turkey:"🇹🇷", azerbaijan:"🇦🇿",
  germany:"🇩🇪", england:"🇬🇧", "united kingdom":"🇬🇧", uae:"🇦🇪",
  russia:"🇷🇺", italy:"🇮🇹", spain:"🇪🇸", netherlands:"🇳🇱",
  usa:"🇺🇸", "united states":"🇺🇸", qatar:"🇶🇦", georgia:"🇬🇪",
  ukraine:"🇺🇦", poland:"🇵🇱", austria:"🇦🇹", switzerland:"🇨🇭",
  china:"🇨🇳", japan:"🇯🇵", kazakhstan:"🇰🇿", egypt:"🇪🇬", thailand:"🇹🇭",
};
function getFlag(country = "") {
  const key = Object.keys(COUNTRY_FLAGS).find((k) => country.toLowerCase().includes(k));
  return key ? COUNTRY_FLAGS[key] : "🌍";
}

function variantMeta(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("first"))    return { color: "#f59e0b" };
  if (n.includes("economy"))  return { color: "#22c55e" };
  return                             { color: "#ef4444" };
}
function cardAccent(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("first"))   return "ft-card--first";
  if (n.includes("economy")) return "ft-card--economy";
  return "ft-card--business";
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const iso = s.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const plain = s.match(/^(\d{2}):(\d{2})/);
  if (plain) return `${plain[1]}:${plain[2]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (hh !== "00" || mm !== "00") return `${hh}:${mm}`;
  }
  return null;
}

function formatArrival(dateStr, addHours = 3) {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--:--";
  d.setHours(d.getHours() + addHours);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
}

function LocationSelect({ locations, value, onChange, loading, label, dotClass }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref       = useRef(null);
  const searchRef = useRef(null);
  const selected  = locations.find((l) => String(l.id) === String(value));
  const filtered  = locations.filter((l) => {
    const q = search.toLowerCase();
    return l.name?.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q);
  });

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  if (loading) return (
    <div className="ls-wrap">
      <div className="fs-label"><span className={`fs-label-dot ${dotClass}`} />{label}</div>
      <div className="fs-skeleton" />
    </div>
  );

  return (
    <div className="ls-wrap" ref={ref}>
      <label className="fs-label"><span className={`fs-label-dot ${dotClass}`} />{label}</label>
      <button type="button" className={`ls-trigger${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)}>
        <div className="ls-trigger-left">
          <div className="ls-flag">{selected ? getFlag(selected.country) : "🚄"}</div>
          <div className="ls-text">
            <span className="ls-country">{selected?.country ?? "Select"}</span>
            <span className="ls-city">{selected?.name ?? "—"}</span>
          </div>
        </div>
        <span className={`ls-chevron${open ? " open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="ls-dropdown">
          <div className="ls-search-wrap">
            <span className="ls-search-icon">🔍</span>
            <input ref={searchRef} className="ls-search-input" type="text"
              placeholder="Search locations..." value={search}
              onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
            {search && <button className="ls-search-clear" onClick={() => setSearch("")}>✕</button>}
          </div>
          <div className="ls-options-list">
            {filtered.length === 0
              ? <div className="ls-no-results">No locations found</div>
              : filtered.map((l) => {
                  const isSel = String(l.id) === String(value);
                  return (
                    <div key={l.id} className={`ls-option${isSel ? " selected" : ""}`}
                      onClick={() => { onChange(String(l.id)); setOpen(false); setSearch(""); }}>
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
        </div>
      )}
    </div>
  );
}

function Barcode({ seed = 0 }) {
  const h = [14,20,10,28,16,22,12,26,18,14,24,10,20,16,28,12,22,18,10,26];
  return (
    <div className="ft-barcode">
      {h.map((v, i) => (
        <div key={i} className="ft-barcode-bar" style={{ height: `${((v + seed) % 24) + 6}px` }} />
      ))}
    </div>
  );
}

function TrainCard({ t, fromLabel, toLabel, onSelect, index }) {
  const [variants, setVariants]        = useState([]);
  const [variantsLoading, setVLoading] = useState(true);
  const [selectedVariant, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setVLoading(true);
      try {
        const res  = await fetch(
          `${API_BASE}/Seat/by-ticket?TicketId=${t.id}&TicketType=train`,
          { headers: getHeaders() }
        );
        if (!res.ok) throw new Error();
        const data  = await res.json();
        const seats = Array.isArray(data?.data) ? data.data : [];

        const map = new Map();
        for (const s of seats) {
          if (!map.has(s.variantId)) {
            map.set(s.variantId, { id: s.variantId, name: s.variantName, price: s.variantPrice ?? 0 });
          }
        }
        const list = [...map.values()];
        setVariants(list);
        setSelected(list[0] ?? null);
      } catch (_) {
        setVariants([]);
      } finally {
        setVLoading(false);
      }
    })();
  }, [t.id]);

  const accentClass  = cardAccent(selectedVariant?.name);
  const basePrice    = Number(t.price);
  const totalPrice   = selectedVariant
    ? Math.round(basePrice + Number(selectedVariant.price))
    : Math.round(basePrice);

  const departTime  = formatTime(t.dueDate);
  const arrivalTime = formatTime(t.endDate ?? t.arrivalDate ?? null) ?? formatArrival(t.dueDate);

  return (
    <div className={`ft-card ${accentClass}`} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="ft-card-body">
        <div className="ft-top">
          <div className="ft-airline-block">
            <div className="ft-airline-logo">
              <span className="ft-airline-initial">{(t.trainCompany || "T")[0].toUpperCase()}</span>
            </div>
            <div className="ft-airline-info">
              <span className="ft-airline-name">{t.trainCompany}</span>
              <span className="ft-plane-model">{t.trainNumber}</span>
            </div>
          </div>
          <div className="ft-flight-meta">
            <span className="ft-flight-date">{formatDate(t.dueDate)}</span>
            <span className="ft-flight-num">Wagon {t.vagonNumber ?? "—"}</span>
          </div>
        </div>

        <div className="ft-route">
          <div className="ft-time-block">
            <span className="ft-time">{departTime ?? "--:--"}</span>
            <span className="ft-city">{t.from || fromLabel}</span>
          </div>

          <div className="ft-route-center">
            <span className="ft-duration">Direct</span>
            <div className="ft-line">
              <span className="ft-line-dot" />
              <span className="ft-line-bar" />
              <span className="ft-plane-fly">🚄</span>
              <span className="ft-line-bar" />
              <span className="ft-line-dot" />
            </div>
          </div>

          <div className="ft-time-block ft-time-block--right">
            <span className="ft-time">{arrivalTime ?? "--:--"}</span>
            <span className="ft-city ft-city--arrival">{t.to || toLabel}</span>
          </div>
        </div>

        <div className="ft-divider" />

        <div className="ft-variants-section">
          <span className="ft-variants-label">Select Class</span>
          {variantsLoading ? (
            <div className="ft-variants-skeleton" />
          ) : variants.length === 0 ? (
            <span className="ft-variants-empty">No classes available</span>
          ) : (
            <div className="ft-variants-row">
              {variants.map((v) => {
                const meta    = variantMeta(v.name);
                const isActive = selectedVariant?.id === v.id;
                const vPrice  = Math.round(basePrice + Number(v.price));
                return (
                  <button key={v.id} type="button"
                    className={`vbtn${isActive ? " active" : ""}`}
                    style={{ "--vcolor": meta.color }}
                    onClick={(e) => { e.stopPropagation(); setSelected(v); }}>
                    <span className="vbtn-dot" style={{ background: meta.color }} />
                    <span className="vbtn-name">{v.name}</span>
                    <span className="vbtn-price">{vPrice} ₼</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ft-divider" />

        <div className="ft-bottom">
          <div className="ft-tags">
            <span className="ft-tag"><span className="ft-tag-dot green" />{t.availableSeats} seats</span>
            {t.luggageKg != null && <span className="ft-tag">🧳 {t.luggageKg} kg</span>}
            <span className="ft-tag">🚂 {t.trainNumber}</span>
            <span className="ft-tag">Wagon {t.vagonNumber ?? "—"}</span>
          </div>
          <div className="ft-price-block">
            <span className="ft-price-label">from</span>
            <span className="ft-price">{totalPrice} <span className="ft-price-currency">₼</span></span>
            <button className="ft-book-btn"
              onClick={() => onSelect({ train: t, variant: selectedVariant, fromLabel, toLabel })}>
              Book →
            </button>
          </div>
        </div>
      </div>

      <div className="ft-card-side">
        <div className="ft-side-row">
          <span className="ft-side-label">Train</span>
          <span className="ft-side-value">{t.trainNumber}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">Date</span>
          <span className="ft-side-value">{formatDate(t.dueDate)}</span>
        </div>
        <div className="ft-side-row">
          <span className="ft-side-label">Wagon</span>
          <span className="ft-side-value">{t.vagonNumber ?? "—"}</span>
        </div>
        {departTime && (
          <div className="ft-side-row">
            <span className="ft-side-label">Dep.</span>
            <span className="ft-side-value">{departTime}</span>
          </div>
        )}
        {arrivalTime && (
          <div className="ft-side-row">
            <span className="ft-side-label">Arr.</span>
            <span className="ft-side-value">{arrivalTime}</span>
          </div>
        )}
        <Barcode seed={t.id || index} />
      </div>
    </div>
  );
}

export default function TrainTicket() {
  const [locations, setLocations]   = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [fromId, setFromId]         = useState("");
  const [toId, setToId]             = useState("");
  const [date, setDate]             = useState("");
  const [searching, setSearching]   = useState(false);
  const [trains, setTrains]         = useState(null);
  const [error, setError]           = useState("");
  const [selectedTrain, setSelectedTrain] = useState(null);
  const autoSearchKey = useRef(null);

  useEffect(() => {
    (async () => {
      setLocLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/Location?Page=1&Limit=100`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Locations could not be loaded.");
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setLocations(list);
        if (list.length > 0) setFromId(String(list[0].id));
        if (list.length > 1) setToId(String(list[1].id));
      } catch (e) { setError(e.message); }
      finally     { setLocLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (locLoading || !fromId || !toId || fromId === toId) return;
    const key = `${fromId}-${toId}-${date}`;
    if (autoSearchKey.current === key) return;
    autoSearchKey.current = key;
    search(fromId, toId, date);
  }, [fromId, toId, locLoading]);

  async function search(overrideFrom, overrideTo, overrideDate) {
    const fId = overrideFrom ?? fromId;
    const tId = overrideTo   ?? toId;
    const d   = overrideDate ?? date;
    if (!fId || !tId) { setError("Please select both locations."); return; }
    if (fId === tId)  { setError("Departure and arrival cannot be the same."); return; }
    setSearching(true); setTrains(null); setError("");
    try {
      const params = new URLSearchParams({ PageNumber:1, PageSize:50, FromLocationId:fId, ToLocationId:tId });
      if (d) params.append("Date", d);
      const res = await fetch(`${API_BASE}/TrainTicket?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("No trains found or server error.");
      const result = await res.json();
      setTrains({
        list:      result.data || [],
        fromLabel: locations.find((l) => String(l.id) === fId)?.name,
        toLabel:   locations.find((l) => String(l.id) === tId)?.name,
      });
    } catch (e) { setError(e.message); }
    finally     { setSearching(false); }
  }

  function swap() { setFromId(toId); setToId(fromId); setTrains(null); }

  if (selectedTrain) {
    return (
      <TrainBooking
        train={selectedTrain.train}
        variant={selectedTrain.variant}
        fromLabel={selectedTrain.fromLabel}
        toLabel={selectedTrain.toLabel}
        onBack={() => setSelectedTrain(null)}
        onSuccess={() => setTimeout(() => setSelectedTrain(null), 3000)}
      />
    );
  }

  return (
    <div className="fs-page">
      <div className="fs-inner">

        <div className="fs-header">
          <span className="fs-eyebrow">✦ StepTravel</span>
          <h1 className="fs-title">Plan Your <span className="fs-title-accent">Train</span></h1>
          <p className="fs-subtitle">Find your ticket at the best price</p>
        </div>

        <div className="fs-card">
          <div className="fs-route-row">
            <LocationSelect locations={locations} value={fromId}
              onChange={(v) => { setFromId(v); setTrains(null); }}
              loading={locLoading} label="From" dotClass="from-dot" />
            <button className="fs-swap" onClick={swap} title="Swap">
              <span className="fs-swap-icon">⇌</span>
            </button>
            <LocationSelect locations={locations} value={toId}
              onChange={(v) => { setToId(v); setTrains(null); }}
              loading={locLoading} label="To" dotClass="to-dot" />
          </div>

          <div className="fs-date-row">
            <label className="fs-label">
              <span className="fs-label-icon">◈</span> Train Date
              <span style={{ opacity:0.45, fontSize:"11px" }}>(optional)</span>
            </label>
            <input className="fs-date" type="date" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>

          <button className={`fs-btn${searching ? " fs-btn--loading" : ""}`}
            onClick={() => { autoSearchKey.current = null; search(); }} disabled={searching}>
            {searching
              ? <><span className="fs-spinner" />Searching...</>
              : <><span className="fs-btn-icon">🚄</span>Search Tickets</>}
          </button>
        </div>

        {error && <div className="fs-error"><span className="fs-error-icon">⚠</span> {error}</div>}

        {trains && (
          <div className="fs-results">
            <div className="fs-results-header">
              <div className="fs-results-route">
                <span className="fs-results-from">{trains.fromLabel}</span>
                <span className="fs-results-arrow">→</span>
                <span className="fs-results-to">{trains.toLabel}</span>
              </div>
              <span className="fs-results-count">{trains.list.length} trains</span>
            </div>

            {trains.list.length === 0
              ? <div className="fs-empty"><span className="fs-empty-icon">🚄</span><p>No trains found.</p></div>
              : <div className="fs-flight-list">
                  {trains.list.map((t, i) => (
                    <TrainCard key={t.id} t={t} index={i}
                      fromLabel={trains.fromLabel}
                      toLabel={trains.toLabel}
                      onSelect={setSelectedTrain} />
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}