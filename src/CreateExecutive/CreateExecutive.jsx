import { useState, useCallback } from "react";
import "./CreateExecutive.css";

const API_BASE = "http://localhost:5251/api";

const getToken = () => localStorage.getItem("userToken") ?? "";

const WORDS = [
  "alma","arpa","atlas","azer","baki","bulud","burun","cavid",
  "duman","elvan","emin","ekin","farid","feriz","gelin","gelmir",
  "gizli","oglan","gubre","gumus","gunay","ilham","ilkin","istek","kamil",
  "qanad","kerim","qazan","kenar","qiran","kotan","lacin",
  "liman","metal","metin","misir","murad","nazim","nigar","misal",
  "novruz","odlar","orman","temir","qalib","qaran","qazax","qizil",
  "radar","ramin","rasim","sabit","sabir","safar","saman","sarvan",
  "sevin","sultan","talin","talan","tamam","tarim",
  "terlan","temir","tikan","togrul","turan","ulker","uzaq",
  "veten","vuran","yanar","yarat","yasil","yataq","yavan","yazar",
  "yelin","yolcu","yunis","zafar","zafer","zamin","zefer","zirek","zirve",
];

const SPECIALS = "@$!%*?&";

function generatePassword() {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const word1 = rand(WORDS);
  const word2 = rand(WORDS.filter(w => w !== word1));
  const word3 = rand(WORDS.filter(w => w !== word1 && w !== word2));
  const w1 = word1.charAt(0).toUpperCase() + word1.slice(1);
  const num = Math.floor(Math.random() * 90 + 10);
  const sep = rand(SPECIALS.split(""));
  return `${w1}${sep}${word2}${num}${word3}`;
}

function scorePassword(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[@$!%*?&]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] ?? "Strong" };
}

function validate(form) {
  const errors = {};
  if (!form.Name.trim())
    errors.Name = "First name is required.";
  else if (form.Name.trim().length < 2)
    errors.Name = "Must be at least 2 characters.";
  else if (form.Name.trim().length > 50)
    errors.Name = "Must be 50 characters or less.";

  if (!form.Surname.trim())
    errors.Surname = "Last name is required.";
  else if (form.Surname.trim().length < 2)
    errors.Surname = "Must be at least 2 characters.";
  else if (form.Surname.trim().length > 50)
    errors.Surname = "Must be 50 characters or less.";

  if (!form.Email.trim())
    errors.Email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email.trim()))
    errors.Email = "Enter a valid email address.";

  if (!form.Password)
    errors.Password = "Password is required.";
  else if (form.Password.length < 8)
    errors.Password = "Must be at least 8 characters.";
  else if (form.Password.length > 128)
    errors.Password = "Must be 128 characters or less.";

  return errors;
}

