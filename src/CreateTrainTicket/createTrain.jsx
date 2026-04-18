import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./createTrain.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function toLocalISOString(str) {
  if (!str) return "";
  return str.length === 16 ? str + ":00" : str;
}

const countryColors = {
  FR: { bg: "#1a3a6b", text: "#4a9eff" },
  TR: { bg: "#6b1a1a", text: "#ff6b6b" },
  AZ: { bg: "#1a3a1a", text: "#4aff6b" },
  DE: { bg: "#3a3a1a", text: "#ffd700" },
  GB: { bg: "#1a2a5a", text: "#6699ff" },
  US: { bg: "#1a2a4a", text: "#66aaff" },
  RU: { bg: "#2a1a3a", text: "#cc88ff" },
  IT: { bg: "#1a3a2a", text: "#55cc88" },
  ES: { bg: "#3a2a1a", text: "#ffaa44" },
  DEFAULT: { bg: "#2a2a3a", text: "#9090c0" },
};

function getCountryCode(location) {
  if (!location) return "??";
  if (location.countryCode) return location.countryCode.toUpperCase();
  const country = (location.country || "").toUpperCase();
  const map = {
    FRANSA: "FR", FRANCE: "FR",
    TURKIYE: "TR", TURKEY: "TR", "TÜRKİYE": "TR",
    AZERBAIJAN: "AZ", AZERBAYCAN: "AZ",
    GERMANY: "DE", DEUTSCHLAND: "DE",
    "UNITED KINGDOM": "GB", UK: "GB",
    "UNITED STATES": "US", USA: "US",
    RUSSIA: "RU",
    ITALY: "IT", ITALIA: "IT",
    SPAIN: "ES", ESPANA: "ES",
  };
  return map[country] || country.slice(0, 2) || "??";
}

function LocationAvatar({ location }) {
  const code = getCountryCode(location);
  const colors = countryColors[code] || countryColors.DEFAULT;
  return (
    <div
      className="loc-avatar"
      style={{ background: colors.bg, color: colors.text, border: `1.5px solid ${colors.text}30` }}
    >
      {code.slice(0, 2)}
    </div>
  );
}

