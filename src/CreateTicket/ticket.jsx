import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ticket.css";

const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7001/api";

const rules = {
  airline:     (v) => !v.trim() ? "Airline name cannot be empty!" : v.length > 100 ? "Must not exceed 100 characters!" : null,
  gate:        (v) => !v.trim() ? "Gate cannot be empty!" : v.length > 20 ? "Must not exceed 20 characters!" : null,
  plane:       (v) => !v.trim() ? "Plane model cannot be empty!" : v.length > 100 ? "Must not exceed 100 characters!" : null,
  meal:        (v) => !v.trim() ? "Meal type cannot be empty!" : null,
  luggageKg:   (v) => Number(v) < 0 ? "Luggage cannot be negative!" : null,
  dueDate:     (v) => !v ? "Departure date cannot be empty!" : null,
  fromId:      (v) => !v || Number(v) < 1 ? "Please select a departure location!" : null,
  toId:        (v) => !v || Number(v) < 1 ? "Please select a destination location!" : null,
  variantId:   (v) => !v || Number(v) < 1 ? "Variant ID must be a positive number!" : null,
  rowCount:    (v) => !v || Number(v) < 1 ? "Row count must be at least 1!" : null,
  seatsPerRow: (v) => !v || Number(v) < 1 ? "Seats per row must be at least 1!" : null,
};

const allFields = Object.keys(rules);

function parseItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data))        return data.data;
  if (Array.isArray(data?.items))       return data.items;
  return [];
}

