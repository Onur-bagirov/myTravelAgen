import { useState, useEffect, useCallback } from "react";
import "./addL.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const getHeaders = () => ({
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
      const res = await fetch(`${API_BASE}/Country?page=1&size=100`, {
        headers: getHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setCountries(Array.isArray(data.data) ? data.data : []);
    } catch {}
  };

  useEffect(() => { fetchCountries(); }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Location?Page=${page}&Limit=${limit}`,
        { headers: getHeaders() }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      setLocations(Array.isArray(data.data) ? data.data : []);
      setTotalCount(data.totalDataCount ?? 0);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = "Name cannot be empty";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    if (!form.countryId) {
      errors.countryId = "Select a country";
    }
    if (form.distanceToken === "" || isNaN(Number(form.distanceToken))) {
      errors.distanceToken = "Token is required";
    }
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
        body: JSON.stringify({
          name: form.name.trim(),
          countryId: Number(form.countryId),
          distanceToken: Number(form.distanceToken),
          country: null 
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? `Error ${res.status}`);
      }
      showAlert("success", "Location added successfully!");
      setForm({ name: "", countryId: "", distanceToken: "" });
      setFormErrors({});
      fetchLocations();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name,
      countryId: String(loc.countryId),
      distanceToken: String(loc.distanceToken),
    });
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id) => {
    if (!editForm.name.trim() || !editForm.countryId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: Number(id),
          name: editForm.name.trim(),
          countryId: Number(editForm.countryId),
          distanceToken: Number(editForm.distanceToken),
          country: null 
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? "Update failed");
      }
      showAlert("success", "Location updated successfully!");
      cancelEdit();
      fetchLocations();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, locName) => {
    if (!window.confirm(`Are you sure you want to delete "${locName}"?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id: Number(id) }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? "Delete failed");
      }
      showAlert("success", `"${locName}" deleted!`);
      fetchLocations();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCountryName = (countryId) =>
    countries.find((c) => c.id === countryId)?.name ?? String(countryId);

  const displayed = filterCountryId
    ? locations.filter((l) => String(l.countryId) === filterCountryId)
    : locations;

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="location-panel">
      <div className="location-panel__header">
        <div className="location-panel__icon">📍</div>
        <h2>Location Management</h2>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "success" ? "✅" : "❌"} {alert.msg}
        </div>
      )}

      <div className="location-form-card">
        <h3>Add New Location</h3>
        <div className="location-form-grid">
          <div className="form-group">
            <label>Location Name</label>
            <input
              className={`form-input ${formErrors.name ? "error" : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Baku"
            />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Country</label>
            <select
              className={`form-select ${formErrors.countryId ? "error" : ""}`}
              value={form.countryId}
              onChange={(e) => setForm((p) => ({ ...p, countryId: e.target.value }))}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {formErrors.countryId && <span className="form-error">{formErrors.countryId}</span>}
          </div>

          <div className="form-group">
            <label>Distance Token</label>
            <input
              className={`form-input ${formErrors.distanceToken ? "error" : ""}`}
              type="number"
              value={form.distanceToken}
              onChange={(e) => setForm((p) => ({ ...p, distanceToken: e.target.value }))}
              placeholder="e.g. 120"
            />
            {formErrors.distanceToken && <span className="form-error">{formErrors.distanceToken}</span>}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={submitting}
            style={{ alignSelf: "flex-end" }}
          >
            {submitting ? "Waiting..." : "Add Location"}
          </button>
        </div>
      </div>

      <div className="location-table-card">
        <div className="location-table-card__header">
          <h3>Locations List</h3>
          <div className="header-right">
            <select
              className="filter-select"
              value={filterCountryId}
              onChange={(e) => setFilterCountryId(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <span className="badge">{totalCount} locations</span>
          </div>
        </div>

        <table className="location-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Country</th>
              <th>Token</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row"><td colSpan={5}>Loading...</td></tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">No locations found.</div>
                </td>
              </tr>
            ) : (
              displayed.map((loc) => (
                <tr key={loc.id}>
                  <td><span className="loc-id">#{loc.id}</span></td>
                  <td>
                    {editingId === loc.id ? (
                      <input
                        className="inline-edit-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="loc-name">{loc.name}</span>
                    )}
                  </td>
                  <td>
                    {editingId === loc.id ? (
                      <select
                        className="inline-edit-select"
                        value={editForm.countryId}
                        onChange={(e) => setEditForm((p) => ({ ...p, countryId: e.target.value }))}
                      >
                        {countries.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="country-tag">{loc.country?.name ?? getCountryName(loc.countryId)}</span>
                    )}
                  </td>
                  <td>
                    {editingId === loc.id ? (
                      <input
                        className="inline-edit-number"
                        type="number"
                        value={editForm.distanceToken}
                        onChange={(e) => setEditForm((p) => ({ ...p, distanceToken: e.target.value }))}
                      />
                    ) : (
                      <span className="distance-badge">{loc.distanceToken}</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {editingId === loc.id ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpdate(loc.id)}
                            disabled={submitting}
                          >
                            Save
                          </button>
                          <button className="btn btn-secondary" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-edit" onClick={() => startEdit(loc)}>Edit</button>
                          <button
                            className="btn btn-del"
                            onClick={() => handleDelete(loc.id, loc.name)}
                            disabled={submitting}
                          >
                            Delete
                          </button>
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
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddLocation;