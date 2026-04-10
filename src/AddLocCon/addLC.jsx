import { useNavigate } from "react-router-dom";
import "./addLC.css";

function AddCountryLocation() {
  const navigate = useNavigate();

  return (
    <div className="addlc-wrapper">
      <div className="addlc-header">
        <h2>Admin Panel</h2>
        <p>İdarə etmek istediyin bolumu sec</p>
      </div>

      <div className="addlc-cards">
        <button className="addlc-card addlc-card--country" onClick={() => navigate("/Add-C")}>
          <div className="addlc-card__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="addlc-card__body">
            <span className="addlc-card__title">Ölkələr</span>
            <span className="addlc-card__desc">Ölkə əlavə et, düzəlt, sil</span>
          </div>
          <div className="addlc-card__arrow">→</div>
        </button>

        <button className="addlc-card addlc-card--location" onClick={() => navigate("/Add-L")}>
          <div className="addlc-card__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="addlc-card__body">
            <span className="addlc-card__title">Lokasiyalar</span>
            <span className="addlc-card__desc">Lokasiya əlavə et, düzəlt, sil</span>
          </div>
          <div className="addlc-card__arrow">→</div>
        </button>
      </div>
    </div>
  );
}

export default AddCountryLocation;