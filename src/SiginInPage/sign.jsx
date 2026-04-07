import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./sign.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5251/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        localStorage.setItem("userToken", result.data.token);
        localStorage.setItem("userRole", result.data.role || "User");
        localStorage.setItem("userEmail", result.data.email); 
        localStorage.setItem("userFirstName", result.data.firstName); 
        localStorage.setItem("userLastName", result.data.lastName);  
        
        navigate("/User-Profile"); 
        window.location.reload(); 
      } 
      else if (result.message === "EMAIL_NOT_CONFIRMED") {
        localStorage.setItem("userEmail", formData.email); 
        alert("Please verify your email address first.");
        navigate("/verify-email");
      } 
      else {
        setError(result.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <div className="signin-header">
          <div className="logo-small">Travel<span>Agen</span></div>
          <h1>Welcome Back</h1>
        </div>
        
        {error && <div style={{color: '#ff4d4d', textAlign: 'center', marginBottom: '10px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          {/* 🔥 FORGOT PASSWORD LİNKİ ƏLAVƏ EDİLDİ */}
          <div className="forgot-password-container">
            <span 
              className="forgot-password-link" 
              onClick={() => navigate('/Forgot-Pass')}
            >
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="signin-main-btn">Sign In</button>
        </form>
        
        <div className="signin-footer">
          Don't have an account? <span onClick={() => navigate('/register')} style={{cursor: 'pointer', color: '#ffa500'}}>Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;