import { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  Hash,
  Users,
  Bell,
  Search,
  Menu,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/hooks/useAuth";

const MESSAGES_URL = "https://functions.poehali.dev/b1a16ec3-c9d7-4e46-bb90-e30137e5c534";

interface Message {
  id: number;
  content: string;
  created_at: string;
  username: string;
  favorite_game: string;
}

interface ChatAreaProps {
  onSidebarOpen: () => void;
  onRegisterClick: () => void;
  user: User | null;
  token: string | null;
  channel: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  general: "общий",
  meet: "знакомства",
  memes: "мемы",
  teammates: "поиск-тиммейтов",
};

const CHANNEL_DESC: Record<string, string> = {
  general: "Общайся, играй, дружи",
  meet: "Найди новых друзей",
  memes: "Лучшие игровые мемы",
  teammates: "Ищи тиммейтов для игр",
};

function getAvatarColor(username: string) {
  const colors = [
    "from-purple-500 to-pink-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-red-500",
    "from-cyan-500 to-blue-500",
    "from-yellow-500 to-orange-500",
    "from-[#5865f2] to-[#7c3aed]",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const ChatArea = ({ onSidebarOpen, onRegisterClick, user, token, channel }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`${MESSAGES_URL}?channel=${channel}`);
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    setSending(true);
    const content = input.trim();
    setInput("");

    const res = await fetch(MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, channel }),
    });

    const data = await res.json();
    setSending(false);

    if (data.success && data.message) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const channelLabel = CHANNEL_LABELS[channel] || channel;
  const channelDesc = CHANNEL_DESC[channel] || "";

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок */}
      <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          className="lg:hidden text-[#8e9297] hover:text-[#dcddde] hover:bg-[#40444b] p-1 mr-2"
          onClick={onSidebarOpen}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Hash className="w-5 h-5 text-[#8e9297]" />
        <span className="text-white font-semibold">{channelLabel}</span>
        <div className="w-px h-6 bg-[#40444b] mx-2 hidden sm:block"></div>
        <span className="text-[#8e9297] text-sm hidden sm:block">{channelDesc}</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
        {/* Приветствие бота */}
        <div className="flex gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#5865f2] rounded-full flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-medium text-sm sm:text-base">Frikords Бот</span>
              <span className="bg-[#5865f2] text-white text-xs px-1 rounded">БОТ</span>
            </div>
            <div className="bg-[#2f3136] border-l-4 border-[#5865f2] p-3 rounded text-sm text-[#b9bbbe]">
              Добро пожаловать в <strong className="text-white">#{channelLabel}</strong>! Общайся, играй, дружи 🎮
            </div>
          </div>
        </div>

        {/* Реальные сообщения */}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 sm:gap-4 group">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${getAvatarColor(msg.username)} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs sm:text-sm font-medium">{msg.username[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-white font-medium text-sm sm:text-base">{msg.username}</span>
                {msg.favorite_game && (
                  <span className="text-[#72767d] text-xs hidden sm:inline">🎮 {msg.favorite_game}</span>
                )}
                <span className="text-[#72767d] text-xs">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-[#dcddde] text-sm sm:text-base break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center text-[#72767d] text-sm py-8">
            Пока нет сообщений. Будь первым! 🎮
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-2 sm:p-4 flex-shrink-0">
        {user ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Написать в #${channelLabel}...`}
              disabled={sending}
              className="flex-1 bg-[#40444b] border-none text-white placeholder-[#72767d] rounded-lg px-4 py-3 text-sm outline-none disabled:opacity-60"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 rounded-lg disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="bg-[#40444b] rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-[#72767d] text-sm">Войди, чтобы писать сообщения</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#5865f2] hover:bg-[#5865f2]/10 text-xs"
                onClick={onRegisterClick}
              >
                Регистрация
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
