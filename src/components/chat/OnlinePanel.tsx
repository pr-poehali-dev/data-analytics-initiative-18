import { X } from "lucide-react";
import { OnlineUser, avatarBg } from "@/components/chat/chatTypes";

interface Props {
  onlineUsers: OnlineUser[];
  onClose: () => void;
  onProfileClick: (username: string) => void;
}

export default function OnlinePanel({ onlineUsers, onClose, onProfileClick }: Props) {
  return (
    <div className="w-52 bg-[#2f3136] border-l border-[#202225] flex flex-col flex-shrink-0">
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#202225]">
        <span className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
          Онлайн — {onlineUsers.length}
        </span>
        <button onClick={onClose} className="text-[#72767d] hover:text-white">
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
            onClick={() => onProfileClick(u.username)}
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
  );
}
