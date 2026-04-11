import { useState } from "react";
import "./pyMod.css";

export default function PaymentModal({ amount, onConfirm, onCancel, loading }) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});

  function formatCardNumber(val) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function validate() {
    const e = {};
    if (cardNumber.replace(/\s/g, "").length !== 16)
      e.cardNumber = "Kart nömrəsi 16 rəqəm olmalıdır.";
    if (cardHolder.trim().split(/\s+/).length < 2)
      e.cardHolder = "Ad və soyadı daxil edin.";
    const [mm = "0", yy = "0"] = expiry.split("/");
    const now = new Date();
    const expDate = new Date(2000 + Number(yy), Number(mm) - 1, 1);
    if (!expiry || expDate < now)
      e.expiry = "Etibarlılıq tarixi düzgün deyil.";
    if (cvv.length < 3)
      e.cvv = "CVV 3 rəqəm olmalıdır.";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onConfirm();
  }

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardType =
    cardDigits.startsWith("4") ? "visa" :
    cardDigits.startsWith("5") ? "mastercard" :
    cardDigits.startsWith("9") ? "kapital" : null;

  return (
    <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pm-modal">
        <button className="pm-close" onClick={onCancel}>✕</button>

        <div className="pm-header">
          <div className="pm-lock-icon">🔒</div>
          <h2 className="pm-title">Ödəniş</h2>
          <p className="pm-sub">Məlumatlarınız şifrələnərək göndərilir</p>
        </div>

        {/* Kart preview */}
        <div className={`pm-card-preview ${cardType ? `pm-card-preview--${cardType}` : ""}`}>
          <div className="pm-card-top">
            <div className="pm-chip" />
            {cardType === "visa" && <span className="pm-brand pm-brand--visa">VISA</span>}
            {cardType === "mastercard" && (
              <div className="pm-brand pm-brand--mc">
                <span className="pm-mc-left" />
                <span className="pm-mc-right" />
              </div>
            )}
            {cardType === "kapital" && <span className="pm-brand pm-brand--kb">KB</span>}
          </div>
          <div className="pm-card-number">
            {cardNumber
              ? cardNumber.padEnd(19, " ").replace(/(.{5})/g, (m, i) => i < 15 ? "•••• " : m.trim())
                  .split(" ").map((g, i) => (
                    <span key={i} className="pm-card-group">
                      {i < 3 ? "••••" : (cardNumber.replace(/\s/g, "").slice(12) || "••••")}
                    </span>
                  ))
              : ["••••", "••••", "••••", "••••"].map((g, i) => (
                  <span key={i} className="pm-card-group">{g}</span>
                ))
            }
          </div>
          <div className="pm-card-bottom">
            <div>
              <div className="pm-card-label">Kart sahibi</div>
              <div className="pm-card-val">{cardHolder.toUpperCase() || "AD SOYAD"}</div>
            </div>
            <div>
              <div className="pm-card-label">Son tarix</div>
              <div className="pm-card-val">{expiry || "MM/YY"}</div>
            </div>
            <div className="pm-card-amount">
              <div className="pm-card-label">Məbləğ</div>
              <div className="pm-card-val pm-card-val--price">{amount} ₼</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="pm-form">
          <div className="pm-field">
            <label className="pm-label">Kart nömrəsi</label>
            <input
              className={`pm-input ${errors.cardNumber ? "pm-input--err" : ""}`}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value));
                setErrors((prev) => ({ ...prev, cardNumber: undefined }));
              }}
              inputMode="numeric"
            />
            {errors.cardNumber && <span className="pm-err">{errors.cardNumber}</span>}
          </div>

          <div className="pm-field">
            <label className="pm-label">Kart sahibinin adı</label>
            <input
              className={`pm-input ${errors.cardHolder ? "pm-input--err" : ""}`}
              placeholder="AD SOYAD"
              value={cardHolder}
              onChange={(e) => {
                setCardHolder(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, cardHolder: undefined }));
              }}
            />
            {errors.cardHolder && <span className="pm-err">{errors.cardHolder}</span>}
          </div>

          <div className="pm-row">
            <div className="pm-field">
              <label className="pm-label">Son istifadə tarixi</label>
              <input
                className={`pm-input ${errors.expiry ? "pm-input--err" : ""}`}
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => {
                  setExpiry(formatExpiry(e.target.value));
                  setErrors((prev) => ({ ...prev, expiry: undefined }));
                }}
                inputMode="numeric"
              />
              {errors.expiry && <span className="pm-err">{errors.expiry}</span>}
            </div>

            <div className="pm-field">
              <label className="pm-label">CVV</label>
              <input
                className={`pm-input ${errors.cvv ? "pm-input--err" : ""}`}
                placeholder="•••"
                value={cvv}
                type="password"
                maxLength={3}
                onChange={(e) => {
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
                  setErrors((prev) => ({ ...prev, cvv: undefined }));
                }}
                inputMode="numeric"
              />
              {errors.cvv && <span className="pm-err">{errors.cvv}</span>}
            </div>
          </div>
        </div>

        <button
          className={`pm-pay-btn ${loading ? "pm-pay-btn--loading" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="pm-spinner" />
          ) : (
            <>🔒 {amount} ₼ Ödə</>
          )}
        </button>

        <p className="pm-disclaimer">
          Kart məlumatlarınız saxlanılmır. Ödəniş simulyasiya məqsədlidir.
        </p>
      </div>
    </div>
  );
}