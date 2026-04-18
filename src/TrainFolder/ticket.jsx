import { useState, useEffect, useRef } from "react";
import "./ticket.css";
import TrainBooking from "../BookTrainTicket/bookTrainT";

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

function LocationSelect({ locations, value, onChange, loading, label, dotClass }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);
  const selected = locations.find((l) => String(l.id) === String(value));

  const filtered = locations.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.country?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

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
          <div className="ls-flag">{selected ? getFlag(selected.country) : "🚄"}</div>
          <div className="ls-text">
            <span className="ls-country">{selected?.country ?? "Seç"}</span>
            <span className="ls-city">{selected?.name ?? "—"}</span>
          </div>
        </div>
        <span className={`ls-chevron${open ? " open" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="ls-dropdown">
          <div className="ls-search-wrap">
            <span className="ls-search-icon">🔍</span>
            <input
              ref={searchRef}
              className="ls-search-input"
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button className="ls-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div className="ls-options-list">
            {filtered.length === 0 ? (
              <div className="ls-no-results">No locations found</div>
            ) : (
              filtered.map((l) => {
                const isSel = String(l.id) === String(value);
                return (
                  <div
                    key={l.id}
                    className={`ls-option${isSel ? " selected" : ""}`}
                    onClick={() => { onChange(String(l.id)); setOpen(false); setSearch(""); }}
                  >
                    <div className="ls-option-flag">{getFlag(l.country)}</div>
                    <div className="ls-option-text">
                      <span className="ls-option-country">{l.country}</span>
                      <span className="ls-option-city">{l.name}</span>
                    </div>
                    <span className="ls-selected-dot" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function TrainTicket() {
  const [locations, setLocations]   = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [fromId, setFromId]         = useState("");
  const [toId, setToId]             = useState("");
  const [date, setDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [searching, setSearching]   = useState(false);
  const [trains, setTrains]         = useState(null);
  const [error, setError]           = useState("");
  const [bookingTrain, setBookingTrain] = useState(null);

  const autoSearchKey = useRef(null);

  useEffect(() => {
    (async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${API_BASE}/Location?Page=1&Limit=100`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Lokasiyalar yüklənmədi.");
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
    })();
  }, []);

  useEffect(() => {
    if (locLoading) return;
    if (!fromId || !toId || fromId === toId) return;
    const key = `${fromId}-${toId}-${date}`;
    if (autoSearchKey.current === key) return;
    autoSearchKey.current = key;
    search(fromId, toId, date);
  }, [fromId, toId, locLoading]);

  const fromLoc = locations.find((l) => String(l.id) === String(fromId));
  const toLoc   = locations.find((l) => String(l.id) === String(toId));

  async function search(overrideFrom, overrideTo, overrideDate) {
    const fId = overrideFrom ?? fromId;
    const tId = overrideTo   ?? toId;
    const d   = overrideDate ?? date;

    if (!fId || !tId) { setError("Zəhmət olmasa hər iki lokasiyanı seçin."); return; }
    if (fId === tId)  { setError("Çıxış və gəliş lokasiyaları eyni ola bilməz."); return; }

    setSearching(true); setTrains(null); setError("");
    try {
      const params = new URLSearchParams({ PageNumber: 1, PageSize: 20, Date: d, FromLocationId: fId, ToLocationId: tId });
      const res = await fetch(`${API_BASE}/TrainTicket?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Qatar tapılmadı və ya server xətası.");
      const result = await res.json();
      const now = new Date();

      const fromLabel = locations.find((l) => String(l.id) === fId)?.name;
      const toLabel   = locations.find((l) => String(l.id) === tId)?.name;

      setTrains({
        list:      (result.data || []).filter((t) => new Date(t.dueDate) >= now),
        fromLabel,
        toLabel,
        dateStr:   new Date(d).toLocaleDateString("az-AZ"),
      });
    } catch (e) {
      setError("Qatarlar gətirilərkən problem yarandı: " + e.message);
    } finally {
      setSearching(false);
    }
  }

  function swap() { setFromId(toId); setToId(fromId); setTrains(null); }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  function formatArrival(dateStr, hours = 3) {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + hours);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }
  function getCardModifier(t) {
    if (!t) return "ft-card--business";
    const n = (t.trainCompany || "").toLowerCase();
    if (n.includes("express") || n.includes("first")) return "ft-card--first";
    if (n.includes("economy") || n.includes("local")) return "ft-card--economy";
    return "ft-card--business";
  }

  if (bookingTrain) {
    return (
      <TrainBooking
        train={bookingTrain}
        fromLabel={fromLoc?.name || ""}
        toLabel={toLoc?.name || ""}
        onBack={() => setBookingTrain(null)}
        onSuccess={() => setBookingTrain(null)}
      />
    );
  }

  return (
    <div className="fs-page">
      <div className="fs-inner">
        <div className="fs-header">
          <span className="fs-eyebrow">✦ StepTravel</span>
          <h1 className="fs-title">Plan Your <span className="fs-title-accent">Train</span></h1>
          <p className="fs-subtitle">Rahatlıqla yol planlaşdırın</p>
        </div>
        <div className="fs-card">
          <div className="fs-route-row">
            <LocationSelect
              locations={locations}
              value={fromId}
              onChange={setFromId}
              loading={locLoading}
              label="Haradan"
              dotClass="from-dot"
            />
            <button className="fs-swap" onClick={swap} title="Dəyişdir">
              <span className="fs-swap-icon">⇌</span>
            </button>
            <LocationSelect
              locations={locations}
              value={toId}
              onChange={setToId}
              loading={locLoading}
              label="Haraya"
              dotClass="to-dot"
            />
          </div>

          <div className="fs-date-row">
            <label className="fs-label">
              <span className="fs-label-icon">◈</span> Tarix
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
            onClick={() => {
              autoSearchKey.current = null;
              search();
            }}
            disabled={searching}
          >
            {searching ? (
              <><span className="fs-spinner" />Axtarılır...</>
            ) : (
              <><span className="fs-btn-icon">🚄</span>Search Tickets</>
            )}
          </button>
        </div>
        {error && (
          <div className="fs-error">
            <span className="fs-error-icon">⚠</span> {error}
          </div>
        )}
        {trains && (
          <div className="fs-results">
            <div className="fs-results-header">
              <div className="fs-results-route">
                <span className="fs-results-from">{trains.fromLabel}</span>
                <span className="fs-results-arrow">→</span>
                <span className="fs-results-to">{trains.toLabel}</span>
              </div>
              <span className="fs-results-count">{trains.list.length} qatar</span>
            </div>

            {trains.list.length === 0 ? (
              <div className="fs-empty">
                <span className="fs-empty-icon">🚄</span>
                <p>Bu tarixə qatar tapılmadı.</p>
              </div>
            ) : (
              <div className="fs-flight-list">
                {trains.list.map((t, i) => {
                  const cardModifier = getCardModifier(t);
                  const totalPrice   = Math.round(Number(t.price));

                  return (
                    <button
                      key={t.id}
                      className={`ft-card ${cardModifier}`}
                      style={{ animationDelay: `${i * 0.07}s` }}
                      onClick={() => setBookingTrain(t)}
                    >
                      <div className="ft-card-body">
                        <div className="ft-top">
                          <div className="ft-airline-block">
                            <div className="ft-airline-logo">
                              <span className="ft-airline-initial">{(t.trainCompany || "T")[0]}</span>
                            </div>
                            <div className="ft-airline-info">
                              <span className="ft-airline-name">{t.trainCompany}</span>
                              <span className="ft-plane-model">{t.trainNumber}</span>
                            </div>
                          </div>
                          <div className="ft-flight-meta">
                            <span className="ft-flight-date">{formatDate(t.dueDate)}</span>
                            <span className="ft-flight-num">Vaqon {t.vagonNumber}</span>
                          </div>
                        </div>

                        <div className="ft-route">
                          <div className="ft-time-block">
                            <span className="ft-time">{formatTime(t.dueDate)}</span>
                            <span className="ft-city">{t.from || trains.fromLabel}</span>
                          </div>
                          <div className="ft-route-center">
                            <span className="ft-duration">Birbaşa</span>
                            <div className="ft-line">
                              <span className="ft-line-dot" />
                              <span className="ft-line-bar" />
                              <span className="ft-plane-fly">🚄</span>
                              <span className="ft-line-bar" />
                              <span className="ft-line-dot" />
                            </div>
                          </div>
                          <div className="ft-time-block ft-time-block--right">
                            <span className="ft-time">{formatArrival(t.dueDate)}</span>
                            <span className="ft-city">{t.to || trains.toLabel}</span>
                          </div>
                        </div>

                        <div className="ft-divider" />

                        <div className="ft-bottom">
                          <div className="ft-bottom-left">
                            <div className="ft-tags">
                              <span className="ft-tag"><span className="ft-tag-dot green" />{t.availableSeats} boş yer</span>
                              <span className="ft-tag">🚂 {t.trainNumber}</span>
                              <span className="ft-tag">Vaqon {t.vagonNumber}</span>
                            </div>
                          </div>
                          <div className="ft-price-block">
                            <span className="ft-price-label">başlayan</span>
                            <span className="ft-price">{totalPrice} <span className="ft-price-currency">₼</span></span>
                            <span className="ft-select-arrow">→</span>
                          </div>
                        </div>
                      </div>

                      <div className="ft-card-side">
                        <div className="ft-variant-pill">Train</div>
                        <div className="ft-side-row">
                          <span className="ft-side-label">Qatar</span>
                          <span className="ft-side-value">{t.trainNumber}</span>
                        </div>
                        <div className="ft-side-row">
                          <span className="ft-side-label">Tarix</span>
                          <span className="ft-side-value">{formatDate(t.dueDate)}</span>
                        </div>
                        <div className="ft-side-row">
                          <span className="ft-side-label">Vaqon</span>
                          <span className="ft-side-value">{t.vagonNumber}</span>
                        </div>
                        <Barcode seed={t.id || i} />
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