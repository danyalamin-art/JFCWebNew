import React, { useState } from "react";
import { Film, Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter, Youtube, Info, Shield } from "lucide-react";
import { CinemaSettings } from "../types";

interface FooterProps {
  settings: CinemaSettings;
  onNavigate: (view: string) => void;
}

export default function Footer({ settings, onNavigate }: FooterProps) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [footerMessage, setFooterMessage] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  const handleLinkClick = (view: string) => {
    onNavigate(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showFooterPolicy = (message: string) => {
    setFooterMessage(message);
    setTimeout(() => {
      setFooterMessage(null);
    }, 4500);
  };

  return (
    <footer id="main-footer" className="bg-[#050505] border-t border-white/5 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xs bg-gold-600 flex items-center justify-center">
                <Film className="w-5 h-5 text-black stroke-[2.2]" />
              </div>
              <span className="font-bold uppercase tracking-widest text-sm text-white">
                JFC <span className="text-gold-500">Cineplex</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience movie-going re-imagined. Featuring world-class IMAX projection, advanced Dolby Atmos acoustics, and luxurious gold-class reclining recliners right inside the Jacaranda Family Club in Islamabad.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-2">
              <a
                href={settings.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xs bg-white/5 hover:bg-gold-500 hover:text-black text-slate-400 flex items-center justify-center transition-all duration-300 border border-white/5"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xs bg-white/5 hover:bg-gold-500 hover:text-black text-slate-400 flex items-center justify-center transition-all duration-300 border border-white/5"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xs bg-white/5 hover:bg-gold-500 hover:text-black text-slate-400 flex items-center justify-center transition-all duration-300 border border-white/5"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={settings.socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xs bg-white/5 hover:bg-gold-500 hover:text-black text-slate-400 flex items-center justify-center transition-all duration-300 border border-white/5"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Quick Navigation
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => handleLinkClick("home")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Home Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick("movies")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Now Showing Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick("showtimes")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Showtimes & Schedules
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick("coming-soon")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Coming Soon Teasers
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick("promotions")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Deals & Promotions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick("food")}
                  className="hover:text-gold-500 transition-colors text-left cursor-pointer uppercase tracking-wider"
                >
                  Snack Menu & Pre-Orders
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Contact Us
            </h3>
            <ul className="flex flex-col gap-4 text-xs text-slate-400">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {settings.address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-gold-500 transition-colors font-mono">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-500 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-gold-500 transition-colors">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Stay in the Loop
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Subscribe to get notified about upcoming blockbusters, exclusive promotions, ticket pre-sales, and special events.
            </p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0c0c0f] text-white placeholder-slate-600 text-xs px-4 py-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 transition-all pr-12 uppercase tracking-wider"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 w-9 h-9 rounded-sm bg-gold-600 hover:bg-gold-500 text-black flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </form>
            {isSubscribed && (
              <p className="text-[10px] font-bold uppercase text-gold-500 mt-2 animate-pulse">
                ✓ Successfully subscribed.
              </p>
            )}
          </div>

        </div>

        {/* Floating/Inline Policy notification banner inside footer to avoid alerts */}
        {footerMessage && (
          <div className="bg-cinema-card border border-gold-500/20 p-3 rounded-sm mb-6 flex items-center gap-2.5 text-xs text-gold-400 animate-fadeIn">
            <Info className="w-4 h-4 text-gold-500 shrink-0" />
            <span>{footerMessage}</span>
          </div>
        )}

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 uppercase tracking-wider">
          <p>© {new Date().getFullYear()} JFC Cineplex Islamabad. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3">
            <button onClick={() => showFooterPolicy("Terms of Service is displayed inside Jacaranda Family Club policies.")} className="hover:text-slate-300 cursor-pointer">Terms of Service</button>
            <button onClick={() => showFooterPolicy("Privacy Policy is governed by DHA Islamabad Club regulations.")} className="hover:text-slate-300 cursor-pointer">Privacy Policy</button>
            <span className="text-slate-600 font-mono">DHA Phase II</span>
            <span className="hidden sm:inline text-white/10 select-none">|</span>
            <button
              id="admin-shield-btn"
              onClick={() => handleLinkClick("admin")}
              title="Admin Control Panel"
              className="fixed bottom-6 right-6 z-40 px-3 py-2 bg-cinema-card/95 backdrop-blur-md hover:bg-cinema-gray border border-white/10 hover:border-gold-500/40 text-slate-400 hover:text-gold-500 shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2 active:scale-95 text-[10px] font-mono font-bold tracking-wider rounded-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
