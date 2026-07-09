import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { DatabaseSchema, Movie, Showtime } from "../types";

interface ShowtimesViewProps {
  db: DatabaseSchema;
  onBookMovie: (movie: Movie) => void;
}

export default function ShowtimesView({ db, onBookMovie }: ShowtimesViewProps) {
  // Extract all showtimes dates
  const showtimes = db.showtimes;
  const uniqueDates = Array.from(new Set(showtimes.map(s => s.date))).sort();

  // Active Date selection
  const [selectedDate, setSelectedDate] = useState<string>(uniqueDates[0] || "");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");

  // Filtering showtimes
  const filteredShowtimes = showtimes.filter((s) => {
    const matchDate = selectedDate ? s.date === selectedDate : true;
    const matchFormat = selectedFormat ? s.format === selectedFormat : true;
    const matchMovie = selectedMovieId ? s.movieId === selectedMovieId : true;
    return matchDate && matchFormat && matchMovie;
  });

  // Group filtered showtimes by Movie
  const groupedByMovie: { [movieId: string]: { movie: Movie; list: Showtime[] } } = {};
  
  filteredShowtimes.forEach((st) => {
    if (!groupedByMovie[st.movieId]) {
      const m = db.movies.find(mv => mv.id === st.movieId);
      if (m) {
        groupedByMovie[st.movieId] = {
          movie: m,
          list: []
        };
      }
    }
    if (groupedByMovie[st.movieId]) {
      groupedByMovie[st.movieId].list.push(st);
    }
  });

  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  return (
    <div id="showtimes-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Showtimes & Schedules
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Plan your cinema escape. View interactive daily screenings and select seating formats at JFC Islamabad.
        </p>
      </div>

      {/* Date Stepper calendar (Next 5 Days) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
          Select Date Card
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {uniqueDates.map((dateStr) => {
            const d = new Date(dateStr);
            const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
            const day = d.toLocaleDateString("en-US", { day: "numeric" });
            const month = d.toLocaleDateString("en-US", { month: "short" });
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`p-3.5 rounded-sm flex flex-col items-center min-w-[85px] border transition-all cursor-pointer uppercase tracking-wider ${
                  isSelected
                    ? "bg-gold-600 text-black border-gold-600 font-bold shadow-md shadow-gold-600/10"
                    : "bg-cinema-card/55 border-white/5 text-slate-400 hover:border-gold-500/30 hover:text-white"
                }`}
              >
                <span className="text-[9px] font-bold opacity-85">{weekday}</span>
                <span className="text-xl font-bold my-0.5">{day}</span>
                <span className="text-[9px]">{month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auxiliary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-cinema-card/55 border border-white/5 rounded-lg p-4 mt-[-10px]">
        <div>
          <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
            Filter by Screening Movie
          </label>
          <select
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
            className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-2.5 px-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider cursor-pointer"
          >
            <option value="">All Screening Movies</option>
            {db.movies.filter(m => !m.isComingSoon).map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
            Format Filter
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-2.5 px-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider cursor-pointer"
          >
            <option value="">All Formats (2D, 3D, IMAX)</option>
            <option value="2D">2D Digital</option>
            <option value="3D">3D Stereoscopic</option>
            <option value="IMAX">IMAX Laser</option>
          </select>
        </div>
      </div>

      {/* Grouped Movies Row List */}
      <div className="flex flex-col gap-6">
        {Object.values(groupedByMovie).map(({ movie, list }) => (
          <div
            key={movie.id}
            className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex flex-col md:flex-row gap-6 hover:border-gold-500/25 transition-all"
          >
            {/* Movie Info Cover Column */}
            <div className="md:w-56 shrink-0 flex gap-4 md:flex-col">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-20 h-28 md:w-full md:h-64 object-cover rounded-sm bg-cinema-gray shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="flex-grow">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white leading-snug">
                  {movie.title}
                </h3>
                <p className="text-[10px] font-mono text-gold-500/90 uppercase tracking-widest block mt-1">
                  {movie.genre.slice(0, 2).join(" • ")}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1.5 font-mono">
                  {movie.runtime} min • {movie.ageRating}
                </p>
              </div>
            </div>

            {/* Timetable screenings Column */}
            <div className="flex-grow flex flex-col gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1.5">
                Active Showtimes For Today
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
                {list.map((st) => {
                  const seatsLeft = st.seatsTotal - st.seatsBooked.length;
                  const pct = (seatsLeft / st.seatsTotal) * 100;
                  const isSoldOut = seatsLeft <= 0;

                  return (
                    <div
                      key={st.id}
                      onClick={() => !isSoldOut && onBookMovie(movie)}
                      className={`p-3.5 rounded-sm border flex flex-col justify-between h-28 cursor-pointer transition-all ${
                        isSoldOut
                          ? "bg-cinema-gray/15 border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-black/45 border-white/5 hover:border-gold-500/30 hover:bg-[#0c0c0e]/80"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1 text-gold-500 font-mono font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          {st.time}
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-gold-500/10 text-gold-500 px-1.5 py-0.5 rounded-xs uppercase border border-gold-500/10">
                          {st.format}
                        </span>
                      </div>

                      <div className="mt-3.5 border-t border-white/5 pt-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-400 font-mono block leading-none">{st.hall}</span>
                          <span className="text-slate-500 font-mono text-[10px] block mt-1">{formatRs(st.price)}</span>
                        </div>
                        <div className="text-right">
                          {isSoldOut ? (
                            <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">SOLD OUT</span>
                          ) : (
                            <>
                              <span className={`font-mono font-bold uppercase tracking-wide text-[10px] ${pct < 20 ? "text-red-500" : pct < 50 ? "text-amber-500" : "text-emerald-500"}`}>
                                {seatsLeft} Left
                              </span>
                              <span className="text-gold-500 font-bold block text-[9px] mt-0.5 uppercase tracking-widest">Book seats</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {Object.keys(groupedByMovie).length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-lg bg-cinema-card/20">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">No schedules scheduled for this date</h4>
            <p className="text-xs text-cinema-text-muted uppercase tracking-wide">
              Select another calendar chip or reset format filters.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
