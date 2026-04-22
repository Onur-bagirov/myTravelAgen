import React from "react";
import "./footerP.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-inner">

          {/* Brand */}
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              Travel<span>Agen</span>
            </a>
            <p className="footer-tagline">
              Premium travel experience &amp; exclusive tours worldwide.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram" className="footer-social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter / X" className="footer-social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="footer-social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li>Home</li>
              <li>About</li>
              <li>Buy Tickets</li>
              <li>My Tickets</li>
              <li>My Profile</li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-links">
              <li>Plane Tickets</li>
              <li>Train Tickets</li>
              <li>Bus Tickets</li>
              <li>Seat Map</li>
              <li>Priority Boarding</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col footer-contact">
            <h4 className="footer-col-title">Contact Us</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <span className="footer-contact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span className="footer-contact-text">
                  <span className="footer-contact-label">Location</span>
                  <span className="footer-contact-val">Baku, Azerbaijan</span>
                </span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.37 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.88-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <span className="footer-contact-text">
                  <span className="footer-contact-label">Phone</span>
                  <span className="footer-contact-val">+994 051 541 96 88</span>
                </span>
              </li>
              <li className="footer-contact-item">
                <span className="footer-contact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <span className="footer-contact-text">
                  <span className="footer-contact-label">Email</span>
                  <span className="footer-contact-val">travelagen2026@gmail.com</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Message CTA */}
          <div className="footer-message-col">
            <h4 className="footer-col-title">Bizimlə Əlaqə</h4>
            <p className="footer-msg-desc">
              Sualınız, təklifiniz və ya şikayətiniz var? Admin və ya Executive komandamıza birbaşa mesaj göndərin.
            </p>
            <a href="/message" className="footer-msg-cta">
              <span className="footer-msg-cta-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span className="footer-msg-cta-text">
                <span className="footer-msg-cta-title">Mesaj Göndər</span>
                <span className="footer-msg-cta-sub">Mesaj səhifəsinə keç →</span>
              </span>
            </a>
            <div className="footer-msg-features">
              <div className="footer-msg-feat">
                <span className="footer-msg-feat-dot admin" />
                Admin dəstəyi
              </div>
              <div className="footer-msg-feat">
                <span className="footer-msg-feat-dot exec" />
                Executive komanda
              </div>
              <div className="footer-msg-feat">
                <span className="footer-msg-feat-dot reply" />
                Cavab bildirişi
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span className="footer-bottom-copy">
            © {new Date().getFullYear()} TravelAgen. All rights reserved.
          </span>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <span className="footer-bottom-dot" />
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}