import React, { useState, useEffect } from "react";
import "./profile.css";

const Profile = () => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pin: "",
    birthDate: "",
    joinedDate: "April 2026"
  });

  useEffect(() => {
    // LocalStorage-dən datanı çəkirik
    const savedEmail = localStorage.getItem("userEmail");
    const savedFirstName = localStorage.getItem("userFirstName");
    const savedLastName = localStorage.getItem("userLastName");
    const savedPin = localStorage.getItem("userPin");
    const savedBirthDate = localStorage.getItem("userBirthDate");

    if (savedEmail) {
      setUser({
        firstName: savedFirstName, 
        lastName: savedLastName,
        email: savedEmail,
        pin: savedPin || "AB12345",
        birthDate: savedBirthDate || "2008-08-08",
        joinedDate: "April 2026"
      });
    }
  }, []);

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
              <p>{user.firstName}</p>
            </div>
            <div className="detail-item">
              <label>LAST NAME</label>
              <p>{user.lastName}</p>
            </div>
            <div className="detail-item">
              <label>FIN / PIN</label>
              <p className="highlight-text">{user.pin}</p>
            </div>
            <div className="detail-item">
              <label>BIRTH DATE</label>
              <p>{user.birthDate}</p>
            </div>
            <div className="detail-item">
              <label>EMAIL ADDRESS</label>
              <p>{user.email}</p>
            </div>

            {/* 🔥 PASSWORD HİSSƏSİ BURADADIR */}
            <div className="detail-item">
              <label>PASSWORD</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p>••••••••</p> 
                <span style={{ fontSize: '12px', color: '#ff4d4d', cursor: 'pointer' }}>Change</span>
              </div>
            </div>
          </div>

          <div className="action-buttons-group">
            <button className="btn-main-action">Edit Profile</button>
            <button className="btn-secondary-action" onClick={() => { localStorage.clear(); window.location.href="/"; }}>Logout</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;