import { useState, useEffect } from "react";
import "./allMyP.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

function fmtDate(d) {
  return new Date(d).toLocaleDateString("az-AZ", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtTime(d) {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}
function fmtArrival(d) {
  const dt = new Date(d);
  dt.setHours(dt.getHours() + 2);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}
function countdown(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Bu gün";
  if (days === 1) return "Sabah";
  return `${days} gün qaldı`;
}
function isExpired(t) {
  return new Date(t.dueDate) < new Date();
}
function finalPrice(t) {
  return (t.price * (t.discount || 1)).toFixed(2);
}

const STATE_MAP = {
  Booked:   { cls: "s-booked",   label: "Alınıb"       },
  Pending:  { cls: "s-pending",  label: "Gözləyir"     },
  Canceled: { cls: "s-canceled", label: "Ləğv edilib"  },
  Expired:  { cls: "s-expired",  label: "Vaxtı bitib"  },
  Delayed:  { cls: "s-delayed",  label: "Gecikir"      },
};

function TicketCard({ t, idx }) {
  const exp = isExpired(t);
  const cd  = countdown(t.dueDate);
  const st  = STATE_MAP[t.state] ?? { cls: "s-expired", label: t.state };
  const hasDsc = t.discount > 0 && t.discount < 1;

  return (
    <div className={`amp-card${exp ? " amp-card--exp" : ""}`}
         style={{ animationDelay: `${idx * 0.07}s` }}>

      {/* left stripe */}
      <div className="amp-stripe" />

      <div className="amp-body">
        {/* top row */}
        <div className="amp-top">
          <div className="amp-airline">
            <span className="amp-plane-ico">✈</span>
            <div>
              <span className="amp-airline-name">{t.airline}</span>
              <span className="amp-plane-model">{t.plane}</span>
            </div>
          </div>
          <div className="amp-badges">
            {t.variant?.isPriority && <span className="amp-badge amp-badge--pri">Priority</span>}
            <span className={`amp-badge ${st.cls}`}>{st.label}</span>
          </div>
        </div>

        {/* route */}
        <div className="amp-route">
          <div className="amp-loc">
            <span className="amp-city">{t.from ?? "—"}</span>
            <span className="amp-time">{fmtTime(t.dueDate)}</span>
          </div>

          <div className="amp-mid">
            <div className="amp-track">
              <span className="amp-dot" />
              <span className="amp-dash" />
              <span className="amp-fly">✈</span>
              <span className="amp-dash" />
              <span className="amp-dot" />
            </div>
            {cd && !exp && <span className="amp-cd">{cd}</span>}
            {exp && <span className="amp-cd amp-cd--exp">Tamamlandı</span>}
          </div>

          <div className="amp-loc amp-loc--r">
            <span className="amp-city">{t.to ?? "—"}</span>
            <span className="amp-time">{fmtArrival(t.dueDate)}</span>
          </div>
        </div>

        {/* meta */}
        <div className="amp-meta">
          <span className="amp-meta-item">📅 {fmtDate(t.dueDate)}</span>
          {t.gate && <span className="amp-meta-item">🚪 Gate {t.gate}</span>}
          {t.meal && <span className="amp-meta-item">🍽 {t.meal}</span>}
          {t.seat?.name && <span className="amp-meta-item">💺 {t.seat.name}</span>}
          {t.variant?.name && <span className="amp-meta-item">🎫 {t.variant.name}</span>}
          <span className="amp-meta-item">🧳 {t.luggageCount} çanta · {t.totalLuggageKg} kg</span>
          {t.hasPet   && <span className="amp-meta-item">🐾 Heyvan</span>}
          {t.hasChild && <span className="amp-meta-item">👶 Uşaq</span>}
        </div>

        {/* footer */}
        <div className="amp-footer">
          {t.broughtDate && (
            <span className="amp-bought">Alış: {fmtDate(t.broughtDate)}</span>
          )}
          <div className="amp-price-wrap">
            {hasDsc && (
              <span className="amp-orig">{t.price.toFixed(2)} ₼</span>
            )}
            <span className="amp-price">{finalPrice(t)} ₼</span>
          </div>
        </div>

        {t.note && <div className="amp-note">📝 {t.note}</div>}
      </div>
    </div>
  );
}

export default function AllMyP() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/PlaneTicket/my-tickets`, { headers: getHeaders() })
      .then(r => {
        if (!r.ok) throw new Error("Biletlər yüklənmədi.");
        return r.json();
      })
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const visible = tickets.filter(t =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );

  const activeCount  = tickets.filter(t => !isExpired(t)).length;

  return (
    <div className="amp-page">
      <div className="amp-noise" />

      <div className="amp-inner">
        {/* header */}
        <div className="amp-header">
          <div>
            <h1 className="amp-title">Biletlərim</h1>
            <p className="amp-sub">
              {activeCount} aktiv · {tickets.length} ümumi
            </p>
          </div>
          <div className="amp-filters">
            {[
              { key: "all",     label: "Hamısı" },
              { key: "active",  label: "Aktiv"  },
              { key: "expired", label: "Keçmiş" },
            ].map(f => (
              <button
                key={f.key}
                className={`amp-filter${filter === f.key ? " amp-filter--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        {loading && (
          <div className="amp-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="amp-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="amp-empty">
            <span className="amp-empty-ico">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="amp-empty">
            <span className="amp-empty-ico">✈</span>
            <p>
              {filter === "active"  ? "Aktiv bilet yoxdur." :
               filter === "expired" ? "Keçmiş bilet yoxdur." :
               "Hələ heç bir bilet almamısınız."}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="amp-list">
            {visible.map((t, i) => (
              <TicketCard key={t.id} t={t} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}