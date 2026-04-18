import { useState, useEffect, useCallback, useRef, useContext, createContext } from "react";
import { createPortal } from "react-dom";
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

const DropdownContext = createContext(null);

function DropdownProvider({ children }) {
  const [openId, setOpenId] = useState(null);
  const close  = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id) => setOpenId(prev => (prev === id ? null : id)), []);
  return (
    <DropdownContext.Provider value={{ openId, toggle, close }}>
      {children}
    </DropdownContext.Provider>
  );
}

function CountryDropdown({ id, countries, value, onChange, hasError, placeholder = "Select country" }) {
  const { openId, toggle, close } = useContext(DropdownContext);
  const open = openId === id;

  const [search, setSearch]         = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const searchRef  = useRef(null);

  const selected = countries.find(c => String(c.id) === String(value));
  const filtered = search.trim()
    ? countries.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : countries;

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  };

  const handleToggle = () => {
    if (!open) calcPosition();
    else setSearch("");
    toggle(id);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => calcPosition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        !e.target.closest(".al-dropdown-panel")
      ) {
        close();
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const handleSelect = (c) => {
    onChange(String(c.id));
    close();
    setSearch("");
  };

  return (
    <div className={`al-dropdown-wrap${hasError ? " al-dropdown-wrap--error" : ""}`} ref={triggerRef}>
      <div
        className={`al-dropdown-trigger${open ? " al-dropdown-trigger--open" : ""}${hasError ? " al-dropdown-trigger--error" : ""}`}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); }
          if (e.key === "Escape") { close(); setSearch(""); }
        }}
        role="combobox"
        aria-expanded={open}
      >
        <span className={selected ? "al-dropdown-value" : "al-dropdown-placeholder"}>
          {selected ? selected.name : placeholder}
        </span>
        <svg className={`al-chevron${open ? " al-chevron--up" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && createPortal(
        <div className="al-dropdown-panel" style={panelStyle}>
          <div className="al-search-wrap">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: "rgba(255,255,255,0.3)" }}>
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              className="al-search"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
          <div className="al-list">
            {filtered.length === 0 && <div className="al-empty">No results</div>}
            {filtered.map(c => {
              const isSel = String(c.id) === String(value);
              return (
                <div
                  key={c.id}
                  className={`al-item${isSel ? " al-item--selected" : ""}`}
                  onClick={() => handleSelect(c)}
                >
                  <span className="al-item-name">{c.name}</span>
                  {isSel && (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: "#ff6060" }}>
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

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
      const res = await fetch(`${API_BASE}/Country?page=1&size=100`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setCountries(Array.isArray(data.data) ? data.data : []);
    } catch {}
  };

  useEffect(() => { fetchCountries(); }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/Location?Page=${page}&Limit=${limit}`, { headers: getHeaders() });
      if (!res.ok) { const t = await res.text(); throw new Error(`Error ${res.status}: ${t}`); }
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
    if (!form.name.trim()) errors.name = "Name cannot be empty";
    else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!form.countryId) errors.countryId = "Select a country";
    if (form.distanceToken === "" || isNaN(Number(form.distanceToken))) errors.distanceToken = "Token is required";
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
        body: JSON.stringify({ name: form.name.trim(), countryId: Number(form.countryId), distanceToken: Number(form.distanceToken), country: null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message ?? `Error ${res.status}`); }
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
    setEditForm({ name: loc.name, countryId: String(loc.countryId), distanceToken: String(loc.distanceToken) });
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id) => {
    if (!editForm.name.trim() || !editForm.countryId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Location`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: Number(id), name: editForm.name.trim(), countryId: Number(editForm.countryId), distanceToken: Number(editForm.distanceToken), country: null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message ?? "Update failed"); }
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
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message ?? "Delete failed"); }
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
    <DropdownProvider>
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
              <CountryDropdown
                id="form-country"
                countries={countries}
                value={form.countryId}
                onChange={(val) => setForm(p => ({ ...p, countryId: val }))}
                hasError={!!formErrors.countryId}
                placeholder="Select country"
              />
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
              {/* Filter dropdown */}
              <CountryDropdown
                id="filter-country"
                countries={[{ id: "", name: "All Countries" }, ...countries]}
                value={filterCountryId}
                onChange={(val) => setFilterCountryId(val === "" ? "" : val)}
                placeholder="All Countries"
              />
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
                  <td colSpan={5}><div className="empty-state">No locations found.</div></td>
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
                        <CountryDropdown
                          id={`edit-country-${loc.id}`}
                          countries={countries}
                          value={editForm.countryId}
                          onChange={(val) => setEditForm(p => ({ ...p, countryId: val }))}
                          placeholder="Select country"
                        />
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
                            <button className="btn btn-primary" onClick={() => handleUpdate(loc.id)} disabled={submitting}>Save</button>
                            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-edit" onClick={() => startEdit(loc)}>Edit</button>
                            <button className="btn btn-del" onClick={() => handleDelete(loc.id, loc.name)} disabled={submitting}>Delete</button>
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
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span>{page} / {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </div>
      </div>
    </DropdownProvider>
  );
}

export default AddLocation;