function LocationDropdown({ locations, value, onChange, loading, label, name }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const searchRef  = useRef(null);

  const selected = locations.find(l => String(l.id) === String(value));

  const filtered = search.trim()
    ? locations.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        (l.country || "").toLowerCase().includes(search.toLowerCase())
      )
    : locations;

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  };

  const openPanel = () => {
    calcPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => calcPosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        !e.target.closest(".loc-portal-panel")
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (loc) => {
    onChange({ target: { name, value: String(loc.id) } });
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="ct-field">
      <label>{label}</label>

      <div
        ref={triggerRef}
        className={`loc-trigger${open ? " loc-trigger--open" : ""}`}
        onClick={() => { if (!loading) open ? setOpen(false) : openPanel(); }}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? setOpen(false) : openPanel();
          }
          if (e.key === "Escape") { setOpen(false); setSearch(""); }
        }}
        role="combobox"
        aria-expanded={open}
      >
        {selected ? (
          <div className="loc-trigger-selected">
            <LocationAvatar location={selected} />
            <div className="loc-trigger-text">
              <span className="loc-trigger-country">{(selected.country || "").toUpperCase()}</span>
              <span className="loc-trigger-city">{selected.name}</span>
            </div>
          </div>
        ) : (
          <span className="loc-trigger-placeholder">
            {loading ? "Loading..." : "Select city..."}
          </span>
        )}
        <svg
          className={`loc-chevron${open ? " loc-chevron--up" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && createPortal(
        <div className="loc-portal-panel" style={panelStyle}>
          <div className="loc-search-wrap">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
              style={{ flexShrink: 0, color: "rgba(255,255,255,0.3)" }}>
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              className="loc-search"
              placeholder="Search locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
          <div className="loc-list">
            {filtered.length === 0 && (
              <div className="loc-empty">No locations found</div>
            )}
            {filtered.map(loc => {
              const isSelected = String(loc.id) === String(value);
              return (
                <div
                  key={loc.id}
                  className={`loc-item${isSelected ? " loc-item--selected" : ""}`}
                  onClick={() => handleSelect(loc)}
                >
                  <LocationAvatar location={loc} />
                  <div className="loc-item-text">
                    <span className="loc-item-country">{(loc.country || "").toUpperCase()}</span>
                    <span className="loc-item-city">{loc.name}</span>
                  </div>
                  {isSelected && (
                    <svg className="loc-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#ff6060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CreateTrainTicket({ onCreated }) {
  const [locations, setLocations]   = useState([]);
  const [variants, setVariants]     = useState([]);
  const [locLoading, setLocLoading] = useState(false);

  const [form, setForm] = useState({
    trainCompany: "",
    trainNumber: "",
    vagonNumber: 1,
    dueDate: "",
    fromId: "",
    toId: "",
  });

  const [seatGroups, setSeatGroups] = useState([
    { variantId: "", rowCount: 5, seatsPerRow: 4 },
  ]);

  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg]   = useState(null);

  useEffect(() => {
    setLocLoading(true);
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLocLoading(false));

    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setVariants(list);
        if (list.length > 0)
          setSeatGroups([{ variantId: String(list[0].id), rowCount: 5, seatsPerRow: 4 }]);
      })
      .catch(() => {});
  }, []);

  const handleForm = e => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === "number" ? Number(value) : value }));
  };

  const handleGroup = (idx, field, val) =>
    setSeatGroups(prev =>
      prev.map((g, i) =>
        i === idx ? { ...g, [field]: field === "variantId" ? val : Number(val) } : g
      )
    );

  const addGroup = () =>
    setSeatGroups(p => [
      ...p,
      { variantId: variants[0] ? String(variants[0].id) : "", rowCount: 5, seatsPerRow: 4 },
    ]);

  const removeGroup = idx => setSeatGroups(p => p.filter((_, i) => i !== idx));

  const totalSeats = seatGroups.reduce(
    (s, g) => s + Number(g.rowCount) * Number(g.seatsPerRow), 0
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    if (!form.trainCompany.trim() || !form.fromId || !form.toId || !form.dueDate) {
      setServerError("Please fill in all required fields.");
      return;
    }
    if (form.fromId === form.toId) {
      setServerError("Departure and arrival locations cannot be the same.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        trainCompany: form.trainCompany,
        trainNumber: form.trainNumber,
        vagonNumber: Number(form.vagonNumber),
        dueDate: toLocalISOString(form.dueDate),
        fromId: Number(form.fromId),
        toId: Number(form.toId),
        seatGroups: seatGroups.map(g => ({
          variantId: Number(g.variantId),
          rowCount: Number(g.rowCount),
          seatsPerRow: Number(g.seatsPerRow),
        })),
      };

      const res = await fetch(`${BASE_URL}/TrainTicket`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Server error occurred.");

      setSuccessMsg(`Ticket created successfully! (${totalSeats} seats)`);
      setForm({ trainCompany: "", trainNumber: "", vagonNumber: 1, dueDate: "", fromId: "", toId: "" });
      setSeatGroups([{ variantId: variants[0] ? String(variants[0].id) : "", rowCount: 5, seatsPerRow: 4 }]);

      if (onCreated) onCreated(json.data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-wrapper">

        <div className="ct-header">
          <div className="ct-header-icon">🚆</div>
          <div>
            <h1 className="ct-title">Create Train Ticket</h1>
            <p className="ct-subtitle">
              Fill in travel details — seats will be generated automatically
            </p>
          </div>
        </div>

        {serverError && <div className="ct-alert ct-alert--error">{serverError}</div>}
        {successMsg  && <div className="ct-alert ct-alert--success">✅ {successMsg}</div>}

        <form className="ct-form" onSubmit={handleSubmit}>

          <section className="ct-section">
            <h2 className="ct-section-title">🚂 Train Details</h2>
            <div className="ct-grid-2">
              <div className="ct-field">
                <label>Company</label>
                <input
                  name="trainCompany"
                  value={form.trainCompany}
                  onChange={handleForm}
                  placeholder="e.g. ADY"
                  required
                />
              </div>
              <div className="ct-field">
                <label>Train No</label>
                <input
                  name="trainNumber"
                  value={form.trainNumber}
                  onChange={handleForm}
                  placeholder="e.g. T-100"
                  required
                />
              </div>
              <div className="ct-field">
                <label>Departure Date & Time</label>
                <input
                  name="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={handleForm}
                  required
                />
              </div>
              <div className="ct-field">
                <label>Wagon No</label>
                <input
                  name="vagonNumber"
                  type="number"
                  min={1}
                  value={form.vagonNumber}
                  onChange={handleForm}
                />
              </div>
            </div>
          </section>

          <section className="ct-section">
            <h2 className="ct-section-title">📍 Route</h2>
            <div className="ct-grid-2">
              <LocationDropdown
                label="From"
                name="fromId"
                locations={locations}
                value={form.fromId}
                onChange={handleForm}
                loading={locLoading}
              />
              <LocationDropdown
                label="To"
                name="toId"
                locations={locations}
                value={form.toId}
                onChange={handleForm}
                loading={locLoading}
              />
            </div>
          </section>

          <section className="ct-section">
            <h2 className="ct-section-title">💺 Classes & Seats</h2>

            {seatGroups.map((g, idx) => (
              <div key={idx} className="ct-group-box">
                <div className="ct-group-header">
                  <span>Group {idx + 1}</span>
                  {seatGroups.length > 1 && (
                    <button type="button" className="ct-remove-btn" onClick={() => removeGroup(idx)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="ct-grid-3">
                  <div className="ct-field">
                    <label>Class (Variant)</label>
                    <select
                      value={g.variantId}
                      onChange={e => handleGroup(idx, "variantId", e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>{v.name} — {v.price} ₼</option>
                      ))}
                    </select>
                  </div>
                  <div className="ct-field">
                    <label>Row Count</label>
                    <input
                      type="number"
                      min={1}
                      value={g.rowCount}
                      onChange={e => handleGroup(idx, "rowCount", e.target.value)}
                    />
                  </div>
                  <div className="ct-field">
                    <label>Seats / Row</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={g.seatsPerRow}
                      onChange={e => handleGroup(idx, "seatsPerRow", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="ct-add-group-btn" onClick={addGroup}>
              + Add New Class Group
            </button>
          </section>

          <button type="submit" className="ct-submit-btn" disabled={loading}>
            {loading ? "Creating..." : `🚆 Create Tickets (${totalSeats} seats)`}
          </button>

        </form>
      </div>
    </div>
  );
}