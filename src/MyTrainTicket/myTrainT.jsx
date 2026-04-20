import { useState, useEffect } from "react";
import "./myTrainT.css";

const API_BASE = "http://localhost:5251/api";
const getToken   = () => localStorage.getItem("userToken");
const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

function fmtDateInfo(d) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function fmtDateSidebar(d) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short",
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
  if (days < 0)  return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}
function isExpired(t) { return new Date(t.dueDate) < new Date(); }
function finalPrice(t) {
  const base = Number(t.price || 0);
  return (t.discount > 0 && t.discount < 1 ? base * t.discount : base).toFixed(2);
}

const STATE_MAP = {
  Booked:   { cls: "pill-booked",   label: "Booked"   },
  Pending:  { cls: "pill-pending",  label: "Pending"  },
  Canceled: { cls: "pill-canceled", label: "Canceled" },
  Expired:  { cls: "pill-used",     label: "Used"     },
  Delayed:  { cls: "pill-delayed",  label: "Delayed"  },
};

function TrainTicketCard({ t, idx, onReturn }) {
  const [returning, setReturning] = useState(false);

  const exp     = isExpired(t);
  const stKey   = exp && t.state === "Booked" ? "Expired" : t.state;
  const st      = STATE_MAP[stKey] ?? { cls: "pill-used", label: t.state };
  const cd      = countdown(t.dueDate);
  const hasDsc  = t.discount > 0 && t.discount < 1;

  const varName = t.variantName ?? t.variant?.name ?? "Standart";

  async function handleReturn() {
    if (!window.confirm("Are you sure you want to return this ticket?")) return;
    setReturning(true);
    try {
      const res = await fetch(`${API_BASE}/TrainTicket/return/${t.id}`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Return failed.");
      onReturn(t.id);
    } catch (e) {
      alert(e.message);
      setReturning(false);
    }
  }

  return (
    <div
      className={`tr-card${exp ? " tr-card--exp" : ""}`}
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
      <div className="tr-main">
        <div className="tr-topbar">
          <div className="tr-topbar-left">
            <div className="tr-icon-btn">🚆</div>
            <span className="tr-topbar-title">TRAIN TICKET</span>
            <span className="tr-topbar-sep">·</span>
            <span className="tr-topbar-variant">{varName.toUpperCase()}</span>
          </div>
          <div className="tr-topbar-pills">
            <span className={`tr-pill ${st.cls}`}>{st.label}</span>
            {t.variant?.isPriority && (
              <span className="tr-pill pill-priority">Priority</span>
            )}
          </div>
        </div>

        <div className="tr-route">
          <div className="tr-city-col">
            <span className="tr-city-label">FROM</span>
            <p className="tr-city">
              {t.from ?? "—"}
              <span className="tr-city-dot">•</span>
            </p>
          </div>

          <div className="tr-route-track">
            <div className="tr-track-line">
              <span className="tr-dot tr-dot--filled" />
              <span className="tr-dash" />
              <span className="tr-track-loco">🚆</span>
              <span className="tr-dash" />
              <span className="tr-dot" />
            </div>
            {exp ? (
              <span className="tr-track-badge">Completed</span>
            ) : cd ? (
              <span className="tr-track-badge tr-track-badge--live">{cd.toUpperCase()}</span>
            ) : null}
          </div>

          <div className="tr-city-col tr-city-col--r">
            <span className="tr-city-label">TO</span>
            <p className="tr-city">{t.to ?? "—"}</p>
          </div>
        </div>

        <div className="tr-info-row">
          <div className="tr-info-item">
            <span className="tr-info-label">Passenger</span>
            <span className="tr-info-val tr-info-val--name">
              {t.passengerName ?? t.passenger ?? t.userName ?? t.fullName ?? t.name ?? "—"}
            </span>
          </div>
          <div className="tr-info-item">
            <span className="tr-info-label">Departure</span>
            <span className="tr-info-val">{fmtTime(t.dueDate)}</span>
          </div>
          <div className="tr-info-item">
            <span className="tr-info-label">Arrival Est.</span>
            <span className="tr-info-val">{fmtArrival(t.dueDate)}</span>
          </div>
          <div className="tr-info-item">
            <span className="tr-info-label">Date</span>
            <span className="tr-info-val">{fmtDateInfo(t.dueDate)}</span>
          </div>
        </div>
        <div className="tr-chips">
          {t.vagonNumber && (
            <span className="tr-chip">Coach {t.vagonNumber}</span>
          )}
          {t.seat?.name && (
            <span className="tr-chip">{t.seat.name}</span>
          )}
          {(t.luggageCount > 0 || t.totalLuggageKg > 0) && (
            <span className="tr-chip">
              {t.luggageCount ?? 1} bags · {t.totalLuggageKg ?? 0} kg
            </span>
          )}
          {t.hasPet   && <span className="tr-chip">🐾 Pet</span>}
          {t.hasChild && <span className="tr-chip">👶 Child</span>}
        </div>

        {t.note && <div className="tr-note">📝 {t.note}</div>}
        {!exp && (
          <div className="tr-return-row">
            <button
              className={`tr-return-btn${returning ? " tr-return-btn--busy" : ""}`}
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? "Processing…" : "↩ Return Ticket"}
            </button>
          </div>
        )}
      </div>

      <div className="tr-sidebar">
        <div className="tr-sb-row">
          <span className="tr-sb-label">Company</span>
          <span className="tr-sb-val">{t.trainCompany ?? "—"}</span>
        </div>
        {t.trainNumber && (
          <div className="tr-sb-row">
            <span className="tr-sb-label">Train</span>
            <span className="tr-sb-val">#{t.trainNumber}</span>
          </div>
        )}
        <div className="tr-sb-row">
          <span className="tr-sb-label">Date</span>
          <span className="tr-sb-val tr-sb-val--sm">{fmtDateSidebar(t.dueDate)}</span>
        </div>
        {t.vagonNumber && (
          <div className="tr-sb-row">
            <span className="tr-sb-label">Coach</span>
            <span className="tr-sb-val">{t.vagonNumber}</span>
          </div>
        )}
        <div className="tr-sb-badges">
          <span className={`tr-sb-pill ${st.cls}`}>{st.label}</span>
          {t.variant?.isPriority && (
            <span className="tr-sb-pill pill-priority">Priority</span>
          )}
        </div>
        <div className="tr-sb-price">
          <span className="tr-sb-label">Price</span>
          {hasDsc && (
            <span className="tr-sb-orig">{Number(t.price).toFixed(2)} ₼</span>
          )}
          <span className="tr-sb-amount">
            {finalPrice(t)}<span className="tr-sb-cur"> ₼</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AllMyTrainTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/TrainTicket/my-tickets`, { headers: getHeaders() })
      .then(r => {
        if (!r.ok) throw new Error("Tickets could not be loaded.");
        return r.json();
      })
      .then(data => {
        const arr = Array.isArray(data) ? data : data?.data ?? [];
        setTickets(arr);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  function handleReturn(id) {
    setTickets(prev => prev.filter(t => t.id !== id));
  }

  const visible = tickets.filter(t =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );
  const activeCount = tickets.filter(t => !isExpired(t)).length;

  return (
    <div className="tr-page">
      <div className="tr-inner">
        <div className="tr-page-header">
          <div>
            <h1 className="tr-page-title">My Train Tickets</h1>
            <p className="tr-page-sub">{activeCount} active · {tickets.length} total</p>
          </div>
          <div className="tr-filters">
            {[
              { key: "all",     label: "All"    },
              { key: "active",  label: "Active" },
              { key: "expired", label: "Past"   },
            ].map(f => (
              <button
                key={f.key}
                className={`tr-filter-btn${filter === f.key ? " tr-filter-btn--on" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="tr-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="tr-skeleton" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="tr-empty">
            <span className="tr-empty-ico">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="tr-empty">
            <span className="tr-empty-ico">🚆</span>
            <p>
              {filter === "active"  ? "No active tickets."  :
               filter === "expired" ? "No past tickets."    :
               "You haven't purchased any tickets yet."}
            </p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="tr-list">
            {visible.map((t, i) => (
              <TrainTicketCard
                key={t.id}
                t={t}
                idx={i}
                onReturn={handleReturn}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}