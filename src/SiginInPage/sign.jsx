import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./sign.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Giriş məlumatları:", formData);
    // Bura backend (JWT/Auth) inteqrasiyası gələcək
  };

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <div className="signin-header">
          <div className="logo-small">Travel<span>Agen</span></div>
          <h1>Welcome Back</h1>
          <p>Please enter your details to sign in.</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>
          <div className="input-group">
          <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>
          <div className="label-row">
              <span className="forgot-pass">Forgot Password</span>
            </div>

          <button type="submit" className="signin-main-btn">Sign In</button>
        </form>

        <div className="signin-footer">
          Don't have an account? <span onClick={() => navigate('/register')}>Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;