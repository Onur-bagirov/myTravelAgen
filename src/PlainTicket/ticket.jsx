import React, { useState } from "react";
import "./ticket.css";

const PlanetTicket = () => {
  const [searchData, setSearchData] = useState({
    from: "Baku, Azerbaijan", fromCode: "BAK",
    to: "Istanbul, Turkey", toCode: "IST",
    date: "2026-03-25",
    adults: 1, children: 0, infants: 0
  });

  // Sayğac funksiyası
  const updateCount = (type, operation) => {
    setSearchData(prev => ({
      ...prev,
      [type]: operation === 'inc' ? prev[type] + 1 : Math.max(type === 'adults' ? 1 : 0, prev[type] - 1)
    }));
  };

  return (
    <div className="ticket-page-wrapper">
      <div className="ios-container">
        <h1 className="main-title">Buy a Plane Ticket</h1>

        <div className="search-section">
          
          {/* LOCATION CARD */}
          <div className="ios-card travel-card">
            <div className="ios-row">
              <div className="input-field">
                <span className="label-tiny">From</span>
                <select className="premium-select" value={searchData.from} onChange={(e) => setSearchData({...searchData, from: e.target.value})}>
                  <option>Baku, Azerbaijan</option>
                  <option>London, UK</option>
                  <option>New York, USA</option>
                </select>
              </div>
              <div className="code-badge">{searchData.fromCode}</div>
            </div>

            <div className="ios-divider">
              <div className="ios-swap-btn">⇅</div>
            </div>

            <div className="ios-row">
              <div className="input-field">
                <span className="label-tiny">To</span>
                <select className="premium-select" value={searchData.to} onChange={(e) => setSearchData({...searchData, to: e.target.value})}>
                  <option>Istanbul, Turkey</option>
                  <option>Dubai, UAE</option>
                  <option>Paris, France</option>
                </select>
              </div>
              <div className="code-badge">{searchData.toCode}</div>
            </div>
          </div>

          {/* DATE CARD */}
          <div className="ios-card single-row">
            <div className="input-field">
              <span className="label-tiny">Departure Date</span>
              <input type="date" className="ios-date-input" value={searchData.date} onChange={(e) => setSearchData({...searchData, date: e.target.value})} />
            </div>
            <div className="icon-box">📅</div>
          </div>

          {/* PASSENGERS CARD (DIRECTLY IN CARD) */}
          <div className="ios-card passenger-card">
            <span className="label-tiny padding-left">Passengers</span>
            
            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Adults</span>
                <span className="p-desc">12+ years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('adults', 'dec')}>−</button>
                <span>{searchData.adults}</span>
                <button onClick={() => updateCount('adults', 'inc')}>+</button>
              </div>
            </div>

            <div className="inner-divider"></div>

            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Children</span>
                <span className="p-desc">2-11 years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('children', 'dec')}>−</button>
                <span>{searchData.children}</span>
                <button onClick={() => updateCount('children', 'inc')}>+</button>
              </div>
            </div>

            <div className="inner-divider"></div>

            <div className="passenger-row">
              <div className="p-info">
                <span className="p-type">Infants</span>
                <span className="p-desc">Under 2 years</span>
              </div>
              <div className="stepper">
                <button onClick={() => updateCount('infants', 'dec')}>−</button>
                <span>{searchData.infants}</span>
                <button onClick={() => updateCount('infants', 'inc')}>+</button>
              </div>
            </div>
          </div>

          <button className="ios-main-btn">Search Flights</button>
        </div>
      </div>
    </div>
  );
};

export default PlanetTicket;