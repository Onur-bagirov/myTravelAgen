import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Vite xətası almamaq üçün faylın adının sign.css olduğundan əmin ol
import "./sign.css"; 

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(""); 
  };

  // 1. Frontend-də addım-addım yoxlama
  const validateStepByStep = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) return "Email address is required";
    if (!emailRegex.test(formData.email)) return "Please enter a valid email";
    if (!formData.password.trim()) return "Password is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Öncə frontend yoxlaması
    const frontendError = validateStepByStep();
    if (frontendError) {
      setError(frontendError);
      return;
    }

    try {
      // Backend URL-i öz layihənə görə dəqiqləşdir
      const res = await axios.post("http://localhost:5251/api/Auth/login", formData);

      if (res.status === 200 && res.data.data) {
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
      const data = err.response?.data;

      // 2. ŞƏKİLDƏKİ UZUN MƏTNİ TƏMİZLƏYƏN "SMART" MƏNTİQ
      if (typeof data === "string" && data.includes("Validation failed")) {
        // Mətni "--" işarəsinə görə bölürük və ilk xətanı götürürük
        const parts = data.split("--");
        if (parts.length > 1) {
          // "Name: Message" formatından ":" sonrasını alırıq
          const rawMessage = parts[1].split("Severity")[0];
          const cleanMsg = rawMessage.includes(":") ? rawMessage.split(":")[1] : rawMessage;
          setError(cleanMsg.trim());
        } else {
          setError("Invalid input data.");
        }
      } 
      // 3. Əgər backend xətanı obyekt (FluentValidation) kimi göndərirsə
      else if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        setError(data.errors[firstKey][0]);
      } 
      else {
        setError(data?.message || "Invalid email or password.");
      }
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
        
        {/* Səliqəli Xəta Paneli */}
        <div className={`top-error-container ${error ? "visible" : ""}`}>
          {error && <span className="top-error-msg">⚠️ {error}</span>}
        </div>
        
        <form onSubmit={handleSubmit} className="signin-form" noValidate>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className={error.toLowerCase().includes("email") ? "input-error" : ""}
              value={formData.email} 
              onChange={handleChange} 
              placeholder="example@mail.com"
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className={error.toLowerCase().includes("password") ? "input-error" : ""}
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
            />
          </div>

          <div className="forgot-password-container">
            <span className="forgot-password-link" onClick={() => navigate('/Forgot-Pass')}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="signin-main-btn">Sign In</button>
        </form>
        
        <div className="signin-footer">
          Don't have an account? <span onClick={() => navigate('/register')} className="signup-link">Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;