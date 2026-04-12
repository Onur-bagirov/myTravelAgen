import { useState, useEffect } from "react";
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

export default function CreateTrainTicket({ onCreated }) {
  const [locations, setLocations] = useState([]);
  const [variants, setVariants]   = useState([]);

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
    fetch(`${BASE_URL}/Location?Limit=200&Page=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d?.data) ? d.data : []));

    fetch(`${BASE_URL}/Variant?Page=1&Limit=100`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.data) ? d.data : [];
        setVariants(list);
        if (list.length > 0)
          setSeatGroups([{ variantId: String(list[0].id), rowCount: 5, seatsPerRow: 4 }]);
      });
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
              Total: <strong>{totalSeats} seats</strong> will be created
            </p>
          </div>
        </div>

        {serverError && <div className="ct-alert ct-alert--error">{serverError}</div>}
        {successMsg  && <div className="ct-alert ct-alert--success">✅ {successMsg}</div>}

        <form className="ct-form" onSubmit={handleSubmit}>

          {/* Train Details */}
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

          {/* Route */}
          <section className="ct-section">
            <h2 className="ct-section-title">📍 Route</h2>
            <div className="ct-grid-2">
              <div className="ct-field">
                <label>From</label>
                <select name="fromId" value={form.fromId} onChange={handleForm} required>
                  <option value="">Select city...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              </div>
              <div className="ct-field">
                <label>To</label>
                <select name="toId" value={form.toId} onChange={handleForm} required>
                  <option value="">Select city...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.country}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Seat Classes */}
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