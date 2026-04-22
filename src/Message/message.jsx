import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:5251/api";

const authHeader = () => {
  const token = localStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const useCurrentUser = () => {
  try {
    const token = localStorage.getItem("userToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role =
        payload["role"] ??
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] ??
        "Customer";
      const id = parseInt(payload["uid"] ?? payload["sub"] ?? 0);
      const firstName = localStorage.getItem("userFirstName") ?? payload["given_name"] ?? "";
      const lastName  = localStorage.getItem("userLastName")  ?? payload["family_name"] ?? "";
      const name =
        `${firstName} ${lastName}`.trim() ||
        payload["name"] ||
        payload["unique_name"] ||
        "";
      return { id, role, name };
    }
  } catch {}
  return { id: 0, role: "Customer", name: "" };
};

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("az-AZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ─── Styles ─── */
const S = {
  root: {
    minHeight: "100vh",
    background: "#0f1117",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow1: {
    position: "fixed", top: "-200px", left: "-200px",
    width: "600px", height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  bgGlow2: {
    position: "fixed", bottom: "-150px", right: "-100px",
    width: "500px", height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  sidebar: {
    width: "260px", flexShrink: 0,
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex", flexDirection: "column",
    padding: "28px 20px",
    gap: "8px", zIndex: 1,
    backdropFilter: "blur(12px)",
  },
  brand: {
    fontSize: "22px", fontWeight: 800,
    color: "#fff", letterSpacing: "-0.5px",
    marginBottom: "4px",
  },
  brandSpan: { color: "#818cf8" },
  brandSub: {
    fontSize: "11px", color: "#64748b",
    letterSpacing: "0.08em", textTransform: "uppercase",
    marginBottom: "20px",
  },
  userCard: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "16px",
  },
  avatarXl: {
    width: "42px", height: "42px", borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "15px", fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  userName: { fontSize: "14px", fontWeight: 600, color: "#f1f5f9" },
  userRole: {
    fontSize: "11px", color: "#64748b",
    marginTop: "2px", textTransform: "capitalize",
  },
  statsRow: {
    display: "flex", gap: "8px", marginBottom: "20px",
  },
  statPill: {
    flex: 1, padding: "10px 8px", borderRadius: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    textAlign: "center",
  },
  statPillUnread: { borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)" },
  statPillRead:   { borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" },
  statN: { display: "block", fontSize: "20px", fontWeight: 700, color: "#f1f5f9" },
  statNUnread: { color: "#818cf8" },
  statNRead:   { color: "#34d399" },
  statL: { fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" },
  filterTitle: {
    fontSize: "10px", fontWeight: 600,
    color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.1em", padding: "0 4px", marginBottom: "4px",
  },
  filterBtn: (active) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%", padding: "9px 12px", borderRadius: "9px",
    border: "none", cursor: "pointer", textAlign: "left",
    fontSize: "13px", fontWeight: active ? 600 : 400,
    color: active ? "#c7d2fe" : "#94a3b8",
    background: active ? "rgba(99,102,241,0.15)" : "transparent",
    transition: "all 0.15s",
  }),
  filterCount: {
    fontSize: "11px", padding: "1px 7px", borderRadius: "20px",
    background: "rgba(255,255,255,0.08)", color: "#64748b",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: "8px",
    marginTop: "auto", padding: "10px 12px", borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#64748b", fontSize: "13px", textDecoration: "none",
    transition: "all 0.15s",
  },
  main: {
    flex: 1, display: "flex", flexDirection: "column",
    overflow: "hidden", zIndex: 1,
  },
  header: {
    padding: "24px 28px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(15,17,23,0.8)", backdropFilter: "blur(12px)",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "22px", fontWeight: 700, color: "#f1f5f9",
    margin: 0, display: "flex", alignItems: "center", gap: "10px",
  },
  headerBadge: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
    background: "rgba(99,102,241,0.2)", color: "#818cf8",
    fontWeight: 500, border: "1px solid rgba(99,102,241,0.3)",
  },
  headerSub: { fontSize: "13px", color: "#475569", marginTop: "4px" },
  chatArea: {
    flex: 1, overflowY: "auto", padding: "24px 28px",
    display: "flex", flexDirection: "column",
  },
  empty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "8px",
    color: "#475569", paddingBottom: "60px",
  },
  emptyIcon: { fontSize: "40px", marginBottom: "8px", opacity: 0.5 },
  emptyTitle: { fontSize: "16px", fontWeight: 600, color: "#64748b" },
  emptySub:   { fontSize: "13px", color: "#374151" },
  messages: { display: "flex", flexDirection: "column", gap: "20px" },
  msgWrap: (isMe) => ({
    display: "flex", gap: "10px", alignSelf: "flex-start",
    maxWidth: "75%", width: "fit-content",
    flexDirection: isMe ? "row-reverse" : "row",
    alignSelf: isMe ? "flex-end" : "flex-start",
  }),
  avatarSm: (isMe) => ({
    width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
    background: isMe
      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
      : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: 700, color: "#fff",
    marginTop: "4px",
  }),
  msgCol: { display: "flex", flexDirection: "column", gap: "4px" },
  msgSender: {
    fontSize: "11px", color: "#64748b", fontWeight: 500,
    paddingLeft: "4px",
  },
  bubble: (isMe, unread) => ({
    padding: "12px 16px", borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
    background: isMe
      ? "linear-gradient(135deg, #4f46e5, #6366f1)"
      : unread
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.05)",
    border: isMe
      ? "none"
      : unread
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(255,255,255,0.06)",
    cursor: "pointer", transition: "all 0.15s",
    boxShadow: isMe ? "0 4px 20px rgba(79,70,229,0.25)" : "none",
  }),
  bubbleText: { fontSize: "14px", lineHeight: "1.5", color: "#f1f5f9" },
  bubbleMeta: {
    display: "flex", alignItems: "center", gap: "8px", marginTop: "6px",
  },
  destTag: (forAdmin) => ({
    fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
    fontWeight: 600, letterSpacing: "0.04em",
    background: forAdmin ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.15)",
    color: forAdmin ? "#818cf8" : "#34d399",
    border: forAdmin ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(16,185,129,0.2)",
  }),
  bubbleTime: { fontSize: "11px", color: "rgba(255,255,255,0.3)" },
  readTick:  { fontSize: "12px", color: "#34d399" },
  unreadDot: {
    width: "7px", height: "7px", borderRadius: "50%",
    background: "#818cf8", display: "inline-block",
  },
  replyBubble: {
    padding: "10px 14px", borderRadius: "4px 12px 12px 12px",
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.2)",
    marginTop: "4px",
  },
  replyLabel: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "10px", color: "#34d399", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px",
  },
  replyText: { fontSize: "13px", color: "#94a3b8", lineHeight: "1.5" },
  actions: {
    display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px",
  },
  actBtn: (variant) => ({
    padding: "5px 12px", borderRadius: "7px", border: "none",
    cursor: "pointer", fontSize: "12px", fontWeight: 500,
    background: variant === "green"
      ? "rgba(16,185,129,0.15)"
      : variant === "red"
        ? "rgba(239,68,68,0.15)"
        : "rgba(255,255,255,0.07)",
    color: variant === "green" ? "#34d399" : variant === "red" ? "#f87171" : "#94a3b8",
    border: variant === "green"
      ? "1px solid rgba(16,185,129,0.25)"
      : variant === "red"
        ? "1px solid rgba(239,68,68,0.2)"
        : "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.15s",
  }),
  inlineForm: {
    marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px",
  },
  inlineTa: {
    width: "100%", minHeight: "80px", padding: "10px 14px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "#f1f5f9", fontSize: "13px",
    resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  },
  inlineBtns: { display: "flex", gap: "8px" },
  inlineConfirm: {
    padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff",
    fontSize: "13px", fontWeight: 600,
  },
  inlineCancel: {
    padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
    background: "transparent", color: "#64748b", fontSize: "13px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  toggleMini: {
    display: "flex", gap: "6px",
  },
  toggleMiniBtn: (on) => ({
    padding: "5px 12px", borderRadius: "7px", border: "none", cursor: "pointer",
    fontSize: "12px", fontWeight: 500,
    background: on ? "rgba(99,102,241,0.2)" : "transparent",
    color: on ? "#c7d2fe" : "#64748b",
    border: on ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
  }),
  pagination: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  pgBtn: (disabled, cur) => ({
    padding: "6px 12px", borderRadius: "8px", border: "none", cursor: disabled ? "not-allowed" : "pointer",
    background: cur ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "rgba(255,255,255,0.05)",
    color: cur ? "#fff" : disabled ? "#374151" : "#94a3b8",
    fontSize: "13px", fontWeight: cur ? 600 : 400,
    border: "1px solid rgba(255,255,255,0.07)", opacity: disabled ? 0.4 : 1,
  }),
  pgInfo: { fontSize: "12px", color: "#475569", marginLeft: "4px" },
  compose: {
    padding: "16px 28px 20px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15,17,23,0.9)", backdropFilter: "blur(12px)",
    flexShrink: 0,
  },
  composeTarget: {
    display: "flex", gap: "8px", marginBottom: "10px",
  },
  ctBtn: (on) => ({
    padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: 500,
    background: on ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
    color: on ? "#c7d2fe" : "#64748b",
    border: on ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
    transition: "all 0.15s",
  }),
  composeRow: { display: "flex", gap: "10px", alignItems: "flex-end" },
  composeTa: {
    flex: 1, padding: "12px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9", fontSize: "14px", resize: "none", outline: "none",
    fontFamily: "inherit", lineHeight: "1.5",
    transition: "border-color 0.15s",
  },
  composeSend: (disabled) => ({
    width: "44px", height: "44px", borderRadius: "12px", border: "none",
    background: disabled
      ? "rgba(99,102,241,0.3)"
      : "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
    transition: "all 0.15s",
  }),
  skeleton: {
    height: "80px", borderRadius: "12px",
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    marginBottom: "12px",
  },
  toast: (type) => ({
    position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
    padding: "12px 20px", borderRadius: "12px",
    background: type === "success"
      ? "rgba(16,185,129,0.15)"
      : "rgba(239,68,68,0.15)",
    border: type === "success"
      ? "1px solid rgba(16,185,129,0.3)"
      : "1px solid rgba(239,68,68,0.3)",
    color: type === "success" ? "#34d399" : "#f87171",
    fontSize: "14px", fontWeight: 500,
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  }),
};

