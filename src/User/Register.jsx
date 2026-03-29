import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
// SignIn importunu sildik, çünki navigate ilə keçid edirik

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    pin: "",
    birthDate: ""
  });

  const handleChange = (e) => {
    // [e.target.name] sayəsində bütün inputlar tək funksiya ilə idarə olunur
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Şifrələr uyğun gəlmir!");
      return;
    }
    
    // Backend üçün hazır obyekt
    console.log("Qeydiyyat məlumatları:", formData);
    
    // Uğurlu qeydiyyatdan sonra yönləndirmə
    navigate("/login");
  };

  return (
    <div className="birdie-register-container">
      <div className="birdie-register-box">
        <div className="birdie-icon">🌍</div>
        <h2>Join <span>TravelAgen</span></h2>
        <p>Enter your details to start</p>
        
        <form className="birdie-form" onSubmit={handleSubmit}>
          {/* Ad və Soyad */}
          <div className="input-row">
            <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
          </div>

          {/* Email */}
          <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />

          {/* Şifrə və Təsdiqi */}
          <div className="input-row">
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          </div>

          {/* Pin və Doğum Tarixi */}
          <div className="input-row">
            <input type="text" name="pin" placeholder="FIN ( 7 digits )" maxLength="7" onChange={handleChange} required />
            <input type="date" name="birthDate" className="date-input" onChange={handleChange} required />
          </div>

          <button onClick={() => navigate("/email")} type="submit" className="birdie-btn">Create Account</button>
        </form>

        <div className="register-footer">
          Already a member? <span className="login-link" onClick={() => navigate("/login")}>Sign In</span>
        </div>
      </div>
    </div>
  );
}