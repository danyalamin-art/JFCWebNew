import React, { useState } from "react";
import { Film, Calendar, Bell, Play, Mail, Check } from "lucide-react";
import { Movie } from "../types";

interface ComingSoonViewProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export default function ComingSoonView({ movies, onSelectMovie }: ComingSoonViewProps) {
  const comingSoonMovies = movies.filter(m => m.isComingSoon);

  // Notifications signup state
  const [notifiedMovieId, setNotifiedMovieId] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifiedEmailValue, setNotifiedEmailValue] = useState<string | null>(null);

  const handleNotifySubmit = (e: React.FormEvent, movieId: string) => {
    e.preventDefault();
    if (notifyEmail.trim()) {
      setNotifiedMovieId(movieId);
      setNotifiedEmailValue(notifyEmail);
      setNotifyEmail("");
      // Clear notification success after 5s
      setTimeout(() => {
        setNotifiedMovieId(null);
        setNotifiedEmailValue(null);
      }, 5000);
    }
  };

  return (
    <div id="coming-soon-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Coming Soon Blockbusters
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Get a sneak peek at the massive releases heading to JFC Cineplex, Islamabad. Subscribe to receive launch day alerts!
        </p>
      </div>

      {/* Grid of Coming soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {comingSoonMovies.map((movie) => (
          <div
            key={movie.id}
            className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row gap-6 hover:border-gold-500/25 transition-all"
          >
            {/* Poster cover */}
            <div className="sm:w-44 shrink-0 relative overflow-hidden rounded-sm">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-64 object-cover rounded-sm"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black/80 text-[9px] font-mono font-bold text-gold-500 px-2.5 py-0.5 rounded-xs border border-white/5">
                Coming Soon
              </div>
            </div>

            {/* Content Details */}
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-1">
                  Expected Releasing Date
                </span>
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider mb-3">
                  <Calendar className="w-3.5 h-3.5 text-gold-500" />
                  {new Date(movie.releaseDate).toLocaleDateString("en-US", { dateStyle: "long" })}
                </div>

                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white leading-tight">
                  {movie.title}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mt-2">
                  {movie.synopsis}
                </p>

                <p className="text-[11px] text-slate-500 font-medium font-sans mt-3">
                  <b>Starring:</b> {movie.cast.join(", ")}
                </p>
              </div>

              {/* Subscriptions Alert & Trailer pop CTA */}
              <div className="border-t border-white/5 pt-4 mt-5 flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="flex-grow flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-slate-300 fill-slate-300 ml-0.5" />
                    Watch Teaser
                  </button>
                </div>

                {/* Notify form */}
                {notifiedMovieId === movie.id ? (
                  <div className="p-2 bg-gold-500/10 border border-gold-500/20 rounded-sm text-[10px] font-bold uppercase tracking-wide text-gold-400 flex items-center gap-1.5 justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Alert set for {notifiedEmailValue}! We'll ping you.</span>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleNotifySubmit(e, movie.id)} className="flex gap-2">
                    <div className="relative flex-grow font-sans">
                      <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="NOTIFY ME AT (EMAIL)"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        className="w-full bg-[#0c0c0f] border border-white/5 rounded-xs px-3 py-2 pl-8 text-[10px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xs bg-gold-600 hover:bg-gold-500 text-black font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Bell className="w-3 h-3 text-black" />
                      Alert Me
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}

        {comingSoonMovies.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-lg bg-cinema-card/20 col-span-2">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">No Coming Soon Movies</h4>
            <p className="text-xs text-cinema-text-muted uppercase tracking-wide">
              Check back later for newly registered upcoming teasers.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
