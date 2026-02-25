import { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { io } from "socket.io-client";
import chatIcon from "../assets/icons/chat.png";
import friendsIcon from "../assets/icons/friends.png";
import notificationsIcon from "../assets/icons/notifications.png";
import exploreIcon from "../assets/icons/explore.png";

const statusColor = { online: "#22d3a5", away: "#f59e0b", offline: "#64748b" };

const SOCKET_URL = import.meta.env.PROD ? "/" : "http://localhost:5000";

export default function ChatSystem({ isOpen, onClose, currentUser, onUnreadChange }) {
    const [view, setView] = useState("chat"); // chat | friends | requests | explore
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
    const [typing, setTyping] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Refs to track state for socket listeners without reconnecting
    const isOpenRef = useRef(isOpen);
    const selectedFriendRef = useRef(selectedFriend);
    const viewRef = useRef(view);

    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    useEffect(() => { selectedFriendRef.current = selectedFriend; }, [selectedFriend]);
    useEffect(() => { viewRef.current = view; }, [view]);

    const currentMessages = selectedFriend ? (messages[selectedFriend._id] || []) : [];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (currentUser) {
            console.log("Initializing Socket connection for user:", currentUser._id);
            socketRef.current = io(SOCKET_URL);

            socketRef.current.on("connect", () => {
                console.log("Socket connected successfully");
                socketRef.current.emit("join", currentUser._id);
            });

            socketRef.current.on("newMessage", (msg) => {
                console.log("New message received via socket:", msg);
                const friendId = msg.sender === currentUser._id ? msg.recipient : msg.sender;

                setMessages((prev) => ({
                    ...prev,
                    [friendId]: [...(prev[friendId] || []), msg],
                }));

                // Handle unread counts and notifications
                if (msg.sender !== currentUser._id) {
                    const isChattingWithSender = isOpenRef.current && selectedFriendRef.current?._id === friendId && viewRef.current === "chat";
                    console.log("Is currently chatting with sender?", isChattingWithSender);

                    if (!isChattingWithSender) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [friendId]: (prev[friendId] || 0) + 1
                        }));

                        // Visual indicator for debugging
                        if (!isOpenRef.current) {
                            console.log("Modal closed, triggering sound and badge update");
                        }

                        // Play notification sound
                        const audio = new Audio("/add.mp3");
                        audio.volume = 0.5;
                        audio.play().then(() => {
                            console.log("Notification sound played successfully");
                        }).catch((err) => {
                            console.warn("Sound play failed (interaction required?):", err);
                        });
                    }
                }
            });

            socketRef.current.on("userStatusChange", ({ userId, isOnline }) => {
                console.log(`Status change for ${userId}: ${isOnline ? 'online' : 'offline'}`);
                setFriends(prev => prev.map(f =>
                    f._id === userId ? { ...f, isOnline, status: isOnline ? 'online' : 'offline' } : f
                ));
                setSelectedFriend(prev =>
                    prev?._id === userId ? { ...prev, isOnline, status: isOnline ? 'online' : 'offline' } : prev
                );
            });

            return () => {
                if (socketRef.current) {
                    console.log("Disconnecting socket");
                    socketRef.current.disconnect();
                }
            };
        }
    }, [currentUser]); // ONLY depend on currentUser to avoid frequent reconnects

    // Notify parent about total unread
    useEffect(() => {
        const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
        onUnreadChange?.(total);
    }, [unreadCounts, onUnreadChange]);

    // Clear unread when entering chat with a friend
    useEffect(() => {
        if (isOpen && selectedFriend && view === "chat") {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedFriend._id]: 0
            }));

            // Unlock audio on first interaction
            const unlockAudio = () => {
                const audio = new Audio("/add.mp3");
                audio.volume = 0;
                audio.play().catch(() => { });
                window.removeEventListener('click', unlockAudio);
            };
            window.addEventListener('click', unlockAudio);
        }
    }, [isOpen, selectedFriend, view]);

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
    }, [currentMessages, typing]);

    const fetchFriends = async () => {
        try {
            const res = await api.get("/friends");
            setFriends(res.data.map(f => ({
                ...f,
                status: f.isOnline ? "online" : "offline",
                lastSeen: formatLastSeen(f.lastSeen),
                avatar: f.username.substring(0, 2).toUpperCase(),
                name: f.username
            })));
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

    const fetchPendingRequests = async () => {
        try {
            const res = await api.get("/friends/requests");
            setPendingRequests(res.data.map(r => ({
                id: r._id,
                from: {
                    id: r.sender._id,
                    name: r.sender.username,
                    avatar: r.sender.username.substring(0, 2).toUpperCase()
                },
                time: new Date(r.createdAt).toLocaleTimeString()
            })));
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const fetchChatHistory = async (friendId) => {
        try {
            const res = await api.get(`/chat/history/${friendId}`);
            setMessages(prev => ({
                ...prev,
                [friendId]: res.data.map(m => ({
                    id: m._id,
                    sender: m.sender,
                    text: m.text,
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }))
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

    if (!isOpen) return null;

    const sendMessage = async () => {
        if (!input.trim() || !selectedFriend) return;

        const text = input.trim();
        setInput("");

        try {
            const res = await api.post("/chat/send", { recipientId: selectedFriend._id, text });
            const newMsg = {
                id: res.data._id,
                sender: currentUser._id,
                text: res.data.text,
                time: new Date(res.data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
            // Update explore results if we are in explore view
            setExploreResults(prev => prev.map(u => u.username === targetUsername ? { ...u, requestStatus: 'sent' } : u));
        } catch (err) {
            console.error("Failed to send request", err);
            showNotification(err.response?.data?.message || "Failed to send request");
        }
    };

    const filteredFriends = friends.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getLastMessage = (friendId) => {
        const msgs = messages[friendId] || [];
        return msgs[msgs.length - 1];
    };

    const myAvatar = currentUser?.username?.substring(0, 2).toUpperCase() || "ME";

    // Navigation logic
    const showSidebar = !isMobile || (isMobile && !selectedFriend);
    const showChat = !isMobile || (isMobile && selectedFriend);

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div
                style={{ ...styles.root, ...(isMobile ? styles.rootMobile : {}) }}
                onClick={(e) => e.stopPropagation()}
                className={isMobile ? "mobile-root" : ""}
            >
                <style>{css}</style>

                {/* Close Button */}
                <button style={styles.closeSystemBtn} onClick={onClose}>✕</button>

                {/* Notification */}
                {notification && <div style={styles.notification}>{notification}</div>}

                {/* Sidebar */}
                {showSidebar && (
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarHeader}>
                            <div style={styles.myAvatar}>
                                <span>{myAvatar}</span>
                                <div style={{ ...styles.statusDot, background: "#22d3a5", bottom: 2, right: 2 }} />
                            </div>
                            <div>
                                <div style={styles.myName}>{currentUser?.username}</div>
                                <div style={styles.myStatus}>● Online</div>
                            </div>
                        </div>

                        {/* Nav */}
                        <div style={styles.nav}>
                            {[
                                { key: "chat", label: "Messages", icon: chatIcon },
                                { key: "friends", label: "Friends", icon: friendsIcon, badge: friends.length },
                                { key: "explore", label: "Explore", icon: exploreIcon },
                                { key: "requests", label: "Requests", icon: notificationsIcon, badge: pendingRequests.length },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    style={{ ...styles.navBtn, ...(view === tab.key ? styles.navBtnActive : {}) }}
                                    onClick={() => setView(tab.key)}
                                    className="nav-btn"
                                >
                                    <img src={tab.icon} alt={tab.label} style={{ width: 22, height: 22, objectFit: 'contain', marginBottom: 2 }} />
                                    <span style={styles.navLabel}>{tab.label}</span>
                                    {tab.badge > 0 && <span style={styles.badge}>{tab.badge}</span>}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div style={styles.searchWrap}>
                            <input
                                style={styles.searchInput}
                                placeholder={view === "explore" ? "Search users..." : "Search..."}
                                value={view === "explore" ? exploreQuery : searchQuery}
                                onChange={(e) => view === "explore" ? handleExploreSearch(e.target.value) : setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Friend list for chat */}
                        <div style={styles.friendList}>
                            {view === "chat" && (
                                <>
                                    {filteredFriends.length === 0 ? (
                                        <div style={styles.emptyState}>
                                            <div style={{ marginBottom: 12 }}>
                                                <img src={chatIcon} alt="Chat" style={{ width: 50, height: 50, objectFit: 'contain', opacity: 0.8 }} />
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0" }}>No conversations yet</div>
                                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 1.5, padding: "0 20px" }}>
                                                Select a conversation or find<br />new friends in <b>Explore</b>
                                            </div>
                                            <button
                                                style={{ ...styles.msgBtn, marginTop: 20, padding: "10px 24px" }}
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
                                                        ...(unread > 0 && !isActive ? { background: "rgba(99,102,241,0.08)" } : {})
                                                    }}
                                                    onClick={() => setSelectedFriend(f)}
                                                    className="friend-item"
                                                >
                                                    <div style={styles.avatarWrap}>
                                                        <div style={{ ...styles.avatar, background: avatarBg(f.name) }}>{f.avatar}</div>
                                                        <div style={{
                                                            ...styles.statusDot,
                                                            background: f.isOnline ? "#22d3a5" : "#64748b",
                                                            boxShadow: f.isOnline ? "0 0 8px rgba(34,211,165,0.4)" : "none"
                                                        }} />
                                                    </div>
                                                    <div style={styles.friendInfo}>
                                                        <div style={{ ...styles.friendName, fontWeight: unread > 0 ? 800 : 600 }}>
                                                            {f.name}
                                                            {unread > 0 && <span style={styles.unreadPulse} />}
                                                        </div>
                                                        <div style={{ ...styles.lastMsg, color: unread > 0 ? "#818cf8" : "#64748b", fontWeight: unread > 0 ? 600 : 400 }}>
                                                            {lastMsg ? (lastMsg.sender === currentUser._id ? "You: " : "") + lastMsg.text : "Start a conversation"}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                        {lastMsg && <div style={styles.msgTime}>{lastMsg.time}</div>}
                                                        {unread > 0 && <div style={styles.unreadBadge}>NEW</div>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            )}

                            {view === "friends" && filteredFriends.map((f) => (
                                <div key={f._id} style={styles.friendItem} className="friend-item" onClick={() => { setSelectedFriend(f); setView("chat"); }}>
                                    <div style={styles.avatarWrap}>
                                        <div style={{ ...styles.avatar, background: avatarBg(f.name) }}>{f.avatar}</div>
                                        <div style={{ ...styles.statusDot, background: statusColor[f.status] }} />
                                    </div>
                                    <div style={styles.friendInfo}>
                                        <div style={styles.friendName}>{f.name}</div>
                                        <div style={styles.lastMsg}>Lvl {f.level} · {f.xp} XP</div>
                                    </div>
                                    <button style={styles.msgBtn}>Chat</button>
                                </div>
                            ))}

                            {view === "explore" && (
                                <>
                                    {exploreResults.length === 0 && exploreQuery.length >= 2 && <div style={styles.emptyState}>No users found 🔍</div>}
                                    {exploreResults.length === 0 && exploreQuery.length < 2 && <div style={styles.emptyState}>Search users to connect...</div>}
                                    {exploreResults.map((u) => (
                                        <div key={u._id} style={styles.friendItem} className="friend-item">
                                            <div style={{ ...styles.avatar, background: avatarBg(u.username) }}>{u.username.substring(0, 2).toUpperCase()}</div>
                                            <div style={styles.friendInfo}>
                                                <div style={styles.friendName}>{u.username}</div>
                                                <div style={styles.lastMsg}>Lvl {u.level || 1} · {u.xp || 0} XP</div>
                                            </div>
                                            {u.isFriend ? <span style={{ fontSize: 11, color: "#22d3a5", fontWeight: 700 }}>Friend</span> :
                                                u.requestStatus === 'sent' ? <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>Pending</span> :
                                                    u.requestStatus === 'received' ? <button style={styles.msgBtn} onClick={() => setView("requests")}>Review</button> :
                                                        <button style={styles.addBtnSmall} onClick={() => sendFriendRequest(u.username)}>+</button>}
                                        </div>
                                    ))}
                                </>
                            )}

                            {view === "requests" && (
                                <>
                                    {pendingRequests.length === 0 && <div style={styles.emptyState}>No requests 🎉</div>}
                                    {pendingRequests.map((req) => (
                                        <div key={req.id} style={styles.requestItem}>
                                            <div style={{ ...styles.avatar, background: avatarBg(req.from.name), marginRight: 12 }}>{req.from.avatar}</div>
                                            <div style={styles.friendInfo}>
                                                <div style={styles.friendName}>{req.from.name}</div>
                                                <div style={styles.lastMsg}>{req.time}</div>
                                            </div>
                                            <div style={styles.reqActions}>
                                                <button style={styles.acceptBtn} onClick={() => acceptRequest(req)}>✓</button>
                                                <button style={styles.rejectBtn} onClick={() => rejectRequest(req)}>✕</button>
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
                                    {isMobile && <button style={styles.backBtn} onClick={() => setSelectedFriend(null)}>←</button>}
                                    <div style={styles.avatarWrap}>
                                        <div style={{ ...styles.avatar, background: avatarBg(selectedFriend.name), width: 42, height: 42, fontSize: 15 }}>
                                            {selectedFriend.avatar}
                                        </div>
                                        <div style={{
                                            ...styles.statusDot,
                                            background: selectedFriend.isOnline ? "#22d3a5" : "#64748b",
                                            width: 12,
                                            height: 12
                                        }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={styles.chatHeaderName}>{selectedFriend.name}</div>
                                        <div style={{
                                            ...styles.chatHeaderStatus,
                                            color: selectedFriend.isOnline ? "#22d3a5" : "#64748b"
                                        }}>
                                            {selectedFriend.isOnline ? "● Online" : `Last seen ${selectedFriend.lastSeen}`}
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
                                            <div style={styles.emptyChatText}>Say hi to {selectedFriend.name}!</div>
                                        </div>
                                    )}
                                    {currentMessages.map((msg, i) => {
                                        const isMe = msg.sender === currentUser._id;
                                        const showAvatar = !isMe && (i === 0 || currentMessages[i - 1].sender !== msg.sender);
                                        return (
                                            <div key={msg.id} style={{ ...styles.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                                {!isMe && (
                                                    <div style={{ ...styles.avatar, ...styles.msgAvatar, opacity: showAvatar ? 1 : 0, background: avatarBg(selectedFriend.name) }}>
                                                        {selectedFriend.avatar}
                                                    </div>
                                                )}
                                                <div style={{ maxWidth: "75%" }}>
                                                    <div style={{ ...styles.bubble, ...(isMe ? styles.bubbleMe : styles.bubbleThem) }}>
                                                        {msg.text}
                                                    </div>
                                                    <div style={{ ...styles.msgMeta, textAlign: isMe ? "right" : "left" }}>{msg.time}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div style={styles.inputArea}>
                                    {!isMobile && <button style={styles.attachBtn}>📎</button>}
                                    <input
                                        style={styles.messageInput}
                                        placeholder="Type a message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                    />
                                    <button
                                        style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                                        onClick={sendMessage}
                                        disabled={!input.trim()}
                                    >
                                        ➤
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={styles.welcomePanel}>
                                <div style={{ marginBottom: 16 }}>
                                    <img src={chatIcon} alt="Messages" style={{ width: 80, height: 80, objectFit: 'contain', opacity: 0.8 }} />
                                </div>
                                <h2 style={styles.welcomeTitle}>Your Messages</h2>
                                <p style={styles.welcomeSub}>Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function avatarBg(name) {
    const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];
    return colors[name.charCodeAt(0) % colors.length];
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    root: {
        display: "flex",
        width: "90%",
        maxWidth: "1000px",
        height: "80vh",
        background: "#0a0c10",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#e2e8f0",
        overflow: "hidden",
        borderRadius: "16px",
        position: "relative",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    },
    rootMobile: {
        width: "100%",
        height: "100%",
        borderRadius: 0,
        maxWidth: "none",
    },
    closeSystemBtn: {
        position: "absolute",
        top: 15,
        right: 15,
        background: "rgba(255,255,255,0.05)",
        border: "none",
        color: "#fff",
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 100,
    },
    notification: {
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#22d3a5",
        color: "#0a0c10",
        padding: "10px 20px",
        borderRadius: 100,
        fontWeight: 700,
        zIndex: 999,
        boxShadow: "0 4px 20px rgba(34,211,165,0.4)",
        animation: "slideDown 0.3s ease",
    },
    sidebar: {
        width: 320,
        background: "#0f1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
    },
    sidebarHeader: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "20px 16px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    myAvatar: {
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
    },
    myName: { fontWeight: 700, fontSize: 15 },
    myStatus: { fontSize: 11, color: "#22d3a5", marginTop: 2 },
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
        borderRadius: 12,
        color: "#64748b",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s",
    },
    navIcon: { fontSize: 20 },
    navLabel: { fontSize: 10, fontWeight: 700 },
    unreadDot: {
        display: "inline-block",
        width: 8,
        height: 8,
        background: "#6366f1",
        borderRadius: "50%",
        marginLeft: 6,
        boxShadow: "0 0 8px rgba(99,102,241,0.5)"
    },
    miniBadge: {
        background: "#6366f1",
        color: "#fff",
        borderRadius: 10,
        fontSize: 10,
        padding: "1px 6px",
        fontWeight: 800,
    },
    navBtnActive: {
        background: "rgba(99,102,241,0.15)",
        color: "#818cf8",
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 6,
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
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "12px 16px",
        color: "#e2e8f0",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
    },
    friendList: { flex: 1, overflowY: "auto" },
    friendItem: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "background 0.15s",
    },
    friendItemActive: { background: "rgba(99,102,241,0.12)" },
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
    },
    statusDot: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: "2px solid #0f1117",
    },
    friendInfo: { flex: 1, minWidth: 0 },
    friendName: { fontWeight: 600, fontSize: 15, color: "#e2e8f0" },
    lastMsg: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    msgTime: { fontSize: 11, color: "#475569" },
    chatPanel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#0a0c10",
    },
    chatHeader: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#0f1117",
    },
    backBtn: {
        background: "transparent",
        border: "none",
        color: "#e2e8f0",
        fontSize: 24,
        padding: "0 8px 0 0",
        cursor: "pointer",
    },
    chatHeaderName: { fontWeight: 700, fontSize: 16 },
    chatHeaderStatus: { fontSize: 12, color: "#22d3a5" },
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
        gap: 6,
    },
    msgRow: { display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 4 },
    msgAvatar: { width: 32, height: 32, fontSize: 12 },
    bubble: {
        padding: "12px 16px",
        borderRadius: 20,
        fontSize: 14,
        lineHeight: 1.5,
    },
    bubbleMe: {
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        color: "#fff",
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        background: "#1e2330",
        color: "#e2e8f0",
        borderBottomLeftRadius: 4,
    },
    msgMeta: { fontSize: 10, color: "#475569", marginTop: 4 },
    inputArea: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "#0f1117",
    },
    attachBtn: { background: "transparent", border: "none", fontSize: 20, cursor: "pointer", opacity: 0.5 },
    messageInput: {
        flex: 1,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: "12px 20px",
        color: "#e2e8f0",
        fontSize: 15,
        outline: "none",
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        border: "none",
        color: "#fff",
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    welcomePanel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.3,
    },
    welcomeTitle: { margin: "10px 0", fontSize: 24 },
    welcomeSub: { margin: 0, fontSize: 14 },
    emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.5 },
    emptyChatText: { fontSize: 16, fontWeight: 700, marginTop: 10 },
    emptyState: { padding: "40px 20px", textAlign: "center", color: "#64748b" },
    addFriendSection: { padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 8 },
    addBtnSmall: {
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        width: 32,
        height: 32,
        fontSize: 20,
        cursor: "pointer",
    },
    msgBtn: {
        background: "rgba(99,102,241,0.15)",
        color: "#818cf8",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
    },
    requestItem: { display: "flex", alignItems: "center", padding: "14px 16px" },
    reqActions: { display: "flex", gap: 8, marginLeft: "auto" },
    acceptBtn: { width: 34, height: 34, borderRadius: "50%", background: "rgba(34,211,165,0.15)", color: "#22d3a5", border: "1px solid rgba(34,211,165,0.3)", cursor: "pointer" },
    rejectBtn: { width: 34, height: 34, borderRadius: "50%", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" },
    unreadBadge: {
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        color: "#fff",
        borderRadius: 4,
        fontSize: 10,
        padding: "2px 6px",
        fontWeight: 800,
        boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
        letterSpacing: "0.5px"
    },
    unreadPulse: {
        display: "inline-block",
        width: 8,
        height: 8,
        background: "#6366f1",
        borderRadius: "50%",
        marginLeft: 8,
        boxShadow: "0 0 0 rgba(99,102,241, 0.4)",
        animation: "pulse 2s infinite",
        verticalAlign: "middle"
    }
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
  
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

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

  @media (max-width: 768px) {
    .sidebar { width: 100% !important; border-right: none !important; }
  }
`;
