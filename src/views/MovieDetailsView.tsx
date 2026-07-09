import { useState } from "react";
import { Play, Ticket, Clock, Star, Volume2, Calendar, ShieldAlert, ArrowLeft, Film } from "lucide-react";
import { Movie, Showtime } from "../types";

interface MovieDetailsViewProps {
  movie: Movie;
  showtimes: Showtime[];
  onBack: () => void;
  onBookNow: (movie: Movie) => void;
}

export default function MovieDetailsView({ movie, showtimes, onBack, onBookNow }: MovieDetailsViewProps) {
  // Movie specific showtimes
  const activeShowtimes = showtimes.filter(s => s.movieId === movie.id);

  // Group showtimes by Date
  const uniqueDates = Array.from(new Set(activeShowtimes.map(s => s.date))).sort();

  const [selectedDate, setSelectedDate] = useState<string>(uniqueDates[0] || "");
  const filteredShowtimes = activeShowtimes.filter(s => s.date === selectedDate);

  // Video trailer simulation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  return (
    <div id="movie-details-view" className="pb-20 animate-fade-in font-sans">
      
      {/* 1. Backdrop majestic banner section */}
      <section className="relative w-full h-[40vh] sm:h-[55vh] bg-black overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0">
          <img
            src={movie.banner || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover opacity-35 scale-101"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/80 via-transparent to-transparent" />
        </div>

        {/* Back navigation */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-black/60 hover:bg-black text-slate-300 hover:text-white border border-white/5 cursor-pointer backdrop-blur transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8 sm:pb-12 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            {/* Poster thumbnail overlap */}
            <div className="w-32 sm:w-44 shrink-0 rounded-sm overflow-hidden border border-white/10 bg-cinema-black shadow-2xl hidden sm:block">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover rounded-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Quick Title header info */}
            <div className="flex-grow flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                {movie.isComingSoon ? (
                  <span className="bg-amber-500 text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                    COMING SOON
                  </span>
                ) : (
                  <span className="bg-gold-600 text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                    NOW PLAYING
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                  {movie.genre.join(" • ")}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">•</span>
                <span className="text-slate-400 font-mono text-[10px] font-bold tracking-wider">
                  {movie.runtime} MINUTES
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold uppercase tracking-wider text-white leading-none">
                {movie.title}
              </h2>

              <div className="flex gap-4 items-center mt-1 text-xs">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span className="text-white font-bold">{movie.imdbRating.toFixed(1)}</span>
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">IMDb Rating</span>
                </div>
                <div className="text-slate-500">•</div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-300 font-mono bg-white/5 border border-white/5 px-1.5 py-0.5 rounded-xs text-[9px] font-bold">
                    {movie.ageRating}
                  </span>
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Classification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main content section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Synopsis, Video, Cast (Left side) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Synopsis */}
          <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Movie Storyline
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {/* Cast & Director */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-cinema-card/55 border border-white/5 p-5 rounded-lg shrink-0">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Directed By
              </span>
              <span className="text-sm text-white font-bold uppercase tracking-wider">
                {movie.director}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Starring Cast
              </span>
              <span className="text-xs text-slate-300 font-medium leading-relaxed block uppercase tracking-wide">
                {movie.cast.join(", ")}
              </span>
            </div>
          </div>

          {/* Simulated HD video trailer */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Film className="w-4 h-4 text-gold-500" />
              Official Cinematic Trailer
            </h3>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-white/5 group flex items-center justify-center shadow-lg">
              {/* Simulated Poster placeholder */}
              <img
                src={movie.banner || movie.poster}
                alt={movie.title}
                className={`absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500 ${
                  isPlaying ? "opacity-20 pointer-events-none" : ""
                }`}
                referrerPolicy="no-referrer"
              />

              {isPlaying ? (
                /* Simulated Active Video Loop Visuals */
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-2">
                  <div className="w-16 h-16 rounded-full border-4 border-gold-500 border-t-transparent animate-spin mb-2" />
                  <p className="text-[10px] text-gold-500 font-mono tracking-widest uppercase font-bold">
                    Streaming HD Conversion...
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Audio Sync OK • 1080p Atmos Stream
                  </p>
                </div>
              ) : (
                /* Center Play Icon trigger */
                <button
                  onClick={handleTogglePlay}
                  className="w-14 h-14 rounded-full bg-gold-600 text-black hover:bg-gold-500 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center cursor-pointer z-10"
                >
                  <Play className="w-5 h-5 text-black fill-black ml-1 stroke-[2.5]" />
                </button>
              )}

              {/* Bottom Custom Video player controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/0 p-4 pt-10 flex flex-col gap-3 opacity-90">
                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1 overflow-hidden relative cursor-pointer">
                  <div
                    style={{ width: isPlaying ? "65%" : "35%" }}
                    className="bg-gold-500 h-full absolute left-0 top-0 transition-all duration-1000"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-300">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleTogglePlay}
                      className="text-white hover:text-gold-500 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {isPlaying ? "PAUSE" : "PLAY"}
                    </button>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                      {isPlaying ? "01:42" : "00:35"} / 02:45
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleMute}
                      className="text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Volume2 className={`w-4 h-4 ${isMuted ? "text-red-400 line-through" : ""}`} />
                    </button>
                    <span className="font-mono text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                      ATMOS 12.2 CH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Column 3: Active Showtimes scheduler & booking ticket button (Right side) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-6 flex flex-col gap-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Instant Reserve Seats
            </h3>

            {movie.isComingSoon ? (
              <div className="p-4 bg-[#0a0a0c]/80 border border-white/5 rounded-lg text-center flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-slate-500 mb-1" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Releasing soon</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed uppercase tracking-wide">
                  No active screenings scheduled yet. Watch the trailer above or enable "Alert Me" notifications on the catalog page.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Dates chips */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Choose Screening Date
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {uniqueDates.map((dStr) => {
                      const d = new Date(dStr);
                      const isSelected = selectedDate === dStr;
                      const dayLabel = d.toLocaleDateString("en", { day: "numeric" });
                      const monthLabel = d.toLocaleDateString("en", { month: "short" });

                      return (
                        <button
                          key={dStr}
                          onClick={() => setSelectedDate(dStr)}
                          className={`px-3 py-1.5 rounded-xs border border-white/5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gold-600 text-black border-gold-600"
                              : "bg-black text-slate-400 hover:text-white"
                          }`}
                        >
                          {dayLabel} {monthLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Showtimes slots list */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Available Screening Times
                  </span>

                  {filteredShowtimes.map((st) => {
                    const left = st.seatsTotal - st.seatsBooked.length;
                    const isSoldOut = left <= 0;

                    return (
                      <div
                        key={st.id}
                        onClick={() => !isSoldOut && onBookNow(movie)}
                        className={`p-3 border rounded-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSoldOut
                            ? "bg-cinema-gray/10 border-white/5 opacity-40 cursor-not-allowed"
                            : "bg-black border-white/5 hover:border-gold-500/40 hover:bg-cinema-gray/10"
                        }`}
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-gold-500 block uppercase tracking-wider">
                            {st.time}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-1 uppercase tracking-wider font-bold">
                            {st.hall} • <b className="text-slate-400">{st.format}</b>
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-300 block">{formatRs(st.price)}</span>
                          {isSoldOut ? (
                            <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">SOLD OUT</span>
                          ) : (
                            <span className="text-[9px] text-emerald-500 font-bold block mt-1 uppercase tracking-wider">{left} seats left</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredShowtimes.length === 0 && (
                    <div className="py-6 text-center text-slate-500 text-xs uppercase tracking-wide">
                      No times scheduled for this selected date. Choose another day from the list.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onBookNow(movie)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-xs uppercase tracking-widest bg-gold-600 hover:bg-gold-500 text-black shadow-lg shadow-gold-600/10 transition-all cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-black stroke-[2.5]" />
                  Launch Seating Wizard
                </button>

              </div>
            )}
          </div>

          {/* Terms info */}
          <div className="bg-cinema-card/25 border border-white/5 p-4 rounded-lg flex gap-2.5 items-start text-[10px] text-slate-500 leading-relaxed uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p>
              By clicking "Launch Seating Wizard", you accept our gated club ticket admission rules. Tickets are refundable up to 2 hours before the screen starts. Gated Entry coordinates will be provided inside the PDF confirmation.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}
