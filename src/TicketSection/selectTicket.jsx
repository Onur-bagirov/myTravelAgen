import React from 'react';
import './selectTicket.css';

const SelectTicket = ({ onSelect }) => {
  return (
    <div className="st-shell">
      <div className="st-header">
        <span className="st-eyebrow">Ticket Management</span>
        <h1 className="st-title">Create New <span>Ticket</span></h1>
        <p className="st-desc">Please select the type of transport you wish to configure.</p>
      </div>

      <div className="st-grid">
        {/* Plane Ticket Card */}
        <div className="st-card" onClick={() => onSelect('plane')}>
          <div className="st-card-icon plane-icon">
            <i className="fa-solid fa-plane-up"></i>
          </div>
          <div className="st-card-content">
            <h3>Create Plane Ticket</h3>
            <p>Organize new flights and airline tickets for global destinations.</p>
          </div>
          <div className="st-card-arrow">
            <i className="fa-solid fa-chevron-right"></i>
          </div>
        </div>

        {/* Train Ticket Card */}
        <div className="st-card" onClick={() => onSelect('train')}>
          <div className="st-card-icon train-icon">
            <i className="fa-solid fa-train-subway"></i>
          </div>
          <div className="st-card-content">
            <h3>Create Train Ticket</h3>
            <p>Define new railway routes and schedules for regional travel.</p>
          </div>
          <div className="st-card-arrow">
            <i className="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>

      <div className="st-footer-note">
        <i className="fa-solid fa-circle-info"></i>
        After selecting a type, you will be redirected to the specific configuration form.
      </div>
    </div>
  );
};

export default SelectTicket;