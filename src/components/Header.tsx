import { useState, useEffect } from "react";
import { Film, Menu, X, Ticket } from "lucide-react";

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onStartBooking: () => void;
}

export default function Header({ currentView, onNavigate, onStartBooking }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "movies", label: "Movies" },
    { id: "showtimes", label: "Showtimes" },
    { id: "coming-soon", label: "Coming Soon" },
    { id: "promotions", label: "Promotions" },
    { id: "food", label: "Food & Drinks" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-cinema-black/90 backdrop-blur-md border-b border-cinema-gray shadow-lg py-3"
          : "bg-gradient-to-b from-cinema-black/80 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          id="logo-container"
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => handleNavClick("home")}
        >
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter leading-none text-gold-500">JFC</span>
            <span className="text-[9px] tracking-[0.3em] font-light uppercase text-white/70">Cineplex</span>
          </div>
          <div className="hidden md:block h-6 w-px bg-white/10"></div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-[9px] uppercase tracking-tight text-white/50">Islamabad, Pakistan</span>
            <span className="text-[11px] font-bold text-white/90">DHA Phase II</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden lg:flex items-center gap-2 xl:gap-4">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 relative cursor-pointer ${
                  isActive
                    ? "text-gold-500"
                    : "text-white/60 hover:text-gold-400"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-[-4px] left-3 right-3 h-0.5 bg-gold-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* CTAs */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            id="cta-book-tickets"
            onClick={onStartBooking}
            className="px-5 py-2 bg-gold-600 hover:bg-gold-500 text-black text-xs font-bold uppercase tracking-widest transition-all rounded-sm active:scale-95 cursor-pointer shadow-md shadow-gold-600/10"
          >
            Book Tickets
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            id="mobile-menu-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-cinema-gray text-slate-200 hover:text-white hover:bg-cinema-gray/80 transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-drawer"
        className={`fixed inset-y-0 right-0 w-72 bg-cinema-black border-l border-cinema-gray shadow-2xl z-50 p-6 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="font-display font-bold text-lg text-white">Navigation Menu</span>
          <button
            id="close-mobile-menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg bg-cinema-gray text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav id="mobile-nav" className="flex flex-col gap-2 mb-8">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? "text-gold-500 bg-cinema-gray"
                    : "text-slate-300 hover:text-white hover:bg-cinema-gray/50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 pt-6 border-t border-cinema-gray">
          <button
            id="mobile-cta-book-tickets"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onStartBooking();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold bg-gradient-to-r from-gold-500 to-amber-500 text-cinema-black shadow-lg shadow-gold-500/10 cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-cinema-black" />
            Book Tickets
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          id="mobile-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
    </header>
  );
}
