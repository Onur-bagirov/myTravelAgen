import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ticket.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ── Validation ── */
const rules = {
  airline: (v) => {
    if (!v?.trim()) return "Airline name is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 100) return "Maximum 100 characters";
    if (!/^[a-zA-Z0-9 \-&().]+$/i.test(v.trim())) return "Only letters, numbers and - & ( ) .";
    return null;
  },
  gate: (v) => {
    if (!v?.trim()) return "Gate is required";
    if (v.length > 10) return "Maximum 10 characters";
    if (!/^[A-Za-z0-9\-]+$/.test(v.trim())) return "Only letters and numbers";
    return null;
  },
  plane: (v) => {
    if (!v?.trim()) return "Plane model is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 50) return "Maximum 50 characters";
    return null;
  },
  meal: (v) => {
    if (!v?.trim()) return "Meal type is required";
    if (v.trim().length < 2) return "At least 2 characters required";
    if (v.length > 50) return "Maximum 50 characters";
    return null;
  },
  luggageKg: (v) => {
    if (v === "" || v == null) return "Luggage amount is required";
    const n = Number(v);
    if (isNaN(n)) return "Enter a number";
    if (n < 0) return "Luggage cannot be negative";
    if (n > 100) return "Maximum 100 kg";
    return null;
  },
  dueDate: (v) => {
    if (!v) return "Flight date is required";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "Enter a valid date";
    if (d <= new Date()) return "Flight date must be in the future";
    const max = new Date();
    max.setFullYear(max.getFullYear() + 2);
    if (d > max) return "Date cannot be more than 2 years ahead";
    return null;
  },
  locationId: (v) => {
    if (!v || Number(v) < 1) return "Select a departure location";
    return null;
  },
  toLocationId: (v, form) => {
    if (!v || Number(v) < 1) return "Select an arrival location";
    if (form && String(v) === String(form.locationId)) return "Departure and arrival cannot be the same";
    return null;
  },
  variantId: (v) => {
    if (!v || Number(v) < 1) return "Select a variant";
    return null;
  },
  rowCount: (v) => {
    if (v === "" || v == null) return "Row count is required";
    const n = Number(v);
    if (!Number.isInteger(n) || isNaN(n)) return "Enter a whole number";
    if (n < 1) return "At least 1 row required";
    if (n > 50) return "Maximum 50 rows";
    return null;
  },
  seatsPerRow: (v) => {
    if (v === "" || v == null) return "Seats per row is required";
    const n = Number(v);
    if (!Number.isInteger(n) || isNaN(n)) return "Enter a whole number";
    if (n < 1) return "At least 1 seat per row";
    if (n > 12) return "Maximum 12 seats per row";
    return null;
  },
};

const ALL_FIELDS = [
  "airline", "gate", "plane", "meal", "luggageKg",
  "dueDate", "locationId", "toLocationId", "variantId", "rowCount", "seatsPerRow",
];