export default function MessagePage() {
  const currentUser = useCurrentUser();
  const isAdmin = ["Admin", "Company"].includes(currentUser.role);

  const [messages, setMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [forAdmin, setForAdmin] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [replyId, setReplyId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [inlineText, setInlineText] = useState("");
  const [inlineForAdmin, setInlineForAdmin] = useState(true);
  const [text, setText] = useState("");
  const [composeTo, setComposeTo] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const bottomRef = useRef(null);
  const LIMIT = 15;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ Page: page, Limit: LIMIT });
      if (forAdmin !== null) params.append("ForAdmin", forAdmin);

      // FIX: Customer-lar üçün də eyni endpoint, amma backend
      // GET /api/Message — yalnız Admin/Company üçün açıqdır.
      // Customer öz mesajlarını görmək üçün backend-ə
      // GET /api/Message/my endpoint-i əlavə etmək lazımdır.
      // Əgər Customer rolu üçün bu endpoint yoxdursa, aşağıdakı
      // şərhi götürün və backend-ə /my endpoint əlavə edin.
      const endpoint = isAdmin
        ? `${API_BASE}/Message?${params}`
        : `${API_BASE}/Message/my?${params}`;

      const res = await fetch(endpoint, {
        headers: { ...authHeader(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMessages(json.data ?? []);
      setTotalCount(json.totalDataCount ?? 0);
    } catch (err) {
      showToast(`Mesajlar yüklənə bilmədi: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [page, forAdmin, isAdmin]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── FIX 1: SenderId artıq POST body-yə əlavə edilir ──
  const handleSend = async () => {
    if (!text.trim()) return showToast("Mesaj boş ola bilməz", "error");
    if (!currentUser.id) return showToast("İstifadəçi məlumatı tapılmadı", "error");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id, // FIX: əvvəl yox idi!
          content: text,
          forAdmin: composeTo,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Mesaj göndərildi ✓");
      setText("");
      fetchMessages();
    } catch (err) {
      showToast(`Göndərilə bilmədi: ${err.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (id) => {
    if (!inlineText.trim()) return showToast("Cavab boş ola bilməz", "error");
    try {
      const res = await fetch(`${API_BASE}/Message/respond`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id, response: inlineText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Cavab göndərildi ✓");
      setReplyId(null);
      setInlineText("");
      fetchMessages();
    } catch (err) {
      showToast(`Xəta: ${err.message}`, "error");
    }
  };

  const handleUpdate = async (id) => {
    if (!inlineText.trim()) return showToast("Məzmun boş ola bilməz", "error");
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: inlineText, forAdmin: inlineForAdmin }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Mesaj yeniləndi ✓");
      setEditId(null);
      setInlineText("");
      fetchMessages();
    } catch (err) {
      showToast(`Xəta: ${err.message}`, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu mesajı silmək istəyirsiniz?")) return;
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "DELETE",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Mesaj silindi");
      setExpandedId(null);
      fetchMessages();
    } catch (err) {
      showToast(`Xəta: ${err.message}`, "error");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/Message/${id}/mark-read`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Oxundu olaraq işarələndi ✓");
      fetchMessages();
    } catch (err) {
      showToast(`Xəta: ${err.message}`, "error");
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);
  const unread = messages.filter((m) => !m.hasBeenRead).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mp-msg-wrap { animation: fadeIn 0.2s ease; }
        .mp-act-btn:hover { filter: brightness(1.2); }
        .mp-filter-btn:hover { background: rgba(255,255,255,0.05) !important; }
        .mp-back-btn:hover { color: #94a3b8 !important; background: rgba(255,255,255,0.04); }
        .mp-compose-ta:focus { border-color: rgba(99,102,241,0.5) !important; }
        .mp-bubble:hover { filter: brightness(1.06); }
      `}</style>

      <div style={S.root}>
        <div style={S.bgGlow1} />
        <div style={S.bgGlow2} />

        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <div style={S.brand}>
            Travel<span style={S.brandSpan}>Agen</span>
          </div>
          <div style={S.brandSub}>Mesajlar Mərkəzi</div>

          {currentUser.name && (
            <div style={S.userCard}>
              <div style={S.avatarXl}>{initials(currentUser.name)}</div>
              <div>
                <div style={S.userName}>{currentUser.name}</div>
                <div style={S.userRole}>{currentUser.role}</div>
              </div>
            </div>
          )}

          <div style={S.statsRow}>
            <div style={S.statPill}>
              <span style={S.statN}>{totalCount}</span>
              <span style={S.statL}>Cəmi</span>
            </div>
            <div style={{ ...S.statPill, ...S.statPillUnread }}>
              <span style={{ ...S.statN, ...S.statNUnread }}>{unread}</span>
              <span style={S.statL}>Yeni</span>
            </div>
            <div style={{ ...S.statPill, ...S.statPillRead }}>
              <span style={{ ...S.statN, ...S.statNRead }}>{totalCount - unread}</span>
              <span style={S.statL}>Oxunub</span>
            </div>
          </div>

          <div style={S.filterTitle}>Filtr</div>
          {[
            { label: "Hamısı", val: null },
            { label: "🛡 Admin", val: true },
            { label: "🏢 Executive", val: false },
          ].map(({ label, val }) => (
            <button
              key={String(val)}
              className="mp-filter-btn"
              style={S.filterBtn(forAdmin === val)}
              onClick={() => { setForAdmin(val); setPage(1); }}
            >
              {label}
              {val === null && <span style={S.filterCount}>{totalCount}</span>}
            </button>
          ))}

          <a href="/" style={S.backBtn} className="mp-back-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Ana səhifəyə qayıt
          </a>
        </aside>

        {/* ── Main ── */}
        <main style={S.main}>
          <div style={S.header}>
            <div>
              <h1 style={S.headerTitle}>
                Mesajlar
                {unread > 0 && <span style={S.headerBadge}>{unread} yeni</span>}
              </h1>
              <p style={S.headerSub}>Admin və ya Executive komanda ilə əlaqə saxlayın</p>
            </div>
          </div>

          {/* Chat area */}
          <div style={S.chatArea}>
            {loading ? (
              <div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={S.skeleton} />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div style={S.empty}>
                <div style={S.emptyIcon}>✉️</div>
                <p style={S.emptyTitle}>Mesaj tapılmadı</p>
                <span style={S.emptySub}>Göndərdiyiniz mesajlar burada görünəcək</span>
              </div>
            ) : (
              <div style={S.messages}>
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isOpen = expandedId === msg.id;
                  return (
                    <div key={msg.id} className="mp-msg-wrap" style={S.msgWrap(isMe)}>
                      {!isMe && (
                        <div style={S.avatarSm(false)}>{initials(msg.senderFullName)}</div>
                      )}
                      <div style={S.msgCol}>
                        {!isMe && (
                          <div style={S.msgSender}>{msg.senderFullName}</div>
                        )}
                        <div
                          className="mp-bubble"
                          style={S.bubble(isMe, !msg.hasBeenRead)}
                          onClick={() => setExpandedId(isOpen ? null : msg.id)}
                        >
                          <div style={S.bubbleText}>{msg.content}</div>
                          <div style={S.bubbleMeta}>
                            <span style={S.destTag(msg.forAdmin)}>
                              {msg.forAdmin ? "Admin" : "Executive"}
                            </span>
                            <span style={S.bubbleTime}>{fmtDate(msg.createdDate)}</span>
                            {msg.hasBeenRead
                              ? <span style={S.readTick}>✓✓</span>
                              : <span style={S.unreadDot} />
                            }
                          </div>
                        </div>

                        {/* Reply bubble */}
                        {msg.response && (
                          <div style={S.replyBubble}>
                            <div style={S.replyLabel}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                              </svg>
                              Rəsmi Cavab
                            </div>
                            <div style={S.replyText}>{msg.response}</div>
                          </div>
                        )}

                        {/* Actions */}
                        {isOpen && (
                          <div style={S.actions} onClick={(e) => e.stopPropagation()}>
                            {isAdmin && !msg.hasBeenRead && (
                              <button
                                className="mp-act-btn"
                                style={S.actBtn("green")}
                                onClick={() => handleMarkRead(msg.id)}
                              >
                                ✓ Oxundu
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                className="mp-act-btn"
                                style={S.actBtn("")}
                                onClick={() => {
                                  setReplyId(msg.id);
                                  setEditId(null);
                                  setInlineText("");
                                }}
                              >
                                ↩ Cavabla
                              </button>
                            )}
                            {msg.senderId === currentUser.id && (
                              <button
                                className="mp-act-btn"
                                style={S.actBtn("")}
                                onClick={() => {
                                  setEditId(msg.id);
                                  setReplyId(null);
                                  setInlineText(msg.content);
                                  setInlineForAdmin(msg.forAdmin);
                                }}
                              >
                                ✎ Düzəlt
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                className="mp-act-btn"
                                style={S.actBtn("red")}
                                onClick={() => handleDelete(msg.id)}
                              >
                                🗑 Sil
                              </button>
                            )}
                          </div>
                        )}

                        {/* Reply form */}
                        {replyId === msg.id && (
                          <div style={S.inlineForm}>
                            <textarea
                              className="mp-compose-ta"
                              style={S.inlineTa}
                              placeholder="Cavabınızı yazın..."
                              value={inlineText}
                              onChange={(e) => setInlineText(e.target.value)}
                            />
                            <div style={S.inlineBtns}>
                              <button style={S.inlineConfirm} onClick={() => handleReply(msg.id)}>Göndər</button>
                              <button style={S.inlineCancel} onClick={() => { setReplyId(null); setInlineText(""); }}>Ləğv et</button>
                            </div>
                          </div>
                        )}

                        {/* Edit form */}
                        {editId === msg.id && (
                          <div style={S.inlineForm}>
                            <textarea
                              className="mp-compose-ta"
                              style={S.inlineTa}
                              value={inlineText}
                              onChange={(e) => setInlineText(e.target.value)}
                            />
                            <div style={S.toggleMini}>
                              <button
                                style={S.toggleMiniBtn(inlineForAdmin)}
                                onClick={() => setInlineForAdmin(true)}
                              >
                                🛡 Admin
                              </button>
                              <button
                                style={S.toggleMiniBtn(!inlineForAdmin)}
                                onClick={() => setInlineForAdmin(false)}
                              >
                                🏢 Executive
                              </button>
                            </div>
                            <div style={S.inlineBtns}>
                              <button style={S.inlineConfirm} onClick={() => handleUpdate(msg.id)}>Yadda saxla</button>
                              <button style={S.inlineCancel} onClick={() => { setEditId(null); setInlineText(""); }}>Ləğv et</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {isMe && (
                        <div style={S.avatarSm(true)}>{initials(currentUser.name)}</div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={S.pagination}>
              <button
                style={S.pgBtn(page === 1, false)}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >←</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const num = start + i;
                return num <= totalPages ? (
                  <button
                    key={num}
                    style={S.pgBtn(false, num === page)}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ) : null;
              })}
              <span style={S.pgInfo}>{page} / {totalPages}</span>
              <button
                style={S.pgBtn(page === totalPages, false)}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >→</button>
            </div>
          )}

          {/* Compose */}
          <div style={S.compose}>
            <div style={S.composeTarget}>
              <button style={S.ctBtn(composeTo)} onClick={() => setComposeTo(true)}>🛡 Admin</button>
              <button style={S.ctBtn(!composeTo)} onClick={() => setComposeTo(false)}>🏢 Executive</button>
            </div>
            <div style={S.composeRow}>
              <textarea
                className="mp-compose-ta"
                style={S.composeTa}
                placeholder="Mesajınızı yazın..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <button
                style={S.composeSend(sending)}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <span style={{
                    width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid #fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.8s linear infinite",
                  }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div style={S.toast(toast.type)}>
            {toast.type === "success" ? "✓" : "✕"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}