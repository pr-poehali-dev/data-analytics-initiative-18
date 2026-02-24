import { useState } from "react";
import { Gamepad2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onRegisterClick: () => void;
}

const Navbar = ({ onRegisterClick }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[#2f3136] border-b border-[#202225] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#5865f2] rounded-full flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Frikords</h1>
            <p className="text-xs text-[#b9bbbe] hidden sm:block">Соцсеть для настоящих геймеров</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <Button variant="ghost" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]">
            Войти
          </Button>
          <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded text-sm font-medium" onClick={onRegisterClick}>
            Регистрация
          </Button>
        </div>
        <Button
          variant="ghost"
          className="sm:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden mt-4 pt-4 border-t border-[#202225]">
          <div className="flex flex-col gap-3">
            <Button variant="ghost" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] justify-start">
              Войти
            </Button>
            <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-2 rounded text-sm font-medium" onClick={onRegisterClick}>
              Регистрация
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
