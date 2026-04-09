import React, { useState } from "react";
import "./addLC.css";

const AddCountryLocation = () => {
  const [activeTab, setActiveTab] = useState(null);

  return (
    <div className="lc-minimal-wrapper">
      <h2 className="lc-minimal-title">Selection <span>Panel</span></h2>
      
      <div className="lc-btn-group">
        <button 
          className={`lc-oval-btn country-theme ${activeTab === "country" ? "active" : ""}`}
          onClick={() => setActiveTab("country")}
        >
          Add Country
        </button>
        
        <button 
          className={`lc-oval-btn location-theme ${activeTab === "location" ? "active" : ""}`}
          onClick={() => setActiveTab("location")}
        >
          Add Location
        </button>
      </div>

      <div className="lc-display-content">
        {activeTab === "country" && <AddCountry />}
        {activeTab === "location" && <AddLocation />}
        
        {!activeTab && (
          <p className="lc-hint-text">Lütfən, icra etmək istədiyiniz əməliyyatı seçin.</p>
        )}
      </div>
    </div>
  );
};

export default AddCountryLocation;