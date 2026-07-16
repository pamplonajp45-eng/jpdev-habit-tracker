import { useState, useEffect, useRef, useCallback } from "react";
import api from "../utils/api";
import { io } from "socket.io-client";
import chatIcon from "../assets/icons/chat.png";
import friendsIcon from "../assets/icons/friends.png";
import notificationsIcon from "../assets/icons/notifications.png";
import exploreIcon from "../assets/icons/explore.png";

const statusColor = { online: "#22d3a5", away: "#f59e0b", offline: "#64748b" };

const SOCKET_URL = import.meta.env.PROD ? "/" : "http://localhost:5000";

export default function ChatSystem({
  isOpen,
  onClose,
  currentUser,
  onUnreadChange,
}) {
  const [view, setView] = useState("chat");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [input, setInput] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exploreQuery, setExploreQuery] = useState("");
  const [exploreResults, setExploreResults] = useState([]);
  const [notification, setNotification] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOpenRef = useRef(isOpen);
  const selectedFriendRef = useRef(selectedFriend);
  const viewRef = useRef(view);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const currentMessages = selectedFriend
    ? messages[selectedFriend._id] || []
    : [];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on("connect", () => {
        socketRef.current.emit("join", currentUser._id);
      });

      socketRef.current.on("newMessage", (msg) => {
        const friendId =
          msg.sender === currentUser._id ? msg.recipient : msg.sender;

        setMessages((prev) => ({
          ...prev,
          [friendId]: [...(prev[friendId] || []), msg],
        }));

        if (msg.sender !== currentUser._id) {
          const isChattingWithSender =
            isOpenRef.current &&
            selectedFriendRef.current?._id === friendId &&
            viewRef.current === "chat";

          if (!isChattingWithSender) {
            setUnreadCounts((prev) => ({
              ...prev,
              [friendId]: (prev[friendId] || 0) + 1,
            }));

            const audio = new Audio("/add.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          }
        }
      });

      socketRef.current.on("userStatusChange", ({ userId, isOnline }) => {
        setFriends((prev) =>
          prev.map((f) =>
            f._id === userId
              ? { ...f, isOnline, status: isOnline ? "online" : "offline" }
              : f,
          ),
        );
        setSelectedFriend((prev) =>
          prev?._id === userId
            ? { ...prev, isOnline, status: isOnline ? "online" : "offline" }
            : prev,
        );
      });

      socketRef.current.on("typing", ({ userId, isTyping }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [userId]: isTyping,
        }));
      });

      socketRef.current.on("messagesRead", ({ readerId, senderId }) => {
        if (senderId === currentUser._id) {
          setMessages((prev) => {
            const msgs = prev[readerId] || [];
            const updated = msgs.map((m) =>
              m.sender === senderId && !m.read ? { ...m, read: true } : m,
            );
            return { ...prev, [readerId]: updated };
          });
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [currentUser]);

  useEffect(() => {
    const total = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    onUnreadChange?.(total);
  }, [unreadCounts, onUnreadChange]);

  useEffect(() => {
    let unlockAudio = null;

    if (isOpen && selectedFriend && view === "chat") {
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedFriend._id]: 0,
      }));

      unlockAudio = () => {
        const audio = new Audio("/add.mp3");
        audio.volume = 0;
        audio.play().catch(() => {});
        window.removeEventListener("click", unlockAudio);
      };
      window.addEventListener("click", unlockAudio);

      if (selectedFriend._id && socketRef.current) {
        socketRef.current.emit("markRead", {
          senderId: selectedFriend._id,
          readerId: currentUser._id,
        });
      }
    }
    return () => {
      if (typeof unlockAudio === "function") {
        window.removeEventListener("click", unlockAudio);
      }
    };
  }, [isOpen, selectedFriend, view, currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFriend) {
      fetchChatHistory(selectedFriend._id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, typingUsers]);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(
        res.data.map((f) => ({
          ...f,
          status: f.isOnline ? "online" : "offline",
          lastSeen: formatLastSeen(f.lastSeen),
          avatar: f.username.substring(0, 2).toUpperCase(),
          name: f.username,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return "Long ago";
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString();
  };

  const formatDateSeparator = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)
      return msgDate.toLocaleDateString(undefined, { weekday: "long" });
    return msgDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const shouldShowDateSeparator = (msg, prevMsg) => {
    if (!prevMsg) return true;
    const msgDate = new Date(msg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return msgDate !== prevDate;
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("/friends/requests");
      setPendingRequests(
        res.data.map((r) => ({
          id: r._id,
          from: {
            id: r.sender._id,
            name: r.sender.username,
            avatar: r.sender.username.substring(0, 2).toUpperCase(),
          },
          time: new Date(r.createdAt).toLocaleTimeString(),
        })),
      );
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const fetchChatHistory = async (friendId) => {
    try {
      const res = await api.get(`/chat/history/${friendId}`);
      setMessages((prev) => ({
        ...prev,
        [friendId]: res.data.map((m) => ({
          id: m._id,
          sender: m.sender,
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: m.createdAt,
          read: m.read || false,
        })),
      }));
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleExploreSearch = async (val) => {
    setExploreQuery(val);
    if (val.length < 2) {
      setExploreResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${val}`);
      setExploreResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const handleTyping = useCallback(
    (e) => {
      setInput(e.target.value);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      if (selectedFriend && socketRef.current) {
        socketRef.current.emit("typing", {
          recipientId: selectedFriend._id,
          isTyping: true,
        });
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedFriend && socketRef.current) {
          socketRef.current.emit("typing", {
            recipientId: selectedFriend._id,
            isTyping: false,
          });
        }
      }, 1000);
    },
    [selectedFriend],
  );

  const sendMessage = async () => {
    if (!input.trim() || !selectedFriend) return;

    const text = input.trim();
    setInput("");
    setReplyTo(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (selectedFriend && socketRef.current) {
      socketRef.current.emit("typing", {
        recipientId: selectedFriend._id,
        isTyping: false,
      });
    }

    try {
      const res = await api.post("/chat/send", {
        recipientId: selectedFriend._id,
        text,
      });
      const newMsg = {
        id: res.data._id,
        sender: currentUser._id,
        text: res.data.text,
        time: new Date(res.data.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: res.data.createdAt,
        read: false,
      };
      setMessages((prev) => ({
        ...prev,
        [selectedFriend._id]: [...(prev[selectedFriend._id] || []), newMsg],
      }));
    } catch (err) {
      console.error("Failed to send message", err);
      showNotification("Failed to send message");
    }
  };

  const acceptRequest = async (req) => {
    try {
      await api.put(`/friends/accept/${req.id}`);
      fetchFriends();
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      showNotification(`${req.from.name} added to friends!`);
    } catch (err) {
      console.error("Failed to accept request", err);
      showNotification("Failed to accept request");
    }
  };

  const rejectRequest = async (req) => {
    try {
      await api.put(`/friends/reject/${req.id}`);
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      showNotification(`Request from ${req.from.name} declined.`);
    } catch (err) {
      console.error("Failed to reject request", err);
      showNotification("Failed to reject request");
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const sendFriendRequest = async (targetUsername) => {
    try {
      await api.post(`/friends/request/${targetUsername}`);
      showNotification(`Friend request sent to "${targetUsername}"!`);
      setExploreResults((prev) =>
        prev.map((u) =>
          u.username === targetUsername ? { ...u, requestStatus: "sent" } : u,
        ),
      );
    } catch (err) {
      console.error("Failed to send request", err);
      showNotification(err.response?.data?.message || "Failed to send request");
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getLastMessage = (friendId) => {
    const msgs = messages[friendId] || [];
    return msgs[msgs.length - 1];
  };

  const myAvatar = currentUser?.username?.substring(0, 2).toUpperCase() || "ME";

  const showSidebar = !isMobile || (isMobile && !selectedFriend);
  const showChat = !isMobile || (isMobile && selectedFriend);

  const isTyping = selectedFriend ? typingUsers[selectedFriend._id] : false;

  return (
    <div
      style={{
        ...styles.overlay,
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        transition: "opacity 0.3s ease, visibility 0.3s",
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.root,
          ...(isMobile ? styles.rootMobile : {}),
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? "translateX(0) scale(1)"
            : "translateX(-40px) scale(0.98)",
          transition:
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
        className={isMobile ? "mobile-root" : ""}
      >
        <style>{css}</style>

        {/* Notification */}
        {notification && <div style={styles.notification}>{notification}</div>}

        {/* Sidebar */}
        {showSidebar && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <div style={styles.myAvatar}>
                  <span>{myAvatar}</span>
                  <div
                    style={{
                      ...styles.statusDot,
                      background: "#22d3a5",
                      bottom: 2,
                      right: 2,
                    }}
                  />
                </div>
                <div>
                  <div style={styles.myName}>{currentUser?.username}</div>
                  <div style={styles.myStatus}>● Online</div>
                </div>
              </div>
              <button onClick={onClose} style={styles.closeBtn} title="Close">
                ✕
              </button>
            </div>

            {/* Nav */}
            <div style={styles.nav}>
              {[
                { key: "chat", label: "Messages", icon: chatIcon },
                {
                  key: "friends",
                  label: "Friends",
                  icon: friendsIcon,
                  badge: friends.length,
                },
                { key: "explore", label: "Explore", icon: exploreIcon },
                {
                  key: "requests",
                  label: "Requests",
                  icon: notificationsIcon,
                  badge: pendingRequests.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  style={{
                    ...styles.navBtn,
                    ...(view === tab.key ? styles.navBtnActive : {}),
                  }}
                  onClick={() => setView(tab.key)}
                  className="nav-btn"
                >
                  <img
                    src={tab.icon}
                    alt={tab.label}
                    style={{
                      width: 22,
                      height: 22,
                      objectFit: "contain",
                      marginBottom: 2,
                    }}
                  />
                  <span style={styles.navLabel}>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span style={styles.badge}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={styles.searchWrap}>
              <input
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Content area */}
            <div style={styles.friendList}>
              {view === "chat" && (
                <>
                  {filteredFriends.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={{ marginBottom: 12 }}>
                        <img
                          src={chatIcon}
                          alt="Chat"
                          style={{
                            width: 50,
                            height: 50,
                            objectFit: "contain",
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#e2e8f0",
                        }}
                      >
                        No conversations yet
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          marginTop: 8,
                          lineHeight: 1.5,
                          padding: "0 20px",
                        }}
                      >
                        Select a conversation or find
                        <br />
                        new friends in <b>Explore</b>
                      </div>
                      <button
                        style={{
                          ...styles.msgBtn,
                          marginTop: 20,
                          padding: "10px 24px",
                        }}
                        onClick={() => setView("explore")}
                      >
                        Go to Explore
                      </button>
                    </div>
                  ) : (
                    filteredFriends.map((f) => {
                      const lastMsg = getLastMessage(f._id);
                      const isActive = selectedFriend?._id === f._id;
                      const unread = unreadCounts[f._id] || 0;
                      return (
                        <div
                          key={f._id}
                          style={{
                            ...styles.friendItem,
                            ...(isActive ? styles.friendItemActive : {}),
                            ...(unread > 0 && !isActive
                              ? { background: "rgba(99,102,241,0.08)" }
                              : {}),
                          }}
                          onClick={() => {
                            setSelectedFriend(f);
                            setReplyTo(null);
                          }}
                          className="friend-item"
                        >
                          <div style={styles.avatarWrap}>
                            <div
                              style={{
                                ...styles.avatar,
                                background: avatarBg(f.name),
                              }}
                            >
                              {f.avatar}
                            </div>
                            <div
                              style={{
                                ...styles.statusDot,
                                background: f.isOnline ? "#22d3a5" : "#64748b",
                                boxShadow: f.isOnline
                                  ? "0 0 8px rgba(34,211,165,0.4)"
                                  : "none",
                              }}
                            />
                          </div>
                          <div style={styles.friendInfo}>
                            <div
                              style={{
                                ...styles.friendName,
                                fontWeight: unread > 0 ? 800 : 600,
                              }}
                            >
                              {f.name}
                              {unread > 0 && (
                                <span style={styles.unreadPulse} />
                              )}
                            </div>
                            <div
                              style={{
                                ...styles.lastMsg,
                                color: unread > 0 ? "#818cf8" : "#64748b",
                                fontWeight: unread > 0 ? 600 : 400,
                              }}
                            >
                              {lastMsg
                                ? (lastMsg.sender === currentUser._id
                                    ? "You: "
                                    : "") + lastMsg.text
                                : "Start a conversation"}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 4,
                            }}
                          >
                            {lastMsg && (
                              <div style={styles.msgTime}>{lastMsg.time}</div>
                            )}
                            {unread > 0 && (
                              <div style={styles.unreadBadge}>NEW</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {view === "friends" &&
                filteredFriends.map((f) => (
                  <div
                    key={f._id}
                    style={styles.friendItem}
                    className="friend-item"
                    onClick={() => {
                      setSelectedFriend(f);
                      setView("chat");
                    }}
                  >
                    <div style={styles.avatarWrap}>
                      <div
                        style={{
                          ...styles.avatar,
                          background: avatarBg(f.name),
                        }}
                      >
                        {f.avatar}
                      </div>
                      <div
                        style={{
                          ...styles.statusDot,
                          background: statusColor[f.status],
                        }}
                      />
                    </div>
                    <div style={styles.friendInfo}>
                      <div style={styles.friendName}>{f.name}</div>
                      <div style={styles.lastMsg}>
                        Lvl {f.level} · {f.xp} XP
                      </div>
                    </div>
                    <button style={styles.msgBtn}>Chat</button>
                  </div>
                ))}

              {view === "explore" && (
                <>
                  <div style={styles.searchWrap}>
                    <input
                      style={styles.searchInput}
                      placeholder="Search users..."
                      value={exploreQuery}
                      onChange={(e) => handleExploreSearch(e.target.value)}
                    />
                  </div>
                  {exploreResults.length === 0 && exploreQuery.length >= 2 && (
                    <div style={styles.emptyState}>No users found 🔍</div>
                  )}
                  {exploreResults.length === 0 && exploreQuery.length < 2 && (
                    <div style={styles.emptyState}>
                      Search users to connect...
                    </div>
                  )}
                  {exploreResults.map((u) => (
                    <div
                      key={u._id}
                      style={styles.friendItem}
                      className="friend-item"
                    >
                      <div
                        style={{
                          ...styles.avatar,
                          background: avatarBg(u.username),
                        }}
                      >
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={styles.friendInfo}>
                        <div style={styles.friendName}>{u.username}</div>
                        <div style={styles.lastMsg}>
                          Lvl {u.level || 1} · {u.xp || 0} XP
                        </div>
                      </div>
                      {u.isFriend ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#22d3a5",
                            fontWeight: 700,
                          }}
                        >
                          Friend
                        </span>
                      ) : u.requestStatus === "sent" ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#f59e0b",
                            fontWeight: 700,
                          }}
                        >
                          Pending
                        </span>
                      ) : u.requestStatus === "received" ? (
                        <button
                          style={styles.msgBtn}
                          onClick={() => setView("requests")}
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          style={styles.addBtnSmall}
                          onClick={() => sendFriendRequest(u.username)}
                        >
                          +
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {view === "requests" && (
                <>
                  {pendingRequests.length === 0 && (
                    <div style={styles.emptyState}>No requests 🎉</div>
                  )}
                  {pendingRequests.map((req) => (
                    <div key={req.id} style={styles.requestItem}>
                      <div
                        style={{
                          ...styles.avatar,
                          background: avatarBg(req.from.name),
                          marginRight: 12,
                        }}
                      >
                        {req.from.avatar}
                      </div>
                      <div style={styles.friendInfo}>
                        <div style={styles.friendName}>{req.from.name}</div>
                        <div style={styles.lastMsg}>{req.time}</div>
                      </div>
                      <div style={styles.reqActions}>
                        <button
                          style={styles.acceptBtn}
                          onClick={() => acceptRequest(req)}
                        >
                          ✓
                        </button>
                        <button
                          style={styles.rejectBtn}
                          onClick={() => rejectRequest(req)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div style={styles.chatPanel}>
            {selectedFriend && view === "chat" ? (
              <>
                {/* Chat Header */}
                <div style={styles.chatHeader}>
                  {isMobile && (
                    <button
                      style={styles.backBtn}
                      onClick={() => setSelectedFriend(null)}
                    >
                      ←
                    </button>
                  )}
                  <div style={styles.avatarWrap}>
                    <div
                      style={{
                        ...styles.avatar,
                        background: avatarBg(selectedFriend.name),
                        width: 42,
                        height: 42,
                        fontSize: 15,
                      }}
                    >
                      {selectedFriend.avatar}
                    </div>
                    <div
                      style={{
                        ...styles.statusDot,
                        background: selectedFriend.isOnline
                          ? "#22d3a5"
                          : "#64748b",
                        width: 12,
                        height: 12,
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.chatHeaderName}>
                      {selectedFriend.name}
                    </div>
                    <div
                      style={{
                        ...styles.chatHeaderStatus,
                        color: selectedFriend.isOnline ? "#22d3a5" : "#64748b",
                      }}
                    >
                      {isTyping ? (
                        <span style={{ color: "#818cf8" }}>typing</span>
                      ) : selectedFriend.isOnline ? (
                        "● Online"
                      ) : (
                        `Last seen ${selectedFriend.lastSeen}`
                      )}
                    </div>
                  </div>
                  {!isMobile && (
                    <div style={styles.chatActions}>
                      <button style={styles.iconBtn}>📞</button>
                      <button style={styles.iconBtn}>📹</button>
                      <button style={styles.iconBtn}>⋯</button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={styles.messages}>
                  {currentMessages.length === 0 && (
                    <div style={styles.emptyChat}>
                      <div style={{ fontSize: 48 }}>👋</div>
                      <div style={styles.emptyChatText}>
                        Say hi to {selectedFriend.name}!
                      </div>
                    </div>
                  )}
                  {currentMessages.map((msg, i) => {
                    const isMe = msg.sender === currentUser._id;
                    const showAvatar =
                      !isMe &&
                      (i === 0 || currentMessages[i - 1].sender !== msg.sender);
                    const showDateSep = shouldShowDateSeparator(
                      msg,
                      currentMessages[i - 1],
                    );

                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div style={styles.dateSeparator}>
                            <span style={styles.dateSeparatorText}>
                              {formatDateSeparator(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            ...styles.msgRow,
                            justifyContent: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          {!isMe && (
                            <div
                              style={{
                                ...styles.avatar,
                                ...styles.msgAvatar,
                                opacity: showAvatar ? 1 : 0,
                                background: avatarBg(selectedFriend.name),
                              }}
                            >
                              {showAvatar ? selectedFriend.avatar : ""}
                            </div>
                          )}
                          <div style={{ maxWidth: "75%" }}>
                            <div
                              style={{
                                ...styles.bubble,
                                ...(isMe ? styles.bubbleMe : styles.bubbleThem),
                                borderBottomRightRadius:
                                  isMe && showAvatar ? 20 : 4,
                                borderBottomLeftRadius:
                                  !isMe && showAvatar ? 20 : 4,
                              }}
                            >
                              {msg.text}
                            </div>
                            <div
                              style={{
                                ...styles.msgMeta,
                                textAlign: isMe ? "right" : "left",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                justifyContent: isMe
                                  ? "flex-end"
                                  : "flex-start",
                              }}
                            >
                              {msg.time}
                              {isMe && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: msg.read ? "#22d3a5" : "#64748b",
                                  }}
                                >
                                  {msg.read ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing indicator */}
                {isTyping && (
                  <div style={styles.typingIndicator}>
                    <div style={styles.typingDots}>
                      <span style={{ ...styles.dot, animationDelay: "0s" }} />
                      <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                      <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}

                {/* Input */}
                <div style={styles.inputArea}>
                  <div style={styles.inputWrapper}>
                    <input
                      style={styles.messageInput}
                      placeholder="Type a message..."
                      value={input}
                      onChange={handleTyping}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                    />
                    <button
                      style={{
                        ...styles.sendBtn,
                        opacity: input.trim() ? 1 : 0.4,
                      }}
                      onClick={sendMessage}
                      disabled={!input.trim()}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                  <div
                    style={{
                      height: "env(safe-area-inset-bottom)",
                      background: styles.inputArea.background,
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={styles.welcomePanel}>
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={chatIcon}
                    alt="Messages"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                      opacity: 0.8,
                    }}
                  />
                </div>
                <h2 style={styles.welcomeTitle}>Your Messages</h2>
                <p style={styles.welcomeSub}>
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function avatarBg(name) {
  const colors = [
    "#6366f1",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    backdropFilter: "blur(8px)",
  },
  root: {
    display: "flex",
    width: "95%",
    maxWidth: "1100px",
    height: "85vh",
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "var(--text-primary)",
    overflow: "hidden",
    borderRadius: "var(--radius-xl)",
    position: "relative",
    boxShadow: "var(--card-shadow)",
  },
  rootMobile: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    maxWidth: "none",
  },
  notification: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--accent)",
    color: "var(--bg-primary)",
    padding: "10px 20px",
    borderRadius: 100,
    fontWeight: 700,
    zIndex: 999,
    boxShadow: "0 4px 20px rgba(34,211,165,0.4)",
    animation: "slideDown 0.3s ease",
  },
  sidebar: {
    width: 340,
    background: "var(--card-bg)",
    borderRight: "1px solid var(--card-border)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 16px 16px",
    borderBottom: "1px solid var(--card-border)",
  },
  myAvatar: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
  },
  myName: { fontWeight: 700, fontSize: 15, color: "var(--text-primary)" },
  myStatus: { fontSize: 11, color: "var(--accent)", marginTop: 2 },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    lineHeight: 1,
    transition: "all 0.2s",
  },
  nav: {
    display: "flex",
    gap: 4,
    padding: "12px 12px 8px",
  },
  navBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "8px 4px",
    background: "transparent",
    border: "none",
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
  },
  navLabel: { fontSize: 10, fontWeight: 700 },
  navBtnActive: {
    background: "var(--accent-light)",
    color: "var(--accent)",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "#ef4444",
    color: "#fff",
    borderRadius: 100,
    fontSize: 10,
    padding: "1px 5px",
    fontWeight: 800,
  },
  searchWrap: { padding: "8px 12px 12px" },
  searchInput: {
    width: "100%",
    background: "var(--bg-secondary)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-md)",
    padding: "12px 16px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  },
  friendList: { flex: 1, overflowY: "auto", paddingBottom: 90 },
  friendItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "all 0.15s",
    borderRadius: "var(--radius-md)",
    margin: "0 8px 4px",
  },
  friendItemActive: { background: "var(--accent-light)" },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid var(--card-bg)",
  },
  friendInfo: { flex: 1, minWidth: 0 },
  friendName: { fontWeight: 600, fontSize: 15, color: "var(--text-primary)" },
  lastMsg: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  msgTime: { fontSize: 11, color: "var(--text-muted)" },
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "var(--card-bg)",
    minWidth: 0,
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
    borderBottom: "1px solid var(--card-border)",
    background: "var(--bg-primary)",
    flexShrink: 0,
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 24,
    padding: "0 8px 0 0",
    cursor: "pointer",
  },
  chatHeaderName: {
    fontWeight: 700,
    fontSize: 16,
    color: "var(--text-primary)",
  },
  chatHeaderStatus: { fontSize: 12, color: "var(--accent)" },
  chatActions: { display: "flex", gap: 8, marginLeft: "auto" },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: 8,
    borderRadius: 8,
    opacity: 0.6,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    background: "var(--bg-secondary)",
  },
  dateSeparator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "16px 0 12px",
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    background: "var(--card-bg)",
    padding: "4px 12px",
    borderRadius: 100,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    border: "1px solid var(--card-border)",
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 2 },
  msgAvatar: { width: 32, height: 32, fontSize: 12 },
  bubble: {
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: "100%",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  bubbleMe: {
    background: "var(--accent)",
    color: "var(--bg-primary)",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    background: "var(--card-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--card-border)",
    borderBottomLeftRadius: 4,
  },
  msgMeta: { fontSize: 10, color: "var(--text-muted)", marginTop: 4 },
  typingIndicator: {
    padding: "8px 20px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-secondary)",
  },
  typingDots: {
    display: "flex",
    gap: 4,
    background: "var(--card-bg)",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid var(--card-border)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--accent)",
    animation: "typingBounce 1.4s infinite ease-in-out",
  },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderTop: "1px solid var(--card-border)",
    background: "var(--bg-primary)",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-secondary)",
    border: "1px solid var(--card-border)",
    borderRadius: 24,
    padding: "4px 4px 4px 16px",
  },
  messageInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    minWidth: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--accent)",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  welcomePanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.3,
  },
  welcomeTitle: {
    margin: "10px 0",
    fontSize: 24,
    color: "var(--text-primary)",
  },
  welcomeSub: { margin: 0, fontSize: 14, color: "var(--text-secondary)" },
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 10,
    color: "var(--text-primary)",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--text-muted)",
  },
  msgBtn: {
    background: "var(--accent-light)",
    color: "var(--accent)",
    border: "1px solid var(--accent-mid)",
    borderRadius: "var(--radius-md)",
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  addBtnSmall: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    width: 32,
    height: 32,
    fontSize: 20,
    cursor: "pointer",
  },
  requestItem: { display: "flex", alignItems: "center", padding: "14px 16px" },
  reqActions: { display: "flex", gap: 8, marginLeft: "auto" },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--success-bg)",
    color: "var(--success-text)",
    border: "1px solid var(--success-text)",
    cursor: "pointer",
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid var(--danger-text)",
    cursor: "pointer",
  },
  unreadBadge: {
    background: "var(--accent)",
    color: "var(--bg-primary)",
    borderRadius: 4,
    fontSize: 10,
    padding: "2px 6px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  unreadPulse: {
    display: "inline-block",
    width: 8,
    height: 8,
    background: "var(--accent)",
    borderRadius: "50%",
    marginLeft: 8,
    animation: "pulse 2s infinite",
    verticalAlign: "middle",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }

  .friend-item:hover { background: rgba(255,255,255,0.04) !important; }
  .nav-btn:hover { background: rgba(255,255,255,0.03); }

  @keyframes slideDown {
    from { transform: translate(-50%, -20px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }

  @keyframes pulse {
    0% { transform: scale(0.95); boxShadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
    70% { transform: scale(1); boxShadow: 0 0 0 6px rgba(99, 102, 241, 0); }
    100% { transform: scale(0.95); boxShadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  }

  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }

  @media (max-width: 768px) {
    .sidebar { width: 100% !important; border-right: none !important; }
  }
`;
