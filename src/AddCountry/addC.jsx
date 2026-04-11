import React, { useState, useEffect, useCallback } from "react";
import "./addC.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export default function AddCountry() {
  const [countries, setCountries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const [expandedCountryId, setExpandedCountryId] = useState(null);
  const [subLocations, setSubLocations] = useState({});
  const [subLoading, setSubLoading] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Country?Page=${page}&Limit=${limit}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load countries");
      const data = await res.json();
      setCountries(Array.isArray(data.data) ? data.data : []);
      setTotalCount(data.totalDataCount ?? 0);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  const fetchSubLocations = async (countryId) => {
    if (subLocations[countryId]) return;
    setSubLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Location?Page=1&Limit=100`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      const allLocs = Array.isArray(data.data) ? data.data : [];
      const filtered = allLocs.filter((l) => l.countryId === countryId);
      setSubLocations((prev) => ({ ...prev, [countryId]: filtered }));
    } catch {
      setSubLocations((prev) => ({ ...prev, [countryId]: [] }));
    } finally {
      setSubLoading(false);
    }
  };

  const handleToggleExpand = (countryId) => {
    if (expandedCountryId === countryId) {
      setExpandedCountryId(null);
    } else {
      setExpandedCountryId(countryId);
      fetchSubLocations(countryId);
    }
  };

  const validate = () => {
    if (!name.trim()) {
      setNameError("Country name cannot be empty");
      return false;
    }
    if (name.trim().length < 2) {
      setNameError("Country name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Country`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "An error occurred");
      }
      showAlert("success", `"${name.trim()}" successfully added!`);
      setName("");
      fetchCountries();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (country) => {
    setEditingId(country.id);
    setEditName(country.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Country`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Update failed");
      }
      showAlert("success", "Country successfully updated!");
      cancelEdit();
      fetchCountries();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, countryName) => {
    if (!window.confirm(`Are you sure you want to delete "${countryName}"?`))
      return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Country`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Delete failed");
      }
      showAlert("success", `"${countryName}" deleted!`);
      if (expandedCountryId === id) setExpandedCountryId(null);
      setSubLocations((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      fetchCountries();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="country-panel">
      <div className="country-panel__header">
        <div className="country-panel__icon">🌍</div>
        <h2>Country Management</h2>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "success" ? "✅" : "❌"} {alert.msg}
        </div>
      )}

      <div className="country-form-card">
        <h3>➕ Add New Country</h3>
        <div className="country-form-row">
          <div className="form-group">
            <label htmlFor="countryName">Country Name</label>
            <input
              id="countryName"
              className={`form-input ${nameError ? "error" : ""}`}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Azerbaijan"
            />
            {nameError && <span className="form-error">{nameError}</span>}
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? <><span className="spinner" />Please wait...</> : "➕ Add Country"}
          </button>
        </div>
      </div>

      <div className="country-table-card">
        <div className="country-table-card__header">
          <h3>📋 Countries List</h3>
          <span className="badge">{totalCount} countries</span>
        </div>

        <table className="country-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Country Name</th>
              <th>Locations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row">
                <td colSpan={4}><span className="spinner" /> Loading...</td>
              </tr>
            ) : countries.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state"><p>No countries have been added yet.</p></div>
                </td>
              </tr>
            ) : (
              countries.map((country) => (
                <React.Fragment key={country.id}>
                  <tr>
                    <td><span className="country-id">#{country.id}</span></td>
                    <td>
                      {editingId === country.id ? (
                        <input
                          className="inline-edit-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(country.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="country-name">{country.name}</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: "12px", padding: "5px 12px" }}
                        onClick={() => handleToggleExpand(country.id)}
                      >
                        {expandedCountryId === country.id ? "▲ Hide" : "▼ Locations"}
                      </button>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {editingId === country.id ? (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "7px 14px", fontSize: "13px" }}
                              onClick={() => handleUpdate(country.id)}
                              disabled={submitting}
                            >
                              ✔ Save
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "7px 14px", fontSize: "13px" }}
                              onClick={cancelEdit}
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-edit" onClick={() => startEdit(country)}>
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-del"
                              onClick={() => handleDelete(country.id, country.name)}
                              disabled={submitting}
                            >
                              🗑 Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedCountryId === country.id && (
                    <tr key={`sub-${country.id}`}>
                      <td colSpan={4} style={{ padding: 0 }}>
                        <div className="sub-locations">
                          <div className="sub-locations-title">
                            📍 {country.name} — Locations
                          </div>
                          {subLoading ? (
                            <div style={{ color: "#aaa", fontSize: "13px" }}>
                              <span className="spinner" /> Loading...
                            </div>
                          ) : (subLocations[country.id] ?? []).length === 0 ? (
                            <div style={{ color: "#bbb", fontSize: "13px" }}>
                              No locations found for this country.
                            </div>
                          ) : (
                            (subLocations[country.id] ?? []).map((loc) => (
                              <div key={loc.id} className="sub-location-item">
                                <span className="sub-location-dot" />
                                <strong>{loc.name}</strong>
                                <span style={{ color: "#aaa", fontSize: "12px" }}>
                                  — {loc.distanceToken} tokens
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 14px" }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 14px" }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}