function StrengthBar({ password }) {
  const { score, label } = scorePassword(password);
  const barColors = { 1: "#ff4d4d", 2: "#f97316", 3: "#eab308", 4: "#22c55e" };
  return (
    <div className="ce-strength">
      <div className="ce-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="ce-strength__bar"
            style={{ background: i <= score ? barColors[score] : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      {label && (
        <span className="ce-strength__label" style={{ color: barColors[score] }}>
          {label}
        </span>
      )}
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <span className="ce-field-error">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.3" stroke="#ff4d4d" strokeWidth="1.2"/>
        <path d="M6 3.6v2.8" stroke="#ff4d4d" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="6" cy="8.4" r="0.6" fill="#ff4d4d"/>
      </svg>
      {msg}
    </span>
  );
}

function ResponseBox({ status, message, detail }) {
  if (!status) return null;
  return (
    <div className={`ce-response ce-response--${status}`}>
      <span className="ce-response__icon">
        {status === "ok" ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#22c55e" strokeWidth="1.2"/>
            <path d="M4 7l2.2 2.2L10 5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#ff4d4d" strokeWidth="1.2"/>
            <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#ff4d4d" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        )}
      </span>
      <div className="ce-response__body">
        <span className="ce-response__tag">{status === "ok" ? "Success" : "Error"}</span>
        <p className="ce-response__msg">{message}</p>
        {detail && <p className="ce-response__detail">{detail}</p>}
      </div>
    </div>
  );
}

export default function CreateExecutive() {
  const [form, setForm] = useState({
    Name:     "",
    Surname:  "",
    Email:    "",
    Password: generatePassword(),
  });

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [res,     setRes]     = useState(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const blur = (k) => {
    setTouched((t) => ({ ...t, [k]: true }));
    const fe = validate({ ...form });
    setErrors((e) => ({ ...e, [k]: fe[k] }));
  };

  const regenerate = useCallback(() => {
    setForm((f) => ({ ...f, Password: generatePassword() }));
    setErrors((e) => ({ ...e, Password: undefined }));
    setRes(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ Name: true, Surname: true, Email: true, Password: true });
    const fe = validate(form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setLoading(true);
    setRes(null);
    try {
      const r = await fetch(`${API_BASE}/Auth/create-executive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const json = await r.json().catch(() => null);
      if (r.ok && json?.data) {
        const d = json.data;
        setRes({
          status:  "ok",
          message: `Executive created — ID: ${d.id} · ${d.name} ${d.surname} · ${d.email}`,
          detail:  "Credentials have been sent to the executive's email address.",
        });
        setForm({ Name: "", Surname: "", Email: "", Password: generatePassword() });
        setErrors({});
        setTouched({});
      } else {
        const msg  = json?.message ?? json?.title ?? r.statusText ?? "Unknown error";
        const errs = json?.errors
          ? Object.values(json.errors).flat().join(" · ")
          : "";
        setRes({ status: "err", message: `${r.status} — ${msg}`, detail: errs || undefined });
      }
    } catch (err) {
      setRes({
        status:  "err",
        message: "Connection failed — could not reach the API.",
        detail:  err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ Name: "", Surname: "", Email: "", Password: generatePassword() });
    setErrors({});
    setTouched({});
    setRes(null);
    setShowPw(false);
  };

  return (
    <div className="ce-shell">
      <header className="ce-header">
        <div className="ce-eyebrow">Admin Portal</div>
        <h1 className="ce-title">Create <span>Executive</span></h1>
        <p className="ce-desc">
          Provision a Company-role account. The generated credentials will be
          emailed directly to the executive upon creation.
        </p>
      </header>

      <form className="ce-card" onSubmit={handleSubmit} noValidate>

        <p className="ce-section">Personal Information</p>

        <div className="ce-row ce-row--2">
          <div className={`ce-field${touched.Name && errors.Name ? " ce-field--error" : ""}`}>
            <label className="ce-label">First Name <span className="req">*</span></label>
            <input
              className="ce-input"
              placeholder="e.g. Anar"
              value={form.Name}
              onChange={(e) => set("Name", e.target.value)}
              onBlur={() => blur("Name")}
              autoComplete="given-name"
            />
            <FieldError msg={touched.Name && errors.Name} />
          </div>

          <div className={`ce-field${touched.Surname && errors.Surname ? " ce-field--error" : ""}`}>
            <label className="ce-label">Last Name <span className="req">*</span></label>
            <input
              className="ce-input"
              placeholder="e.g. Mammadov"
              value={form.Surname}
              onChange={(e) => set("Surname", e.target.value)}
              onBlur={() => blur("Surname")}
              autoComplete="family-name"
            />
            <FieldError msg={touched.Surname && errors.Surname} />
          </div>
        </div>

        <div className="ce-row ce-row--1">
          <div className={`ce-field${touched.Email && errors.Email ? " ce-field--error" : ""}`}>
            <label className="ce-label">Email Address <span className="req">*</span></label>
            <input
              className="ce-input"
              type="email"
              placeholder="executive@company.com"
              value={form.Email}
              onChange={(e) => set("Email", e.target.value)}
              onBlur={() => blur("Email")}
              autoComplete="email"
            />
            <FieldError msg={touched.Email && errors.Email} />
          </div>
        </div>

        <hr className="ce-hr" />
        <p className="ce-section">Access Credentials</p>

        <div className="ce-row ce-row--1">
          <div className={`ce-field${touched.Password && errors.Password ? " ce-field--error" : ""}`}>
            <label className="ce-label">Password <span className="req">*</span></label>
            <div className="ce-pw-wrap">
              <input
                className="ce-input"
                type={showPw ? "text" : "password"}
                value={form.Password}
                onChange={(e) => set("Password", e.target.value)}
                onBlur={() => blur("Password")}
                autoComplete="new-password"
                spellCheck={false}
              />
              <div className="ce-pw-actions">
                <button type="button" className="ce-pw-btn" onClick={() => setShowPw(v => !v)}>
                  {showPw ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                  {showPw ? "Hide" : "Show"}
                </button>
                <button type="button" className="ce-regen-btn" onClick={regenerate}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 8a7 7 0 1 0 7-7" strokeLinecap="round"/>
                    <path d="M1 4v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Regen
                </button>
              </div>
            </div>
            <StrengthBar password={form.Password} />
            <FieldError msg={touched.Password && errors.Password} />
          </div>
        </div>

        <hr className="ce-hr" />
        <p className="ce-section">Assigned Role</p>

        <div className="ce-role-badge">
          <span className="ce-role-badge__dot" />
          Company (Executive) — UserType.Company
        </div>

        <div className="ce-note">
          This account will be created with <strong>IsConfirmed = true</strong>, skipping
          email verification. Credentials are automatically emailed to the executive.
        </div>

        <ResponseBox {...res} />

        <div className="ce-actions">
          <button
            type="submit"
            className={`ce-submit${loading ? " ce-submit--loading" : ""}`}
            disabled={loading}
          >
            {loading && <span className="ce-spinner" />}
            <span>{loading ? "Creating..." : "Create Executive Account"}</span>
          </button>
          <button type="button" className="ce-reset" onClick={handleReset}>
            Reset
          </button>
        </div>

      </form>
    </div>
  );
}