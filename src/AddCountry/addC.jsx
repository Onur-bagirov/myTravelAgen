import { useState, useEffect, useCallback } from "react";
import "./addC.css";

const API_BASE = "http://localhost:5170/api";

// Token-i localStorage-dən al (login zamanı saxlanılmış olmalıdır)
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
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
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg }

  // Locations altında göstər
  const [expandedCountryId, setExpandedCountryId] = useState(null);
  const [subLocations, setSubLocations] = useState({});
  const [subLoading, setSubLoading] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  // ─── Fetch Countries ───────────────────────────────────────────────
  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Country?Page=${page}&Limit=${limit}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Ölkələr yüklənmədi");
      const data = await res.json();
      // xeta burada idi
      setCountries(Array.isArray(data.data) ? data.data : []);
      setTotalCount(data.totalDataCount ?? 0);
      } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // ─── Fetch Locations of a Country ─────────────────────────────────
  const fetchSubLocations = async (countryId) => {
    if (subLocations[countryId]) return; // cache
    setSubLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Location?Page=1&Limit=100`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const allLocs = data.data?.items ?? data.items ?? [];
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

  // ─── Validate ──────────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim()) {
      setNameError("Ölkə adı boş ola bilməz");
      return false;
    }
    if (name.trim().length < 2) {
      setNameError("Ölkə adı ən azı 2 hərf olmalıdır");
      return false;
    }
    setNameError("");
    return true;
  };

  // ─── Create Country ────────────────────────────────────────────────
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
        const err = await res.json();
        throw new Error(err?.message ?? "Xəta baş verdi");
      }
      showAlert("success", `"${name.trim()}" uğurla əlavə edildi!`);
      setName("");
      fetchCountries();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Start Edit ────────────────────────────────────────────────────
  const startEdit = (country) => {
    setEditingId(country.id);
    setEditName(country.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // ─── Update Country ────────────────────────────────────────────────
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
        const err = await res.json();
        throw new Error(err?.message ?? "Yenilənmədi");
      }
      showAlert("success", "Ölkə uğurla yeniləndi!");
      cancelEdit();
      fetchCountries();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Country ────────────────────────────────────────────────
  const handleDelete = async (id, countryName) => {
    if (!window.confirm(`"${countryName}" ölkəsini silmək istədiyinizə əminsiniz?`))
      return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Country`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Silinmədi");
      }
      showAlert("success", `"${countryName}" silindi!`);
      // expanded-i təmizlə
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
      {/* Header */}
      <div className="country-panel__header">
        <div className="country-panel__icon">🌍</div>
        <h2>Ölkə İdarəetməsi</h2>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "success" ? "✅" : "❌"} {alert.msg}
        </div>
      )}

      {/* Add Form */}
      <div className="country-form-card">
        <h3>➕ Yeni Ölkə Əlavə Et</h3>
        <div className="country-form-row">
          <div className="form-group">
            <label htmlFor="countryName">Ölkə Adı</label>
            <input
              id="countryName"
              className={`form-input ${nameError ? "error" : ""}`}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Məs: Azərbaycan"
            />
            {nameError && <span className="form-error">{nameError}</span>}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? <><span className="spinner" />Gözləyin...</> : "➕ Əlavə Et"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="country-table-card">
        <div className="country-table-card__header">
          <h3>📋 Ölkələr Siyahısı</h3>
          <span className="badge">{totalCount} ölkə</span>
        </div>

        <table className="country-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ölkə Adı</th>
              <th>Lokasiyalar</th>
              <th>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row">
                <td colSpan={4}>
                  <span className="spinner" /> Yüklənir...
                </td>
              </tr>
            ) : countries.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <p>Hələ heç bir ölkə əlavə edilməyib.</p>
                  </div>
                </td>
              </tr>
            ) : (
              countries.map((country) => (
                <>
                  <tr key={country.id}>
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
                        {expandedCountryId === country.id ? "▲ Gizlət" : "▼ Lokasiyalar"}
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
                              ✔ Saxla
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "7px 14px", fontSize: "13px" }}
                              onClick={cancelEdit}
                            >
                              ✖ Ləğv
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-edit"
                              onClick={() => startEdit(country)}
                            >
                              ✏️ Düzəlt
                            </button>
                            <button
                              className="btn btn-del"
                              onClick={() => handleDelete(country.id, country.name)}
                              disabled={submitting}
                            >
                              🗑 Sil
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Sub-locations row */}
                  {expandedCountryId === country.id && (
                    <tr key={`sub-${country.id}`}>
                      <td colSpan={4} style={{ padding: 0 }}>
                        <div className="sub-locations">
                          <div className="sub-locations-title">
                            📍 {country.name} — Lokasiyalar
                          </div>
                          {subLoading ? (
                            <div style={{ color: "#aaa", fontSize: "13px" }}>
                              <span className="spinner" /> Yüklənir...
                            </div>
                          ) : (subLocations[country.id] ?? []).length === 0 ? (
                            <div style={{ color: "#bbb", fontSize: "13px" }}>
                              Bu ölkəyə aid lokasiya yoxdur.
                            </div>
                          ) : (
                            (subLocations[country.id] ?? []).map((loc) => (
                              <div key={loc.id} className="sub-location-item">
                                <span className="sub-location-dot" />
                                <strong>{loc.name}</strong>
                                <span style={{ color: "#aaa", fontSize: "12px" }}>
                                  — {loc.distanceToken} token
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 14px" }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Əvvəl
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 14px" }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Növbəti →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}