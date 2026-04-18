import { useState } from "react";
import "./pyMod.css";

export default function PaymentModal({ amount = "249.00", onConfirm, onCancel, loading }) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  function formatCardNumber(val) {
    return val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function validate() {
    const e = {};
    if (cardNumber.replace(/\s/g, "").length !== 16)
      e.cardNumber = "Card number must be 16 digits.";
    if (cardHolder.trim().split(/\s+/).length < 2)
      e.cardHolder = "Please enter your first and last name.";
    const [mm = "0", yy = "0"] = expiry.split("/");
    const expDate = new Date(2000 + Number(yy), Number(mm) - 1, 1);
    if (!expiry || expDate < new Date())
      e.expiry = "Invalid expiry date.";
    if (cvv.length < 3)
      e.cvv = "CVV must be 3 digits.";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setPaying(true);
    if (onConfirm) {
      onConfirm();
    } else {
      // Demo simulation
      setTimeout(() => {
        setPaying(false);
        setSuccess(true);
      }, 2000);
    }
  }

  const cardDigits = cardNumber.replace(/\s/g, "");
  const cardType =
    cardDigits.startsWith("4") ? "visa" :
    cardDigits.startsWith("5") ? "mastercard" :
    cardDigits.startsWith("9") ? "kapital" : null;


  const rawDigits = cardDigits.padEnd(16, "");
  const previewGroups = [
    rawDigits.slice(0, 4) || "••••",
    rawDigits.slice(4, 8) || "••••",
    rawDigits.slice(8, 12) || "••••",
    cardDigits.slice(12) || "••••",
  ];

  const refNumber = `TA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  if (success) {
    return (
      <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
        <div className="pm-modal">
          <button className="pm-close" onClick={onCancel}>✕</button>
          <div className="pm-success">
            <div className="pm-success-icon">✓</div>
            <h2 className="pm-success-title">Payment Successful!</h2>
            <p className="pm-success-amount">{amount} ₼</p>
            <p className="pm-success-sub">
              Your booking is confirmed.<br />
              A receipt has been sent to your email.
            </p>
            <span className="pm-success-ref">REF: {refNumber}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pm-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="pm-modal">
        <button className="pm-close" onClick={onCancel}>✕</button>

        <div className="pm-header">
          <div className="pm-lock-icon">🔒</div>
          <h2 className="pm-title">Secure Payment</h2>
          <p className="pm-sub">Your information is encrypted &amp; protected</p>
        </div>

        <div className={`pm-card-preview${cardType ? ` pm-card-preview--${cardType}` : ""}`}>
          <div className="pm-card-top">
            <div className="pm-chip" />
            {cardType === "visa" && (
              <span className="pm-brand pm-brand--visa">VISA</span>
            )}
            {cardType === "mastercard" && (
              <div className="pm-brand pm-brand--mc">
                <span className="pm-mc-left" />
                <span className="pm-mc-right" />
              </div>
            )}
            {cardType === "kapital" && (
              <span className="pm-brand pm-brand--kb">KB</span>
            )}
          </div>

          <div className="pm-card-number">
            {previewGroups.map((group, i) => (
              <span key={i} className="pm-card-group">
                {i < 3 ? (cardDigits.length > i * 4 ? "••••" : "••••") : group}
              </span>
            ))}
          </div>

          <div className="pm-card-bottom">
            <div>
              <div className="pm-card-label">Cardholder</div>
              <div className="pm-card-val">
                {cardHolder.toUpperCase() || "FULL NAME"}
              </div>
            </div>
            <div>
              <div className="pm-card-label">Expires</div>
              <div className="pm-card-val">{expiry || "MM/YY"}</div>
            </div>
            <div className="pm-card-amount">
              <div className="pm-card-label">Amount</div>
              <div className="pm-card-val pm-card-val--price">{amount} ₼</div>
            </div>
          </div>
        </div>

        <div className="pm-form">
          <div className="pm-field">
            <label className="pm-label">Card Number</label>
            <input
              className={`pm-input${errors.cardNumber ? " pm-input--err" : ""}`}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value));
                setErrors((prev) => ({ ...prev, cardNumber: undefined }));
              }}
              inputMode="numeric"
              autoComplete="cc-number"
            />
            {errors.cardNumber && (
              <span className="pm-err">{errors.cardNumber}</span>
            )}
          </div>

          <div className="pm-field">
            <label className="pm-label">Cardholder Name</label>
            <input
              className={`pm-input${errors.cardHolder ? " pm-input--err" : ""}`}
              placeholder="FULL NAME"
              value={cardHolder}
              onChange={(e) => {
                setCardHolder(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, cardHolder: undefined }));
              }}
              autoComplete="cc-name"
            />
            {errors.cardHolder && (
              <span className="pm-err">{errors.cardHolder}</span>
            )}
          </div>

          <div className="pm-row">
            <div className="pm-field">
              <label className="pm-label">Expiry Date</label>
              <input
                className={`pm-input${errors.expiry ? " pm-input--err" : ""}`}
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => {
                  setExpiry(formatExpiry(e.target.value));
                  setErrors((prev) => ({ ...prev, expiry: undefined }));
                }}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
              {errors.expiry && (
                <span className="pm-err">{errors.expiry}</span>
              )}
            </div>

            <div className="pm-field">
              <label className="pm-label">CVV</label>
              <input
                className={`pm-input${errors.cvv ? " pm-input--err" : ""}`}
                placeholder="•••"
                value={cvv}
                type="password"
                maxLength={3}
                onChange={(e) => {
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
                  setErrors((prev) => ({ ...prev, cvv: undefined }));
                }}
                inputMode="numeric"
                autoComplete="cc-csc"
              />
              {errors.cvv && (
                <span className="pm-err">{errors.cvv}</span>
              )}
            </div>
          </div>
        </div>

        <div className="pm-badges">
          <span className="pm-badge">
            <span className="pm-badge-dot" />
            SSL Secured
          </span>
          <span className="pm-badge">
            <span className="pm-badge-dot" />
            256-bit Encrypted
          </span>
          <span className="pm-badge">
            <span className="pm-badge-dot" />
            PCI Compliant
          </span>
        </div>
        
        <button
          className={`pm-pay-btn${paying || loading ? " pm-pay-btn--loading" : ""}`}
          onClick={handleSubmit}
          disabled={paying || loading}
        >
          {paying || loading ? (
            <span className="pm-spinner" />
          ) : (
            <>🔒 Pay {amount} ₼</>
          )}
        </button>

        <p className="pm-disclaimer">
          Card details are not stored. This is a payment simulation.
        </p>
      </div>
    </div>
  );
}