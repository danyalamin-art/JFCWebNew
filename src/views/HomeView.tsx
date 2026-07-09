import React, { useState, useEffect } from "react";
import { Play, Ticket, Sparkles, Star, ChevronRight, ChevronLeft, Volume2, ShieldCheck, Heart, Coffee, Compass, HelpCircle, MapPin, Phone, Mail, Clock } from "lucide-react";
import { DatabaseSchema, Movie, Showtime, SnackItem, Promotion, Testimonial, FAQ } from "../types";
import MovieCard from "../components/MovieCard";

interface HomeViewProps {
  db: DatabaseSchema;
  onNavigate: (view: string) => void;
  onSelectMovie: (movie: Movie) => void;
  onBookMovie: (movie: Movie) => void;
}

export default function HomeView({ db, onNavigate, onSelectMovie, onBookMovie }: HomeViewProps) {
  // Hero carousel — movies marked Featured in CMS (ordered by featuredOrder)
  const featuredMovies = db.movies
    .filter((m) => m.isFeatured)
    .slice()
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  const activeHero = featuredMovies[heroIdx] || db.movies[0];

  // FAQ Accordion states
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleNextHero = () => {
    setHeroIdx((prev) => (prev + 1) % featuredMovies.length);
  };

  const handlePrevHero = () => {
    setHeroIdx((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  // Helper currency formatter
  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  // Filter Today's Showtimes
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysShowtimes = db.showtimes.filter(s => s.date === todayStr).slice(0, 6);

  return (
    <div id="home-view" className="flex flex-col gap-16 pb-20">
      
      {/* SECTION 1: HERO MOVIE SLIDER */}
      {activeHero && (
        <section id="hero-slider" className="relative w-full h-[65vh] sm:h-[80vh] bg-black overflow-hidden flex items-end">
          {/* Banner backdrop with OLED darken mask */}
          <div className="absolute inset-0 z-0">
            <img
              src={activeHero.banner}
              alt={activeHero.title}
              className="w-full h-full object-cover opacity-45 scale-[1.02] transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-black via-cinema-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-black/80 via-transparent to-transparent hidden md:block" />
          </div>

          {/* Carousel Slider Controls */}
          {featuredMovies.length > 1 && (
            <div className="absolute right-6 bottom-10 z-20 flex gap-2">
              <button
                onClick={handlePrevHero}
                className="p-3 rounded-full bg-cinema-card/70 border border-slate-700 hover:border-gold-500 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextHero}
                className="p-3 rounded-full bg-cinema-card/70 border border-slate-700 hover:border-gold-500 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Hero Content layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10 sm:pb-20 relative z-10">
            <div className="max-w-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-tighter">
                  Featured Spotlight
                </span>
                <span className="text-slate-300 text-xs font-mono font-semibold">
                  IMDB {activeHero.imdbRating.toFixed(1)}/10
                </span>
              </div>

              <h2 className="font-display font-black italic tracking-tighter uppercase text-3xl sm:text-5xl lg:text-6.5xl text-white leading-none">
                {activeHero.title}
              </h2>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed line-clamp-3">
                {activeHero.synopsis}
              </p>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <button
                  onClick={() => onBookMovie(activeHero)}
                  className="px-6 py-2.5 bg-gold-600 hover:bg-gold-500 text-black text-xs font-bold uppercase tracking-widest transition-all rounded-xs active:scale-95 cursor-pointer shadow-md shadow-gold-600/10"
                >
                  Book Tickets
                </button>
                <button
                  onClick={() => onSelectMovie(activeHero)}
                  className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest transition-all rounded-xs hover:bg-white/15 active:scale-95 cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: NOW SHOWING */}
      <section id="now-showing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-end justify-between mb-8 border-b border-cinema-gray pb-4">
          <div>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Now Showing Movies
            </h3>
            <p className="text-sm text-cinema-text-muted mt-1">
              Currently playing blockbusters at JFC DHA Islamabad.
            </p>
          </div>
          <button
            onClick={() => onNavigate("movies")}
            className="flex items-center gap-1 text-xs font-semibold text-gold-500 hover:text-gold-400 group cursor-pointer"
          >
            See All Movies
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {db.movies
            .filter((m) => !m.isComingSoon)
            .slice(0, 4)
            .map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onViewDetails={onSelectMovie}
                onBookNow={onBookMovie}
              />
            ))}
        </div>
      </section>

      {/* SECTION 3: QUICK TODAY'S SCHEDULE TIMELINE */}
      <section id="todays-schedule" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans">
        <div className="bg-cinema-card/50 border border-white/5 rounded-lg p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-white/5 pb-5">
            <div>
              <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-1">
                Timeline Scheduler
              </span>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                Today's Showtimes Schedule
              </h3>
            </div>
            <button
              onClick={() => onNavigate("showtimes")}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              Full Calendar View
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysShowtimes.map((sh) => (
              <div
                key={sh.id}
                onClick={() => {
                  const m = db.movies.find(mv => mv.id === sh.movieId);
                  if (m) onBookMovie(m);
                }}
                className="bg-black/45 border border-white/5 hover:border-gold-500/30 p-4 rounded-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-[#0c0c0e]/80 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-sm bg-gold-500/10 text-gold-500 font-mono font-bold text-xs flex flex-col items-center justify-center border border-gold-500/10">
                    {sh.time}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white line-clamp-1">
                      {sh.movieTitle}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {sh.hall} • <span className="text-gold-500 font-bold">{sh.format}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-slate-300 block">{formatRs(sh.price)}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500 mt-1 block">Book Seats</span>
                </div>
              </div>
            ))}
            {todaysShowtimes.length === 0 && (
              <div className="p-6 text-center text-cinema-text-muted text-xs col-span-3">
                No active showtimes currently scheduled for today. Access the CMS dashboard to map movie timetables.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY CHOOSE US (FACILITIES BENTO GRID) */}
      <section id="facilities-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-2">
            The Luxury Benchmark
          </span>
          <h3 className="text-xl font-bold uppercase tracking-wider text-white">
            Why Choose JFC Cineplex?
          </h3>
          <p className="text-xs sm:text-sm text-cinema-text-muted mt-2">
            Engineering premium cinematic encounters inside the Jacaranda Family Club.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-cinema-card/50 border border-white/5 rounded-lg p-6 hover:border-gold-500/25 transition-all duration-300">
            <Volume2 className="w-8 h-8 text-gold-500 mb-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Dolby Atmos Acoustic Surround</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience uncompressed 12-channel spatial audio. High-fidelity acoustic sound panels direct sound precisely around you.
            </p>
          </div>

          <div className="bg-cinema-card/50 border border-white/5 rounded-lg p-6 hover:border-gold-500/25 transition-all duration-300">
            <ShieldCheck className="w-8 h-8 text-gold-500 mb-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Elite Family Atmosphere</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fully gated, secure, club-vetted family atmosphere right inside Jacaranda Family Club, DHA Islamabad. Absolute comfort.
            </p>
          </div>

          <div className="bg-cinema-card/50 border border-white/5 rounded-lg p-6 hover:border-gold-500/25 transition-all duration-300">
            <Heart className="w-8 h-8 text-gold-500 mb-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Cozy Gold Class Recliner</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Electronic fully reclining luxury leather lounges with personal call-service indicators, soft blankets, and leg space comfort.
            </p>
          </div>

          <div className="bg-cinema-card/50 border border-white/5 rounded-lg p-6 hover:border-gold-500/25 transition-all duration-300">
            <Coffee className="w-8 h-8 text-gold-500 mb-4" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Pre-order Concessions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bypass long concessions standby lines. Pre-order freshly popped popcorn, drinks, or loaded nachos Supreme during checkout.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: COMING SOON PREVIEW */}
      <section id="coming-soon-teasers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans">
        <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-white">
              Coming Soon Blockbusters
            </h3>
            <p className="text-sm text-cinema-text-muted mt-1">
              Mark your calendars! Upcoming teasers arriving soon.
            </p>
          </div>
          <button
            onClick={() => onNavigate("coming-soon")}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold-500 hover:text-gold-400 group cursor-pointer"
          >
            Schedules & Trailers
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {db.movies
            .filter((m) => m.isComingSoon)
            .slice(0, 3)
            .map((movie) => (
              <div
                key={movie.id}
                className="group bg-cinema-card/50 rounded-lg overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img
                    src={movie.banner || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 font-mono text-[9px] font-bold text-gold-500 px-2 py-0.5 rounded-xs border border-white/5">
                    Releasing {movie.releaseDate}
                  </div>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-gold-500 transition-colors">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1.5">
                      {movie.synopsis}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="mt-4 w-full py-2 rounded-xs bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-all text-center cursor-pointer"
                  >
                    Watch Trailer & Details
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* SECTION 6: PROMOTIONS BANNER */}
      <section id="promo-teaser" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans">
        <div className="bg-gradient-to-r from-gold-600/90 to-amber-950/95 rounded-lg p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-white/5">
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-xl">
            <span className="bg-black/30 text-gold-400 border border-gold-500/20 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-xs uppercase tracking-widest mb-3 inline-block">
              Limited Time Offer
            </span>
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
              Get 20% Flat Discount With Student Code
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-2 leading-relaxed">
              Utilize promo coupon code <b className="text-white font-mono bg-black/45 px-1.5 py-0.5 rounded-xs border border-white/5">STUDENT20</b> during checkout to get instant 20% off on premium ticket bookings from Monday to Wednesday!
            </p>
          </div>
          <button
            onClick={() => onNavigate("promotions")}
            className="px-6 py-2.5 rounded-xs text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-100 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-md"
          >
            Explore All Deals
          </button>
        </div>
      </section>

      {/* SECTION 7: TESTIMONIALS */}
      <section id="testimonials-reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-2">
            Reviews & Feedback
          </span>
          <h3 className="text-xl font-bold uppercase tracking-wider text-white">
            What Our Attendees Say
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {db.testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex flex-col justify-between"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 text-gold-500 mb-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(t.rating) ? "fill-gold-500 text-gold-500" : "text-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[10px]">
                <span className="font-bold text-white/90 uppercase tracking-wider">{t.name}</span>
                <span className="text-slate-500 font-mono">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: FAQs ACCORDIONS */}
      <section id="faqs-accordions" className="max-w-3xl mx-auto px-4 w-full font-sans">
        <div className="text-center mb-8">
          <HelpCircle className="w-8 h-8 text-gold-500 mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {db.faqs.map((f) => {
            const isExpanded = expandedFaqId === f.id;
            return (
              <div
                key={f.id}
                className="bg-cinema-card/55 border border-white/5 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(f.id)}
                  className="w-full flex items-center justify-between p-4 font-bold text-xs sm:text-sm text-white hover:text-gold-500 text-left transition-colors cursor-pointer"
                >
                  <span className="uppercase tracking-wide text-xs sm:text-sm">{f.question}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transform transition-transform duration-250 ${
                      isExpanded ? "rotate-90 text-gold-500" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-white/5 text-xs text-slate-300 leading-relaxed">
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 9: VISUAL ADDRESS & styled GOOGLE MAP */}
      <section id="physical-address" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-sans pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          {/* Card details */}
          <div className="lg:col-span-2 bg-cinema-card/55 border border-white/5 rounded-lg p-6 sm:p-8 flex flex-col gap-5 shadow-xl">
            <div>
              <span className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-widest block mb-1">
                Our Coordinates
              </span>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                Visit JFC Cineplex Islamabad
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              We are strategically located within the gated, secure premises of the prestigious Jacaranda Family Club in DHA Phase II, Islamabad. Gated entry ensures safety for kids, family groups, and club members.
            </p>

            <div className="flex flex-col gap-3.5 text-xs text-slate-400 pt-3 border-t border-white/5">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span>{db.settings.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-500 shrink-0" />
                <a href={`tel:${db.settings.phone}`} className="hover:text-gold-500 transition-colors font-mono">
                  {db.settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-500 shrink-0" />
                <a href={`mailto:${db.settings.email}`} className="hover:text-gold-500 transition-colors">
                  {db.settings.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold-500 shrink-0" />
                <span>Weekdays: {db.settings.openingHours.weekdays} <br/> Weekends: {db.settings.openingHours.weekends}</span>
              </div>
            </div>
          </div>

          {/* High contrast visual simulated map */}
          <div className="lg:col-span-3 h-80 bg-[#0a0a0c] border border-white/5 rounded-lg overflow-hidden relative shadow-lg flex items-center justify-center">
            {/* Visual background pattern simulating roads */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <div className="absolute top-1/3 left-0 right-0 h-4 bg-slate-500 rotate-12" />
              <div className="absolute top-0 bottom-0 left-1/3 w-4 bg-slate-500 -rotate-45" />
              <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-500 -rotate-12" />
              <div className="absolute top-0 bottom-0 left-2/3 w-4 bg-slate-500 rotate-45" />
              {/* Circles */}
              <div className="absolute top-1/4 left-1/2 w-32 h-32 rounded-full border-2 border-slate-500 -translate-x-1/2" />
            </div>

            {/* Map Pin spotlight indicator */}
            <div className="text-center relative z-10 flex flex-col items-center">
              <div className="relative mb-3 flex justify-center">
                <div className="absolute w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-full animate-ping" />
                <div className="w-10 h-10 bg-gold-500 rounded-sm flex items-center justify-center shadow-lg shadow-gold-500/20 border border-gold-600">
                  <MapPin className="w-5 h-5 text-cinema-black stroke-[2.2]" />
                </div>
              </div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Jacaranda Family Club (JFC)</h4>
              <p className="font-mono text-[10px] text-gold-500 mt-1 uppercase tracking-widest">
                Sector E, DHA Phase II, Islamabad
              </p>
              <a
                href="https://maps.google.com/?q=JFC+Cineplex+Jacaranda+Family+Club+Islamabad"
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-all border border-white/10 cursor-pointer"
              >
                Get Physical Directions
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
