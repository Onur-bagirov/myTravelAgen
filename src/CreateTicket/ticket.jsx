import React, { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const rules = {
  airline:     (v) => !v.trim() ? "Airline adı boş ola bilməz" : v.length > 100 ? "100 simvoldan çox ola bilməz" : null,
  gate:        (v) => !v.trim() ? "Gate boş ola bilməz" : v.length > 10 ? "10 simvoldan çox ola bilməz" : null,
  plane:       (v) => !v.trim() ? "Plane modeli boş ola bilməz" : v.length > 50 ? "50 simvoldan çox ola bilməz" : null,
  meal:        (v) => !v.trim() ? "Meal tipi boş ola bilməz" : v.length > 50 ? "50 simvoldan çox ola bilməz" : null,
  luggageKg:   (v) => Number(v) < 0 ? "Bagaj mənfi ola bilməz" : null,
  dueDate:     (v) => !v ? "Uçuş tarixi boş ola bilməz" : null,
  locationId:  (v) => !v || Number(v) < 1 ? "Haradan seçin" : null,
  variantId:   (v) => !v || Number(v) < 1 ? "Variant seçin" : null,
  toLocationId:(v) => !v || Number(v) < 1 ? "Haraya seçin" : null,
  rowCount:    (v) => !v || Number(v) < 1 ? "Sıra sayı ən azı 1 olmalıdır" : null,
  seatsPerRow: (v) => !v || Number(v) < 1 ? "Sıradakı oturacaq ən azı 1 olmalıdır" : null,
};

function parseLocations(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

const formatDate = (iso) =>
  !iso ? "—" : new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
const formatTime = (iso) =>
  !iso ? "" : new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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
        if (!res.ok) throw new Error("Lokasiyalar yuklenмedi");
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
        if (!res.ok) throw new Error("Variantlar yuklenmedi");
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setVariants(list);
        if (list.length > 0) setForm(prev => ({ ...prev, variantId: list[0].id }));
      } catch (err) {
        console.warn("Variant yuklenmedi:", err.message);
      } finally {
        setVarLoading(false);
      }
    };

    fetchLocations();
    fetchVariants();
  }, []);

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

  const handleFromLocation = (e) => {
    const id = e.target.value;
    setForm(prev => ({ ...prev, locationId: id }));
    setFromLocationName(locations.find(l => String(l.id) === String(id))?.name || "");
    if (touched.locationId) setErrors(prev => ({ ...prev, locationId: validate("locationId", id) }));
  };

  const handleToLocation = (e) => {
    const id = e.target.value;
    setForm(prev => ({ ...prev, toLocationId: id }));
    setToLocationName(locations.find(l => String(l.id) === String(id))?.name || "");
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};
    ["airline","gate","plane","meal","luggageKg","dueDate","locationId","toLocationId","variantId","rowCount","seatsPerRow"].forEach(f => {
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
      airline: form.airline.trim(),
      gate: form.gate.trim(),
      plane: form.plane.trim(),
      meal: form.meal.trim(),
      luggageKg: Number(form.luggageKg),
      dueDate: new Date(form.dueDate).toISOString(),
      fromId: Number(form.locationId),
      toId: Number(form.toLocationId),
      seatGroups: [{
        variantId: Number(form.variantId),
        rowCount: Number(form.rowCount),
        seatsPerRow: Number(form.seatsPerRow),
      }],
    };

    try {
      console.log("📤 Göndərilən payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(`${BASE_URL}/PlaneTicket`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      console.log("📥 Server cavabı (raw):", responseText);

      if (!res.ok) {
        let errMsg = `Server xətası: ${res.status}`;
        try {
          const errJson = JSON.parse(responseText);
          console.log("📥 Server xətası (JSON):", errJson);
          // ASP.NET validation errors
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
      setCreatedTicket(ticket);
      setIsGenerated(true);
    } catch (err) {
      setServerError(err.message || "Naməlum xəta baş verdi.");
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
    setForm({ airline: "", gate: "", plane: "", meal: "", luggageKg: 23, dueDate: "", locationId: "", toLocationId: "", variantId: variants.length > 0 ? variants[0].id : "", rowCount: 10, seatsPerRow: 6 });
  };

  const Field = ({ label, name, type = "text", placeholder, min, step }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>{label}</label>
      <input
        name={name} type={type} value={form[name]}
        onChange={handleChange} onBlur={handleBlur}
        placeholder={placeholder} min={min} step={step}
        autoComplete="off"
        style={{
          background: errors[name] && touched[name] ? "rgba(255,80,80,0.07)" : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${errors[name] && touched[name] ? "#ff5050" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 10,
          padding: "11px 14px",
          color: "#fff",
          fontSize: 14,
          outline: "none",
          transition: "border 0.2s",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = "#a78bfa"}
      />
      {touched[name] && errors[name] && (
        <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors[name]}</span>
      )}
    </div>
  );

  const LocationSelect = ({ label, value, onChange, fieldKey }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>{label}</label>
      <select
        value={value} onChange={onChange} disabled={locLoading}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "11px 14px",
          color: value ? "#fff" : "#666",
          fontSize: 14,
          outline: "none",
          cursor: "pointer",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = "#a78bfa"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
      >
        <option value="" style={{ background: "#1a1528" }}>
          {locLoading ? "Yüklənir..." : "— Lokasiya seçin —"}
        </option>
        {locations.map(l => (
          <option key={l.id} value={l.id} style={{ background: "#1a1528" }}>
            {l.name}{l.country ? ` (${l.country})` : ""}
          </option>
        ))}
      </select>
      {fieldKey === "locationId" && touched.locationId && errors.locationId && (
        <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors.locationId}</span>
      )}
    </div>
  );

  const SectionTitle = ({ icon, text }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px", borderBottom: "1px solid rgba(167,139,250,0.2)", paddingBottom: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa" }}>{text}</span>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0b14 0%, #1a1130 40%, #0f1629 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes pop { from { opacity:0; transform: scale(0.88) translateY(30px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fly { 0%,100% { transform: translateX(0) rotate(-5deg); } 50% { transform: translateX(12px) rotate(5deg); } }
        @keyframes barcode-in { from { opacity:0; transform: scaleY(0); } to { opacity:1; transform: scaleY(1); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        select option { background: #1a1528; color: #fff; }
      `}</style>

      {!isGenerated ? (
        /* ── FORM ── */
        <div style={{
          width: "100%", maxWidth: 680,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          overflow: "hidden",
          animation: "pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
            padding: "32px 36px 28px",
            position: "relative",
            overflow: "hidden",
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
              <Field label="Airline Adı" name="airline" placeholder="məs. AZAL" />
              <Field label="Gate" name="gate" placeholder="məs. A12" />
              <Field label="Plane Modeli" name="plane" placeholder="məs. Boeing 737" />
              <Field label="Yemək Tipi" name="meal" placeholder="məs. Standard" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <Field label="Bagaj (kg)" name="luggageKg" type="number" min="0" step="0.5" />
              <Field label="Uçuş Tarixi & Saatı" name="dueDate" type="datetime-local" />
            </div>

            <SectionTitle icon="📍" text="Lokasiyalar" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <LocationSelect label="Haradan (From) *" value={form.locationId} onChange={handleFromLocation} fieldKey="locationId" />
              <LocationSelect label="Haraya (To)" value={form.toLocationId} onChange={handleToLocation} fieldKey="toLocationId" />
            </div>

            <SectionTitle icon="💺" text="Oturacaq Konfiqurasiyası" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {/* Variant Select */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7fa8" }}>Variant (Sinif)</label>
                <select
                  value={form.variantId}
                  onChange={e => { setForm(prev => ({ ...prev, variantId: e.target.value })); if (touched.variantId) setErrors(prev => ({ ...prev, variantId: !e.target.value ? "Variant seçin" : null })); }}
                  onBlur={() => { setTouched(p => ({ ...p, variantId: true })); setErrors(p => ({ ...p, variantId: !form.variantId ? "Variant seçin" : null })); }}
                  disabled={varLoading}
                  style={{
                    background: errors.variantId && touched.variantId ? "rgba(255,80,80,0.07)" : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${errors.variantId && touched.variantId ? "#ff5050" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 10, padding: "11px 14px", color: form.variantId ? "#fff" : "#666",
                    fontSize: 14, outline: "none", cursor: "pointer", width: "100%", boxSizing: "border-box",
                  }}
                >
                  <option value="" style={{ background: "#1a1528" }}>
                    {varLoading ? "Yüklənir..." : variants.length === 0 ? "— Variant yoxdur —" : "— Variant seçin —"}
                  </option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id} style={{ background: "#1a1528" }}>
                      {v.name} — {v.price} AZN
                    </option>
                  ))}
                </select>
                {touched.variantId && errors.variantId && (
                  <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 600 }}>⚠ {errors.variantId}</span>
                )}
                {variants.length === 0 && !varLoading && (
                  <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>⚠ Əvvəlcə Admin paneldən Variant yaradın!</span>
                )}
              </div>
              <Field label="Sıra Sayı" name="rowCount" type="number" min="1" />
              <Field label="Sıradakı Oturacaq" name="seatsPerRow" type="number" min="1" />
            </div>

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
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)",
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
        /* ── BOARDING PASS ── */
        <div style={{ animation: "pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div style={{
            display: "flex", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            maxWidth: 720, width: "100%",
          }}>
            {/* Left */}
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
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase", marginTop: 3 }}>
                    Boarding Pass
                  </div>
                </div>
                <div style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  borderRadius: 8, padding: "4px 12px",
                  fontSize: 10, color: "#fff", fontWeight: 800, letterSpacing: "0.1em",
                }}>
                  ID #{createdTicket?.id ?? "—"}
                </div>
              </div>

              {/* Route */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {(createdTicket?._fromName || fromLocationName || "—").slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {createdTicket?._fromName || fromLocationName}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4))" }} />
                  <div style={{ fontSize: 20, color: "#a78bfa", animation: "fly 3s ease-in-out infinite" }}>✈</div>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(167,139,250,0.4), transparent)" }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {(createdTicket?._toName || toLocationName || "—").slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {createdTicket?._toName || toLocationName}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  ["GATE", createdTicket?.gate || form.gate],
                  ["PLANE", createdTicket?.plane || form.plane],
                  ["MEAL", createdTicket?.meal || form.meal],
                  ["BAGAJ", `${createdTicket?.luggageKg ?? form.luggageKg} kg`],
                  ["TARİX", formatDate(createdTicket?.dueDate || form.dueDate)],
                  ["SAAT", formatTime(createdTicket?.dueDate || form.dueDate)],
                  ["OTURACAQ", createdTicket?.totalTicketsCreated ?? "—"],
                  ["STATUS", "ACTIVE"],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.04)", borderRadius: 8,
                    padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perforation */}
            <div style={{
              width: 24, background: "linear-gradient(160deg, #1a1537, #0c1628)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              alignItems: "center", padding: "20px 0",
              borderLeft: "1px dashed rgba(255,255,255,0.1)",
              borderRight: "1px dashed rgba(255,255,255,0.1)",
            }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(0,0,0,0.6)" }} />
              ))}
            </div>

            {/* Stub */}
            <div style={{
              width: 180, background: "linear-gradient(160deg, #1a1537 0%, #0c1628 100%)",
              padding: "36px 20px", display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em" }}>
                  {createdTicket?.airline || form.airline}
                </div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>BOARDING PASS</div>
              </div>
              <div style={{ fontSize: 12, color: "#d1d5db", fontWeight: 600, lineHeight: 1.5 }}>
                {(createdTicket?._fromName || fromLocationName || "—").slice(0,3).toUpperCase()}
                &nbsp;→&nbsp;
                {(createdTicket?._toName || toLocationName || "—").slice(0,3).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Gate", createdTicket?.gate || form.gate],
                  ["Plane", createdTicket?.plane || form.plane],
                  ["Date", formatDate(createdTicket?.dueDate || form.dueDate)],
                  ["Time", formatTime(createdTicket?.dueDate || form.dueDate)],
                  ["Seats", createdTicket?.totalTicketsCreated ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</span>
                    <span style={{ fontSize: 10, color: "#d1d5db", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Barcode */}
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 2, height: 52, marginTop: "auto",
                animation: "barcode-in 0.6s ease both",
              }}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} style={{
                    flex: i % 3 === 0 ? 2 : 1,
                    height: `${45 + Math.sin(i * 1.9) * 20}%`,
                    background: `rgba(167,139,250,${0.5 + (i % 4) * 0.12})`,
                    borderRadius: 1,
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "＋ Yeni Bilet", onClick: resetForm, bg: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
              { label: "✈ Biletlərə Bax", onClick: () => navigate("/Show-Ticket"), bg: "rgba(255,255,255,0.08)" },
              { label: "🏠 Ana Səhifə", onClick: () => navigate("/"), bg: "rgba(255,255,255,0.05)" },
            ].map(({ label, onClick, bg }) => (
              <button key={label} onClick={onClick} style={{
                padding: "12px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                background: bg, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", transition: "transform 0.15s, opacity 0.15s",
                letterSpacing: "0.03em",
              }}
                onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.target.style.transform = "translateY(0)"}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}