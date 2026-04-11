import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./profile.css";

const API_BASE = "http://localhost:5251/api/Auth";

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
});

const Avatar = ({ name, surname }) => {
  const initials = `${name?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase() || "?";
  return <div className="profile-avatar">{initials}</div>;
};

const Dash = () => <span className="field-dash">—</span>;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast ${type === "error" ? "toast-error" : "toast-success"}`}>
      {message}
    </div>
  );
};

const FieldError = ({ message }) =>
  message ? <span className="profile-field-error">{message}</span> : null;


const mapEditErrors = (message) => {
  const msg = message?.toLowerCase() || "";
  if (msg.includes("surname"))  return { surname: message };
  if (msg.includes("name"))     return { name: message };
  if (msg.includes("email"))    return { email: message };
  if (msg.includes("fin"))      return { fin: message };
  if (msg.includes("birthday")) return { birthday: message };
  return { general: message };
};

const mapPwErrors = (message) => {
  const msg = message?.toLowerCase() || "";
  if (msg.includes("current"))  return { current: message };
  if (msg.includes("confirm"))  return { confirm: message };
  if (msg.includes("password")) return { next: message };
  return { general: message };
};

const PasswordPanel = ({ onCancel, onSuccess }) => {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErrors({});

    if (!pw.current || !pw.next || !pw.confirm) {
      setErrors({ general: "Please fill in all fields." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setErrors({ confirm: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_BASE}/change-password`,
        { currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm },
        getAuthHeader()
      );
      onSuccess("Password changed successfully.");
    } catch (err) {
      const message = err.response?.data?.message || "Current password is incorrect.";
      setErrors(mapPwErrors(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="pw-panel-header">
          <p className="pw-panel-title">Change Password</p>
          <button className="pw-close-btn" onClick={onCancel}>✕</button>
        </div>

        {errors.general && <FieldError message={errors.general} />}

        <div className="pw-field">
          <span className="field-label">Current Password</span>
          <input
            className={`field-input ${errors.current ? "input-error" : ""}`}
            type="password"
            value={pw.current}
            onChange={(e) => { setPw(p => ({ ...p, current: e.target.value })); setErrors(p => ({ ...p, current: "" })); }}
          />
          <FieldError message={errors.current} />
        </div>

        <div className="pw-field">
          <span className="field-label">New Password</span>
          <input
            className={`field-input ${errors.next ? "input-error" : ""}`}
            type="password"
            value={pw.next}
            onChange={(e) => { setPw(p => ({ ...p, next: e.target.value })); setErrors(p => ({ ...p, next: "" })); }}
          />
          <FieldError message={errors.next} />
        </div>

        <div className="pw-field">
          <span className="field-label">Confirm New Password</span>
          <input
            className={`field-input ${errors.confirm ? "input-error" : ""}`}
            type="password"
            value={pw.confirm}
            onChange={(e) => { setPw(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: "" })); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <FieldError message={errors.confirm} />
        </div>

        <div className="divider" />
        <div className="pw-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const [user, setUser]       = useState(null);
  const [draft, setDraft]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (!token) { setFetching(false); return; }

    try {
      const res = await axios.get(`${API_BASE}/me`, getAuthHeader());
      const rawData = res.data?.data || res.data;
      const p = {
        name:     rawData.name     || rawData.Name     || "",
        surname:  rawData.surname  || rawData.Surname  || "",
        email:    rawData.email    || rawData.Email    || "",
        fin:      rawData.fin      || rawData.Fin      || "",
        birthday: (rawData.birthday || rawData.Birthday)
          ? (rawData.birthday || rawData.Birthday).slice(0, 10)
          : "",
      };
      setUser(p);
      setDraft(p);
      localStorage.setItem("firstName", p.name);
      localStorage.setItem("lastName", p.surname);
    } catch {
      notify("Failed to load profile data.", "error");
    } finally {
      setFetching(false);
    }
  }, [notify]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const isAdmin = user?.email?.toLowerCase() === "admin@gmail.com";

  const startEdit  = () => { setDraft({ ...user }); setEditErrors({}); setEditing(true); };
  const cancelEdit = () => { setDraft({ ...user }); setEditErrors({}); setEditing(false); };
  const onChange   = (e) => {
    setDraft(p => ({ ...p, [e.target.name]: e.target.value }));
    setEditErrors(p => ({ ...p, [e.target.name]: "" }));
  };

  const saveEdit = async () => {
    setEditErrors({});
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/edit-profile`,
        {
          name:     draft.name,
          surname:  draft.surname,
          email:    draft.email,
          birthday: draft.birthday || null,
          fin:      isAdmin ? null : draft.fin,
        },
        getAuthHeader()
      );
      setUser({ ...draft });
      localStorage.setItem("firstName", draft.name);
      localStorage.setItem("lastName", draft.surname);
      setEditing(false);
      notify("Profile updated successfully.");
    } catch (err) {
      const message = err.response?.data?.message || "An error occurred during update.";
      setEditErrors(mapEditErrors(message));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => { localStorage.clear(); window.location.href = "/"; };

  if (fetching) return <div className="state-screen"><p>Loading...</p></div>;
  if (!user)    return <div className="state-screen"><p>Please log in again.</p></div>;

  if (showPw) return (
    <>
      <PasswordPanel
        onCancel={() => setShowPw(false)}
        onSuccess={(msg) => { notify(msg); setShowPw(false); }}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );

  return (
    <div className="profile-wrapper">
      {/* Header card */}
      <div className="profile-card profile-header">
        <Avatar name={user.name} surname={user.surname} />
        <div>
          <p className="profile-fullname">{user.name} {user.surname}</p>
          <p className="profile-email-text">{user.email}</p>
          {isAdmin && <span className="badge-admin">System Admin</span>}
        </div>
      </div>

      {/* Info card */}
      <div className="profile-card">
        <p className="section-label">Account Information</p>

        {editErrors.general && <FieldError message={editErrors.general} />}

        <div className="fields-grid">
          <div className="field-item">
            <span className="field-label">First Name</span>
            {editing
              ? <><input className={`field-input ${editErrors.name ? "input-error" : ""}`} name="name" value={draft.name} onChange={onChange} />
                  <FieldError message={editErrors.name} /></>
              : <p className="field-value">{user.name || <Dash />}</p>}
          </div>

          <div className="field-item">
            <span className="field-label">Last Name</span>
            {editing
              ? <><input className={`field-input ${editErrors.surname ? "input-error" : ""}`} name="surname" value={draft.surname} onChange={onChange} />
                  <FieldError message={editErrors.surname} /></>
              : <p className="field-value">{user.surname || <Dash />}</p>}
          </div>

          <div className="field-item">
            <span className="field-label">Email</span>
            {editing
              ? <><input className={`field-input ${editErrors.email ? "input-error" : ""}`} name="email" value={draft.email} onChange={onChange} />
                  <FieldError message={editErrors.email} /></>
              : <p className="field-value">{user.email}</p>}
          </div>

          {!isAdmin && (
            <>
              <div className="field-item">
                <span className="field-label">FIN Code</span>
                {editing
                  ? <><input className={`field-input ${editErrors.fin ? "input-error" : ""}`} name="fin" value={draft.fin} onChange={onChange} maxLength={7} />
                      <FieldError message={editErrors.fin} /></>
                  : <p className="field-value">{user.fin || <Dash />}</p>}
              </div>

              <div className="field-item">
                <span className="field-label">Birthday</span>
                {editing
                  ? <><input className={`field-input ${editErrors.birthday ? "input-error" : ""}`} type="date" name="birthday" value={draft.birthday} onChange={onChange} />
                      <FieldError message={editErrors.birthday} /></>
                  : <p className="field-value">{user.birthday || <Dash />}</p>}
              </div>
            </>
          )}
        </div>

        <div className="divider" />
        <div className="actions-row">
          {!editing ? (
            <>
              <button onClick={startEdit}        className="btn-edit">Edit Profile</button>
              <button onClick={() => setShowPw(true)} className="btn-pw">Change Password</button>
              <button onClick={logout}           className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <button onClick={saveEdit}  disabled={saving} className="btn-save">{saving ? "Saving..." : "Save Changes"}</button>
              <button onClick={cancelEdit} disabled={saving} className="btn-cancel">Cancel</button>
            </>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}