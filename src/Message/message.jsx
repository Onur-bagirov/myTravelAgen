import { useState, useEffect, useCallback, useRef } from "react";
import "./message.css";

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
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
        "Customer";
      const id = parseInt(payload["uid"] ?? payload["sub"] ?? 0);
      const companyId = parseInt(
        payload["cid"] ?? payload["companyId"] ?? payload["company_id"] ?? 0
      );
      const firstName = localStorage.getItem("userFirstName") ?? payload["given_name"] ?? "";
      const lastName  = localStorage.getItem("userLastName")  ?? payload["family_name"] ?? "";
      const name = `${firstName} ${lastName}`.trim() || payload["name"] || payload["unique_name"] || "";
      return { id, role, name, companyId };
    }
  } catch {}
  return { id: 0, role: "Customer", name: "", companyId: 0 };
};

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) + " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const fmtDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit" });
};

const DoubleTick = ({ read }) => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
    <path d="M1 6L5 10L11 2"
      stroke={read ? "#4ade80" : "rgba(255,255,255,0.32)"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6L10 10L16 2"
      stroke={read ? "#4ade80" : "rgba(255,255,255,0.32)"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MAX_LEN = 500;

const BANNED = [
  "fuck","shit","bitch","asshole","bastard","cunt","dick","cock","pussy","whore",
  "faggot","nigger","nigga","retard","motherfucker","prick","slut","twat","wanker",
  "sic","sik","orospu","siktir","amk","amina","yarrak","bok","ibne","sikik","amcik",
  "kill yourself","bomb threat","terrorist","rape",
];

const hasBanned = (msg) => {
  const clean = msg.toLowerCase().replace(/[^a-z0-9 ]/gi, " ");
  return BANNED.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(clean));
};

export default function MessagePage() {
  const currentUser = useCurrentUser();
  const isAdmin   = currentUser.role === "Admin";
  const isCompany = currentUser.role === "Company";
  const isStaff   = isAdmin || isCompany;
  const forAdminFilter = isAdmin ? true : isCompany ? false : null;

  const [messages,    setMessages]    = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);
  const [replyId,     setReplyId]     = useState(null);
  const [editId,      setEditId]      = useState(null);
  const [inlineText,  setInlineText]  = useState("");
  const [text,        setText]        = useState("");
  const [composeTo,   setComposeTo]   = useState(true);
  const [sending,     setSending]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [photoCache,  setPhotoCache]  = useState({});
  const [myPhoto,     setMyPhoto]     = useState(null);
  const bottomRef = useRef(null);
  const LIMIT = 20;

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ Page: page, Limit: LIMIT });
      if (forAdminFilter !== null) params.append("ForAdmin", forAdminFilter);
      if (isCompany && currentUser.id) params.append("receiverId", currentUser.id);
      const endpoint = isStaff
        ? `${API_BASE}/Message?${params}`
        : `${API_BASE}/Message/my?${params}`;
      const res = await fetch(endpoint, { headers: { ...authHeader(), "Content-Type": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      let data = json.data ?? [];
      if (isCompany && currentUser.id) {
        const filtered = data.filter(
          (m) => m.receiverId === currentUser.id || m.companyId === currentUser.companyId || m.senderId === currentUser.id
        );
        data = filtered.length > 0 ? filtered : data;
      }
      setMessages(data.slice().sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate)));
      setTotalCount(json.totalDataCount ?? data.length);
    } catch (err) {
      showToast(`Could not load: ${err.message}`, "err");
    } finally {
      setLoading(false);
    }
  }, [page, forAdminFilter, isStaff, isCompany, currentUser.id, currentUser.companyId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const toAbs = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://localhost:5251${path}`;
  };

  const fetchUserPhoto = useCallback(async (userId) => {
    if (!userId || photoCache[userId] !== undefined) return;
    setPhotoCache(c => ({ ...c, [userId]: null }));
    try {
      const res = await fetch(`${API_BASE}/Auth/user/${userId}`, { headers: authHeader() });
      if (!res.ok) return;
      const json = await res.json();
      const raw = json?.data?.profilePicture || json?.profilePicture || null;
      const url = toAbs(raw);
      setPhotoCache(c => ({ ...c, [userId]: url }));
    } catch {}
  }, [photoCache]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/Auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        const raw = json?.data?.profilePicture || json?.profilePicture || null;
        setMyPhoto(toAbs(raw));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    messages.forEach((m) => {
      const pid = m.senderProfilePicture ? null : m.senderId;
      if (pid) fetchUserPhoto(pid);
    });
  }, [messages, fetchUserPhoto]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const unread = messages.filter((m) => {
      if (m.hasBeenRead || m.senderId === currentUser.id) return false;
      if (isAdmin   && m.forAdmin === true)  return true;
      if (isCompany && m.forAdmin === false) return true;
      if (!isStaff) return true;
      return false;
    });
    if (!unread.length) return;
    const t = setTimeout(async () => {
      await Promise.allSettled(
        unread.map((m) => fetch(`${API_BASE}/Message/${m.id}/mark-read`, { method: "PATCH", headers: authHeader() }))
      );
      fetchMessages();
    }, 1000);
    return () => clearTimeout(t);
  }, [messages, currentUser.id, isAdmin, isCompany, isStaff, fetchMessages]);

  const validate = (val) => {
    if (!val.trim()) { showToast("Message cannot be empty.", "err"); return false; }
    if (val.trim().length > MAX_LEN) { showToast(`Max ${MAX_LEN} characters allowed.`, "err"); return false; }
    if (hasBanned(val)) { showToast("Your message contains inappropriate language.", "err"); return false; }
    return true;
  };

  const handleSend = async () => {
    if (isStaff || !validate(text)) return;
    if (!currentUser.id) return showToast("User not found.", "err");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser.id, content: text, forAdmin: composeTo }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Message sent");
      setText(""); fetchMessages();
    } catch (err) { showToast(`Error: ${err.message}`, "err"); }
    finally { setSending(false); }
  };

  const handleReply = async (id) => {
    if (!validate(inlineText)) return;
    try {
      const res = await fetch(`${API_BASE}/Message/respond`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id, response: inlineText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Reply sent");
      setReplyId(null); setInlineText(""); fetchMessages();
    } catch (err) { showToast(`Error: ${err.message}`, "err"); }
  };

  const handleUpdate = async (id) => {
    if (!validate(inlineText)) return;
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: inlineText, forAdmin: composeTo }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Updated");
      setEditId(null); setInlineText(""); fetchMessages();
    } catch (err) { showToast(`Error: ${err.message}`, "err"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await fetch(`${API_BASE}/Message`, {
        method: "DELETE",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Deleted");
      setExpandedId(null); fetchMessages();
    } catch (err) { showToast(`Error: ${err.message}`, "err"); }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);
  const unreadCount = messages.filter((m) => !m.hasBeenRead && m.senderId !== currentUser.id).length;
  const charPct = text.length / MAX_LEN;
  const charCls = charPct >= 1 ? "over" : charPct >= 0.8 ? "warn" : "";

  return (
    <div className="mp-wrap">
      <div className="mp-bg" />

      <button className="mp-mobile-toggle" onClick={() => setSidebarOpen(v => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className={`mp-sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`mp-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="mp-sidebar-head">
          <div className="mp-sidebar-title">
            {isAdmin ? "Admin Inbox" : isCompany ? "Company Inbox" : "Messages"}
          </div>
          {currentUser.name && (
            <div className="mp-user-pill">
              <div className={`mp-uav${isStaff ? " staff" : ""}`}>{initials(currentUser.name)}</div>
              <div>
                <div className="mp-uname">{currentUser.name}</div>
                <div className="mp-urole">{currentUser.role}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mp-stats-grid">
          <div className="mp-stat-box">
            <span className="mp-stat-num">{totalCount}</span>
            <span className="mp-stat-lbl">Total</span>
          </div>
          <div className="mp-stat-box red">
            <span className="mp-stat-num">{unreadCount}</span>
            <span className="mp-stat-lbl">New</span>
          </div>
          <div className="mp-stat-box grn">
            <span className="mp-stat-num">{totalCount - unreadCount}</span>
            <span className="mp-stat-lbl">Read</span>
          </div>
        </div>

        {isStaff && (
          <div className="mp-staff-badge">
            <span className="mp-staff-dot" />
            {isAdmin ? "Admin — view & reply only" : "Company — your messages only"}
          </div>
        )}

        <div className="mp-sidebar-foot">
          <a href="/" className="mp-back-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Home
          </a>
        </div>
      </aside>

      <div className="mp-main">
        <div className="mp-topbar">
          <div
            className={`mp-topbar-av${isStaff ? " staff" : ""}`}
            style={!isStaff && myPhoto ? { background: "none", padding: 0, overflow: "hidden" } : {}}
          >
            {!isStaff && myPhoto
              ? <img src={myPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
              : isStaff ? (isAdmin ? "A" : "C") : initials(currentUser.name)}
          </div>
          <div>
            <div className="mp-topbar-title">
              {isAdmin ? "Admin Messages" : isCompany ? "Company Messages" : "Support Chat"}
            </div>
            <div className="mp-topbar-sub">
              {isStaff ? "Incoming messages — click a message to reply" : "Your conversations with support"}
            </div>
          </div>
          {unreadCount > 0 && <div className="mp-topbar-badge">{unreadCount} new</div>}
        </div>

        <div className="mp-messages-wrap">
          {loading ? (
            <div>{[1,2,3,4,5].map(i => <div key={i} className="mp-skel" />)}</div>
          ) : messages.length === 0 ? (
            <div className="mp-empty-state">
              <div className="mp-empty-icon">💬</div>
              <h3>No messages yet</h3>
              <p>{isStaff ? "No incoming messages" : "Start a conversation below"}</p>
            </div>
          ) : (
            <div className="mp-msglist">
              {messages.map((msg, idx) => {
                const isMe   = !isStaff && msg.senderId === currentUser.id;
                const isOpen = expandedId === msg.id;
                const msgDay  = new Date(msg.createdDate).toDateString();
                const prevDay = idx > 0 ? new Date(messages[idx - 1].createdDate).toDateString() : null;

                return (
                  <div key={msg.id}>
                    {msgDay !== prevDay && <div className="mp-date-div">{fmtDay(msg.createdDate)}</div>}

                    <div className={`mp-msg-row${isMe ? " mine" : ""}`}>
                      {!isMe && (() => {
                        const pic = msg.senderProfilePicture
                          ? toAbs(msg.senderProfilePicture)
                          : photoCache[msg.senderId];
                        return (
                          <div
                            className={`mp-msg-av${isStaff ? " staff" : ""}`}
                            style={pic ? { background: "none", padding: 0, overflow: "hidden" } : {}}
                          >
                            {pic
                              ? <img src={pic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                              : initials(msg.senderFullName || "?")}
                          </div>
                        );
                      })()}

                      <div className="mp-msg-body">
                        {!isMe && <div className="mp-msg-from">{msg.senderFullName}</div>}

                        {isMe && (
                          <span className={`mp-dest-tag${msg.forAdmin ? "" : " co"}`}>
                            → {msg.forAdmin ? "Admin" : "Company"}
                          </span>
                        )}

                        <div
                          className={`mp-bubble${isMe ? " mine" : ""}${!msg.hasBeenRead && !isMe ? " unread" : ""}`}
                          onClick={() => setExpandedId(isOpen ? null : msg.id)}
                        >
                          <div className="mp-btext">{msg.content}</div>
                          <div className="mp-bmeta">
                            <span className="mp-btime">{fmtTime(msg.createdDate)}</span>
                            {isMe && <DoubleTick read={msg.hasBeenRead} />}
                          </div>
                        </div>

                        {isMe && msg.hasBeenRead && <div className="mp-seen-lbl">Seen</div>}

                        {msg.response && (
                          <div className="mp-reply-box">
                            <div className="mp-reply-hd">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                              </svg>
                              Official Reply
                            </div>
                            <div className="mp-reply-txt">{msg.response}</div>
                          </div>
                        )}

                        {isOpen && isStaff && (
                          <div className="mp-act-row" onClick={e => e.stopPropagation()}>
                            {!msg.hasBeenRead && (
                              <button className="mp-act g" onClick={async () => {
                                await fetch(`${API_BASE}/Message/${msg.id}/mark-read`, { method: "PATCH", headers: authHeader() });
                                showToast("Marked as read"); fetchMessages();
                              }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Mark Read
                              </button>
                            )}
                            <button className="mp-act b" onClick={() => { setReplyId(msg.id); setEditId(null); setInlineText(""); }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                              Reply
                            </button>
                            <button className="mp-act r" onClick={() => handleDelete(msg.id)}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              Delete
                            </button>
                          </div>
                        )}

                        {isOpen && isMe && (
                          <div className="mp-act-row" onClick={e => e.stopPropagation()}>
                            <button className="mp-act" onClick={() => { setEditId(msg.id); setReplyId(null); setInlineText(msg.content); }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                          </div>
                        )}

                        {replyId === msg.id && (
                          <div className="mp-inline-form">
                            <textarea
                              className="mp-inline-ta"
                              placeholder="Type your reply..."
                              value={inlineText}
                              onChange={e => setInlineText(e.target.value)}
                            />
                            <div className="mp-inline-btns">
                              <button className="mp-btn-ok" onClick={() => handleReply(msg.id)}>Send Reply</button>
                              <button className="mp-btn-cancel" onClick={() => { setReplyId(null); setInlineText(""); }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {editId === msg.id && (
                          <div className="mp-inline-form">
                            <textarea
                              className="mp-inline-ta"
                              value={inlineText}
                              onChange={e => setInlineText(e.target.value)}
                            />
                            <div className="mp-inline-btns">
                              <button className="mp-btn-ok" onClick={() => handleUpdate(msg.id)}>Save</button>
                              <button className="mp-btn-cancel" onClick={() => { setEditId(null); setInlineText(""); }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {isMe && (
                        <div
                          className="mp-msg-av mine"
                          style={myPhoto ? { background: "none", padding: 0, overflow: "hidden" } : {}}
                        >
                          {myPhoto
                            ? <img src={myPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                            : initials(currentUser.name)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mp-pagination">
            <button className="mp-pgbtn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const num = start + i;
              return num <= totalPages ? (
                <button key={num} className={`mp-pgbtn${num === page ? " active" : ""}`} onClick={() => setPage(num)}>{num}</button>
              ) : null;
            })}
            <span className="mp-pginfo">{page} / {totalPages}</span>
            <button className="mp-pgbtn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}

        <div className="mp-compose-area">
          {isStaff ? (
            <div className="mp-no-compose">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Click on a message and use the Reply button to respond.
            </div>
          ) : (
            <>
              <div className="mp-target-row">
                <button
                  className={`mp-target-btn${composeTo ? " sel" : ""}`}
                  onClick={() => setComposeTo(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  To Admin
                </button>
                <button
                  className={`mp-target-btn${!composeTo ? " sel" : ""}`}
                  onClick={() => setComposeTo(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                  To Company
                </button>
              </div>

              <div className="mp-char-hint">
                <span className={`mp-char-txt${charCls ? " " + charCls : ""}`}>
                  {text.length} / {MAX_LEN}
                </span>
              </div>

              <div className="mp-input-row">
                <textarea
                  className={`mp-textarea${charCls === "over" ? " over" : ""}`}
                  placeholder="Write your message..."
                  value={text}
                  rows={1}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="mp-send-btn"
                  onClick={handleSend}
                  disabled={sending || charCls === "over"}
                >
                  {sending ? (
                    <span className="mp-spinner" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className={`mp-toast ${toast.type}`}>
          {toast.type === "ok"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}