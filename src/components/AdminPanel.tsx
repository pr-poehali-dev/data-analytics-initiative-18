import { useState, useEffect } from "react";
import { X, AlertTriangle, Users, BarChart2, Ban, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface AdminPanelProps {
  token: string;
  onClose: () => void;
}

type Tab = "stats" | "users" | "logs";

const AdminPanel = ({ token, onClose }: AdminPanelProps) => {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (tab === "stats") loadStats();
    else if (tab === "users") loadUsers();
    else if (tab === "logs") loadLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadStats = async () => {
    setLoading(true);
    const data = await api.admin.stats(token);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  };

  const loadUsers = async (q = "") => {
    setLoading(true);
    const data = await api.admin.users(token, q);
    if (data.users) setUsers(data.users);
    setLoading(false);
  };

  const loadLogs = async () => {
    setLoading(true);
    const data = await api.admin.logs(token, 100);
    if (data.logs) setLogs(data.logs);
    setLoading(false);
  };

  const handleBan = async (userId: number, ban: boolean) => {
    const data = await api.admin.ban(token, userId, ban);
    if (data.ok) {
      setMsg(ban ? "Пользователь заблокирован" : "Пользователь разблокирован");
      loadUsers(search);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const LEVEL_COLOR: Record<string, string> = {
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-[#b9bbbe]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#2f3136] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-[#202225]">
        <div className="flex items-center justify-between p-4 border-b border-[#202225] flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Админ-панель</h2>
          <Button variant="ghost" size="sm" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-1" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex border-b border-[#202225] flex-shrink-0">
          {([["stats", BarChart2, "Статистика"], ["users", Users, "Пользователи"], ["logs", AlertTriangle, "Логи"]] as const).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${tab === t ? "text-white border-b-2 border-[#5865f2]" : "text-[#8e9297] hover:text-white"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="mx-4 mt-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded px-3 py-2 flex-shrink-0">{msg}</div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-[#72767d] text-sm text-center py-8">Загрузка...</div>}

          {/* STATS */}
          {!loading && tab === "stats" && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ["Пользователей", stats.total_users],
                ["Заблокировано", stats.banned_users],
                ["Сообщений", stats.total_messages],
                ["Комнат", stats.total_rooms],
                ["Ошибок за 24ч", stats.errors_24h],
                ["Новых за 24ч", stats.new_users_24h],
                ["Сообщений 24ч", stats.messages_24h],
              ].map(([label, val]) => (
                <div key={label as string} className="bg-[#36393f] rounded-lg p-3">
                  <div className="text-[#8e9297] text-xs mb-1">{label as string}</div>
                  <div className="text-white text-2xl font-bold">{val as number}</div>
                </div>
              ))}
            </div>
          )}

          {/* USERS */}
          {!loading && tab === "users" && (
            <div>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#72767d]" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); loadUsers(e.target.value); }}
                    placeholder="Поиск по нику или email..."
                    className="w-full bg-[#40444b] text-white placeholder-[#72767d] rounded px-3 py-2 pl-9 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-[#36393f] rounded px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{u.username}</span>
                        {u.is_admin && <span className="bg-[#faa61a] text-black text-xs px-1 rounded font-bold">ADMIN</span>}
                        {u.is_banned && <span className="bg-red-500/20 text-red-400 text-xs px-1 rounded border border-red-500/30">БАН</span>}
                      </div>
                      <div className="text-[#72767d] text-xs truncate">{u.email}</div>
                    </div>
                    {!u.is_admin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBan(u.id, !u.is_banned)}
                        className={`text-xs ml-2 flex-shrink-0 ${u.is_banned ? "text-green-400 hover:bg-green-500/10" : "text-red-400 hover:bg-red-500/10"}`}
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        {u.is_banned ? "Разбан" : "Бан"}
                      </Button>
                    )}
                  </div>
                ))}
                {users.length === 0 && <div className="text-[#72767d] text-sm text-center py-4">Нет пользователей</div>}
              </div>
            </div>
          )}

          {/* LOGS */}
          {!loading && tab === "logs" && (
            <div className="space-y-1">
              {logs.map(log => (
                <div key={log.id} className="bg-[#36393f] rounded px-3 py-2 text-xs font-mono">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={LEVEL_COLOR[log.level] || "text-[#b9bbbe]"}>[{log.level.toUpperCase()}]</span>
                    <span className="text-[#8e9297]">{log.source}</span>
                    <span className="text-[#72767d] ml-auto">{new Date(log.created_at).toLocaleString("ru-RU")}</span>
                  </div>
                  <div className="text-[#dcddde]">{log.message}</div>
                  {log.ip && <div className="text-[#72767d]">IP: {log.ip}</div>}
                </div>
              ))}
              {logs.length === 0 && <div className="text-[#72767d] text-sm text-center py-4">Логов нет</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;