export default function CreatePlaneTicket() {
  const navigate = useNavigate();

  const [isGenerated, setIsGenerated]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [serverError, setServerError]     = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [touched, setTouched]             = useState({});
  const [errors, setErrors]               = useState({});

  const [locations, setLocations]         = useState([]);
  const [countries, setCountries]         = useState([]);
  const [fromCountryId, setFromCountryId] = useState("");
  const [toCountryId, setToCountryId]     = useState("");
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations]     = useState([]);
  const [fromName, setFromName]           = useState("");
  const [toName, setToName]               = useState("");
  const [fromCountryName, setFromCountryName] = useState("");
  const [toCountryName, setToCountryName]     = useState("");

  const [form, setForm] = useState({
    airline: "", gate: "", plane: "", meal: "", luggageKg: 23,
    dueDate: "", fromId: "", toId: "",
    variantId: 1, rowCount: 10, seatsPerRow: 6,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/Location?Limit=200&Page=1`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setLocations(parseItems(data));
      } catch (_) {}
    };
    fetchLocations();
  }, []);

  // Derive countries from location data (no separate Country API needed)
  useEffect(() => {
    if (locations.length === 0) return;
    const seen = new Map();
    locations.forEach(l => {
      if (l.countryId && !seen.has(l.countryId)) {
        seen.set(l.countryId, { id: l.countryId, name: l.country || `Country #${l.countryId}` });
      }
    });
    setCountries([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)));
    setFromLocations(locations);
    setToLocations(locations);
  }, [locations]);

  // Filter FROM locations when country changes
  useEffect(() => {
    if (!fromCountryId) {
      setFromLocations(locations);
    } else {
      setFromLocations(locations.filter(l => String(l.countryId) === String(fromCountryId)));
      setForm(prev => ({ ...prev, fromId: "" }));
      setFromName("");
    }
  }, [fromCountryId, locations]);

  // Filter TO locations when country changes
  useEffect(() => {
    if (!toCountryId) {
      setToLocations(locations);
    } else {
      setToLocations(locations.filter(l => String(l.countryId) === String(toCountryId)));
      setForm(prev => ({ ...prev, toId: "" }));
      setToName("");
    }
  }, [toCountryId, locations]);

  const validate = (name, value) => rules[name]?.(String(value)) ?? null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const coerced = type === "number" ? (value === "" ? "" : Number(value)) : value;
    setForm(prev => ({ ...prev, [name]: coerced }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, coerced) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleFromCountry = (e) => {
    const cid = e.target.value;
    setFromCountryId(cid);
    setFromCountryName(countries.find(c => String(c.id) === String(cid))?.name || "");
  };

  const handleToCountry = (e) => {
    const cid = e.target.value;
    setToCountryId(cid);
    setToCountryName(countries.find(c => String(c.id) === String(cid))?.name || "");
  };

  const handleFromLocation = (e) => {
    const locId = e.target.value;
    setForm(prev => ({ ...prev, fromId: locId }));
    setFromName(locations.find(l => String(l.id) === String(locId))?.name || "");
    if (touched.fromId) setErrors(prev => ({ ...prev, fromId: validate("fromId", locId) }));
  };

  const handleToLocation = (e) => {
    const locId = e.target.value;
    setForm(prev => ({ ...prev, toId: locId }));
    setToName(locations.find(l => String(l.id) === String(locId))?.name || "");
    if (touched.toId) setErrors(prev => ({ ...prev, toId: validate("toId", locId) }));
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};
    allFields.forEach(f => {
      newTouched[f] = true;
      newErrors[f] = validate(f, String(form[f] ?? ""));
    });
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.values(newErrors).every(e => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validateAll()) return;
    setLoading(true);
    const payload = {
      airline: form.airline, gate: form.gate, plane: form.plane, meal: form.meal,
      luggageKg: Number(form.luggageKg),
      dueDate: new Date(form.dueDate).toISOString(),
      fromId: Number(form.fromId),
      toId: Number(form.toId),
      seatGroups: [{ variantId: Number(form.variantId), rowCount: Number(form.rowCount), seatsPerRow: Number(form.seatsPerRow) }],
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/PlaneTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || err?.title || `Server error: ${res.status}`);
      }
      const data = await res.json();
      const ticket = data?.data ?? data;
      ticket._fromName    = fromName;
      ticket._toName      = toName;
      ticket._fromCountry = fromCountryName;
      ticket._toCountry   = toCountryName;
      setCreatedTicket(ticket);
      setIsGenerated(true);
    } catch (err) {
      setServerError(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsGenerated(false); setCreatedTicket(null); setServerError(null);
    setTouched({}); setErrors({});
    setFromCountryId(""); setToCountryId("");
    setFromName(""); setToName(""); setFromCountryName(""); setToCountryName("");
    setForm({ airline: "", gate: "", plane: "", meal: "", luggageKg: 23, dueDate: "", fromId: "", toId: "", variantId: 1, rowCount: 10, seatsPerRow: 6 });
  };

  const formatDate = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const formatTime = (iso) => !iso ? "" : new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const Field = ({ label, name, type = "text", placeholder, min, step }) => (
    <div className={`cpt-input-group${errors[name] && touched[name] ? " cpt-input-error" : ""}`}>
      <label>{label}</label>
      <input name={name} type={type} value={form[name]} onChange={handleChange} onBlur={handleBlur}
        placeholder={placeholder} min={min} step={step} autoComplete="off" />
      {touched[name] && errors[name] && <span className="cpt-field-error-msg">{errors[name]}</span>}
    </div>
  );

  const CountrySelect = ({ label, value, onChange }) => (
    <div className="cpt-input-group">
      <label>{label}</label>
      <select value={value} onChange={onChange} className="cpt-select">
        <option value="">— All countries —</option>
        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {countries.length === 0 && locations.length > 0 && (
        <span className="cpt-hint">No country info in locations</span>
      )}
    </div>
  );

  const LocationSelect = ({ label, fieldName, value, onChange, options }) => (
    <div className={`cpt-input-group${touched[fieldName] && errors[fieldName] ? " cpt-input-error" : ""}`}>
      <label>{label}</label>
      <select value={value} onChange={onChange}
        onBlur={() => { setTouched(p => ({ ...p, [fieldName]: true })); setErrors(p => ({ ...p, [fieldName]: validate(fieldName, value) })); }}
        className="cpt-select">
        <option value="">{options.length === 0 ? "— No locations —" : "— Select location —"}</option>
        {options.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      {touched[fieldName] && errors[fieldName] && <span className="cpt-field-error-msg">{errors[fieldName]}</span>}
    </div>
  );

  return (
    <div className="cpt-page-body">
      {!isGenerated ? (
        <div className="cpt-card">
          <div className="cpt-header">
            <div className="cpt-plane-icon-bg">✈️</div>
            <h2><span>Create</span> Plane Ticket</h2>
            <p>Fill in flight details to generate seats and boarding passes.</p>
          </div>

          <form className="cpt-form" onSubmit={handleSubmit} noValidate>
            <p className="cpt-section-title">✈ Airline Information</p>
            <div className="cpt-form-grid cpt-form-grid-2">
              <Field label="Airline Name" name="airline" placeholder="e.g. AZAL, Turkish Airlines" />
              <Field label="Gate"         name="gate"    placeholder="e.g. A12" />
              <Field label="Plane Model"  name="plane"   placeholder="e.g. Boeing 737" />
              <Field label="Meal Type"    name="meal"    placeholder="e.g. Standard, Vegan" />
            </div>
            <div className="cpt-form-grid cpt-form-grid-2">
              <Field label="Luggage (kg)"   name="luggageKg" type="number" min="0" step="0.5" />
              <Field label="Departure Date" name="dueDate"   type="datetime-local" />
            </div>

            <p className="cpt-section-title">🛫 Departure</p>
            <div className="cpt-form-grid cpt-form-grid-2">
              <CountrySelect label="Country (From) — optional" value={fromCountryId} onChange={handleFromCountry} />
              <LocationSelect label="Location (From) *" fieldName="fromId" value={form.fromId} onChange={handleFromLocation} options={fromLocations} />
            </div>

            <p className="cpt-section-title">🛬 Destination</p>
            <div className="cpt-form-grid cpt-form-grid-2">
              <CountrySelect label="Country (To) — optional" value={toCountryId} onChange={handleToCountry} />
              <LocationSelect label="Location (To) *" fieldName="toId" value={form.toId} onChange={handleToLocation} options={toLocations} />
            </div>

            <p className="cpt-section-title">💺 Seat Configuration</p>
            <div className="cpt-form-grid cpt-form-grid-3">
              <Field label="Variant ID"    name="variantId"   type="number" min="1" />
              <Field label="Row Count"     name="rowCount"    type="number" min="1" />
              <Field label="Seats Per Row" name="seatsPerRow" type="number" min="1" />
            </div>

            {serverError && <div className="cpt-server-error">⚠️ {serverError}</div>}

            <button type="submit" className="cpt-generate-btn" disabled={loading}>
              {loading ? <span className="cpt-btn-loading"><span className="cpt-spinner" />Generating...</span> : "✈ Generate Plane Ticket"}
            </button>
          </form>
        </div>
      ) : (
        <div className="cpt-boarding-container cpt-animate-pop">
          <div className="cpt-boarding-pass">
            <div className="cpt-pass-left">
              <div className="cpt-pass-header">
                <div className="cpt-airline-brand">{createdTicket?.airline || form.airline}</div>
                <div className="cpt-pass-label">BOARDING PASS</div>
              </div>
              <div className="cpt-pass-route">
                <div className="cpt-city">
                  <h1>{createdTicket?._fromName || fromName || `#${createdTicket?.fromId ?? form.fromId}`}</h1>
                  <p>FROM</p>
                  {(createdTicket?._fromCountry || fromCountryName) && <span className="cpt-country-tag">{createdTicket?._fromCountry || fromCountryName}</span>}
                </div>
                <div className="cpt-plane-fly-anim">✈</div>
                <div className="cpt-city cpt-city--right">
                  <h1>{createdTicket?._toName || toName || `#${createdTicket?.toId ?? form.toId}`}</h1>
                  <p>TO</p>
                  {(createdTicket?._toCountry || toCountryName) && <span className="cpt-country-tag">{createdTicket?._toCountry || toCountryName}</span>}
                </div>
              </div>
              <div className="cpt-pass-info-grid">
                <div className="cpt-info-box"><span>TICKET ID</span><strong>{createdTicket?.id ?? "—"}</strong></div>
                <div className="cpt-info-box"><span>GATE</span><strong>{createdTicket?.gate || form.gate}</strong></div>
                <div className="cpt-info-box"><span>PLANE</span><strong>{createdTicket?.plane || form.plane}</strong></div>
                <div className="cpt-info-box"><span>MEAL</span><strong>{createdTicket?.meal || form.meal}</strong></div>
                <div className="cpt-info-box"><span>LUGGAGE</span><strong>{createdTicket?.luggageKg ?? form.luggageKg} kg</strong></div>
                <div className="cpt-info-box"><span>DEPARTURE</span><strong>{formatDate(createdTicket?.dueDate || form.dueDate)}</strong></div>
                <div className="cpt-info-box"><span>TIME</span><strong>{formatTime(createdTicket?.dueDate || form.dueDate)}</strong></div>
                <div className="cpt-info-box"><span>TOTAL SEATS</span><strong>{createdTicket?.totalTicketsCreated ?? "—"}</strong></div>
              </div>
            </div>
            <div className="cpt-perforation">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="cpt-perf-dot" />)}
            </div>
            <div className="cpt-pass-right">
              <div className="cpt-stub-header">{createdTicket?.airline || form.airline}</div>
              <div className="cpt-stub-route">
                {createdTicket?._fromName || fromName || `#${createdTicket?.fromId ?? form.fromId}`}
                &nbsp;✈&nbsp;
                {createdTicket?._toName || toName || `#${createdTicket?.toId ?? form.toId}`}
              </div>
              <div className="cpt-stub-details">
                <p>Gate: {createdTicket?.gate || form.gate}</p>
                <p>Plane: {createdTicket?.plane || form.plane}</p>
                <p>Date: {formatDate(createdTicket?.dueDate || form.dueDate)}</p>
                <p>Time: {formatTime(createdTicket?.dueDate || form.dueDate)}</p>
                <p>Seats: {createdTicket?.totalTicketsCreated ?? "—"}</p>
              </div>
              <div className="cpt-barcode-area">
                {Array.from({ length: 22 }).map((_, i) => (
                  <div key={i} className="cpt-bar" style={{ height: `${20 + Math.sin(i * 1.7) * 16}px`, opacity: 0.6 + (i % 3) * 0.13 }} />
                ))}
              </div>
            </div>
          </div>
          <div className="cpt-action-buttons">
            <button className="cpt-create-new-btn" onClick={resetForm}>＋ Create New</button>
            <button className="cpt-show-tickets-btn" onClick={() => navigate("/show-plane-tickets")}>✈ Show Plane Tickets</button>
            <button className="cpt-home-btn" onClick={() => navigate("/")}>🏠 Go Home</button>
          </div>
        </div>
      )}
    </div>
  );
}