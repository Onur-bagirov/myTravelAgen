import { useState, useEffect } from "react";
import "./MyTickets.css";

async function fetchMyTickets() {
  const now = new Date();
  const future = (d) => new Date(now.getTime() + d * 86400000).toISOString();
  const past   = (d) => new Date(now.getTime() - d * 86400000).toISOString();

  return {
    plane: [
      {
        id: 1, airline: "AzerAir", gate: "B12", plane: "Boeing 737",
        meal: "Standard", hasCheckedIn: true, luggageKg: 23,
        dueDate: future(14), broughtDate: past(30),
        state: "Pending", price: 220, discount: 0.85,
        from: "Baku", fromCode: "GYD", to: "Istanbul", toCode: "IST",
        variant: { name: "Business", allowedLuggageKg: 32, allowedLuggageCount: 2, isPriority: true },
        seat: { name: "3B" }, hasPet: false, hasChild: true,
        luggageCount: 1, totalLuggageKg: 23,
        isRoundTrip: false, isCashPayment: false, note: "Window seat requested",
      },
      {
        id: 2, airline: "Turkish Airlines", gate: "C4", plane: "Airbus A321",
        meal: "Vegetarian", hasCheckedIn: false, luggageKg: 15,
        dueDate: future(3), broughtDate: past(10),
        state: "Pending", price: 185, discount: 1,
        from: "Istanbul", fromCode: "IST", to: "London", toCode: "LHR",
        variant: { name: "Economy", allowedLuggageKg: 15, allowedLuggageCount: 1, isPriority: false },
        seat: { name: "22A" }, hasPet: false, hasChild: false,
        luggageCount: 1, totalLuggageKg: 15,
        isRoundTrip: true, isCashPayment: true, note: "",
      },
      {
        id: 3, airline: "FlyDubai", gate: "A8", plane: "Boeing 737 MAX",
        meal: "None", hasCheckedIn: false, luggageKg: 0,
        dueDate: past(5), broughtDate: past(60),
        state: "Expired", price: 95, discount: 0.9,
        from: "Baku", fromCode: "GYD", to: "Dubai", toCode: "DXB",
        variant: { name: "Economy", allowedLuggageKg: 15, allowedLuggageCount: 1, isPriority: false },
        seat: { name: "14C" }, hasPet: false, hasChild: false,
        luggageCount: 0, totalLuggageKg: 0,
        isRoundTrip: false, isCashPayment: true, note: "",
      },
    ],
    train: [
      {
        id: 10, trainCompany: "AzərYolları", trainNumber: "T-47", vagonNumber: 3,
        dueDate: future(8), broughtDate: past(5),
        state: "Pending", price: 42, discount: 0.75,
        from: "Baku Central", fromCode: "BAK", to: "Ganja", toCode: "GNJ",
        variant: { name: "First Class", allowedLuggageKg: 30, allowedLuggageCount: 2, isPriority: true },
        seat: { name: "8A" }, hasPet: true, hasChild: false,
        luggageCount: 2, totalLuggageKg: 18,
        isRoundTrip: false, isCashPayment: false, note: "Pet carrier approved",
      },
      {
        id: 11, trainCompany: "AzərYolları", trainNumber: "E-22", vagonNumber: 5,
        dueDate: past(20), broughtDate: past(90),
        state: "Canceled", price: 28, discount: 1,
        from: "Ganja", fromCode: "GNJ", to: "Baku Central", toCode: "BAK",
        variant: { name: "Economy", allowedLuggageKg: 15, allowedLuggageCount: 1, isPriority: false },
        seat: { name: "12B" }, hasPet: false, hasChild: false,
        luggageCount: 1, totalLuggageKg: 10,
        isRoundTrip: false, isCashPayment: true, note: "",
      },
    ],
  };
}

