import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./sign.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (formData) => {
  const errs = {};
  if (!formData.email.trim()) {
    errs.email = "Email can't be empty";
  } else if (!emailRegex.test(formData.email.trim())) {
    errs.email = "Please enter the correct email format (e.g. user@mail.com)";
  }
  if (!formData.password) {
    errs.password = "Password cannot be empty!";
  } else if (formData.password.length < 6) {
    errs.password = "Password must be at least 6 characters long";
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
    const { name, value } = e.target;
    const currentData = { ...formData, [name]: value };
    const errs = validate(currentData);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errs[name] || "",
    }));
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
      } else {
        setServerError("The email or password is incorrect. Please try again.");
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message;
        if (status === 401 || status === 400) {
          setServerError(msg || "The email or password is incorrect. Please try again.");
        } else if (msg) {
          setServerError(msg);
        } else {
          setServerError("An error occurred on the server.");
        }
      } else {
        setServerError("Server connection failed. Please try again later.");
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

        {/* Server error — ForgotPassword-dakı kimi tam blok */}
        {serverError && (
          <div className="signin-error-box">
            ⚠ {serverError}
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
            {/* Field error — input altında kiçik xəta */}
            {fieldErrors.email && (
              <span className="signin-field-error">⚠ {fieldErrors.email}</span>
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
              <span className="signin-field-error">⚠ {fieldErrors.password}</span>
            )}
          </div>

          <div className="forgot-password-container">
            <span className="forgot-password-link" onClick={() => navigate("/Forgot-Pass")}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="signin-main-btn" disabled={loading}>
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