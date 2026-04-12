import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./sign.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (formData) => {
  const errs = {};
  if (!formData.email.trim()) {
    errs.email = "Email boş ola bilməz";
  } else if (!emailRegex.test(formData.email.trim())) {
    errs.email = "Düzgün email formatı daxil edin (məs. user@mail.com)";
  }
  if (!formData.password) {
    errs.password = "Şifrə boş ola bilməz";
  } else if (formData.password.length < 6) {
    errs.password = "Şifrə ən azı 6 simvol olmalıdır";
  }
  return errs;
};

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const errs = validate(formData);
    if (errs[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5251/api/Auth/login", formData);
      if (res.data && res.data.data) {
        const { token, role, email, firstName, lastName } = res.data.data;
        localStorage.setItem("userToken", token);
        localStorage.setItem("userRole", role || "User");
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userFirstName", firstName);
        localStorage.setItem("userLastName", lastName);
        navigate("/User-Profile");
        window.location.reload();
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 400) {
          setServerError("Email və ya şifrə səhvdir. Yenidən cəhd edin.");
        } else if (err.response.data?.message) {
          setServerError(err.response.data.message);
        } else {
          setServerError("Serverdə xəta baş verdi.");
        }
      } else {
        setServerError("Server bağlantısı alınmadı. Sonra yenidən cəhd edin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <div className="signin-header">
          <div className="logo-small">Travel<span>Agen</span></div>
          <h1>Welcome Back</h1>
          <p>Please enter your details to continue</p>
        </div>

        {serverError && (
          <div style={{
            backgroundColor: "#fff0f0",
            color: "#d32f2f",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
            border: "1px solid #ffcccc",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "500",
          }}>
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form" noValidate>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="example@mail.com"
              className={fieldErrors.email ? "input-error" : ""}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span style={{ color: "#d32f2f", fontSize: 12, marginTop: 4, display: "block", fontWeight: 500 }}>
                ⚠ {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={fieldErrors.password ? "input-error" : ""}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span style={{ color: "#d32f2f", fontSize: 12, marginTop: 4, display: "block", fontWeight: 500 }}>
                ⚠ {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="forgot-password-container">
            <span className="forgot-password-link" onClick={() => navigate("/Forgot-Pass")}>
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            className="signin-main-btn"
            disabled={loading}
          >
            {loading ? "Checking..." : "Sign In"}
          </button>
        </form>

        <div className="signin-footer">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")} className="signup-link">
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;