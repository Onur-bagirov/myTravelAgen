import { useState, useEffect } from "react";
import "./myTrainT.css";

const API_BASE = "http://localhost:5251/api";
const getToken = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

function fmtDate(d) {
  return new Date(d).toLocaleDateString("az-AZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  // Backend Fill handler artıq discount tətbiq edərək t.price-i DB-ə yazır.
  // Biz yalnız göstəririk — əlavə əməliyyat lazım deyil.
  return Number(t.price || 0).toFixed(2);
}

const STATE_MAP = {
  Booked:   { cls: "s-booked",   label: "Alınıb"      },
  Pending:  { cls: "s-pending",  label: "Gözləyir"    },
  Canceled: { cls: "s-canceled", label: "Ləğv edilib" },
  Expired:  { cls: "s-expired",  label: "Vaxtı bitib" },
  Delayed:  { cls: "s-delayed",  label: "Gecikir"     },
};

function TrainTicketCard({ t, idx }) {
  const exp    = isExpired(t);
  const stKey  = exp && t.state === "Booked" ? "Expired" : t.state;
  const st     = STATE_MAP[stKey] ?? { cls: "s-expired", label: t.state };
  const cd     = countdown(t.dueDate);
  const hasDsc   = t.discount > 0 && t.discount < 1;
  const origCalc = hasDsc ? (Number(t.price) / t.discount).toFixed(2) : null;

  return (
    <div
      className={`amt-card${exp ? " amt-card--exp" : ""}`}
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
      <div className="amt-stripe" />

      <div className="amt-body">
        {/* top row */}
        <div className="amt-top">
          <div className="amt-train-info">
            <span className="amt-train-ico">🚂</span>
            <div>
              <span className="amt-train-name">{t.trainCompany}</span>
              <span className="amt-train-num">
                №{t.trainNumber} · Vaqon {t.vagonNumber}
              </span>
            </div>
          </div>
          <div className="amt-badges">
            <span className={`amt-badge ${st.cls}`}>{st.label}</span>
          </div>
        </div>

        {/* route */}
        <div className="amt-route">
          <div className="amt-loc">
            <span className="amt-city">{t.from ?? "—"}</span>
            <span className="amt-time">{fmtTime(t.dueDate)}</span>
          </div>

          <div className="amt-mid">
            <div className="amt-track">
              <span className="amt-dot" />
              <span className="amt-dash" />
              <span className="amt-loco">🚂</span>
              <span className="amt-dash" />
              <span className="amt-dot" />
            </div>
            {exp ? (
              <span className="amt-cd amt-cd--done">Tamamlandı</span>
            ) : cd ? (
              <span className="amt-cd">{cd}</span>
            ) : null}
          </div>

          <div className="amt-loc amt-loc--r">
            <span className="amt-city">{t.to ?? "—"}</span>
            <span className="amt-time amt-time--arr">
              {fmtArrival(t.dueDate)}
            </span>
          </div>
        </div>

        {/* meta chips */}
        <div className="amt-meta">
          <span className="amt-meta-item">📅 {fmtDate(t.dueDate)}</span>
          {t.seat?.name  && <span className="amt-meta-item">💺 {t.seat.name}</span>}
          {t.variantName && <span className="amt-meta-item">🎫 {t.variantName}</span>}
          <span className="amt-meta-item">🧳 {t.luggageCount ?? 1} çanta · {t.totalLuggageKg ?? 0} kg</span>
          {t.hasPet   && <span className="amt-meta-item">🐾 Heyvan</span>}
          {t.hasChild && <span className="amt-meta-item">👶 Uşaq</span>}
        </div>

        {/* footer */}
        <div className="amt-footer">
          {t.broughtDate && (
            <span className="amt-bought">Alış: {fmtDate(t.broughtDate)}</span>
          )}
          <div className="amt-price-wrap">
            {hasDsc && (
              <span className="amt-orig">{origCalc} ₼</span>
            )}
            <span className="amt-price">{finalPrice(t)} ₼</span>
          </div>
        </div>

        {t.note && (
          <div className="amt-note">📝 {t.note}</div>
        )}
      </div>
    </div>
  );
}

export default function AllMyTrainTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/TrainTicket/my-tickets`, { headers: getHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Biletlər yüklənmədi.");
        return r.json();
      })
      .then((data) => {
        setTickets(Array.isArray(data) ? data : data?.data ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const visible = tickets.filter((t) =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );

  const activeCount = tickets.filter((t) => !isExpired(t)).length;

  return (
    <div className="amt-page">
      <div className="amt-noise" />

      <div className="amt-inner">
        {/* header */}
        <div className="amt-header">
          <div>
            <h1 className="amt-title">Qatar Biletlərim</h1>
            <p className="amt-sub">
              {activeCount} aktiv · {tickets.length} ümumi
            </p>
          </div>
          <div className="amt-filters">
            {[
              { key: "all",     label: "Hamısı" },
              { key: "active",  label: "Aktiv"  },
              { key: "expired", label: "Keçmiş" },
            ].map((f) => (
              <button
                key={f.key}
                className={`amt-filter${filter === f.key ? " amt-filter--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* loading skeletons */}
        {loading && (
          <div className="amt-list">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="amt-skeleton"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {/* error */}
        {!loading && error && (
          <div className="amt-empty">
            <span className="amt-empty-ico">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* empty */}
        {!loading && !error && visible.length === 0 && (
          <div className="amt-empty">
            <span className="amt-empty-ico">🚂</span>
            <p>
              {filter === "active"  ? "Aktiv bilet yoxdur."  :
               filter === "expired" ? "Keçmiş bilet yoxdur." :
               "Hələ heç bir bilet almamısınız."}
            </p>
          </div>
        )}

        {/* list */}
        {!loading && !error && visible.length > 0 && (
          <div className="amt-list">
            {visible.map((t, i) => (
              <TrainTicketCard key={t.id} t={t} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}