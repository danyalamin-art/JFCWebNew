import { useState, useEffect } from "react";
import { fetchFullDatabase } from "./lib/api";
import { DatabaseSchema, Movie } from "./types";
import { Film, RefreshCw, AlertCircle, Shield } from "lucide-react";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import BookingFlow from "./components/BookingFlow";
import AdminDashboard from "./components/AdminDashboard";

// Views
import HomeView from "./views/HomeView";
import MoviesView from "./views/MoviesView";
import ShowtimesView from "./views/ShowtimesView";
import ComingSoonView from "./views/ComingSoonView";
import PromotionsView from "./views/PromotionsView";
import FoodView from "./views/FoodView";
import AboutView from "./views/AboutView";
import ContactView from "./views/ContactView";
import MovieDetailsView from "./views/MovieDetailsView";

export default function App() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Router View States
  // Allowed views: "home" | "movies" | "showtimes" | "coming-soon" | "promotions" | "food" | "about" | "contact" | "admin" | "movie-details" | "booking"
  const [currentView, setCurrentView] = useState<string>("home");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [bookingMovie, setBookingMovie] = useState<Movie | null>(null);

  // Fetch full data on mount
  const loadDatabase = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFullDatabase();
      setDb(data);
    } catch (err: any) {
      console.error("Database initialization failed", err);
      if (showLoading || !db) {
        setError("Unable to establish connect to JFC Cinema API. Please ensure the backend is active.");
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase(true);
  }, []);

  // Light background sync for seat availability (only while tab is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      loadDatabase(false);
    }, currentView === "booking" ? 8000 : 20000);

    return () => clearInterval(interval);
  }, [currentView]);

  // Set view and scroll smoothly to top
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    handleNavigate("movie-details");
  };

  const handleBookMovie = (movie: Movie | null) => {
    setBookingMovie(movie);
    setCurrentView("booking");
  };

  const handleBookingSuccess = async () => {
    // Re-fetch database to sync booked seats and states in background
    try {
      const data = await fetchFullDatabase();
      setDb(data);
    } catch (e) {
      console.error("Failed to sync database seats after booking", e);
    }
  };

  // Loading indicator screen
  if (isLoading) {
    return (
      <div id="loading-screen" className="min-h-screen bg-cinema-black flex flex-col items-center justify-center gap-4 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gold-500/10 border-t-gold-500 animate-spin" />
          <Film className="w-6 h-6 text-gold-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div>
          <h1 className="font-display font-black text-xl text-white tracking-widest uppercase">
            JFC Cineplex
          </h1>
          <p className="text-xs text-cinema-text-muted mt-1.5 font-mono">
            Loading showtimes &amp; movies…
          </p>
        </div>
      </div>
    );
  }

  // Error recovery screen
  if (error || !db) {
    return (
      <div id="error-screen" className="min-h-screen bg-cinema-black flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="max-w-md">
          <h2 className="font-display font-extrabold text-xl text-white">Connection Interrupted</h2>
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            {error || "An unknown database parsing mismatch occurred. Please try rebooting the workspace development server."}
          </p>
        </div>
        <button
          onClick={() => loadDatabase(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-cinema-black font-display font-bold text-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-cinema-black" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-black text-slate-200 flex flex-col justify-between">
      
      {/* Dynamic Navigation Sticky Header */}
      <Header currentView={currentView} onNavigate={handleNavigate} onStartBooking={() => handleBookMovie(null)} />

      {/* Primary Dynamic Main Body View */}
      <main className="flex-grow pt-24">
        {currentView === "home" && (
          <HomeView
            db={db}
            onNavigate={handleNavigate}
            onSelectMovie={handleSelectMovie}
            onBookMovie={handleBookMovie}
          />
        )}

        {currentView === "movies" && (
          <MoviesView
            movies={db.movies}
            onSelectMovie={handleSelectMovie}
            onBookMovie={handleBookMovie}
          />
        )}

        {currentView === "movie-details" && selectedMovie && (
          <MovieDetailsView
            movie={selectedMovie}
            showtimes={db.showtimes}
            onBack={() => handleNavigate("movies")}
            onBookNow={handleBookMovie}
          />
        )}

        {currentView === "showtimes" && (
          <ShowtimesView
            db={db}
            onBookMovie={handleBookMovie}
          />
        )}

        {currentView === "coming-soon" && (
          <ComingSoonView
            movies={db.movies}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentView === "promotions" && (
          <PromotionsView
            promotions={db.promotions}
          />
        )}

        {currentView === "food" && (
          <FoodView
            snacks={db.snacks}
            onStartBooking={() => handleBookMovie(null)}
          />
        )}

        {currentView === "about" && (
          <AboutView
            settings={db.settings}
          />
        )}

        {currentView === "contact" && (
          <ContactView
            settings={db.settings}
          />
        )}

        {currentView === "admin" && (
          <AdminDashboard
            initialDb={db}
            onRefreshData={loadDatabase}
            onClose={() => handleNavigate("home")}
          />
        )}

        {currentView === "booking" && (
          <div className="max-w-5xl mx-auto px-4 py-4">
            <BookingFlow
              movies={db.movies}
              showtimes={db.showtimes}
              snacks={db.snacks}
              promotions={db.promotions}
              preselectedMovieId={bookingMovie ? bookingMovie.id : null}
              onClose={() => {
                handleNavigate("home");
                setBookingMovie(null);
              }}
              onBookingSuccess={handleBookingSuccess}
            />
          </div>
        )}
      </main>

      {/* Sticky Informational Footer */}
      <Footer onNavigate={handleNavigate} settings={db.settings} />

    </div>
  );
}