function parseLocations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function fmtDate(str) {
  if (!str) return "—";
  const [d] = str.split("T");
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = ["","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${day} ${months[parseInt(m, 10)]} ${y}`;
}

function fmtTime(str) {
  if (!str) return "";
  const parts = str.split("T");
  return parts.length < 2 ? "" : parts[1].slice(0, 5);
}

function toISO(str) {
  if (!str) return "";
  return str.length === 16 ? str + ":00.000Z" : str + ".000Z";
}

/* ── Field ── */
function Field({ label, name, type = "text", placeholder, min, max, step, value, onChange, onBlur, error, touched }) {
  return (
    <div className="cpt-field">
      <label>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        autoComplete="off"
        className={error && touched ? "cpt-input--error" : ""}
      />
      {touched && error && <span className="cpt-field-error">⚠ {error}</span>}
    </div>
  );
}

/* ── Section title ── */
function SectionTitle({ icon, text }) {
  return (
    <div className="cpt-section-title">
      <span>{icon}</span>
      {text}
    </div>
  );
}

/* ── Main ── */
export default function CreatePlaneTicket() {
  const navigate = useNavigate();

  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [touched, setTouched]   = useState({});
  const [errors, setErrors]     = useState({});
  const [locations, setLocations]   = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [variants, setVariants]     = useState([]);
  const [varLoading, setVarLoading] = useState(false);
  const [fromName, setFromName]     = useState("");
  const [toName, setToName]         = useState("");

  const [form, setForm] = useState({
    airline: "", gate: "", plane: "", meal: "",
    luggageKg: 23, dueDate: "",
    locationId: "", toLocationId: "",
    variantId: "", rowCount: 10, seatsPerRow: 6,
  });

  useEffect(() => {
    setLocLoading(true);
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(parseLocations(d)))
      .catch(() => {})
      .finally(() => setLocLoading(false));

    setVarLoading(true);
    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setVariants(list);
        if (list.length > 0) setForm(p => ({ ...p, variantId: list[0].id }));
      })
      .catch(() => {})
      .finally(() => setVarLoading(false));
  }, []);

  const validate = (name, value, currentForm) => {
    const fn = rules[name];
    return fn ? fn(String(value ?? ""), currentForm ?? form) : null;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const coerced = type === "number" ? (value === "" ? "" : Number(value)) : value;
    const newForm = { ...form, [name]: coerced };
    setForm(newForm);
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate(name, coerced, newForm) }));
    if (name === "locationId" && touched.toLocationId)
      setErrors(p => ({ ...p, toLocationId: validate("toLocationId", newForm.toLocationId, newForm) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate(name, value) }));
  };

  const handleFromLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, locationId: id };
    setForm(newForm);
    setFromName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(p => ({ ...p, locationId: true }));
    setErrors(p => ({
      ...p,
      locationId: validate("locationId", id, newForm),
      ...(touched.toLocationId ? { toLocationId: validate("toLocationId", newForm.toLocationId, newForm) } : {}),
    }));
  };

  const handleToLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, toLocationId: id };
    setForm(newForm);
    setToName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(p => ({ ...p, toLocationId: true }));
    setErrors(p => ({ ...p, toLocationId: validate("toLocationId", id, newForm) }));
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};
    ALL_FIELDS.forEach(f => {
      newTouched[f] = true;
      newErrors[f] = validate(f, String(form[f] ?? ""), form);
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
      airline: form.airline.trim(),
      gate: form.gate.trim(),
      plane: form.plane.trim(),
      meal: form.meal.trim(),
      luggageKg: Number(form.luggageKg),
      dueDate: toISO(form.dueDate),
      fromId: Number(form.locationId),
      toId: Number(form.toLocationId),
      seatGroups: [{
        variantId: Number(form.variantId),
        rowCount: Number(form.rowCount),
        seatsPerRow: Number(form.seatsPerRow),
      }],
    };

    try {
      const res  = await fetch(`${BASE_URL}/PlaneTicket`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Server error: ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j?.errors) msg = Object.entries(j.errors).map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(", ") : e}`).join(" | ");
          else msg = j?.message || j?.title || msg;
        } catch {}
        throw new Error(msg);
      }
      const data   = JSON.parse(text);
      const ticket = data?.data ?? data;
      ticket._fromName     = fromName;
      ticket._toName       = toName;
      ticket._localDueDate = form.dueDate;
      setCreatedTicket(ticket);
      setIsGenerated(true);
    } catch (err) {
      setServerError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsGenerated(false);
    setCreatedTicket(null);
    setServerError(null);
    setTouched({});
    setErrors({});
    setFromName("");
    setToName("");
    setForm({
      airline: "", gate: "", plane: "", meal: "",
      luggageKg: 23, dueDate: "",
      locationId: "", toLocationId: "",
      variantId: variants[0]?.id ?? "",
      rowCount: 10, seatsPerRow: 6,
    });
  };

  const displayDate = createdTicket?._localDueDate || form.dueDate;
  const displayFrom = createdTicket?._fromName || fromName;
  const displayTo   = createdTicket?._toName   || toName;
  const totalSeats  = createdTicket?.totalTicketsCreated ?? (Number(form.rowCount) * Number(form.seatsPerRow));

  /* ══ Form view ══ */
  if (!isGenerated) return (
    <div className="cpt-page">
      <div className="cpt-wrapper">

        <div className="cpt-header">
          <div className="cpt-header-icon">✈️</div>
          <div>
            <h1 className="cpt-title">Create Plane Ticket</h1>
            <p className="cpt-subtitle">Fill in flight details — seats will be generated automatically</p>
          </div>
        </div>

        {serverError && <div className="cpt-alert cpt-alert--error">⚠️ {serverError}</div>}

        <div className="cpt-form-card">
          <form onSubmit={handleSubmit} noValidate>

            <SectionTitle icon="✈" text="Flight Details" />
            <div className="cpt-grid-2">
              <Field label="Airline" name="airline" placeholder="e.g. AZAL"
                value={form.airline} onChange={handleChange} onBlur={handleBlur}
                error={errors.airline} touched={touched.airline} />
              <Field label="Gate" name="gate" placeholder="e.g. A12"
                value={form.gate} onChange={handleChange} onBlur={handleBlur}
                error={errors.gate} touched={touched.gate} />
              <Field label="Plane Model" name="plane" placeholder="e.g. Boeing 737"
                value={form.plane} onChange={handleChange} onBlur={handleBlur}
                error={errors.plane} touched={touched.plane} />
              <Field label="Meal Type" name="meal" placeholder="e.g. Standard"
                value={form.meal} onChange={handleChange} onBlur={handleBlur}
                error={errors.meal} touched={touched.meal} />
            </div>

            <div className="cpt-grid-2" style={{ marginTop: 14 }}>
              <Field label="Luggage (kg) — max 100" name="luggageKg" type="number" min="0" max="100" step="0.5"
                value={form.luggageKg} onChange={handleChange} onBlur={handleBlur}
                error={errors.luggageKg} touched={touched.luggageKg} />
              <Field label="Departure Date & Time" name="dueDate" type="datetime-local"
                value={form.dueDate} onChange={handleChange} onBlur={handleBlur}
                error={errors.dueDate} touched={touched.dueDate} />
            </div>

            {form.dueDate && !errors.dueDate && (
              <div className="cpt-hint-banner">
                🗓 {fmtDate(form.dueDate)} at {fmtTime(form.dueDate)}
              </div>
            )}

            <SectionTitle icon="📍" text="Route" />
            <div className="cpt-grid-2">
              <div className="cpt-field">
                <label>From</label>
                <select
                  value={form.locationId}
                  onChange={handleFromLocation}
                  onBlur={() => {
                    setTouched(p => ({ ...p, locationId: true }));
                    setErrors(p => ({ ...p, locationId: validate("locationId", form.locationId) }));
                  }}
                  disabled={locLoading}
                  className={`cpt-select${touched.locationId && errors.locationId ? " cpt-input--error" : ""}`}
                >
                  <option value="">{locLoading ? "Loading..." : "— Select location —"}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}{l.country ? ` (${l.country})` : ""}</option>
                  ))}
                </select>
                {touched.locationId && errors.locationId && <span className="cpt-field-error">⚠ {errors.locationId}</span>}
              </div>

              <div className="cpt-field">
                <label>To</label>
                <select
                  value={form.toLocationId}
                  onChange={handleToLocation}
                  onBlur={() => {
                    setTouched(p => ({ ...p, toLocationId: true }));
                    setErrors(p => ({ ...p, toLocationId: validate("toLocationId", form.toLocationId, form) }));
                  }}
                  disabled={locLoading}
                  className={`cpt-select${touched.toLocationId && errors.toLocationId ? " cpt-input--error" : ""}`}
                >
                  <option value="">{locLoading ? "Loading..." : "— Select location —"}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}{l.country ? ` (${l.country})` : ""}</option>
                  ))}
                </select>
                {touched.toLocationId && errors.toLocationId && <span className="cpt-field-error">⚠ {errors.toLocationId}</span>}
              </div>
            </div>

            <SectionTitle icon="💺" text="Seat Configuration" />
            <div className="cpt-grid-3">
              <div className="cpt-field">
                <label>Class (Variant)</label>
                <select
                  value={form.variantId}
                  onChange={e => {
                    setForm(p => ({ ...p, variantId: e.target.value }));
                    if (touched.variantId) setErrors(p => ({ ...p, variantId: validate("variantId", e.target.value) }));
                  }}
                  onBlur={() => {
                    setTouched(p => ({ ...p, variantId: true }));
                    setErrors(p => ({ ...p, variantId: validate("variantId", form.variantId) }));
                  }}
                  disabled={varLoading}
                  className={`cpt-select${touched.variantId && errors.variantId ? " cpt-input--error" : ""}`}
                >
                  <option value="">{varLoading ? "Loading..." : variants.length === 0 ? "— No variants —" : "— Select variant —"}</option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {v.price} ₼</option>
                  ))}
                </select>
                {touched.variantId && errors.variantId && <span className="cpt-field-error">⚠ {errors.variantId}</span>}
                {variants.length === 0 && !varLoading && (
                  <span className="cpt-field-error" style={{ color: "#f59e0b" }}>⚠ Create a Variant in Admin panel first!</span>
                )}
              </div>

              <Field label="Row Count (max 50)" name="rowCount" type="number" min="1" max="50"
                value={form.rowCount} onChange={handleChange} onBlur={handleBlur}
                error={errors.rowCount} touched={touched.rowCount} />

              <Field label="Seats / Row (max 12)" name="seatsPerRow" type="number" min="1" max="12"
                value={form.seatsPerRow} onChange={handleChange} onBlur={handleBlur}
                error={errors.seatsPerRow} touched={touched.seatsPerRow} />
            </div>

            {!errors.rowCount && !errors.seatsPerRow && form.rowCount && form.seatsPerRow && (
              <div className="cpt-hint-banner" style={{ marginTop: 10 }}>
                💺 {Number(form.rowCount) * Number(form.seatsPerRow)} seats will be created
                ({form.rowCount} rows × {form.seatsPerRow} seats)
              </div>
            )}

            <button type="submit" className="cpt-submit-btn" disabled={loading}>
              {loading ? <><span className="cpt-spinner" /> Creating...</> : "✈ Create Ticket"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );

  /* ══ Success / Boarding pass view ══ */
  return (
    <div className="cpt-page">
      <div className="cpt-wrapper" style={{ maxWidth: 760 }}>

        <div className="cpt-header">
          <div className="cpt-header-icon">✈️</div>
          <div>
            <h1 className="cpt-title">Ticket Created</h1>
            <p className="cpt-subtitle">Your boarding pass is ready</p>
          </div>
        </div>

        <div className="cpt-success-wrap">
          <div className="cpt-boarding-pass">

            {/* Left */}
            <div className="cpt-pass-left">
              <div className="cpt-pass-header">
                <div>
                  <div className="cpt-pass-airline">{createdTicket?.airline || form.airline}</div>
                  <div className="cpt-pass-type">Boarding Pass</div>
                </div>
                <div className="cpt-pass-id">ID #{createdTicket?.id ?? "—"}</div>
              </div>

              <div className="cpt-pass-route">
                <div className="cpt-route-city">
                  <div className="cpt-route-code">{(displayFrom || "—").slice(0, 3).toUpperCase()}</div>
                  <div className="cpt-route-name">{displayFrom}</div>
                </div>
                <div className="cpt-route-middle">
                  <div className="cpt-route-dot" />
                  <div className="cpt-route-dash" />
                  <span className="cpt-route-plane">✈</span>
                  <div className="cpt-route-dash" />
                  <div className="cpt-route-dot" />
                </div>
                <div className="cpt-route-city cpt-route-city--right">
                  <div className="cpt-route-code">{(displayTo || "—").slice(0, 3).toUpperCase()}</div>
                  <div className="cpt-route-name">{displayTo}</div>
                </div>
              </div>

              <div className="cpt-pass-info-grid">
                {[
                  ["GATE",    createdTicket?.gate    || form.gate],
                  ["PLANE",   createdTicket?.plane   || form.plane],
                  ["MEAL",    createdTicket?.meal    || form.meal],
                  ["LUGGAGE", `${createdTicket?.luggageKg ?? form.luggageKg} kg`],
                  ["DATE",    fmtDate(displayDate)],
                  ["TIME",    fmtTime(displayDate)],
                  ["SEATS",   totalSeats],
                  ["STATUS",  "ACTIVE"],
                ].map(([label, val]) => (
                  <div key={label} className="cpt-info-box">
                    <span>{label}</span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Perforation */}
            <div className="cpt-perforation">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="cpt-perf-dot" />
              ))}
            </div>

            {/* Stub */}
            <div className="cpt-pass-right">
              <div className="cpt-stub-airline">{createdTicket?.airline || form.airline}</div>
              <div className="cpt-stub-route">
                {(displayFrom || "—").slice(0, 3).toUpperCase()} → {(displayTo || "—").slice(0, 3).toUpperCase()}
              </div>
              {[
                ["Gate",  createdTicket?.gate  || form.gate],
                ["Plane", createdTicket?.plane || form.plane],
                ["Date",  fmtDate(displayDate)],
                ["Time",  fmtTime(displayDate)],
                ["Seats", totalSeats],
              ].map(([k, v]) => (
                <div key={k} className="cpt-stub-row">
                  <span className="cpt-stub-key">{k}</span>
                  <span className="cpt-stub-val">{v}</span>
                </div>
              ))}
              <div className="cpt-barcode">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="cpt-bar"
                    style={{ height: `${45 + Math.sin(i * 1.9) * 20}%`, opacity: 0.5 + (i % 4) * 0.12 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="cpt-actions">
            <button className="cpt-action-btn cpt-action-btn--primary" onClick={resetForm}>
              + New Ticket
            </button>
            <button className="cpt-action-btn" onClick={() => navigate("/Show-Ticket")}>
              ✈ View Tickets
            </button>
            <button className="cpt-action-btn" onClick={() => navigate("/")}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}