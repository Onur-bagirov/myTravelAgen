import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    pin: "",
    birthDate: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Backend-in gözlədiyi format
      const payload = {
        name: formData.firstName,   
        surname: formData.lastName, 
        email: formData.email,
        password: formData.password,
        birthday: formData.birthDate,
        fin: formData.pin
      };

      const response = await axios.post("http://localhost:5251/api/Auth/register", payload);

      if (response.data.isSuccess || response.status === 200 || response.status === 201) {
        
        // 🔥 PROFİL ÜÇÜN MÜTLƏQ OLAN HİSSƏ:
        // Buradakı adlar (məs: "firstName") Profile.jsx-dəki getItem ilə eyni olmalıdır.
        localStorage.setItem("userEmail", formData.email); 
        localStorage.setItem("firstName", formData.firstName); 
        localStorage.setItem("lastName", formData.lastName);
        localStorage.setItem("userPin", formData.pin);
        localStorage.setItem("userBirthDate", formData.birthDate);
        
        alert("Registration successful!");
        navigate("/email"); 
      }
    } catch (error) {
      console.error("Backend Error:", error.response?.data);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="birdie-register-container">
      <div className="birdie-register-box">
        <div className="birdie-icon">🌍</div>
        <h2>Join <span>TravelAgen</span></h2>
        <p>Enter your details to start your luxury journey</p>
        
        <form className="birdie-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <input 
              type="text" 
              name="firstName" 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={handleChange} 
              required 
            />
            <input 
              type="text" 
              name="lastName" 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={handleChange} 
              required 
            />
          </div>

          <input 
            type="email" 
            name="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange} 
            required 
          />

          <div className="input-row">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="input-row">
            <input 
              type="text" 
              name="pin" 
              placeholder="FIN (7 characters)" 
              maxLength="7" 
              value={formData.pin}
              onChange={handleChange} 
              required 
            />
            <input 
              type="date" 
              name="birthDate" 
              className="date-input" 
              value={formData.birthDate}
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="birdie-btn">Create Account</button>
        </form>

        <div className="register-footer">
          Already a member? <span className="login-link" onClick={() => navigate("/login")}>Sign In</span>
        </div>
      </div>
    </div>
  );
}