import { useState, useEffect, useRef, useCallback } from "react";
import { Hash, Menu, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { User } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import ProfileModal from "@/components/ProfileModal";

interface Reaction {
  emoji: string;
  count: number;
  users: number[];
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  username: string;
  favorite_game: string;
  avatar_url?: string;
  is_removed?: boolean;
  author_id?: number;
  edited?: boolean;
  reactions?: Reaction[];
  replyTo?: { id: number; username: string; content: string };
}

interface OnlineUser {
  username: string;
  favorite_game: string;
}

interface ContextMenu {
  msgId: number;
  x: number;
  y: number;
}

interface ChatAreaProps {
  onSidebarOpen: () => void;
  onRegisterClick: () => void;
  user: User | null;
  token: string | null;
  channel: string;
  roomId?: number;
  roomName?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  general: "общий",
  meet: "знакомства",
  memes: "мемы",
  teammates: "поиск-тиммейтов",
};

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👎", "🎮"];

function avatarBg(name: string) {
  const colors = ["#5865f2","#eb459e","#ed4245","#57f287","#1abc9c","#3498db","#e91e63","#f39c12"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Yekaterinburg",
  });
}

function sendNotification(username: string, content: string) {
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification(`${username} в Frikords`, {
      body: content.length > 60 ? content.slice(0, 60) + "…" : content,
      icon: "/favicon.ico",
    });
  }
}

