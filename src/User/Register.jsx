import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", pin: "", birthDate: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(""); 
  };

  const validateStepByStep = () => {
    if (!formData.firstName.trim()) return "Name is required";
    if (formData.firstName.length < 2) return "Name must be at least 2 characters";

    if (!formData.lastName.trim()) return "Surname is required";
    if (formData.lastName.length < 2) return "Surname must be at least 2 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) return "Email is required";
    if (!emailRegex.test(formData.email)) return "Invalid email format";

    if (!formData.password.trim()) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";

    if (!formData.pin.trim()) return "FIN is required";
    if (formData.pin.length !== 7) return "FIN must be exactly 7 characters";

    if (!formData.birthDate) return "Birth date is required";

    return null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const frontendError = validateStepByStep();
    if (frontendError) {
      setError(frontendError);
      return; 
    }

    const payload = {
      name: formData.firstName,
      surname: formData.lastName,
      email: formData.email,
      password: formData.password,
      birthday: formData.birthDate,
      fin: formData.pin
    };

    try {
      const res = await axios.post("http://localhost:5251/api/Auth/register", payload);
      if (res.status === 200 || res.status === 201) {
        localStorage.setItem("userEmail", formData.email);
        navigate("/email");
      }
    } catch (err) {
      const data = err.response?.data;

      // 1. Əgər şəkildəki kimi uzun "Validation failed" stringi gəlirsə (məs: Email istifadə olunub)
      if (typeof data === "string" && data.includes("Validation failed")) {
        const match = data.match(/--\s*(.*?)\s*Severity/);
        if (match && match[1]) {
          const cleanMsg = match[1].includes(":") ? match[1].split(":")[1].trim() : match[1].trim();
          setError(cleanMsg);
        } else {
          setError("This email might already be registered.");
        }
      } 
      // 2. Əgər backend obyekt (errors: {}) qaytarırsa
      else if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        setError(data.errors[firstKey][0]);
      } 
      else {
        setError(data?.message || "Registration failed. Try a different email.");
      }
    }
  };

  return (
    <div className="birdie-register-container">
      <div className="birdie-register-box">
        <div className="birdie-icon">🌍</div>
        <h2>Join <span>TravelAgen</span></h2>
        <p>Start your luxury journey</p>

        <div className={`top-error-container ${error ? "visible" : ""}`}>
          {error && <span className="top-error-msg">⚠️ {error}</span>}
        </div>

        <form className="birdie-form" onSubmit={handleSubmit} noValidate>
          <div className="input-row">
            <div className="input-wrap">
              <input type="text" name="firstName" placeholder="First Name" 
                className={error.toLowerCase().includes("name") && !error.toLowerCase().includes("last") ? "input-error" : ""}
                value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="input-wrap">
              <input type="text" name="lastName" placeholder="Last Name" 
                className={error.toLowerCase().includes("surname") || error.toLowerCase().includes("last name") ? "input-error" : ""}
                value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="input-wrap">
            <input type="email" name="email" placeholder="Email Address" 
              className={error.toLowerCase().includes("email") ? "input-error" : ""}
              value={formData.email} onChange={handleChange} />
          </div>

          <div className="input-wrap">
            <input type="password" name="password" placeholder="Password" 
              className={error.toLowerCase().includes("password") ? "input-error" : ""}
              value={formData.password} onChange={handleChange} />
          </div>

          <div className="input-row">
            <div className="input-wrap">
              <input type="text" name="pin" placeholder="FIN" maxLength="7" 
                className={error.toLowerCase().includes("fin") ? "input-error" : ""}
                value={formData.pin} onChange={handleChange} />
            </div>
            <div className="input-wrap">
              <input type="date" name="birthDate" 
                className={`date-input ${error.toLowerCase().includes("birth") ? "input-error" : ""}`}
                value={formData.birthDate} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="birdie-btn">Create Account</button>
        </form>

        <div className="register-footer">
          Member? <span className="login-link" onClick={() => navigate("/login")}>Sign In</span>
        </div>
      </div>
    </div>
  );
}