import React, { useState, useEffect } from "react";
import axios from "axios";
import "./profile.css";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false); // Edit rejimi üçün
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pin: "",
    birthDate: "",
    joinedDate: "April 2026"
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const savedFirstName = localStorage.getItem("firstName");
    const savedLastName = localStorage.getItem("lastName");
    const savedPin = localStorage.getItem("userPin");
    const savedBirthDate = localStorage.getItem("userBirthDate");

    if (savedEmail) {
      setUser({
        firstName: savedFirstName || "",
        lastName: savedLastName || "",
        email: savedEmail,
        pin: savedPin || "AB12345",
        birthDate: savedBirthDate || "2008-08-08",
        joinedDate: "April 2026"
      });
    }
  }, []);

  // --- EDIT PROFILE FUNKSİYASI ---
  const handleEditToggle = () => {
    if (isEditing) {
      // Burada Save (Yadda saxla) məntiqi işləyəcək
      localStorage.setItem("firstName", user.firstName);
      localStorage.setItem("lastName", user.lastName);
      localStorage.setItem("userPin", user.pin);
      localStorage.setItem("userBirthDate", user.birthDate);
      alert("Profile updated locally!");
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // --- PASSWORD CHANGE (GMAİL-Ə MESAJ) ---
  const handlePasswordChange = async () => {
    const confirmChange = window.confirm("Do you want to reset your password? A verification code will be sent to your email.");
    
    if (confirmChange) {
      setLoading(true);
      try {
        // Backend-də ForgotPassword və ya ResetPassword endpoint-i olmalıdır
        const response = await axios.post("http://localhost:5251/api/Auth/forgot-password", {
          email: user.email
        });

        if (response.status === 200) {
          alert("Reset code sent to your email!");
          // Burada kodu daxil etmək üçün başqa səhifəyə navigate edə bilərsən
        }
      } catch (error) {
        console.error("Error sending reset email:", error);
        alert("Failed to send reset email. Make sure your backend service is running.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user.email) return <div className="profile-page-wrapper"><h2 style={{color: "white"}}>Please Login</h2></div>;

  return (
    <div className="profile-page-wrapper">
      <div className="glass-container">
        
        {/* Sol Panel */}
        <div className="profile-side-bar">
          <div className="avatar-wrapper">
            <img 
              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=ff4d4d&color=fff&bold=true&size=128`} 
              alt="Avatar" 
            />
          </div>
          <h3>{user.firstName} {user.lastName}</h3>
          <p className="user-email-text">{user.email}</p>
        </div>

        {/* Sağ Panel - Detallar */}
        <div className="profile-details-area">
          <h2>Account Information</h2>
          <div className="details-grid">
            
            <div className="detail-item">
              <label>FIRST NAME</label>
              {isEditing ? (
                <input name="firstName" value={user.firstName} onChange={handleChange} className="edit-input" />
              ) : (
                <p>{user.firstName}</p>
              )}
            </div>

            <div className="detail-item">
              <label>LAST NAME</label>
              {isEditing ? (
                <input name="lastName" value={user.lastName} onChange={handleChange} className="edit-input" />
              ) : (
                <p>{user.lastName}</p>
              )}
            </div>

            <div className="detail-item">
              <label>FIN / PIN</label>
              {isEditing ? (
                <input name="pin" value={user.pin} onChange={handleChange} className="edit-input" />
              ) : (
                <p className="highlight-text">{user.pin}</p>
              )}
            </div>

            <div className="detail-item">
              <label>BIRTH DATE</label>
              {isEditing ? (
                <input type="date" name="birthDate" value={user.birthDate} onChange={handleChange} className="edit-input" />
              ) : (
                <p>{user.birthDate}</p>
              )}
            </div>

            <div className="detail-item">
              <label>EMAIL ADDRESS</label>
              <p>{user.email}</p> {/* Email adətən dəyişdirilmir */}
            </div>

            <div className="detail-item">
              <label>PASSWORD</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p>••••••••</p> 
                <span 
                  onClick={handlePasswordChange}
                  style={{ fontSize: '12px', color: '#ff4d4d', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  {loading ? "Sending..." : "Change"}
                </span>
              </div>
            </div>
          </div>

          <div className="action-buttons-group">
            <button className="btn-main-action" onClick={handleEditToggle}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
            <button className="btn-secondary-action" onClick={() => { localStorage.clear(); window.location.href="/"; }}>
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;