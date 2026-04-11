import { useState, useEffect, useCallback } from "react";
import "./addV.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const emptyForm = {
  name: "",
  price: "",
  allowedLuggageKg: "",
  allowedLuggageCount: "",
  isPriority: false,
};

export default function AddVariant() {
  const [variants, setVariants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/Variant?Page=${page}&Limit=${limit}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error("Failed to load variants");
      const data = await res.json();
      setVariants(Array.isArray(data.data) ? data.data : []);
      setTotalCount(data.totalDataCount ?? 0);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const validate = (f = form) => {
    const errors = {};
    if (!f.name.trim()) errors.name = "Name cannot be empty";
    else if (f.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

    if (f.price === "" || isNaN(Number(f.price)) || Number(f.price) < 0)
      errors.price = "Enter a valid price";

    if (f.allowedLuggageKg === "" || isNaN(Number(f.allowedLuggageKg)) || Number(f.allowedLuggageKg) < 0)
      errors.allowedLuggageKg = "Enter a valid weight";

    if (f.allowedLuggageCount === "" || isNaN(Number(f.allowedLuggageCount)) || Number(f.allowedLuggageCount) < 0)
      errors.allowedLuggageCount = "Enter a valid count";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Variant`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          allowedLuggageKg: Number(form.allowedLuggageKg),
          allowedLuggageCount: Number(form.allowedLuggageCount),
          isPriority: form.isPriority,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? "An error occurred");
      }
      showAlert("success", `Variant "${form.name.trim()}" created successfully!`);
      setForm(emptyForm);
      setFormErrors({});
      fetchVariants();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (v) => {
    setEditingId(v.id);
    setEditForm({
      name: v.name,
      price: String(v.price),
      allowedLuggageKg: String(v.allowedLuggageKg),
      allowedLuggageCount: String(v.allowedLuggageCount),
      isPriority: v.isPriority,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id) => {
    if (!editForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Variant`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: Number(id),
          name: editForm.name.trim(),
          price: Number(editForm.price),
          allowedLuggageKg: Number(editForm.allowedLuggageKg),
          allowedLuggageCount: Number(editForm.allowedLuggageCount),
          isPriority: editForm.isPriority,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? "Update failed");
      }
      showAlert("success", "Variant updated successfully!");
      cancelEdit();
      fetchVariants();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, variantName) => {
    if (!window.confirm(`Are you sure you want to delete "${variantName}"?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/Variant`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id: Number(id) }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message ?? "Delete failed");
      }
      showAlert("success", `"${variantName}" deleted successfully!`);
      fetchVariants();
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="variant-panel">
      <div className="variant-panel__header">
        <div className="variant-panel__icon">🎫</div>
        <h2>Variant Management</h2>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === "success" ? "✅" : "❌"} {alert.msg}
        </div>
      )}

      <div className="variant-form-card">
        <h3>➕ Add New Variant</h3>
        <div className="variant-form-grid">

          <div className="form-group">
            <label>Variant Name</label>
            <input
              className={`form-input ${formErrors.name ? "error" : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Economy, Business"
            />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Price (AZN)</label>
            <input
              className={`form-input ${formErrors.price ? "error" : ""}`}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
              placeholder="e.g. 120.00"
            />
            {formErrors.price && <span className="form-error">{formErrors.price}</span>}
          </div>

          <div className="form-group">
            <label>Allowed Luggage (kg)</label>
            <input
              className={`form-input ${formErrors.allowedLuggageKg ? "error" : ""}`}
              type="number"
              min="0"
              step="0.5"
              value={form.allowedLuggageKg}
              onChange={(e) => setForm(p => ({ ...p, allowedLuggageKg: e.target.value }))}
              placeholder="e.g. 23"
            />
            {formErrors.allowedLuggageKg && <span className="form-error">{formErrors.allowedLuggageKg}</span>}
          </div>

          <div className="form-group">
            <label>Luggage Count</label>
            <input
              className={`form-input ${formErrors.allowedLuggageCount ? "error" : ""}`}
              type="number"
              min="0"
              value={form.allowedLuggageCount}
              onChange={(e) => setForm(p => ({ ...p, allowedLuggageCount: e.target.value }))}
              placeholder="e.g. 1"
            />
            {formErrors.allowedLuggageCount && <span className="form-error">{formErrors.allowedLuggageCount}</span>}
          </div>

          <div className="form-group form-group--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isPriority}
                onChange={(e) => setForm(p => ({ ...p, isPriority: e.target.checked }))}
                className="checkbox-input"
              />
              <span className="checkbox-custom" />
              Priority Access
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={submitting}
            style={{ alignSelf: "flex-end" }}
          >
            {submitting ? <><span className="spinner" />Please wait...</> : "➕ Add Variant"}
          </button>
        </div>
      </div>

      <div className="variant-table-card">
        <div className="variant-table-card__header">
          <h3>📋 Variants List</h3>
          <span className="badge">{totalCount} variants</span>
        </div>

        <table className="variant-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Price</th>
              <th>Luggage (kg)</th>
              <th>Count</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row">
                <td colSpan={7}><span className="spinner" /> Loading...</td>
              </tr>
            ) : variants.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No variants found.</div>
                </td>
              </tr>
            ) : (
              variants.map((v) => (
                <tr key={v.id}>
                  <td><span className="variant-id">#{v.id}</span></td>

                  <td>
                    {editingId === v.id ? (
                      <input
                        className="inline-edit-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      <span className="variant-name">{v.name}</span>
                    )}
                  </td>

                  <td>
                    {editingId === v.id ? (
                      <input
                        className="inline-edit-number"
                        type="number" min="0" step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm(p => ({ ...p, price: e.target.value }))}
                      />
                    ) : (
                      <span className="price-badge">{v.price} ₼</span>
                    )}
                  </td>

                  <td>
                    {editingId === v.id ? (
                      <input
                        className="inline-edit-number"
                        type="number" min="0" step="0.5"
                        value={editForm.allowedLuggageKg}
                        onChange={(e) => setEditForm(p => ({ ...p, allowedLuggageKg: e.target.value }))}
                      />
                    ) : (
                      <span className="luggage-badge">{v.allowedLuggageKg} kg</span>
                    )}
                  </td>

                  <td>
                    {editingId === v.id ? (
                      <input
                        className="inline-edit-number"
                        type="number" min="0"
                        value={editForm.allowedLuggageCount}
                        onChange={(e) => setEditForm(p => ({ ...p, allowedLuggageCount: e.target.value }))}
                      />
                    ) : (
                      <span>{v.allowedLuggageCount} pcs</span>
                    )}
                  </td>

                  <td>
                    {editingId === v.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.isPriority}
                        onChange={(e) => setEditForm(p => ({ ...p, isPriority: e.target.checked }))}
                        className="checkbox-input"
                      />
                    ) : (
                      <span className={`priority-badge ${v.isPriority ? "priority-yes" : "priority-no"}`}>
                        {v.isPriority ? "⭐ Yes" : "No"}
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="actions-cell">
                      {editingId === v.id ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUpdate(v.id)}
                            disabled={submitting}
                          >
                            ✔ Save
                          </button>
                          <button className="btn btn-secondary" onClick={cancelEdit}>
                            ✖ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-edit" onClick={() => startEdit(v)}>
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-del"
                            onClick={() => handleDelete(v.id, v.name)}
                            disabled={submitting}
                          >
                            🗑 Delete
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
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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