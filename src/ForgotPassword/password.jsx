import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./password.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const extractError = (result) => {
    if (!result) return "Server error occurred.";
    if (result.errors && Array.isArray(result.errors)) {
      return result.errors.map((e) => e.description || e.message || e).join(" ");
    }
    if (result.errors && typeof result.errors === "object") {
      return Object.values(result.errors).flat().join(" ");
    }
    return result.message || result.data?.message || "Server error occurred.";
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5251/api/Auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let result = null;
      try { result = await response.json(); } catch { result = null; }

      if (response.ok) {
        if (result?.data?.success === false) {
          setError(result.data.message);
          return;
        }
        setInfoMessage("Reset code has been sent to your email.");
        setStep(2);
      } else {
        setError(extractError(result));
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!pwRegex.test(newPassword)) {
      setError("Password needs uppercase, lowercase, digit and special character (@$!%*?&).");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5251/api/Auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword, confirmPassword }),
      });

      let result = null;
      try { result = await response.json(); } catch { result = null; }

      if (response.ok) {
        alert("Your password has been successfully updated!");
        navigate("/login");
      } else {
        setError(extractError(result));
      }
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pass-wrapper">
      <div className="pass-card">
        <div className="pass-header">
          <div className="pass-logo">Travel<span>Agen</span></div>
          <h1>{step === 1 ? "Reset Password" : "Verification"}</h1>
          <p>
            {step === 1
              ? "Enter your email to receive a recovery code."
              : `Enter the code we sent to ${email}`}
          </p>
        </div>

        {infoMessage && <div className="pass-info-box">{infoMessage}</div>}
        {error && <div className="pass-error-box">{error}</div>}

        <form className="pass-form" noValidate onSubmit={step === 1 ? handleSendEmail : handleResetPassword}>
          {step === 1 ? (
            <div className="pass-group">
              <label>Email Address</label>
              <input
                type="text"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={loading} className="pass-main-btn">
                {loading ? "Sending..." : "Get Reset Code"}
              </button>
            </div>
          ) : (
            <div className="pass-group">
              <label>Verification Code</label>
              <input
                type="text"
                className="otp-input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength="6"
              />
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min 6 chars, A-z, 0-9, @$!%*?&"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <p className="pass-hint">
                Password must contain uppercase, lowercase, digit and a special character (@$!%*?&)
              </p>
              <button type="submit" disabled={loading} className="pass-main-btn">
                {loading ? "Updating..." : "Update Password"}
              </button>
              <p className="change-email-text" onClick={() => setStep(1)}>
                Change Email Address
              </p>
            </div>
          )}
        </form>

        <div className="pass-footer">
          Back to <span onClick={() => navigate("/login")}>Sign In</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;