const ChatArea = ({ onSidebarOpen, onRegisterClick, user, token, channel, roomId, roomName }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(
    "Notification" in window && Notification.permission === "granted"
  );
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: number; content: string } | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const lastMsgIdRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uid = (user as unknown as { id: number } | null)?.id;

  const isAtBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgCount(0);
  };

  const fetchMessages = useCallback(async () => {
    const data = await api.messages.get(channel, token, roomId);
    if (Array.isArray(data.messages)) {
      const msgs = data.messages as Message[];
      setMessages(prev => {
        if (prev.length > 0 && msgs.length > prev.length) {
          const newOnes = msgs.slice(prev.length);
          const fromOthers = newOnes.filter(m => m.username !== user?.username).length;
          if (fromOthers > 0 && !isAtBottom()) {
            setNewMsgCount(c => c + fromOthers);
          } else if (isAtBottom()) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        } else if (prev.length === 0) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 50);
        }
        return msgs;
      });
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (lastMsgIdRef.current !== null && last.id !== lastMsgIdRef.current && last.username !== user?.username) {
          sendNotification(last.username, last.content);
        }
        lastMsgIdRef.current = last.id;
      }
    }
  }, [channel, token, roomId, user]);

  const fetchOnline = useCallback(async () => {
    const data = await api.online.get();
    if (typeof data.online === "number") setOnline(data.online);
    if (Array.isArray(data.users)) setOnlineUsers(data.users as OnlineUser[]);
  }, []);

  useEffect(() => {
    setMessages([]);
    setNewMsgCount(0);
    lastMsgIdRef.current = null;
    setReplyTo(null);
    setEditingMsg(null);
    fetchMessages();
    fetchOnline();
    const interval = setInterval(() => { fetchMessages(); fetchOnline(); }, 5000);
    return () => clearInterval(interval);
  }, [channel, roomId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("keydown", e => { if (e.key === "Escape") { setContextMenu(null); setEditingMsg(null); setReplyTo(null); } });
    return () => window.removeEventListener("click", close);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    if (editingMsg) {
      const res = await api.messages.edit(token, editingMsg.id, input.trim());
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: input.trim(), edited: true } : m));
      }
      setEditingMsg(null);
      setInput("");
      return;
    }

    setSending(true);
    const content = replyTo
      ? `↩ @${replyTo.username}: "${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? '…' : ''}"\n${input.trim()}`
      : input.trim();
    setInput("");
    setReplyTo(null);
    const data = await api.messages.send(token, content, channel, roomId);
    setSending(false);
    if (data.success && data.message) {
      const msg = data.message as Message;
      setMessages(prev => [...prev, msg]);
      lastMsgIdRef.current = msg.id;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const handleDelete = async (msgId: number) => {
    if (!token) return;
    setContextMenu(null);
    const res = await api.messages.remove(token, msgId);
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_removed: true, content: "" } : m));
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    if (!token || !user) return;
    setEmojiPickerFor(null);
    const data = await api.reactions.add(token, msgId, emoji);
    if (!data.ok) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const others = (m.reactions || []).filter(r => r.emoji !== emoji);
      const count = data.count as number;
      const users = data.users as number[];
      if (count > 0) return { ...m, reactions: [...others, { emoji, count, users }] };
      return { ...m, reactions: others };
    }));
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (msg.is_removed) return;
    e.preventDefault();
    setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
  };

  const handleCopy = (msgId: number) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) navigator.clipboard.writeText(msg.content);
    setContextMenu(null);
  };

  const handleReply = (msgId: number) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      setReplyTo(msg);
      inputRef.current?.focus();
    }
    setContextMenu(null);
  };

  const handleEdit = (msgId: number) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      setEditingMsg({ id: msg.id, content: msg.content });
      setInput(msg.content);
      inputRef.current?.focus();
    }
    setContextMenu(null);
  };

  const handleEnableNotif = async () => {
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  };

  const label = roomId ? (roomName || "комната") : (CHANNEL_LABELS[channel] || channel);

  const ctxMsg = contextMenu ? messages.find(m => m.id === contextMenu.msgId) : null;
  const isCtxOwn = ctxMsg && uid === ctxMsg.author_id;

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden" onClick={() => { setEmojiPickerFor(null); setContextMenu(null); }}>
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
          <Button variant="ghost" className="lg:hidden text-[#8e9297] hover:text-[#dcddde] hover:bg-[#40444b] p-1 mr-2" onClick={onSidebarOpen}>
            <Menu className="w-5 h-5" />
          </Button>
          <Hash className="w-5 h-5 text-[#8e9297]" />
          <span className="text-white font-semibold">{label}</span>
          <div className="ml-auto flex items-center gap-3">
            {online !== null && (
              <div className="flex items-center gap-1.5 text-xs text-[#3ba55c]">
                <span className="w-2 h-2 rounded-full bg-[#3ba55c] inline-block"></span>
                {online} онлайн
              </div>
            )}
            {"Notification" in window && !notifEnabled && (
              <button onClick={handleEnableNotif} title="Включить уведомления" className="text-[#b9bbbe] hover:text-[#faa81a] transition-colors">
                <Icon name="BellOff" size={16} />
              </button>
            )}
            {"Notification" in window && notifEnabled && (
              <button onClick={() => setNotifEnabled(false)} title="Уведомления включены" className="text-[#3ba55c] hover:text-[#b9bbbe] transition-colors">
                <Icon name="Bell" size={16} />
              </button>
            )}
            <button onClick={() => setShowUsers(v => !v)} title="Пользователи онлайн" className={`transition-colors ${showUsers ? "text-white" : "text-[#b9bbbe] hover:text-white"}`}>
              <Icon name="Users" size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex-1 min-h-0">
          <div ref={scrollContainerRef} className="h-full overflow-y-auto p-3 space-y-1">
            {messages.length === 0 && (
              <div className="text-center text-[#72767d] text-sm py-12">
                Сообщений пока нет. Будь первым!
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = uid === msg.author_id;
              const isHovered = hoveredMsg === msg.id;
              return (
                <div
                  key={msg.id}
                  className="relative flex gap-3 hover:bg-[#32353b] rounded px-2 py-1 -mx-2 group"
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                  onContextMenu={e => handleContextMenu(e, msg)}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer overflow-hidden"
                    style={{ background: msg.avatar_url ? undefined : avatarBg(msg.username) }}
                    onClick={() => setProfileUsername(msg.username)}
                  >
                    {msg.avatar_url
                      ? <img src={msg.avatar_url} alt={msg.username} className="w-full h-full object-cover" />
                      : <span className="text-white text-sm font-semibold">{msg.username[0].toUpperCase()}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span
                        className="text-white font-medium text-sm cursor-pointer hover:underline"
                        onClick={() => setProfileUsername(msg.username)}
                      >
                        {msg.username}
                      </span>
                      {msg.favorite_game && !msg.is_removed && <span className="text-[#5865f2] text-xs">🎮 {msg.favorite_game}</span>}
                      <span className="text-[#72767d] text-xs">{formatTime(msg.created_at)}</span>
                      {msg.edited && !msg.is_removed && <span className="text-[#72767d] text-xs italic">(изменено)</span>}
                    </div>
                    {msg.is_removed ? (
                      <p className="text-[#72767d] text-sm italic">сообщение удалено</p>
                    ) : (
                      <p className="text-[#dcddde] text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {/* Reactions row */}
                    {!msg.is_removed && (msg.reactions || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(msg.reactions || []).map(r => {
                          const iMine = user && r.users.includes(uid!);
                          return (
                            <button
                              key={r.emoji}
                              onClick={e => { e.stopPropagation(); handleReact(msg.id, r.emoji); }}
                              className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                                iMine
                                  ? "bg-[#5865f2]/20 border-[#5865f2]/60 text-white"
                                  : "bg-[#2f3136] border-[#40444b] text-[#dcddde] hover:border-[#5865f2]/50"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[10px] font-medium">{r.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hover action buttons */}
                  {!msg.is_removed && user && isHovered && (
                    <div
                      className="absolute right-2 top-0 -translate-y-1/2 flex items-center gap-1 bg-[#2f3136] border border-[#202225] rounded-lg shadow-lg px-1 py-0.5 z-10"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEmojiPickerFor(v => v === msg.id ? null : msg.id)}
                        className="text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#40444b]"
                        title="Реакция"
                      >
                        <Icon name="Smile" size={14} />
                      </button>
                      <button
                        onClick={() => handleReply(msg.id)}
                        className="text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#40444b]"
                        title="Ответить"
                      >
                        <Icon name="Reply" size={14} />
                      </button>
                      {isOwn && (
                        <>
                          <button
                            onClick={() => handleEdit(msg.id)}
                            className="text-[#b9bbbe] hover:text-white transition-colors p-1 rounded hover:bg-[#40444b]"
                            title="Изменить"
                          >
                            <Icon name="Pencil" size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-[#b9bbbe] hover:text-[#ed4245] transition-colors p-1 rounded hover:bg-[#40444b]"
                            title="Удалить"
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Emoji picker */}
                  {emojiPickerFor === msg.id && (
                    <div
                      className="absolute right-2 top-7 bg-[#2f3136] border border-[#202225] rounded-lg shadow-xl p-2 z-20 flex gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="text-xl hover:scale-125 transition-transform p-0.5 rounded hover:bg-[#40444b]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          {newMsgCount > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-colors"
            >
              ↓ {newMsgCount} {newMsgCount === 1 ? "новое сообщение" : "новых сообщения"}
            </button>
          )}
        </div>

        {/* Reply / Edit bar */}
        {(replyTo || editingMsg) && (
          <div className="mx-3 mb-1 px-3 py-2 bg-[#2f3136] rounded-t-lg border-l-2 border-[#5865f2] flex items-center gap-2">
            <Icon name={editingMsg ? "Pencil" : "Reply"} size={14} className="text-[#5865f2] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[#5865f2] text-xs font-medium">
                {editingMsg ? "Редактирование" : `Ответ для @${replyTo?.username}`}
              </span>
              {replyTo && (
                <p className="text-[#72767d] text-xs truncate">{replyTo.content}</p>
              )}
            </div>
            <button
              onClick={() => { setReplyTo(null); setEditingMsg(null); setInput(""); }}
              className="text-[#72767d] hover:text-white flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 flex-shrink-0 border-t border-[#202225]">
          {user ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={editingMsg ? "Редактировать сообщение..." : `Написать в #${label}...`}
                disabled={sending}
                className="flex-1 bg-[#40444b] text-white placeholder-[#72767d] rounded px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#5865f2] disabled:opacity-60"
              />
              <Button type="submit" disabled={!input.trim() || sending} className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-3 disabled:opacity-40">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between bg-[#40444b] rounded px-3 py-2.5">
              <span className="text-[#72767d] text-sm">Войди, чтобы писать</span>
              <Button size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs" onClick={onRegisterClick}>
                Войти / зарегистрироваться
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Users panel */}
      {showUsers && (
        <div className="w-52 bg-[#2f3136] border-l border-[#202225] flex flex-col flex-shrink-0">
          <div className="h-12 flex items-center justify-between px-3 border-b border-[#202225]">
            <span className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
              Онлайн — {onlineUsers.length}
            </span>
            <button onClick={() => setShowUsers(false)} className="text-[#72767d] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {onlineUsers.length === 0 && (
              <p className="text-[#72767d] text-xs text-center mt-4">Никого нет онлайн</p>
            )}
            {onlineUsers.map((u) => (
              <div
                key={u.username}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#36393f] rounded mx-1 cursor-pointer"
                onClick={() => setProfileUsername(u.username)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: avatarBg(u.username) }}
                >
                  <span className="text-white text-xs font-semibold">{u.username[0].toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{u.username}</div>
                  {u.favorite_game && (
                    <div className="text-[#72767d] text-xs truncate">🎮 {u.favorite_game}</div>
                  )}
                </div>
                <span className="w-2 h-2 rounded-full bg-[#3ba55c] flex-shrink-0 ml-auto"></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#18191c] border border-[#202225] rounded-lg shadow-2xl py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => handleCopy(contextMenu.msgId)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#dcddde] hover:bg-[#5865f2] hover:text-white text-sm transition-colors"
          >
            <Icon name="Copy" size={14} />
            Скопировать
          </button>
          {user && (
            <button
              onClick={() => handleReply(contextMenu.msgId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[#dcddde] hover:bg-[#5865f2] hover:text-white text-sm transition-colors"
            >
              <Icon name="Reply" size={14} />
              Ответить
            </button>
          )}
          {isCtxOwn && (
            <button
              onClick={() => handleEdit(contextMenu.msgId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[#dcddde] hover:bg-[#5865f2] hover:text-white text-sm transition-colors"
            >
              <Icon name="Pencil" size={14} />
              Изменить
            </button>
          )}
          {isCtxOwn && (
            <>
              <div className="border-t border-[#202225] my-1" />
              <button
                onClick={() => handleDelete(contextMenu.msgId)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[#ed4245] hover:bg-[#ed4245] hover:text-white text-sm transition-colors"
              >
                <Icon name="Trash2" size={14} />
                Удалить
              </button>
            </>
          )}
        </div>
      )}

      {/* Profile modal */}
      {profileUsername && (
        <ProfileModal
          username={profileUsername}
          onClose={() => setProfileUsername(null)}
          token={token}
          currentUserId={uid}
        />
      )}
    </div>
  );
};

export default ChatArea;
