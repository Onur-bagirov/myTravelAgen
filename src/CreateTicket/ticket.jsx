import React, { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const rules = {
  airline: (v) => {
    if (!v || !v.trim()) return "Airline adı boş ola bilməz";
    if (v.trim().length < 2) return "Ən az 2 simvol olmalıdır";
    if (v.length > 100) return "100 simvoldan çox ola bilməz";
    if (!/^[a-zA-ZğüşöçıəƏĞÜŞÖÇİ0-9 \-&().]+$/i.test(v.trim()))
      return "Yalnız hərf, rəqəm və - & ( ) . işarələri";
    return null;
  },
  gate: (v) => {
    if (!v || !v.trim()) return "Gate boş ola bilməz";
    if (v.length > 10) return "10 simvoldan çox ola bilməz";
    if (!/^[A-Za-z0-9\-]+$/.test(v.trim())) return "Yalnız hərf və rəqəm";
    return null;
  },
  plane: (v) => {
    if (!v || !v.trim()) return "Plane modeli boş ola bilməz";
    if (v.trim().length < 2) return "Ən az 2 simvol olmalıdır";
    if (v.length > 50) return "50 simvoldan çox ola bilməz";
    return null;
  },
  meal: (v) => {
    if (!v || !v.trim()) return "Meal tipi boş ola bilməz";
    if (v.trim().length < 2) return "Ən az 2 simvol olmalıdır";
    if (v.length > 50) return "50 simvoldan çox ola bilməz";
    return null;
  },
  luggageKg: (v) => {
    if (v === "" || v === null || v === undefined) return "Bagaj miqdarı boş ola bilməz";
    const n = Number(v);
    if (isNaN(n)) return "Rəqəm daxil edin";
    if (n < 0) return "Bagaj mənfi ola bilməz";
    if (n > 100) return "Maksimum 100 kq ola bilər";
    return null;
  },
  dueDate: (v) => {
    if (!v) return "Uçuş tarixi boş ola bilməz";
    const selected = new Date(v);
    if (isNaN(selected.getTime())) return "Düzgün tarix daxil edin";
    if (selected <= new Date()) return "Uçuş tarixi gələcəkdə olmalıdır";
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (selected > maxDate) return "Tarix 2 ildən artıq ola bilməz";
    return null;
  },
  locationId: (v) => {
    if (!v || Number(v) < 1) return "Haradan lokasiya seçin";
    return null;
  },
  toLocationId: (v, form) => {
    if (!v || Number(v) < 1) return "Haraya lokasiya seçin";
    if (form && String(v) === String(form.locationId)) return '"Haradan" və "Haraya" eyni ola bilməz';
    return null;
  },
  variantId: (v) => {
    if (!v || Number(v) < 1) return "Variant seçin";
    return null;
  },
  rowCount: (v) => {
    if (v === "" || v === null || v === undefined) return "Sıra sayı boş ola bilməz";
    const n = Number(v);
    if (isNaN(n) || !Number.isInteger(n)) return "Tam rəqəm daxil edin";
    if (n < 1) return "Sıra sayı ən azı 1 olmalıdır";
    if (n > 50) return "Sıra sayı maksimum 50 ola bilər";
    return null;
  },
  seatsPerRow: (v) => {
    if (v === "" || v === null || v === undefined) return "Oturacaq sayı boş ola bilməz";
    const n = Number(v);
    if (isNaN(n) || !Number.isInteger(n)) return "Tam rəqəm daxil edin";
    if (n < 1) return "Sıradakı oturacaq ən azı 1 olmalıdır";
    if (n > 12) return "Sıradakı oturacaq maksimum 12 ola bilər";
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

const formatDateFromLocal = (localStr) => {
  if (!localStr) return "—";
  const [datePart] = localStr.split("T");
  if (!datePart) return "—";
  const [year, month, day] = datePart.split("-");
  const months = ["", "YAN", "FEV", "MAR", "APR", "MAY", "İYN", "İYL", "AVQ", "SEP", "OKT", "NOY", "DEK"];
  return `${day} ${months[parseInt(month, 10)]} ${year}`;
};

const formatTimeFromLocal = (localStr) => {
  if (!localStr) return "";
  const parts = localStr.split("T");
  if (parts.length < 2) return "";
  return parts[1].slice(0, 5);
};

const toISOFromLocal = (localStr) => {
  if (!localStr) return "";
  return localStr.length === 16 ? localStr + ":00.000Z" : localStr + ".000Z";
};

const Field = ({ label, name, type = "text", placeholder, min, max, step, value, onChange, onBlur, error, touched }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>
      {label} <span style={{ color: "#ff6b6b" }}>*</span>
    </label>
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
      className={`ticket-input${error && touched ? " ticket-input--error" : ""}`}
    />
    {touched && error && (
      <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {error}</span>
    )}
  </div>
);

const SectionTitle = ({ icon, text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px", borderBottom: "1px solid rgba(167,139,250,0.2)", paddingBottom: 10 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa" }}>{text}</span>
  </div>
);

export default function CreatePlaneTicket() {
  const navigate = (path) => { window.location.href = path; };

  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [fromLocationName, setFromLocationName] = useState("");
  const [toLocationName, setToLocationName] = useState("");
  const [variants, setVariants] = useState([]);
  const [varLoading, setVarLoading] = useState(false);

  const [form, setForm] = useState({
    airline: "", gate: "", plane: "", meal: "",
    luggageKg: 23, dueDate: "",
    locationId: "", toLocationId: "",
    variantId: "", rowCount: 10, seatsPerRow: 6,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Lokasiyalar yüklənmədi");
        const data = await res.json();
        setLocations(parseLocations(data));
      } catch (err) {
        setServerError(err.message);
      } finally {
        setLocLoading(false);
      }
    };

    const fetchVariants = async () => {
      setVarLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Variantlar yüklənmədi");
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setVariants(list);
        if (list.length > 0) setForm(prev => ({ ...prev, variantId: list[0].id }));
      } catch (err) {
        console.warn("Variant yüklənmədi:", err.message);
      } finally {
        setVarLoading(false);
      }
    };

    fetchLocations();
    fetchVariants();
  }, []);

  const validate = (name, value, currentForm) => {
    const fn = rules[name];
    if (!fn) return null;
    return fn(String(value ?? ""), currentForm ?? form);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const coerced = type === "number" ? (value === "" ? "" : Number(value)) : value;
    const newForm = { ...form, [name]: coerced };
    setForm(newForm);
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validate(name, coerced, newForm) }));
    }
    if (name === "locationId" && touched.toLocationId) {
      setErrors(prev => ({ ...prev, toLocationId: validate("toLocationId", newForm.toLocationId, newForm) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleFromLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, locationId: id };
    setForm(newForm);
    setFromLocationName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(p => ({ ...p, locationId: true }));
    setErrors(prev => ({
      ...prev,
      locationId: validate("locationId", id, newForm),
      ...(touched.toLocationId ? { toLocationId: validate("toLocationId", newForm.toLocationId, newForm) } : {}),
    }));
  };

  const handleToLocation = (e) => {
    const id = e.target.value;
    const newForm = { ...form, toLocationId: id };
    setForm(newForm);
    setToLocationName(locations.find(l => String(l.id) === String(id))?.name || "");
    setTouched(prev => ({ ...prev, toLocationId: true }));
    setErrors(prev => ({ ...prev, toLocationId: validate("toLocationId", id, newForm) }));
  };

  const handleVariantChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, variantId: val }));
    if (touched.variantId)
      setErrors(prev => ({ ...prev, variantId: validate("variantId", val) }));
  };

  const handleVariantBlur = () => {
    setTouched(p => ({ ...p, variantId: true }));
    setErrors(p => ({ ...p, variantId: validate("variantId", form.variantId) }));
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
      dueDate: toISOFromLocal(form.dueDate),
      fromId: Number(form.locationId),
      toId: Number(form.toLocationId),
      seatGroups: [{
        variantId: Number(form.variantId),
        rowCount: Number(form.rowCount),
        seatsPerRow: Number(form.seatsPerRow),
      }],
    };

    try {
      const res = await fetch(`${BASE_URL}/PlaneTicket`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      if (!res.ok) {
        let errMsg = `Server xətası: ${res.status}`;
        try {
          const errJson = JSON.parse(responseText);
          if (errJson?.errors) {
            const msgs = Object.entries(errJson.errors)
              .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
              .join(" | ");
            errMsg = msgs;
          } else {
            errMsg = errJson?.message || errJson?.title || errMsg;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(responseText);
      const ticket = data?.data ?? data;
      ticket._fromName = fromLocationName;
      ticket._toName = toLocationName;
      ticket._localDueDate = form.dueDate;
      setCreatedTicket(ticket);
      setIsGenerated(true);
    } catch (err) {
      setServerError(err.message || "Xəta baş verdi.");
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
    setFromLocationName("");
    setToLocationName("");
    setForm({
      airline: "", gate: "", plane: "", meal: "",
      luggageKg: 23, dueDate: "",
      locationId: "", toLocationId: "",
      variantId: variants.length > 0 ? variants[0].id : "",
      rowCount: 10, seatsPerRow: 6,
    });
  };

  const displayDate = createdTicket?._localDueDate || form.dueDate;
  const displayFrom = createdTicket?._fromName || fromLocationName;
  const displayTo = createdTicket?._toName || toLocationName;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0b14 0%, #1a1130 40%, #0f1629 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes pop { from { opacity:0; transform: scale(0.88) translateY(30px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fly { 0%,100% { transform: translateX(0) rotate(-5deg); } 50% { transform: translateX(12px) rotate(5deg); } }
        @keyframes barcode-in { from { opacity:0; transform: scaleY(0); } to { opacity:1; transform: scaleY(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ticket-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 11px 14px;
          color: #fff; font-size: 14px; outline: none;
          transition: border-color 0.2s; width: 100%;
          box-sizing: border-box; color-scheme: dark; font-family: inherit;
        }
        .ticket-input:focus { border-color: #a78bfa; }
        .ticket-input--error { background: rgba(255,80,80,0.07); border-color: #ff5050 !important; }
        .ticket-input::placeholder { color: rgba(255,255,255,0.2); }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        .ticket-select {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 11px 14px;
          color: #fff; font-size: 14px; outline: none;
          cursor: pointer; width: 100%; box-sizing: border-box;
          transition: border-color 0.2s; font-family: inherit;
        }
        .ticket-select:focus { border-color: #a78bfa; }
        .ticket-select--error { background: rgba(255,80,80,0.07); border-color: #ff5050 !important; }
        .ticket-select option { background: #1a1528; color: #fff; }
        .action-btn:hover { transform: translateY(-2px); }
      `}</style>

      {!isGenerated ? (
        <div style={{
          width: "100%", maxWidth: 680,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24, overflow: "hidden",
          animation: "pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
            padding: "32px 36px 28px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, fontSize: 120, opacity: 0.08, transform: "rotate(-25deg)" }}>✈</div>
            <div style={{ fontSize: 36, marginBottom: 10, animation: "fly 3s ease-in-out infinite" }}>✈️</div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Plane Ticket <span style={{ color: "#c4b5fd" }}>Yarat</span>
            </h2>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              Uçuş məlumatlarını doldurun — oturacaqlar avtomatik yaranacaq
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ padding: "28px 36px 36px" }}>
            <SectionTitle icon="✈" text="Airline Məlumatları" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Airline Adı" name="airline" placeholder="məs. AZAL"
                value={form.airline} onChange={handleChange} onBlur={handleBlur}
                error={errors.airline} touched={touched.airline} />
              <Field label="Gate" name="gate" placeholder="məs. A12"
                value={form.gate} onChange={handleChange} onBlur={handleBlur}
                error={errors.gate} touched={touched.gate} />
              <Field label="Plane Modeli" name="plane" placeholder="məs. Boeing 737"
                value={form.plane} onChange={handleChange} onBlur={handleBlur}
                error={errors.plane} touched={touched.plane} />
              <Field label="Yemək Tipi" name="meal" placeholder="məs. Standard"
                value={form.meal} onChange={handleChange} onBlur={handleBlur}
                error={errors.meal} touched={touched.meal} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <Field label="Bagaj (kg) — maks. 100" name="luggageKg" type="number" min="0" max="100" step="0.5"
                value={form.luggageKg} onChange={handleChange} onBlur={handleBlur}
                error={errors.luggageKg} touched={touched.luggageKg} />
              <Field label="Uçuş Tarixi & Saatı" name="dueDate" type="datetime-local"
                value={form.dueDate} onChange={handleChange} onBlur={handleBlur}
                error={errors.dueDate} touched={touched.dueDate} />
            </div>

            {form.dueDate && !errors.dueDate && (
              <div style={{
                marginTop: 10, padding: "10px 16px",
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.25)",
                borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>🗓️</span>
                <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600 }}>
                  {formatDateFromLocal(form.dueDate)} — saat {formatTimeFromLocal(form.dueDate)}
                </span>
              </div>
            )}

            <SectionTitle icon="📍" text="Lokasiyalar" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>
                  Haradan (From) <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <select
                  value={form.locationId}
                  onChange={handleFromLocation}
                  onBlur={() => {
                    setTouched(p => ({ ...p, locationId: true }));
                    setErrors(p => ({ ...p, locationId: validate("locationId", form.locationId) }));
                  }}
                  disabled={locLoading}
                  className={`ticket-select${touched.locationId && errors.locationId ? " ticket-select--error" : ""}`}
                >
                  <option value="">{locLoading ? "Yüklənir..." : "— Lokasiya seçin —"}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}{l.country ? ` (${l.country})` : ""}</option>
                  ))}
                </select>
                {touched.locationId && errors.locationId && (
                  <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors.locationId}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>
                  Haraya (To) <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <select
                  value={form.toLocationId}
                  onChange={handleToLocation}
                  onBlur={() => {
                    setTouched(p => ({ ...p, toLocationId: true }));
                    setErrors(p => ({ ...p, toLocationId: validate("toLocationId", form.toLocationId, form) }));
                  }}
                  disabled={locLoading}
                  className={`ticket-select${touched.toLocationId && errors.toLocationId ? " ticket-select--error" : ""}`}
                >
                  <option value="">{locLoading ? "Yüklənir..." : "— Lokasiya seçin —"}</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}{l.country ? ` (${l.country})` : ""}</option>
                  ))}
                </select>
                {touched.toLocationId && errors.toLocationId && (
                  <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors.toLocationId}</span>
                )}
              </div>
            </div>

            <SectionTitle icon="💺" text="Oturacaq Konfiqurasiyası" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>
                  Variant (Sinif) <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <select
                  value={form.variantId}
                  onChange={handleVariantChange}
                  onBlur={handleVariantBlur}
                  disabled={varLoading}
                  className={`ticket-select${touched.variantId && errors.variantId ? " ticket-select--error" : ""}`}
                >
                  <option value="">{varLoading ? "Yüklənir..." : variants.length === 0 ? "— Variant yoxdur —" : "— Variant seçin —"}</option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {v.price} AZN</option>
                  ))}
                </select>
                {touched.variantId && errors.variantId && (
                  <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors.variantId}</span>
                )}
                {variants.length === 0 && !varLoading && (
                  <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>⚠ Əvvəlcə Admin paneldən Variant yaradın!</span>
                )}
              </div>

              <Field label="Sıra Sayı (maks. 50)" name="rowCount" type="number" min="1" max="50"
                value={form.rowCount} onChange={handleChange} onBlur={handleBlur}
                error={errors.rowCount} touched={touched.rowCount} />

              <Field label="Sıradakı Oturacaq (maks. 12)" name="seatsPerRow" type="number" min="1" max="12"
                value={form.seatsPerRow} onChange={handleChange} onBlur={handleBlur}
                error={errors.seatsPerRow} touched={touched.seatsPerRow} />
            </div>

            {!errors.rowCount && !errors.seatsPerRow && form.rowCount && form.seatsPerRow && (
              <div style={{
                marginTop: 10, padding: "10px 16px",
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span>💺</span>
                <span style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600 }}>
                  Cəmi {Number(form.rowCount) * Number(form.seatsPerRow)} oturacaq yaranacaq
                  ({form.rowCount} sıra × {form.seatsPerRow} oturacaq)
                </span>
              </div>
            )}

            {serverError && (
              <div style={{
                background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 10, padding: "12px 16px", marginTop: 20,
                color: "#ff8888", fontSize: 13, fontWeight: 600,
              }}>
                ⚠️ {serverError}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", marginTop: 28, padding: "15px 0",
                background: loading ? "rgba(109,40,217,0.5)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 15, fontWeight: 700, letterSpacing: "0.05em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s", boxShadow: "0 8px 32px rgba(109,40,217,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontFamily: "inherit",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18,
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite", display: "inline-block",
                  }} />
                  Yaradılır...
                </>
              ) : "✈  Bilet Yarat"}
            </button>
          </form>
        </div>

      ) : (
        <div style={{ animation: "pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{
            display: "flex", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            maxWidth: 720, width: "100%",
          }}>
            <div style={{
              flex: 1, background: "linear-gradient(160deg, #1e1537 0%, #0f1a35 100%)",
              padding: "36px 36px 36px 40px", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, fontSize: 160, opacity: 0.04, fontWeight: 900 }}>✈</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase" }}>
                    {createdTicket?.airline || form.airline}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase", marginTop: 3 }}>Boarding Pass</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: 8, padding: "4px 12px", fontSize: 10, color: "#fff", fontWeight: 800, letterSpacing: "0.1em" }}>
                  ID #{createdTicket?.id ?? "—"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {(displayFrom || "—").slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{displayFrom}</div>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4))" }} />
                  <div style={{ fontSize: 20, color: "#a78bfa", animation: "fly 3s ease-in-out infinite" }}>✈</div>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(167,139,250,0.4), transparent)" }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {(displayTo || "—").slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{displayTo}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  ["GATE",     createdTicket?.gate || form.gate],
                  ["PLANE",    createdTicket?.plane || form.plane],
                  ["MEAL",     createdTicket?.meal || form.meal],
                  ["BAGAJ",    `${createdTicket?.luggageKg ?? form.luggageKg} kg`],
                  ["TARİX",    formatDateFromLocal(displayDate)],
                  ["SAAT",     formatTimeFromLocal(displayDate)],
                  ["OTURACAQ", createdTicket?.totalTicketsCreated ?? "—"],
                  ["STATUS",   "ACTIVE"],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: 24, background: "linear-gradient(160deg, #1a1537, #0c1628)", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderLeft: "1px dashed rgba(255,255,255,0.1)", borderRight: "1px dashed rgba(255,255,255,0.1)" }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(0,0,0,0.6)" }} />
              ))}
            </div>

            <div style={{ width: 180, background: "linear-gradient(160deg, #1a1537 0%, #0c1628 100%)", padding: "36px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em" }}>{createdTicket?.airline || form.airline}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>BOARDING PASS</div>
              </div>
              <div style={{ fontSize: 12, color: "#d1d5db", fontWeight: 600, lineHeight: 1.5 }}>
                {(displayFrom || "—").slice(0, 3).toUpperCase()} → {(displayTo || "—").slice(0, 3).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Gate",  createdTicket?.gate || form.gate],
                  ["Plane", createdTicket?.plane || form.plane],
                  ["Date",  formatDateFromLocal(displayDate)],
                  ["Time",  formatTimeFromLocal(displayDate)],
                  ["Seats", createdTicket?.totalTicketsCreated ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</span>
                    <span style={{ fontSize: 10, color: "#d1d5db", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 52, marginTop: "auto", animation: "barcode-in 0.6s ease both" }}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} style={{ flex: i % 3 === 0 ? 2 : 1, height: `${45 + Math.sin(i * 1.9) * 20}%`, background: `rgba(167,139,250,${0.5 + (i % 4) * 0.12})`, borderRadius: 1 }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "＋ Yeni Bilet",    onClick: resetForm,                      bg: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
              { label: "✈ Biletlərə Bax", onClick: () => navigate("/Show-Ticket"), bg: "rgba(255,255,255,0.08)" },
              { label: "🏠 Ana Səhifə",    onClick: () => navigate("/"),            bg: "rgba(255,255,255,0.05)" },
            ].map(({ label, onClick, bg }) => (
              <button key={label} onClick={onClick} className="action-btn" style={{
                padding: "12px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                background: bg, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", transition: "transform 0.15s, opacity 0.15s",
                letterSpacing: "0.03em", fontFamily: "inherit",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}