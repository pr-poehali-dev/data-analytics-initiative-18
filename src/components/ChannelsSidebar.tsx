import { ArrowRight, Hash, Mic, Settings, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/hooks/useAuth";

const CHANNELS = [
  { id: "general", label: "общий" },
  { id: "meet", label: "знакомства" },
  { id: "memes", label: "мемы" },
  { id: "teammates", label: "поиск-тиммейтов" },
];

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

interface ChannelsSidebarProps {
  mobileSidebarOpen: boolean;
  onClose: () => void;
  activeChannel: string;
  onChannelChange: (channel: string) => void;
  user: User | null;
  onLogout: () => void;
}

const ChannelsSidebar = ({ mobileSidebarOpen, onClose, activeChannel, onChannelChange, user, onLogout }: ChannelsSidebarProps) => {
  return (
    <div className={`${mobileSidebarOpen ? "flex" : "hidden"} lg:flex w-full lg:w-60 bg-[#2f3136] flex-col`}>
      <div className="p-4 border-b border-[#202225] flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Frikords</h2>
        <Button
          variant="ghost"
          className="lg:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-1"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 p-2">
        <div className="mb-4">
          <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
            <ArrowRight className="w-3 h-3" />
            <span>Каналы</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {CHANNELS.map((ch) => (
              <div
                key={ch.id}
                onClick={() => { onChannelChange(ch.id); onClose(); }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                  activeChannel === ch.id
                    ? "bg-[#393c43] text-[#dcddde]"
                    : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="text-sm">{ch.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
            <ArrowRight className="w-3 h-3" />
            <span>Голосовые</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {["Общий лобби", "Ranked Squad"].map((ch) => (
              <div
                key={ch}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span className="text-sm">{ch}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Профиль пользователя */}
      <div className="p-2 bg-[#292b2f] flex items-center gap-2">
        {user ? (
          <>
            <div className={`w-8 h-8 bg-gradient-to-r ${getAvatarColor(user.username)} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm font-medium">{user.username[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.username}</div>
              {user.favorite_game && (
                <div className="text-[#b9bbbe] text-xs truncate">🎮 {user.favorite_game}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-[#40444b]"
              onClick={onLogout}
              title="Выйти"
            >
              <LogOut className="w-4 h-4 text-[#b9bbbe]" />
            </Button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-[#40444b] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#8e9297] text-sm">?</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#8e9297] text-sm truncate">Гость</div>
            </div>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-[#40444b]">
              <Settings className="w-4 h-4 text-[#b9bbbe]" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChannelsSidebar;
