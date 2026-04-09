import { useState, useEffect, useCallback } from "react";
import "./addL.css";

const API_BASE = "http://localhost:5170/api";
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function AddLocation() {
  const [locations, setLocations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [form, setForm] = useState({ name: "", countryId: "", distanceToken: "" });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", countryId: "", distanceToken: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filterCountryId, setFilterCountryId] = useState("");

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_BASE}/Country?Page=1&Limit=200`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setCountries(data.data?.items ?? data.items ?? []);
    } catch {}
  };

  useEffect(() => { fetchCountries(); }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/Location?Page=${page}&Limit=${limit}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Lokasiyalar yuklenmedi");
      const data = await res.json();
      setLocations(data.data?.items ?? data.items ?? []);
      setTotalCount(data.data?.totalDataCount ?? data.totalDataCount ?? 0);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Ad bos ola bilmez";
    if (!form.countryId) errors.countryId = "Olke secin";
    if (form.distanceToken === "" || isNaN(Number(form.distanceToken))) errors.distanceToken = "Token daxil edin";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: form.name.trim(), countryId: Number(form.countryId), distanceToken: Number(form.distanceToken) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e?.message ?? "Xeta"); }
      showAlert("success", "Lokasiya elave edildi!");
      setForm({ name: "", countryId: "", distanceToken: "" });
      setFormErrors({});
      fetchLocations();
    } catch (err) { showAlert("error", err.message); }
    finally { setSubmitting(false); }
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setEditForm({ name: loc.name, countryId: String(loc.countryId), distanceToken: String(loc.distanceToken) });
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleUpdate = async (id) => {
    if (!editForm.name.trim() || !editForm.countryId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id, name: editForm.name.trim(), countryId: Number(editForm.countryId), distanceToken: Number(editForm.distanceToken) || 0 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e?.message ?? "Yenilenmedi"); }
      showAlert("success", "Lokasiya yenilendi!");
      cancelEdit();
      fetchLocations();
    } catch (err) { showAlert("error", err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, locName) => {
    if (!window.confirm(`"${locName}" silinsin?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e?.message ?? "Silinmedi"); }
      showAlert("success", `"${locName}" silindi!`);
      fetchLocations();
    } catch (err) { showAlert("error", err.message); }
    finally { setSubmitting(false); }
  };

  const getCountryName = (countryId) => {
    const c = countries.find((c) => c.id === countryId);
    return c ? c.name : String(countryId);
  };

  const displayed = filterCountryId
    ? locations.filter((l) => String(l.countryId) === filterCountryId)
    : locations;

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="location-panel">
      <div className="location-panel__header">
        <div className="location-panel__icon">📍</div>
        <h2>Lokasiya Idareetmesi</h2>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "success" ? "✅" : "❌"} {alert.msg}
        </div>
      )}

      <div className="location-form-card">
        <h3>Yeni Lokasiya Elave Et</h3>
        <div className="location-form-grid">
          <div className="form-group">
            <label>Lokasiya Adi</label>
            <input
              className={`form-input ${formErrors.name ? "error" : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Mes: Baki"
            />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Olke</label>
            <select
              className={`form-select ${formErrors.countryId ? "error" : ""}`}
              value={form.countryId}
              onChange={(e) => setForm((p) => ({ ...p, countryId: e.target.value }))}
            >
              <option value="">Olke secin</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {formErrors.countryId && <span className="form-error">{formErrors.countryId}</span>}
          </div>

          <div className="form-group">
            <label>Mesafe Token</label>
            <input
              className={`form-input ${formErrors.distanceToken ? "error" : ""}`}
              type="number"
              min="0"
              value={form.distanceToken}
              onChange={(e) => setForm((p) => ({ ...p, distanceToken: e.target.value }))}
              placeholder="0"
            />
            {formErrors.distanceToken && <span className="form-error">{formErrors.distanceToken}</span>}
          </div>

          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting} style={{ alignSelf: "flex-end" }}>
            {submitting ? "Gozleyin..." : "Elave Et"}
          </button>
        </div>
      </div>

      <div className="location-table-card">
        <div className="location-table-card__header">
          <h3>Lokasiyalar Siyahisi</h3>
          <div className="header-right">
            <select className="filter-select" value={filterCountryId} onChange={(e) => setFilterCountryId(e.target.value)}>
              <option value="">Butun Olkeler</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <span className="badge">{totalCount} lokasiya</span>
          </div>
        </div>

        <table className="location-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ad</th>
              <th>Olke</th>
              <th>Token</th>
              <th>Emeliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row"><td colSpan={5}>Yuklenir...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state">Hec bir lokasiya tapilmadi.</div></td></tr>
            ) : (
              displayed.map((loc) => (
                <tr key={loc.id}>
                  <td><span className="loc-id">#{loc.id}</span></td>
                  <td>
                    {editingId === loc.id
                      ? <input className="inline-edit-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
                      : <span className="loc-name">{loc.name}</span>}
                  </td>
                  <td>
                    {editingId === loc.id
                      ? (
                        <select className="inline-edit-select" value={editForm.countryId} onChange={(e) => setEditForm((p) => ({ ...p, countryId: e.target.value }))}>
                          {countries.map((c) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
                        </select>
                      )
                      : <span className="country-tag">{loc.country ?? getCountryName(loc.countryId)}</span>}
                  </td>
                  <td>
                    {editingId === loc.id
                      ? <input className="inline-edit-number" type="number" min="0" value={editForm.distanceToken} onChange={(e) => setEditForm((p) => ({ ...p, distanceToken: e.target.value }))} />
                      : <span className="distance-badge">{loc.distanceToken}</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {editingId === loc.id ? (
                        <>
                          <button className="btn btn-primary" style={{ padding: "7px 14px", fontSize: "13px" }} onClick={() => handleUpdate(loc.id)} disabled={submitting}>Saxla</button>
                          <button className="btn btn-secondary" style={{ padding: "7px 14px", fontSize: "13px" }} onClick={cancelEdit}>Legv</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-edit" onClick={() => startEdit(loc)}>Duzel</button>
                          <button className="btn btn-del" onClick={() => handleDelete(loc.id, loc.name)} disabled={submitting}>Sil</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary" style={{ padding: "6px 14px" }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Evvel</button>
            <span>{page} / {totalPages}</span>
            <button className="btn btn-secondary" style={{ padding: "6px 14px" }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Novbeti</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddLocation;