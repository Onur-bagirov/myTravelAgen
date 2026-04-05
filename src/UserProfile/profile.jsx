import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./profile.css";

const API_BASE = "http://localhost:5251/api/Auth";

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
});

/* ─── Components ─── */
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

/* ─── Password Panel Component ─── */
const PasswordPanel = ({ onCancel, onSuccess, onError }) => {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      onError("Please fill in all fields.");
      return;
    }
    if (pw.next !== pw.confirm) {
      onError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_BASE}/change-password`,
        { 
          currentPassword: pw.current, 
          newPassword: pw.next, 
          confirmPassword: pw.confirm 
        },
        getAuthHeader()
      );
      onSuccess("Password changed successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || "Current password is incorrect.";
      onError(msg);
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
        <div className="pw-field">
          <span className="field-label">Current Password</span>
          <input className="field-input" type="password" value={pw.current} onChange={(e) => setPw(p => ({ ...p, current: e.target.value }))} />
        </div>
        <div className="pw-field">
          <span className="field-label">New Password</span>
          <input className="field-input" type="password" value={pw.next} onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))} />
        </div>
        <div className="pw-field">
          <span className="field-label">Confirm New Password</span>
          <input className="field-input" type="password" value={pw.confirm} onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && submit()} />
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

/* ─── Main Profile Page ─── */
export default function Profile() {
  const [user, setUser] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("userToken");

    if (!token) {
      setFetching(false);
      return;
    }

    try {
      // Backend-dəki GetMe endpointinə sorğu atırıq
      const res = await axios.get(`${API_BASE}/me`, getAuthHeader());
      // CQRS pattern-də data adətən res.data.data və ya res.data daxilində olur
      const rawData = res.data?.data || res.data;
      
      const p = {
        name: rawData.name || rawData.Name || "",
        surname: rawData.surname || rawData.Surname || "",
        email: rawData.email || rawData.Email || "",
        fin: rawData.fin || rawData.Fin || "",
        birthday: (rawData.birthday || rawData.Birthday) ? (rawData.birthday || rawData.Birthday).slice(0, 10) : "",
      };
      
      setUser(p);
      setDraft(p);
      localStorage.setItem("firstName", p.name);
      localStorage.setItem("lastName", p.surname);

    } catch (err) {
      console.error("Fetch error:", err);
      notify("Failed to load profile data.", "error");
    } finally {
      setFetching(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = user?.email?.toLowerCase() === "admin@gmail.com";

  const startEdit = () => { setDraft({ ...user }); setEditing(true); };
  const cancelEdit = () => { setDraft({ ...user }); setEditing(false); };
  const onChange = (e) => setDraft(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveEdit = async () => {
    setSaving(true);
    try {
      // Backend-dəki edit-profile endpointi UserId-ni token-dən götürür
      await axios.put(
        `${API_BASE}/edit-profile`,
        {
          name: draft.name,
          surname: draft.surname,
          email: draft.email,
          birthday: draft.birthday || null,
          fin: isAdmin ? null : draft.fin,
        },
        getAuthHeader()
      );
      setUser({ ...draft });
      localStorage.setItem("firstName", draft.name);
      localStorage.setItem("lastName", draft.surname);
      setEditing(false);
      notify("Profile updated successfully.");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "An error occurred during update.";
      notify(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (fetching) return <div className="state-screen"><p>Loading...</p></div>;
  if (!user) return <div className="state-screen"><p>Please log in again.</p></div>;

  if (showPw) return (
    <>
      <PasswordPanel 
        onCancel={() => setShowPw(false)} 
        onSuccess={(msg) => { notify(msg); setShowPw(false); }}
        onError={(msg) => notify(msg, "error")}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );

  return (
    <div className="profile-wrapper">
      <div className="profile-card profile-header">
        <Avatar name={user.name} surname={user.surname} />
        <div>
          <p className="profile-fullname">{user.name} {user.surname}</p>
          <p className="profile-email-text">{user.email}</p>
          {isAdmin && <span className="badge-admin">System Admin</span>}
        </div>
      </div>

      <div className="profile-card">
        <p className="section-label">Account Information</p>
        <div className="fields-grid">
          <div className="field-item">
            <span className="field-label">First Name</span>
            {editing 
              ? <input className="field-input" name="name" value={draft.name} onChange={onChange} />
              : <p className="field-value">{user.name || <Dash />}</p>}
          </div>
          <div className="field-item">
            <span className="field-label">Last Name</span>
            {editing 
              ? <input className="field-input" name="surname" value={draft.surname} onChange={onChange} />
              : <p className="field-value">{user.surname || <Dash />}</p>}
          </div>
          <div className="field-item">
            <span className="field-label">Email</span>
            <p className="field-value">{user.email}</p>
          </div>
          {!isAdmin && (
            <>
              <div className="field-item">
                <span className="field-label">FIN Code</span>
                {editing 
                  ? <input className="field-input" name="fin" value={draft.fin} onChange={onChange} maxLength={7} />
                  : <p className="field-value">{user.fin || <Dash />}</p>}
              </div>
              <div className="field-item">
                <span className="field-label">Birthday</span>
                {editing 
                  ? <input className="field-input" type="date" name="birthday" value={draft.birthday} onChange={onChange} />
                  : <p className="field-value">{user.birthday || <Dash />}</p>}
              </div>
            </>
          )}
        </div>
        <div className="divider" />
        <div className="actions-row">
          {!editing ? (
            <>
              <button onClick={startEdit} className="btn-edit">Edit Profile</button>
              <button onClick={() => setShowPw(true)} className="btn-pw">Change Password</button>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <button onClick={saveEdit} disabled={saving} className="btn-save">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={cancelEdit} className="btn-cancel" disabled={saving}>Cancel</button>
            </>
          )}
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}