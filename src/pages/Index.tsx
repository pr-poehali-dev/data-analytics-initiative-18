import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChannelsSidebar from "@/components/ChannelsSidebar";
import ChatArea from "@/components/ChatArea";
import RegisterModal from "@/components/RegisterModal";

const Index = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#36393f] text-white overflow-x-hidden">

      {showRegModal && (
        <RegisterModal onClose={() => setShowRegModal(false)} />
      )}

      <Navbar onRegisterClick={() => setShowRegModal(true)} />

      <div className="flex min-h-screen">
        {/* Боковая панель серверов */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2">
          <div className="w-12 h-12 bg-[#5865f2] rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>
          {["🎮", "🏆", "⚔️", "🔥"].map((emoji, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-[#5865f2] text-lg"
            >
              {emoji}
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          <ChannelsSidebar
            mobileSidebarOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <ChatArea
            onSidebarOpen={() => setMobileSidebarOpen(true)}
            onRegisterClick={() => setShowRegModal(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
