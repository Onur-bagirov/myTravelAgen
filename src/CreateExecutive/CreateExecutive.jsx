import { useState, useCallback } from "react";
import "./CreateExecutive.css";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5251/api";

const getToken = () => localStorage.getItem("auth_token") ?? "";

// ─── Password Generator (mirrors your PasswordGenerator.cs exactly) ──────────
const LOWER    = "abcdefghijklmnopqrstuvwxyz";
const UPPER    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS   = "0123456789";
const SPECIALS = "@$!%*?&";
const ALL      = LOWER + UPPER + DIGITS + SPECIALS;

function generatePassword(length = 12) {
  const rand = (str) => str[Math.floor(Math.random() * str.length)];
  let password = "";
  // Guarantee at least one of each required class (mirrors IsValid check)
  const required = [
    rand(LOWER),
    rand(UPPER),
    rand(DIGITS),
    rand(SPECIALS),
  ];
  for (let i = required.length; i < length; i++) {
    required.push(rand(ALL));
  }
  // Shuffle
  password = required.sort(() => Math.random() - 0.5).join("");
  return password;
}

// ─── Password strength scorer ─────────────────────────────────────────────────
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StrengthBar({ password }) {
  const { score, label } = scorePassword(password);
  return (
    <div className="ce-strength">
      <div className="ce-strength__bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`ce-strength__bar${i <= score ? ` ce-strength__bar--${score}` : ""}`}
          />
        ))}
      </div>
      <span className="ce-strength__label">{label}</span>
    </div>
  );
}

function ResponseBox({ status, message, detail }) {
  if (!status) return null;
  return (
    <div className={`ce-response ce-response--${status}`}>
      <div className="ce-response__tag">
        {status === "ok" ? "Success" : "Error"}
      </div>
      {message}
      {detail && (
        <>
          <br />
          <small style={{ opacity: 0.75 }}>{detail}</small>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateExecutive() {
  const [form, setForm] = useState({
    Name:     "",
    Surname:  "",
    Email:    "",
    Password: generatePassword(),  // auto-generate on mount
  });

  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [res,     setRes]     = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Regenerate password ───────────────────────────────────────────────────
  const regenerate = useCallback(() => {
    setForm((f) => ({ ...f, Password: generatePassword() }));
    setRes(null);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setForm({
          Name:     "",
          Surname:  "",
          Email:    "",
          Password: generatePassword(),
        });
      } else {
        const msg = json?.message ?? json?.title ?? r.statusText ?? "Unknown error";
        const errs = json?.errors
          ? Object.values(json.errors).flat().join(" · ")
          : "";
        setRes({
          status:  "err",
          message: `${r.status} — ${msg}`,
          detail:  errs || undefined,
        });
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

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm({ Name: "", Surname: "", Email: "", Password: generatePassword() });
    setRes(null);
    setShowPw(false);
  };

  return (
    <div className="ce-shell">

      {/* Header */}
      <header className="ce-header">
        <div className="ce-eyebrow">Admin Portal</div>
        <h1 className="ce-title">
          Create <span>Executive</span>
        </h1>
        <p className="ce-desc">
          Provision a Company-role account. The generated credentials will be
          emailed directly to the executive upon creation.
        </p>
      </header>

      {/* Form card */}
      <form className="ce-card" onSubmit={handleSubmit}>

        {/* Name & Surname */}
        <p className="ce-section">Personal Information</p>
        <div className="ce-row ce-row--2">
          <div className="ce-field">
            <label className="ce-label">
              First Name <span className="req">*</span>
            </label>
            <input
              className="ce-input"
              placeholder="e.g. Anar"
              value={form.Name}
              onChange={(e) => set("Name", e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="ce-field">
            <label className="ce-label">
              Last Name <span className="req">*</span>
            </label>
            <input
              className="ce-input"
              placeholder="e.g. Mammadov"
              value={form.Surname}
              onChange={(e) => set("Surname", e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="ce-row ce-row--1">
          <div className="ce-field">
            <label className="ce-label">
              Email Address <span className="req">*</span>
            </label>
            <input
              className="ce-input"
              type="email"
              placeholder="executive@company.com"
              value={form.Email}
              onChange={(e) => set("Email", e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <hr className="ce-hr" />

        {/* Password */}
        <p className="ce-section">Access Credentials</p>
        <div className="ce-row ce-row--1">
          <div className="ce-field">
            <label className="ce-label">
              Password <span className="req">*</span>
            </label>

            <div className="ce-pw-wrap">
              <input
                className="ce-input"
                type={showPw ? "text" : "password"}
                value={form.Password}
                onChange={(e) => set("Password", e.target.value)}
                required
                autoComplete="new-password"
                spellCheck={false}
              />

              {/* Show / Hide */}
              <div className="ce-pw-actions">
                <button
                  type="button"
                  className="ce-pw-btn"
                  title={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? "🙈" : "👁"}
                </button>

                {/* Regenerate */}
                <button
                  type="button"
                  className="ce-regen-btn"
                  title="Generate a new password"
                  onClick={regenerate}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 8a7 7 0 1 0 7-7" strokeLinecap="round"/>
                    <path d="M1 4v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Regen
                </button>
              </div>
            </div>

            <StrengthBar password={form.Password} />
          </div>
        </div>

        <hr className="ce-hr" />

        {/* Role — read only, always Company */}
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
            <span className="ce-spinner" />
            <span className="ce-submit__text">Create Executive Account</span>
          </button>
          <button type="button" className="ce-reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}