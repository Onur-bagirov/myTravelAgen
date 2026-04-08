import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Daha stabil olduğu üçün axios istifadə edirik
import "./sign.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // SERVERƏ SORĞU GÖNDƏRİRİK
      const res = await axios.post("http://localhost:5251/api/Auth/login", formData);

      // ƏGƏR CAVAB UĞURLUDURSA (200 OK)
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
      // SERVERDƏN XƏTA GƏLƏNDƏ (Şifrə/Email səhv olanda bura düşür)
      if (err.response) {
        // Backend status 401 (Unauthorized) və ya 400 (Bad Request) göndərirsə
        if (err.response.status === 401 || err.response.status === 400) {
          setError("Invalid email address or password.");
        } 
        else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        }
        else {
          setError("An error occurred on the server.");
        }
      } else {
        // Server ümumiyyətlə bağlıdırsa
        setError("Server connection failed. Please try again later.");
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
        
        {/* Xəta Paneli */}
        {error && (
          <div className="top-error-container visible" style={{
            backgroundColor: "#fff0f0",
            color: "#d32f2f",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "15px",
            border: "1px solid #ffcccc",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className={error ? "input-error" : ""}
              value={formData.email} 
              onChange={handleChange} 
              placeholder="example@mail.com"
              required
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className={error ? "input-error" : ""}
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
              required
            />
          </div>

          <div className="forgot-password-container">
            <span className="forgot-password-link" onClick={() => navigate('/Forgot-Pass')}>
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
          Don't have an account? <span onClick={() => navigate('/register')} className="signup-link">Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;