function isExpired(t) { return new Date(t.dueDate) < new Date(); }

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function countdown(d) {
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d away`;
}
function finalPrice(t) { return (t.price * t.discount).toFixed(2); }
function discPct(d)    { return Math.round((1 - d) * 100); }

const STATE_TAG = {
  Pending:  "tag-green",
  Delayed:  "tag-amber",
  Canceled: "tag-red",
  Expired:  "tag-gray",
};

function Tag({ label, cls }) {
  return <span className={`tag ${cls}`}>{label}</span>;
}

function Cell({ label, value, hi }) {
  return (
    <div className="cell">
      <span className="cell-lbl">{label}</span>
      <span className={`cell-val${hi ? " cell-val--hi" : ""}`}>{value}</span>
    </div>
  );
}

function TicketCard({ ticket, type }) {
  const exp = isExpired(ticket);
  const hasDsc = ticket.discount < 1;
  const cd = countdown(ticket.dueDate);
  const isPlane = type === "plane";

  return (
    <div className={`tc${exp ? " tc--exp" : ""}`}>
      {/* left accent bar */}
      <div className={`tc-bar ${isPlane ? "tc-bar--blue" : "tc-bar--green"}`} />

      <div className="tc-inner">
        {/* ── head row ── */}
        <div className="tc-head">
          <div className="tc-carrier">
            <span className="tc-carrier-icon">{isPlane ? "✈" : "⊟"}</span>
            <span className="tc-carrier-name">
              {isPlane ? ticket.airline : ticket.trainCompany}
            </span>
            <span className="tc-carrier-sub">
              {isPlane ? ticket.plane : ticket.trainNumber}
            </span>
          </div>
          <div className="tc-tags">
            {ticket.variant?.isPriority && <Tag label="Priority" cls="tag-blue" />}
            {ticket.isRoundTrip && <Tag label="Round trip" cls="tag-gray" />}
            <Tag label={ticket.state} cls={STATE_TAG[ticket.state] ?? "tag-gray"} />
          </div>
        </div>

        {/* ── route ── */}
        <div className="tc-route">
          <div className="tc-loc">
            <span className="tc-iata">{ticket.fromCode}</span>
            <span className="tc-city">{ticket.from}</span>
          </div>

          <div className="tc-mid">
            <div className="tc-track">
              <span className="tc-track-dot" />
              <span className="tc-track-line" />
              <span className="tc-track-arrow">›</span>
            </div>
            {cd && !exp && <span className="tc-cd">{cd}</span>}
          </div>

          <div className="tc-loc tc-loc--r">
            <span className="tc-iata">{ticket.toCode}</span>
            <span className="tc-city">{ticket.to}</span>
          </div>
        </div>

        {/* ── dates row ── */}
        <div className="tc-dateline">
          <div className="tc-dategroup">
            <span className="tc-datelbl">Departs</span>
            <span className="tc-dateval">{fmtDate(ticket.dueDate)} · {fmtTime(ticket.dueDate)}</span>
          </div>
          <div className="tc-dategroup">
            <span className="tc-datelbl">Purchased</span>
            <span className="tc-dateval">{fmtDate(ticket.broughtDate)}</span>
          </div>
          {/* price sits in dateline on the right */}
          <div className="tc-price-inline">
            {hasDsc && (
              <span className="tc-disc-badge">-{discPct(ticket.discount)}%</span>
            )}
            <span className="tc-price-row">
              {hasDsc && <span className="tc-original">${ticket.price.toFixed(2)}</span>}
              <span className="tc-final">${finalPrice(ticket)}</span>
            </span>
          </div>
        </div>

        {/* ── details grid ── */}
        <div className="tc-sep" />
        <div className="tc-grid">
          <Cell label="Seat"  value={ticket.seat?.name ?? "—"} />
          {isPlane && <Cell label="Gate"  value={ticket.gate} />}
          <Cell label="Class" value={ticket.variant?.name} />
          {isPlane && <Cell label="Meal"  value={ticket.meal} />}
          {!isPlane && <Cell label="Wagon" value={`#${ticket.vagonNumber}`} />}
          <Cell label="Luggage" value={`${ticket.luggageCount} bag · ${ticket.totalLuggageKg} kg`} />
          {isPlane && (
            <Cell label="Checked in" value={ticket.hasCheckedIn ? "Yes ✓" : "No"} hi={ticket.hasCheckedIn} />
          )}
          <Cell label="Payment" value={ticket.isCashPayment ? "Cash" : "Card"} />
          {ticket.hasPet   && <Cell label="Pet"   value="Included" hi />}
          {ticket.hasChild && <Cell label="Child" value="Included" hi />}
        </div>

        {ticket.note && <div className="tc-note">{ticket.note}</div>}
      </div>
    </div>
  );
}

export default function MyTickets() {
  const [tab, setTab]       = useState("plane");
  const [filter, setFilter] = useState("all");
  const [data, setData]     = useState({ plane: [], train: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets().then(d => { setData(d); setLoading(false); });
  }, []);

  const list = data[tab] || [];
  const visible = list.filter(t =>
    filter === "active"  ? !isExpired(t) :
    filter === "expired" ?  isExpired(t) : true
  );

  const totalActive = [...data.plane, ...data.train].filter(t => !isExpired(t)).length;
  const totalAll    = data.plane.length + data.train.length;

  return (
    <div className="root">
      {/* header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-title-block">
            <h1 className="page-title">My tickets</h1>
            <span className="page-meta">{totalActive} active of {totalAll} total</span>
          </div>
          <div className="filter-row">
            {["all","active","expired"].map(f => (
              <button key={f} className={`filter-btn${filter===f?" filter-btn--on":""}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="tabs-bar">
        <div className="tabs-inner">
          {[
            { key: "plane", icon: "✈", label: "Plane", count: data.plane.length },
            { key: "train", icon: "⊟", label: "Train", count: data.train.length },
          ].map(({ key, icon, label, count }) => (
            <button key={key} className={`tab${tab===key?" tab--on":""}`} onClick={() => setTab(key)}>
              <span className="tab-icon">{icon}</span>
              {label}
              <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="list">
        {loading && <p className="empty-msg">Loading…</p>}
        {!loading && visible.length === 0 && (
          <p className="empty-msg">No {filter !== "all" ? filter + " " : ""}{tab} tickets found.</p>
        )}
        {!loading && visible.map(t => (
          <TicketCard key={t.id} ticket={t} type={tab} />
        ))}
      </div>
    </div>
  );
}