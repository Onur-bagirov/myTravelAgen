import { useState, useEffect } from "react";
import "./createTrain.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// datetime-local dəyərini (2026-04-11T14:30) backend üçün düzgün formata çevirir
// toISOString() UTC-yə çevirir və saat fərqi yaranır — bunu etmirik
function toLocalISOString(localDatetimeStr) {
  if (!localDatetimeStr) return "";
  // "2026-04-11T14:30" → "2026-04-11T14:30:00"
  return localDatetimeStr.length === 16 ? localDatetimeStr + ":00" : localDatetimeStr;
}

export default function CreateTrainTicket({ onCreated }) {
  const [locations, setLocations] = useState([]);
  const [variants, setVariants] = useState([]);

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

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []))
      .catch(err => console.error("Location xətası:", err));

    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setVariants(list);
        if (list.length > 0) {
          setSeatGroups([{ variantId: String(list[0].id), rowCount: 5, seatsPerRow: 4 }]);
        }
      })
      .catch(err => console.error("Variant xətası:", err));
  }, []);

  const handleForm = e => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === "number" ? Number(value) : value }));
  };

  const handleGroup = (idx, field, val) =>
    setSeatGroups(prev => prev.map((g, i) =>
      i === idx ? { ...g, [field]: field === "variantId" ? val : Number(val) } : g
    ));

  const addGroup = () =>
    setSeatGroups(p => [
      ...p,
      { variantId: variants[0] ? String(variants[0].id) : "", rowCount: 5, seatsPerRow: 4 },
    ]);

  const removeGroup = idx =>
    setSeatGroups(p => p.filter((_, i) => i !== idx));

  const totalSeats = seatGroups.reduce(
    (s, g) => s + Number(g.rowCount) * Number(g.seatsPerRow), 0
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    if (!form.trainCompany.trim() || !form.fromId || !form.toId || !form.dueDate) {
      setServerError("Zəhmət olmasa bütün vacib xanaları doldurun.");
      return;
    }
    if (form.fromId === form.toId) {
      setServerError("Çıxış və gəliş lokasiyaları eyni ola bilməz.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        trainCompany: form.trainCompany,
        trainNumber: form.trainNumber,
        vagonNumber: Number(form.vagonNumber),
        dueDate: toLocalISOString(form.dueDate), // ← UTC çevirmə yox, birbaşa
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
      if (!res.ok) throw new Error(json?.message || "Server xətası yarandı.");

      setSuccessMsg(`✅ Qatar bileti uğurla yaradıldı! (${totalSeats} oturacaq)`);
      setForm({
        trainCompany: "",
        trainNumber: "",
        vagonNumber: 1,
        dueDate: "",
        fromId: "",
        toId: "",
      });

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
        <header className="ct-header">
          <div className="ct-header-loco">🚆</div>
          <div className="ct-header-text">
            <h1 className="ct-title">StepTravels <span>Admin</span></h1>
            <p className="ct-subtitle">Cəmi: <strong>{totalSeats} oturacaq</strong> yaradılır.</p>
          </div>
        </header>

        {serverError && <div className="ct-alert ct-alert--error">{serverError}</div>}
        {successMsg && <div className="ct-alert ct-alert--success">{successMsg}</div>}

        <form className="ct-form" onSubmit={handleSubmit}>
          <section className="ct-section">
            <h2 className="ct-section-title"><span>🚂</span> Qatar Detalları</h2>
            <div className="ct-grid-2">
              <div className="ct-field">
                <label>Şirkət</label>
                <input
                  name="trainCompany"
                  value={form.trainCompany}
                  onChange={handleForm}
                  placeholder="ADY"
                  required
                />
              </div>
              <div className="ct-field">
                <label>Qatar №</label>
                <input
                  name="trainNumber"
                  value={form.trainNumber}
                  onChange={handleForm}
                  placeholder="T-100"
                  required
                />
              </div>
              <div className="ct-field">
                <label>Tarix (Gediş vaxtı)</label>
                <input
                  name="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={handleForm}
                  required
                />
              </div>
              <div className="ct-field">
                <label>Vaqon №</label>
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
            <h2 className="ct-section-title"><span>📍</span> Marşrut Seçimi</h2>
            <div className="ct-grid-2">
              <div className="ct-field">
                <label>Haradan</label>
                <select name="fromId" value={form.fromId} onChange={handleForm} required>
                  <option value="">Şəhər seçin...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              </div>
              <div className="ct-field">
                <label>Haraya</label>
                <select name="toId" value={form.toId} onChange={handleForm} required>
                  <option value="">Şəhər seçin...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="ct-section">
            <h2 className="ct-section-title"><span>💺</span> Siniflər və Oturacaqlar</h2>
            {seatGroups.map((g, idx) => (
              <div key={idx} className="ct-group-box">
                <div className="ct-group-header">
                  <span>Qrup {idx + 1}</span>
                  {seatGroups.length > 1 && (
                    <button type="button" className="ct-remove-btn" onClick={() => removeGroup(idx)}>
                      Sil
                    </button>
                  )}
                </div>
                <div className="ct-grid-3">
                  <div className="ct-field">
                    <label>Sinif (Variant)</label>
                    <select
                      value={g.variantId}
                      onChange={e => handleGroup(idx, "variantId", e.target.value)}
                      required
                    >
                      <option value="">Seçin...</option>
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>{v.name} - {v.price}₼</option>
                      ))}
                    </select>
                  </div>
                  <div className="ct-field">
                    <label>Sıra sayı</label>
                    <input
                      type="number"
                      min={1}
                      value={g.rowCount}
                      onChange={e => handleGroup(idx, "rowCount", e.target.value)}
                    />
                  </div>
                  <div className="ct-field">
                    <label>Oturacaq/Sıra</label>
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
              + Yeni Sinif Qrupu
            </button>
          </section>

          <button type="submit" className="ct-submit-btn" disabled={loading}>
            {loading ? "Gözləyin..." : `🚆 BİLETLƏRİ YARAT (${totalSeats} oturacaq)`}
          </button>
        </form>
      </div>
    </div>
  );
}