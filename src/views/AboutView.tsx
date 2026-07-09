import { Compass, Sparkles, Volume2, ShieldCheck, Heart, Coffee } from "lucide-react";
import { CinemaSettings } from "../types";

interface AboutViewProps {
  settings: CinemaSettings;
}

export default function AboutView({ settings }: AboutViewProps) {
  return (
    <div id="about-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          About JFC Cineplex
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Luxury cinema engineering situated right inside Jacaranda Family Club DHA Phase II, Islamabad.
        </p>
      </div>

      {/* Grid of brand history & story */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Editorial Narrative */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-1.5 text-gold-500">
            <Compass className="w-4 h-4 text-gold-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold-500">
              A Legacy Of Premium Entertainment
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white leading-tight">
            Crafting Unforgettable Cinema Escapes in Islamabad
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {settings.aboutHistory}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every screen is engineered with uncompressed multi-channel spatial audio, digital laser projectors, and premium theater layouts to satisfy avid movie-goers and casual family gatherings alike.
          </p>
        </div>

        {/* Brand graphics spot */}
        <div className="lg:col-span-2 aspect-video lg:aspect-square bg-cinema-card/55 border border-white/5 rounded-lg p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-lg">
          <div className="w-12 h-12 rounded-sm bg-gold-500/10 text-gold-500 border border-gold-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Our Gated Mission</h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed italic">
            "{settings.aboutMission}"
          </p>
        </div>
      </div>

      {/* Bento grid of premium qualities */}
      <div className="border-t border-white/5 pt-10 flex flex-col gap-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-1">
            Cinematic Standards
          </span>
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
            World-class Auditorium Amenities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <Heart className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Premium VIP Recliners</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cozy leather seating recliners equipped with electronic footrests and cozy fleece blankets, providing business-class relaxation.
              </p>
            </div>
          </div>

          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <Volume2 className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Dolby Atmos Acoustics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Surround sound engineered with active spatial orientation, allowing sounds to float seamlessly to immerse you entirely.
              </p>
            </div>
          </div>

          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <ShieldCheck className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Gated Security Protection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Located within JFC, visitors enjoy secure entry checkpoints, premium family environment, and zero public disturbance.
              </p>
            </div>
          </div>

          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <Compass className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Free Spacious Parking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiple levels of clean basement vehicle slots with 24/7 security guarding, letting you park securely and free of charge.
              </p>
            </div>
          </div>

          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <Sparkles className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">IMAX Laser Projection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dual laser projection systems delivering pristine clarity and unmatched contrast ratios on massive screen formats.
              </p>
            </div>
          </div>

          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex gap-4 hover:border-gold-500/25 transition-all">
            <Coffee className="w-6 h-6 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1.5">Concessions & Beverages</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Freshly popped butter popcorn, premium cheese nachos, loaded cheeseburgers, and cold fountain beverages.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
