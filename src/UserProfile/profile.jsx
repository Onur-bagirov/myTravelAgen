import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./profile.css";

const API_BASE = "http://localhost:5251/api/Auth";

const toAbsoluteUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `http://localhost:5251${path}`;
};

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
});

const parseBirthday = (raw) => {
  if (!raw) return "";
  const str = raw.toString().slice(0, 10);
  return str === "0001-01-01" ? "" : str;
};

const Avatar = ({ name, surname, photoUrl, editing, onFileSelect }) => {
  const fileRef = useRef(null);
  const initials = `${name?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase() || "?";

  const handleClick = () => { if (editing) fileRef.current?.click(); };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Yalnız JPG, PNG, WEBP və ya GIF icazəlidir.");
      e.target.value = ""; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Fayl 5 MB-dan böyük ola bilməz.");
      e.target.value = ""; return;
    }
    onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div
      className={`profile-avatar${editing ? " profile-avatar--edit" : ""}`}
      onClick={handleClick}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      {photoUrl
        ? <img src={photoUrl} alt="Profil" className="avatar-img" />
        : <span>{initials}</span>
      }

      {editing && (
        <div className="avatar-edit-overlay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Dəyiş</span>
        </div>
      )}
    </div>
  );
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
      setErrors({ general: "Please fill in all fields." }); return;
    }
    if (pw.next !== pw.confirm) {
      setErrors({ confirm: "New passwords do not match." }); return;
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
        {[
          { key: "current", label: "Current Password" },
          { key: "next",    label: "New Password" },
          { key: "confirm", label: "Confirm New Password" },
        ].map(({ key, label }) => (
          <div className="pw-field" key={key}>
            <span className="field-label">{label}</span>
            <input
              className={`field-input ${errors[key] ? "input-error" : ""}`}
              type="password"
              value={pw[key]}
              onChange={(e) => { setPw(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: "" })); }}
              onKeyDown={(e) => key === "confirm" && e.key === "Enter" && submit()}
            />
            <FieldError message={errors[key]} />
          </div>
        ))}
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
  const [user, setUser]             = useState(null);
  const [draft, setDraft]           = useState(null);
  const [editing, setEditing]       = useState(false);
  const [fetching, setFetching]     = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [photoUrl, setPhotoUrl]         = useState(null);
  const [serverPhotoUrl, setServerPhotoUrl] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);

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
        birthday: parseBirthday(rawData.birthday || rawData.Birthday),
      };
      setUser(p);
      setDraft(p);
      localStorage.setItem("firstName", p.name);
      localStorage.setItem("lastName",  p.surname);

      const photo = toAbsoluteUrl(
        rawData.profilePicture || rawData.ProfilePicture || null
      );
      setPhotoUrl(photo);
      setServerPhotoUrl(photo);
    } catch {
      notify("Failed to load profile data.", "error");
    } finally {
      setFetching(false);
    }
  }, [notify]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const isAdmin = user?.email?.toLowerCase() === "admin@gmail.com";

  const startEdit = () => {
    setDraft({ ...user });
    setEditErrors({});
    setPendingPhoto(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft({ ...user });
    setEditErrors({});
    setPendingPhoto(null);
    setPhotoUrl(serverPhotoUrl);
    setEditing(false);
  };

  const onChange = (e) => {
    setDraft(p => ({ ...p, [e.target.name]: e.target.value }));
    setEditErrors(p => ({ ...p, [e.target.name]: "" }));
  };

  const handleFileSelect = (file) => {
    setPhotoUrl(URL.createObjectURL(file));
    setPendingPhoto(file);
  };

  const saveEdit = async () => {
    setEditErrors({});
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name",     draft.name);
      formData.append("surname",  draft.surname);
      formData.append("email",    draft.email);
      formData.append("fin",      isAdmin ? "ADMIN01"    : (draft.fin || ""));
      formData.append("birthday", isAdmin ? "1990-01-01" : (draft.birthday || ""));
      if (pendingPhoto) formData.append("profilePicture", pendingPhoto);

      const res = await axios.put(`${API_BASE}/edit-profile`, formData, getAuthHeader());

      const updatedData = res.data?.data || res.data;
      const newPic = toAbsoluteUrl(
        updatedData?.profilePicture || updatedData?.ProfilePicture || null
      );
      const finalUrl = newPic ?? photoUrl;
      setPhotoUrl(finalUrl);
      setServerPhotoUrl(finalUrl);

      const updatedUser = {
        ...draft,
        birthday: parseBirthday(updatedData?.birthday) || draft.birthday,
      };
      setUser(updatedUser);
      setDraft(updatedUser);
      localStorage.setItem("firstName", updatedUser.name);
      localStorage.setItem("lastName",  updatedUser.surname);

      setPendingPhoto(null);
      setEditing(false);
      notify("Profile updated successfully.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "An error occurred during update.";
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
      <div className="profile-card profile-header">
        <Avatar
          name={user.name}
          surname={user.surname}
          photoUrl={photoUrl}
          editing={editing}
          onFileSelect={handleFileSelect}
        />
        <div>
          <p className="profile-fullname">{user.name} {user.surname}</p>
          <p className="profile-email-text">{user.email}</p>
          {isAdmin && <span className="badge-admin">System Admin</span>}
          {editing && pendingPhoto && (
            <p className="photo-hint">📎 {pendingPhoto.name}</p>
          )}
        </div>
      </div>

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
              <button onClick={startEdit}             className="btn-edit">Edit Profile</button>
              <button onClick={() => setShowPw(true)} className="btn-pw">Change Password</button>
              <button onClick={logout}                className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <button onClick={saveEdit}   disabled={saving} className="btn-save">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={cancelEdit} disabled={saving} className="btn-cancel">Cancel</button>
            </>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}