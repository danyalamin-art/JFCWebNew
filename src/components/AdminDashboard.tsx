import React, { useState, useEffect } from "react";
import { LayoutDashboard, Clapperboard, Calendar, Ticket, Percent, Settings, Plus, Trash2, Edit, Save, RefreshCw, Undo, DollarSign, Users, Shield, MapPin, Phone, Mail, Sparkles, Wand2, Loader2, Download, Upload, Database, ChevronUp, ChevronDown } from "lucide-react";
import { DatabaseSchema, Movie, Showtime, SnackItem, Promotion, FAQ, Booking, CinemaSettings } from "../types";
import {
  fetchDashboardStats,
  createMovie,
  updateMovie,
  deleteMovie,
  createShowtime,
  deleteShowtime,
  refundBooking,
  deleteBooking,
  createPromotion,
  deletePromotion,
  updateSettings,
  autoFetchMovieDetails,
  searchMovieSuggestions,
  adminLogin,
  adminLogout,
  getAdminToken,
  exportDatabaseJson,
  importDatabase,
  fetchOmdbStatus,
  saveOmdbKey,
  type MovieSuggestion,
} from "../lib/api";

interface AdminDashboardProps {
  initialDb: DatabaseSchema;
  onRefreshData: () => void;
  onClose: () => void;
}

export default function AdminDashboard({ initialDb, onRefreshData, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "stats" | "movies" | "spotlight" | "showtimes" | "bookings" | "promos" | "settings"
  >("stats");
  const [spotlightBusyId, setSpotlightBusyId] = useState<string | null>(null);
  const [spotlightMessage, setSpotlightMessage] = useState("");
  const [spotlightAddId, setSpotlightAddId] = useState("");

  // Admin session token (server-validated); token lives in sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAdminToken());
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Live Stats State
  const [stats, setStats] = useState<{
    revenue: number;
    bookingsCount: number;
    seatsSold: number;
    visitorsToday: number;
    popularMovies: { title: string; sales: number }[];
  } | null>(null);

  // Load stats
  const loadStats = async () => {
    try {
      const liveStats = await fetchDashboardStats();
      setStats(liveStats);
    } catch (e) {
      console.error("Failed to load live dashboard stats", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, initialDb]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      await adminLogin(adminPassword);
      setIsAuthenticated(true);
      setAdminPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Invalid admin password");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    onClose();
  };

  // Form states
  // Add/Edit Movie
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState<Omit<Movie, "id">>({
    title: "",
    poster: "",
    banner: "",
    synopsis: "",
    cast: [],
    director: "",
    producer: "",
    genre: [],
    language: [],
    formats: ["2D"],
    releaseDate: "",
    runtime: 120,
    ageRating: "PG-13",
    imdbRating: 7.0,
    trailerUrl: "",
    gallery: [],
    isComingSoon: false,
    isFeatured: false
  });
  const [movieSuccess, setMovieSuccess] = useState("");

  // Custom confirmation dialog state to replace native browser confirm() in iframe environments
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    type: "movie" | "showtime" | "booking" | "promo" | "refund";
    title?: string;
  } | null>(null);

  // Custom visual notifications to replace native browser alert() in iframe environments
  const [adminNotification, setAdminNotification] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const showAdminNotification = (message: string, isError = false) => {
    setAdminNotification({ message, isError });
    setTimeout(() => {
      setAdminNotification(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // Database Import / Export States
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState(false);

  // OMDb lives on the server (env + Firestore) — never re-paste after logout
  const [omdbConfigured, setOmdbConfigured] = useState(false);
  const [omdbHint, setOmdbHint] = useState<string | null>(null);
  const [omdbKeyInput, setOmdbKeyInput] = useState("");
  const [keySavedMessage, setKeySavedMessage] = useState("");
  const [aiMovieTitle, setAiMovieTitle] = useState("");
  const [selectedImdbId, setSelectedImdbId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [aiError, setAiError] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOmdbStatus()
      .then((s) => {
        setOmdbConfigured(s.configured);
        setOmdbHint(s.hint);
      })
      .catch(() => {
        setOmdbConfigured(false);
        setOmdbHint(null);
      });
  }, [isAuthenticated]);

  // Debounced OMDb title suggestions while typing
  useEffect(() => {
    if (!isAuthenticated || isAiLoading) return;
    const q = aiMovieTitle.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const list = await searchMovieSuggestions(q);
        setSuggestions(list);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [aiMovieTitle, isAuthenticated, isAiLoading]);

  // Add Showtime
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: "",
    date: "",
    time: "",
    hall: "Screen 1 (Standard)",
    format: "2D",
    price: 1000,
    seatsTotal: 120
  });
  const [showtimeSuccess, setShowtimeSuccess] = useState("");

  // Add Promotion
  const [promoForm, setPromoForm] = useState<Omit<Promotion, "id">>({
    title: "",
    description: "",
    code: "",
    discountPercent: 15,
    expiryDate: "",
    image: "",
    badge: "Limited"
  });
  const [promoSuccess, setPromoSuccess] = useState("");

  // Settings editable state
  const [settingsForm, setSettingsForm] = useState<CinemaSettings>(initialDb.settings);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Database Backup / Restore (server db.json)
  const handleExportDatabase = async () => {
    try {
      const currentDb = await exportDatabaseJson();
      const dataStr =
        "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentDb, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `jfc_cinema_backup_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupError(false);
      setBackupMessage("Database backup exported successfully.");
    } catch (err) {
      console.error(err);
      setBackupError(true);
      setBackupMessage("Failed to export database backup.");
    }
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.movies || !parsed.showtimes || !parsed.settings) {
          throw new Error("Invalid backup file. Missing movies, showtimes, or settings.");
        }
        await importDatabase(parsed);
        setBackupError(false);
        setBackupMessage("Database restored. Refreshing…");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        console.error(err);
        setBackupError(true);
        setBackupMessage(err.message || "Failed to import backup JSON.");
      }
    };
    fileReader.readAsText(file);
  };

  // Add movie from typed title or a suggestion click
  const addMovieFromOmdb = async (title: string, imdbID?: string) => {
    const t = title.trim();
    if (!t || isAiLoading) return;

    setIsAiLoading(true);
    setAiError("");
    setMovieSuccess("");
    setShowSuggestions(false);
    setSuggestions([]);
    setAiMovieTitle(t);
    setSelectedImdbId(imdbID);
    setAiStatusMessage("Looking up movie on OMDb…");

    try {
      const fetchedDetails = await autoFetchMovieDetails(t, imdbID);
      setAiStatusMessage("Saving movie to cinema database…");
      await createMovie(fetchedDetails);

      setMovieSuccess(
        `"${fetchedDetails.title}" added with IMDb rating, cast, synopsis, and poster. You can edit trailer URL anytime.`
      );
      setAiMovieTitle("");
      setSelectedImdbId(undefined);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to auto-fetch details. Check OMDb key or use the manual form.");
    } finally {
      setIsAiLoading(false);
      setAiStatusMessage("");
    }
  };

  /** Clicking a suggestion adds the movie immediately (no second button press). */
  const pickSuggestion = (s: MovieSuggestion) => {
    void addMovieFromOmdb(s.title, s.imdbID || undefined);
  };

  const handleAiAutoAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMovieFromOmdb(aiMovieTitle, selectedImdbId);
  };

  const handleSaveOmdbKey = async () => {
    const key = omdbKeyInput.trim();
    if (!key) return;
    try {
      const s = await saveOmdbKey(key);
      setOmdbConfigured(s.configured);
      setOmdbHint(s.hint);
      setOmdbKeyInput("");
      setKeySavedMessage("Saved permanently on server");
      setTimeout(() => setKeySavedMessage(""), 3000);
    } catch (err: any) {
      setAiError(err.message || "Could not save OMDb key");
    }
  };

  // —— Homepage Featured Spotlight (hero carousel) ——
  const spotlightMovies = initialDb.movies
    .filter((m) => m.isFeatured)
    .slice()
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));

  const availableForSpotlight = initialDb.movies.filter((m) => !m.isFeatured);

  const nextFeaturedOrder = () => {
    const orders = spotlightMovies.map((m) => m.featuredOrder ?? 0);
    return orders.length ? Math.max(...orders) + 1 : 0;
  };

  const setSpotlightMessageTemp = (msg: string) => {
    setSpotlightMessage(msg);
    setTimeout(() => setSpotlightMessage((cur) => (cur === msg ? "" : cur)), 3500);
  };

  const handleAddToSpotlight = async () => {
    if (!spotlightAddId) return;
    setSpotlightBusyId(spotlightAddId);
    try {
      await updateMovie(spotlightAddId, {
        isFeatured: true,
        featuredOrder: nextFeaturedOrder(),
      });
      setSpotlightAddId("");
      setSpotlightMessageTemp("Movie added to Featured Spotlight.");
      onRefreshData();
    } catch (err: any) {
      showAdminNotification(err.message || "Failed to add to spotlight", true);
    } finally {
      setSpotlightBusyId(null);
    }
  };

  const handleRemoveFromSpotlight = async (movieId: string) => {
    setSpotlightBusyId(movieId);
    try {
      await updateMovie(movieId, { isFeatured: false, featuredOrder: 999 });
      setSpotlightMessageTemp("Removed from Featured Spotlight.");
      onRefreshData();
    } catch (err: any) {
      showAdminNotification(err.message || "Failed to remove from spotlight", true);
    } finally {
      setSpotlightBusyId(null);
    }
  };

  const handleMoveSpotlight = async (movieId: string, direction: "up" | "down") => {
    const list = spotlightMovies;
    const idx = list.findIndex((m) => m.id === movieId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const a = list[idx];
    const b = list[swapIdx];
    const orderA = a.featuredOrder ?? idx;
    const orderB = b.featuredOrder ?? swapIdx;

    setSpotlightBusyId(movieId);
    try {
      await updateMovie(a.id, { featuredOrder: orderB });
      await updateMovie(b.id, { featuredOrder: orderA });
      setSpotlightMessageTemp("Spotlight order updated.");
      onRefreshData();
    } catch (err: any) {
      showAdminNotification(err.message || "Failed to reorder spotlight", true);
    } finally {
      setSpotlightBusyId(null);
    }
  };

  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovieSuccess("");
    try {
      if (editingMovie) {
        await updateMovie(editingMovie.id, movieForm);
        setMovieSuccess("Movie updated successfully!");
        setEditingMovie(null);
      } else {
        await createMovie(movieForm);
        setMovieSuccess("New movie created successfully!");
      }
      onRefreshData();
      // Reset form
      setMovieForm({
        title: "",
        poster: "",
        banner: "",
        synopsis: "",
        cast: [],
        director: "",
        producer: "",
        genre: [],
        language: [],
        formats: ["2D"],
        releaseDate: "",
        runtime: 120,
        ageRating: "PG-13",
        imdbRating: 7.0,
        trailerUrl: "",
        gallery: [],
        isComingSoon: false,
        isFeatured: false
      });
    } catch (err: any) {
      showAdminNotification("Error saving movie: " + err.message, true);
    }
  };

  const handleEditMovieClick = (movie: Movie) => {
    setEditingMovie(movie);
    setMovieForm({ ...movie });
    setMovieSuccess("");
  };

  const handleDeleteMovieClick = (id: string) => {
    const movie = initialDb.movies.find(m => m.id === id);
    setDeleteConfirmation({
      id,
      type: "movie",
      title: movie ? movie.title : "this movie"
    });
  };

  // Showtime actions
  const handleShowtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowtimeSuccess("");
    if (!showtimeForm.movieId) {
      showAdminNotification("Please select a movie.", true);
      return;
    }
    try {
      await createShowtime({
        movieId: showtimeForm.movieId,
        date: showtimeForm.date,
        time: showtimeForm.time,
        hall: showtimeForm.hall,
        format: showtimeForm.format,
        price: Number(showtimeForm.price),
        seatsTotal: Number(showtimeForm.seatsTotal)
      });
      setShowtimeSuccess("Showtime scheduled successfully!");
      onRefreshData();
    } catch (err: any) {
      showAdminNotification("Error saving showtime: " + err.message, true);
    }
  };

  const handleDeleteShowtimeClick = (id: string) => {
    const show = initialDb.showtimes.find(s => s.id === id);
    setDeleteConfirmation({
      id,
      type: "showtime",
      title: show ? `${show.movieTitle} at ${show.time} (${show.date})` : "this showtime"
    });
  };

  // Booking refund
  const handleRefundClick = (id: string) => {
    const b = initialDb.bookings.find(x => x.id === id);
    setDeleteConfirmation({
      id,
      type: "refund",
      title: b ? `Booking ${b.id} for ${b.customerName}` : "this booking"
    });
  };

  const handleDeleteBookingClick = (id: string) => {
    const b = initialDb.bookings.find(x => x.id === id);
    setDeleteConfirmation({
      id,
      type: "booking",
      title: b ? `Booking Record ${b.id}` : "this booking record"
    });
  };

  // Promo actions
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoSuccess("");
    try {
      await createPromotion(promoForm);
      setPromoSuccess("Coupon code created successfully!");
      setPromoForm({
        title: "",
        description: "",
        code: "",
        discountPercent: 15,
        expiryDate: "",
        image: "",
        badge: "Limited"
      });
      onRefreshData();
    } catch (err: any) {
      showAdminNotification("Error saving promotion: " + err.message, true);
    }
  };

  const handleDeletePromoClick = (id: string) => {
    const p = initialDb.promotions.find(x => x.id === id);
    setDeleteConfirmation({
      id,
      type: "promo",
      title: p ? `${p.title} (${p.code})` : "this promo coupon"
    });
  };

  // Execution logic for custom confirmations
  const confirmDeleteAction = async () => {
    if (!deleteConfirmation) return;
    const { id, type } = deleteConfirmation;
    try {
      if (type === "movie") {
        await deleteMovie(id);
        showAdminNotification("Movie and all its showtimes deleted successfully!");
      } else if (type === "showtime") {
        await deleteShowtime(id);
        showAdminNotification("Showtime deleted successfully!");
      } else if (type === "refund") {
        await refundBooking(id);
        showAdminNotification("Booking successfully refunded and seats released!");
      } else if (type === "booking") {
        await deleteBooking(id);
        showAdminNotification("Booking record deleted from database.");
      } else if (type === "promo") {
        await deletePromotion(id);
        showAdminNotification("Promotion deleted successfully!");
      }
      onRefreshData();
    } catch (err: any) {
      showAdminNotification("Operation failed: " + err.message, true);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Settings action
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");
    try {
      await updateSettings(settingsForm);
      setSettingsSuccess("Cinema CMS configurations updated successfully!");
      onRefreshData();
    } catch (err: any) {
      showAdminNotification("Failed to update settings: " + err.message, true);
    }
  };

  // Helper currency formatter
  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  // Security Login Gate
  if (!isAuthenticated) {
    return (
      <div id="admin-login-screen" className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4 font-sans">
        <div className="w-full max-w-md bg-cinema-card/55 border border-white/5 rounded-lg p-8 shadow-2xl relative backdrop-blur-md">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xs bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>

          <div className="text-center mb-8 animate-fade-in">
            <div className="w-12 h-12 rounded-sm bg-gold-500/10 text-gold-500 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">JFC Admin Portal</h2>
            <p className="text-[10px] uppercase font-bold tracking-wide text-slate-500 mt-1.5">
              Access the cinema CMS & database manager.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1.5 tracking-wider">
                Admin Password
              </label>
              <input
                type="password"
                placeholder="Admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500 font-mono"
              />
              <p className="text-[10px] text-slate-600 mt-1.5">
                Default for local testing: <span className="text-slate-400 font-mono">jfc-admin</span> (set ADMIN_PASSWORD in .env)
              </p>
            </div>

            {loginError && <p className="text-xs text-red-400 font-semibold uppercase tracking-wider text-center">{loginError}</p>}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-sm font-bold text-xs text-black bg-gold-600 hover:bg-gold-500 uppercase tracking-widest active:scale-98 transition-all shadow-lg shadow-gold-600/10 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? "Signing in…" : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-portal-dashboard" className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto flex flex-col font-sans">
      {/* Dashboard Top Header Bar */}
      <div className="bg-cinema-card/55 border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-gold-600 text-black flex items-center justify-center font-bold shadow-md shadow-gold-600/10">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              CMS Admin Dashboard
            </h2>
            <p className="text-[10px] text-gold-500 font-mono font-bold uppercase tracking-widest">
              Role: System Administrator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            className="p-2.5 rounded-sm bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Refresh Server Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-sm bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            Exit CMS
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Workspace Sidebar Tabs (1 Column) */}
        <div className="lg:col-span-1 bg-cinema-card/55 border border-white/5 rounded-lg p-4 flex flex-col gap-1.5">
          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-3 mb-2">
            NAVIGATION
          </span>
          
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "stats" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Live Overview
          </button>

          <button
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "movies" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Clapperboard className="w-4 h-4 shrink-0" />
            Movies Manager
          </button>

          <button
            onClick={() => setActiveTab("spotlight")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "spotlight" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Featured Spotlight
          </button>

          <button
            onClick={() => setActiveTab("showtimes")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "showtimes" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            Showtimes Planner
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "bookings" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Ticket className="w-4 h-4 shrink-0" />
            Bookings Tracker
          </button>

          <button
            onClick={() => setActiveTab("promos")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "promos" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Percent className="w-4 h-4 shrink-0" />
            Coupons / Promo
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-gold-600/10 text-gold-500 border border-white/5" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Cinema Settings
          </button>
        </div>

        {/* Dynamic CMS Panel Viewport (4 Columns) */}
        <div className="lg:col-span-4 bg-cinema-card/55 border border-white/5 rounded-lg p-6 min-h-[500px]">
          
          {/* TAB 1: STATISTICS LIVE */}
          {activeTab === "stats" && (
            <div id="tab-stats-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Live Overview Statistics</h3>
                <p className="text-[10px] text-cinema-text-muted uppercase tracking-wide">Dynamic calculations aggregated from the live persistent JSON database.</p>
              </div>

              {stats ? (
                <>
                  {/* Grid of basic parameters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-4 flex items-center gap-4 hover:border-gold-500/25 transition-colors">
                      <div className="w-9 h-9 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/5">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">Revenue</span>
                        <span className="text-sm font-bold text-white font-mono">{formatRs(stats.revenue)}</span>
                      </div>
                    </div>

                    <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-4 flex items-center gap-4 hover:border-gold-500/25 transition-colors">
                      <div className="w-9 h-9 rounded-sm bg-gold-500/10 text-gold-500 flex items-center justify-center shrink-0 border border-white/5">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">Bookings</span>
                        <span className="text-sm font-bold text-white font-mono">{stats.bookingsCount}</span>
                      </div>
                    </div>

                    <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-4 flex items-center gap-4 hover:border-gold-500/25 transition-colors">
                      <div className="w-9 h-9 rounded-sm bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-white/5">
                        <Clapperboard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">Seats Sold</span>
                        <span className="text-sm font-bold text-white font-mono">{stats.seatsSold}</span>
                      </div>
                    </div>

                    <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-4 flex items-center gap-4 hover:border-gold-500/25 transition-colors">
                      <div className="w-9 h-9 rounded-sm bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-white/5">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">Visitors Today</span>
                        <span className="text-sm font-bold text-white font-mono">{stats.visitorsToday}</span>
                      </div>
                    </div>
                  </div>

                  {/* Popular movies bar graph layout */}
                  <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Movie Seat Popularity (Total Seats Booked)</h4>
                    <div className="flex flex-col gap-4">
                      {stats.popularMovies.length > 0 ? (
                        stats.popularMovies.map((movie, idx) => {
                          const maxSales = stats.popularMovies[0]?.sales || 1;
                          const pct = (movie.sales / maxSales) * 100;

                          return (
                            <div key={movie.title} className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-300">
                                <span className="uppercase tracking-wider text-[11px]">{movie.title}</span>
                                <span className="font-mono font-bold text-gold-500">{movie.sales} seats sold</span>
                              </div>
                              <div className="w-full h-1.5 bg-black/45 rounded-sm overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-gold-600 rounded-sm"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-cinema-text-muted italic text-center py-4">No seats booked yet in active records.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin text-gold-500 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Loading database stats...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOVIES CMS */}
          {activeTab === "movies" && (
            <div id="tab-movies-panel" className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">Movies Manager</h3>
                  <p className="text-xs text-cinema-text-muted">Register Now Showing movies or edit upcoming Coming Soon teasers.</p>
                </div>
                {editingMovie && (
                  <button
                    onClick={() => {
                      setEditingMovie(null);
                      setMovieForm({
                        title: "", poster: "", banner: "", synopsis: "", cast: [], director: "", producer: "",
                        genre: [], language: [], formats: ["2D"], releaseDate: "", runtime: 120, ageRating: "PG-13",
                        imdbRating: 7.0, trailerUrl: "", gallery: [], isComingSoon: false, isFeatured: false
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-cinema-gray text-slate-300 text-xs hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Quick AI Auto-Add Card */}
              {!editingMovie && (
                <div className="bg-cinema-card border border-gold-500/10 rounded-xl p-5 flex flex-col gap-4 shadow-lg shadow-gold-500/2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-xs text-gold-500 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold-400" />
                      IMDb & OMDb Instant Film Creator
                    </h4>
                    <span className="px-2.5 py-1 rounded bg-gold-500/10 text-gold-500 font-mono text-[9px] font-bold uppercase tracking-wider">
                      Public Movie Directories
                    </span>
                  </div>
                  
                  <p className="text-xs text-cinema-text-muted">
                    Type a movie title and click Add. The server uses your OMDb key stored permanently
                    (no need to paste again after logout).
                  </p>

                  {/* Permanent OMDb status — key lives on server / Firestore */}
                  <div className="bg-black/45 border border-cinema-gray/40 rounded-lg p-3.5 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-gold-500" />
                          OMDb API
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {omdbConfigured
                            ? `Connected permanently${omdbHint ? ` (${omdbHint})` : ""}. Survives CMS logout.`
                            : "Not configured yet — paste once and Save. It stays on the server."}
                        </span>
                      </div>
                      {omdbConfigured && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    {!omdbConfigured && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="password"
                          placeholder="Paste OMDb API key once"
                          value={omdbKeyInput}
                          onChange={(e) => setOmdbKeyInput(e.target.value)}
                          className="bg-cinema-black border border-cinema-gray rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-gold-500 flex-1 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleSaveOmdbKey}
                          disabled={!omdbKeyInput.trim()}
                          className="px-4 py-1.5 rounded bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-cinema-black text-[10px] font-bold uppercase tracking-wider"
                        >
                          Save permanently
                        </button>
                      </div>
                    )}
                    {keySavedMessage && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                        {keySavedMessage}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleAiAutoAdd} className="flex flex-col md:flex-row gap-3 items-end mt-1">
                    <div className="flex-grow w-full relative">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Movie Title / Name
                        {suggestionsLoading && (
                          <span className="ml-2 text-gold-500/80 normal-case tracking-normal font-medium">
                            finding matches…
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Start typing e.g. Spider-Man…"
                        value={aiMovieTitle}
                        onChange={(e) => {
                          setAiMovieTitle(e.target.value);
                          setSelectedImdbId(undefined);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => {
                          if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                          // Delay so click on suggestion registers
                          setTimeout(() => setShowSuggestions(false), 180);
                        }}
                        disabled={isAiLoading}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
                      />

                      {showSuggestions && suggestions.length > 0 && !isAiLoading && (
                        <ul
                          className="absolute z-30 left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-[#0c0c0e] shadow-2xl shadow-black/50"
                          role="listbox"
                        >
                          {suggestions.map((s) => (
                            <li key={s.imdbID || `${s.title}-${s.year}`}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pickSuggestion(s)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gold-500/10 border-b border-white/5 last:border-0 transition-colors cursor-pointer"
                              >
                                {s.poster ? (
                                  <img
                                    src={s.poster}
                                    alt=""
                                    className="w-8 h-12 object-cover rounded-sm bg-black shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-8 h-12 rounded-sm bg-white/5 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {s.year}
                                    {s.type ? ` · ${s.type}` : ""}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isAiLoading || !aiMovieTitle.trim()}
                      className="w-full md:w-auto h-[46px] px-6 rounded-lg bg-gold-500 hover:bg-gold-600 disabled:bg-cinema-gray disabled:text-slate-500 text-cinema-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-gold-500/10 shrink-0"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cinema-black" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Add Movie instantly</span>
                        </>
                      )}
                    </button>
                  </form>

                  {isAiLoading && (
                    <div className="bg-black/35 border border-white/5 rounded-lg p-3.5 mt-2 flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-ping" />
                      <span className="text-xs font-mono font-medium text-gold-400 uppercase tracking-wider">
                        {aiStatusMessage}
                      </span>
                    </div>
                  )}

                  {aiError && (
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider mt-1 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                      ⚠️ {aiError}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible Manual Form Toggle */}
              {!editingMovie && (
                <div className="flex justify-center my-1">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="text-xs font-mono font-bold text-slate-400 hover:text-gold-400 uppercase tracking-widest flex items-center gap-2 py-2.5 px-5 rounded-lg border border-cinema-gray bg-cinema-black/40 hover:bg-cinema-black/60 transition-colors cursor-pointer"
                  >
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>{showManualForm ? "Hide" : "Show"} Manual Entry Fields</span>
                    <span className="text-[10px] text-slate-500">({showManualForm ? "▲" : "▼"})</span>
                  </button>
                </div>
              )}

              {/* Form to Create/Edit */}
              {(editingMovie || showManualForm) && (
                <form onSubmit={handleMovieSubmit} className="bg-cinema-card border border-cinema-gray rounded-xl p-5 flex flex-col gap-4">
                  <h4 className="font-display font-bold text-xs text-gold-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    {editingMovie ? `Edit Movie: ${editingMovie.title}` : "Add New Movie (Manual)"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Movie Title</label>
                    <input
                      type="text"
                      required
                      value={movieForm.title}
                      onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Poster Image Link</label>
                    <input
                      type="text"
                      required
                      placeholder="https://..."
                      value={movieForm.poster}
                      onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Banner Backdrop Image Link</label>
                    <input
                      type="text"
                      required
                      placeholder="https://..."
                      value={movieForm.banner}
                      onChange={(e) => setMovieForm({ ...movieForm, banner: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">IMDb Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      value={movieForm.imdbRating}
                      onChange={(e) => setMovieForm({ ...movieForm, imdbRating: Number(e.target.value) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Runtime (Minutes)</label>
                    <input
                      type="number"
                      value={movieForm.runtime}
                      onChange={(e) => setMovieForm({ ...movieForm, runtime: Number(e.target.value) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Age Rating Badge (e.g. PG-13)</label>
                    <input
                      type="text"
                      required
                      value={movieForm.ageRating}
                      onChange={(e) => setMovieForm({ ...movieForm, ageRating: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">YouTube Trailer ID (e.g. Way9Dexny3w)</label>
                    <input
                      type="text"
                      placeholder="Video ID only"
                      value={movieForm.trailerUrl}
                      onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Release Date</label>
                    <input
                      type="date"
                      required
                      value={movieForm.releaseDate}
                      onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono cursor-pointer scheme-dark"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Formats Available (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="2D, 3D, IMAX"
                      value={Array.isArray(movieForm.formats) ? movieForm.formats.join(", ") : movieForm.formats}
                      onChange={(e) => setMovieForm({ ...movieForm, formats: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Genres (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Action, Sci-Fi"
                      value={Array.isArray(movieForm.genre) ? movieForm.genre.join(", ") : movieForm.genre}
                      onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Cast Members (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Paul Mescal, Denzel..."
                      value={Array.isArray(movieForm.cast) ? movieForm.cast.join(", ") : movieForm.cast}
                      onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Director</label>
                    <input
                      type="text"
                      value={movieForm.director}
                      onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Movie Synopsis (Story outline)</label>
                  <textarea
                    rows={3}
                    required
                    value={movieForm.synopsis}
                    onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                    className="w-full bg-cinema-black border border-cinema-gray rounded-lg p-3 text-xs text-white mt-1 focus:outline-none"
                  />
                </div>

                <div className="flex gap-6 mt-1.5 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movieForm.isComingSoon}
                      onChange={(e) => setMovieForm({ ...movieForm, isComingSoon: e.target.checked })}
                      className="accent-gold-500"
                    />
                    Coming Soon Teaser (Hide from Now Showing showtimes)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movieForm.isFeatured}
                      onChange={(e) => setMovieForm({ ...movieForm, isFeatured: e.target.checked })}
                      className="accent-gold-500"
                    />
                    Featured Blockbuster (Large Home Hero slider promotion)
                  </label>
                </div>

                {movieSuccess && <p className="text-xs text-gold-400 font-semibold">{movieSuccess}</p>}

                <button
                  type="submit"
                  className="py-2.5 rounded-lg bg-gold-500 text-cinema-black hover:bg-gold-600 font-bold text-xs self-start px-8 transition-colors mt-2 cursor-pointer"
                >
                  {editingMovie ? "Save Changes" : "Create Film entry"}
                </button>
              </form>
              )}

              {/* Table List of Current Movies */}
              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-4 overflow-x-auto">
                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-3">Registered Movies Database</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cinema-gray/80 text-slate-500">
                      <th className="py-2.5">Film</th>
                      <th className="py-2.5">Genres</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-gray/50">
                    {initialDb.movies.map((m) => (
                      <tr key={m.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-2.5">
                          <div className="flex items-center gap-3">
                            <img src={m.poster} className="w-8 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                            <div>
                              <p className="font-bold text-white">{m.title}</p>
                              <p className="text-[10px] text-slate-500">{m.runtime} min • {m.ageRating}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-300">{m.genre.join(", ")}</td>
                        <td className="py-2.5 text-center">
                          {m.isComingSoon ? (
                            <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold">Coming Soon</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">Now Showing</span>
                          )}
                          {m.isFeatured && (
                            <span className="ml-1.5 px-2 py-0.5 rounded-sm bg-gold-500/10 text-gold-500 font-mono text-[9px] font-bold">Featured</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditMovieClick(m)}
                              className="p-1.5 rounded bg-cinema-gray text-slate-300 hover:text-gold-500"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovieClick(m.id)}
                              className="p-1.5 rounded bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FEATURED SPOTLIGHT (homepage hero) */}
          {activeTab === "spotlight" && (
            <div id="tab-spotlight-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-500" />
                  Featured Spotlight
                </h3>
                <p className="text-xs text-cinema-text-muted mt-1">
                  Control the large homepage hero carousel (“Featured Spotlight”). Add movies from your catalog,
                  remove them, or reorder how they slide.
                </p>
              </div>

              {/* Add movie to spotlight */}
              <div className="bg-cinema-card border border-gold-500/15 rounded-xl p-5 flex flex-col gap-3">
                <h4 className="text-[10px] font-mono font-bold text-gold-500 uppercase tracking-wider">
                  Add movie to spotlight
                </h4>
                {availableForSpotlight.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    All movies are already in the spotlight, or no movies exist yet. Add films under Movies Manager first.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <div className="flex-grow">
                      <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Select movie</label>
                      <select
                        value={spotlightAddId}
                        onChange={(e) => setSpotlightAddId(e.target.value)}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                      >
                        <option value="">Choose a movie…</option>
                        {availableForSpotlight.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                            {m.isComingSoon ? " (Coming Soon)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!spotlightAddId || !!spotlightBusyId}
                      onClick={handleAddToSpotlight}
                      className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-cinema-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Add to spotlight
                    </button>
                  </div>
                )}
                {spotlightMessage && (
                  <p className="text-xs text-emerald-400 font-semibold">{spotlightMessage}</p>
                )}
              </div>

              {/* Current spotlight list */}
              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                    Current spotlight slides ({spotlightMovies.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Order = carousel left → right
                  </span>
                </div>

                {spotlightMovies.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-white/10 rounded-lg">
                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      No featured movies yet. The homepage will fall back to the first movie in the catalog.
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Add at least one film above for a proper spotlight.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {spotlightMovies.map((m, idx) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5 hover:border-gold-500/20 transition-colors"
                      >
                        <span className="text-[10px] font-mono text-slate-500 w-5 shrink-0">{idx + 1}</span>
                        <img
                          src={m.poster}
                          alt=""
                          className="w-10 h-14 object-cover rounded-sm bg-black shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-grow">
                          <p className="text-xs font-bold text-white truncate">{m.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {m.genre?.slice(0, 2).join(" · ")}
                            {m.isComingSoon ? " · Coming Soon" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            title="Move earlier in carousel"
                            disabled={idx === 0 || spotlightBusyId === m.id}
                            onClick={() => handleMoveSpotlight(m.id, "up")}
                            className="p-1.5 rounded bg-white/5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move later in carousel"
                            disabled={idx === spotlightMovies.length - 1 || spotlightBusyId === m.id}
                            onClick={() => handleMoveSpotlight(m.id, "down")}
                            className="p-1.5 rounded bg-white/5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={spotlightBusyId === m.id}
                            onClick={() => handleRemoveFromSpotlight(m.id)}
                            className="px-2.5 py-1.5 rounded bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                          >
                            {spotlightBusyId === m.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-[10px] text-slate-600 leading-relaxed">
                Tip: You can still toggle “Featured Blockbuster” when editing a movie under Movies Manager.
                This tab is the dedicated control for the homepage spotlight.
              </p>
            </div>
          )}

          {/* TAB 3: SHOWTIMES PLANNER */}
          {activeTab === "showtimes" && (
            <div id="tab-showtimes-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Showtimes Planner</h3>
                <p className="text-xs text-cinema-text-muted">Create schedules, allocate screens, and set specific pricing parameters.</p>
              </div>

              {/* Add Showtime schedule */}
              <form onSubmit={handleShowtimeSubmit} className="bg-cinema-card border border-cinema-gray rounded-xl p-5 flex flex-col gap-4">
                <h4 className="font-display font-bold text-xs text-gold-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Schedule Movie Screening
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Select Movie</label>
                    <select
                      required
                      value={showtimeForm.movieId}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    >
                      <option value="">-- Choose Now Showing --</option>
                      {initialDb.movies.filter(m => !m.isComingSoon).map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Date</label>
                    <input
                      type="date"
                      required
                      value={showtimeForm.date}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono cursor-pointer scheme-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Show Time</label>
                    <input
                      type="time"
                      required
                      value={showtimeForm.time}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono cursor-pointer scheme-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Screen / Hall</label>
                    <select
                      required
                      value={showtimeForm.hall}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, hall: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    >
                      <option value="Screen 1 (Standard)">Screen 1 (Standard)</option>
                      <option value="Screen 2 (Standard)">Screen 2 (Standard)</option>
                      <option value="IMAX Theater">IMAX Theater</option>
                      <option value="Gold Class VIP">Gold Class VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Projection Format</label>
                    <select
                      required
                      value={showtimeForm.format}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, format: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    >
                      <option value="2D">2D Digital</option>
                      <option value="3D">3D Stereoscopic</option>
                      <option value="IMAX">IMAX Laser</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Standard Ticket Price (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={showtimeForm.price}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, price: Number(e.target.value) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {showtimeSuccess && <p className="text-xs text-gold-400 font-semibold">{showtimeSuccess}</p>}

                <button
                  type="submit"
                  className="py-2.5 rounded-lg bg-gold-500 text-cinema-black hover:bg-gold-600 font-bold text-xs self-start px-8 transition-colors cursor-pointer"
                >
                  Create Schedule
                </button>
              </form>

              {/* Scheduled list */}
              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-4 overflow-x-auto">
                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-3">Planned Schedules (Next 7 Days)</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cinema-gray/80 text-slate-500">
                      <th className="py-2.5">Date & Time</th>
                      <th className="py-2.5">Movie</th>
                      <th className="py-2.5">Hall & Format</th>
                      <th className="py-2.5">Price</th>
                      <th className="py-2.5 text-center">Occupancy</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-gray/50">
                    {initialDb.showtimes.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map((s) => {
                      const bookCount = s.seatsBooked.length;
                      return (
                        <tr key={s.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 font-mono text-[11px]">
                            {s.date} <b className="text-white ml-2">{s.time}</b>
                          </td>
                          <td className="py-2.5 font-bold text-white">{s.movieTitle}</td>
                          <td className="py-2.5">
                            {s.hall} <span className="ml-1 px-1 bg-cinema-gray text-gold-400 font-mono text-[9px] rounded font-bold">{s.format}</span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-300">{formatRs(s.price)}</td>
                          <td className="py-2.5 text-center font-mono">
                            {bookCount} / {s.seatsTotal}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteShowtimeClick(s.id)}
                              className="p-1.5 rounded bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKINGS TRACKER */}
          {activeTab === "bookings" && (
            <div id="tab-bookings-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Bookings Tracker</h3>
                <p className="text-xs text-cinema-text-muted">Track ticket reservations, manage cancellations, and run mock refunds.</p>
              </div>

              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cinema-gray/80 text-slate-500">
                      <th className="py-3">Booking ID</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Movie & Seats</th>
                      <th className="py-3">Screenings</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-gray/40">
                    {initialDb.bookings.sort((a,b) => b.bookingDate.localeCompare(a.bookingDate)).map((b) => (
                      <tr key={b.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 font-mono text-[10px] text-gold-400 font-bold uppercase">{b.id}</td>
                        <td className="py-3">
                          <p className="font-bold text-white leading-tight">{b.customerName}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{b.customerPhone}</p>
                          <p className="text-[9px] text-slate-600 leading-tight">{b.customerEmail}</p>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-200">{b.movieTitle}</p>
                          <p className="font-mono text-[10px] text-gold-500 font-bold mt-0.5">Seats: {b.seats.join(", ")}</p>
                        </td>
                        <td className="py-3 leading-tight">
                          <p className="text-slate-300 font-mono text-[10px]">{b.date}</p>
                          <p className="text-white font-bold mt-0.5">{b.time}</p>
                          <p className="text-[10px] text-slate-500">{b.hall}</p>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-100">{formatRs(b.total)}</td>
                        <td className="py-3 text-center">
                          {b.paymentStatus === "paid" ? (
                            <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">Paid</span>
                          ) : b.paymentStatus === "refunded" ? (
                            <span className="px-2 py-0.5 rounded-sm bg-red-500/10 text-red-400 font-mono text-[9px] font-bold">Refunded</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {b.paymentStatus === "paid" && (
                              <button
                                onClick={() => handleRefundClick(b.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold"
                              >
                                <Undo className="w-3 h-3" />
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBookingClick(b.id)}
                              className="p-1 rounded bg-cinema-gray text-slate-400 hover:text-white"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PROMOTIONS / COUPONS */}
          {activeTab === "promos" && (
            <div id="tab-promos-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Coupons & Promotions</h3>
                <p className="text-xs text-cinema-text-muted">Create custom coupon discounts for users to utilize during booking flow.</p>
              </div>

              {/* Add Promo Form */}
              <form onSubmit={handlePromoSubmit} className="bg-cinema-card border border-cinema-gray rounded-xl p-5 flex flex-col gap-4">
                <h4 className="font-display font-bold text-xs text-gold-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Create Promotional Offer
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Promo Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student Midweek Discount"
                      value={promoForm.title}
                      onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Coupon Code (Uppercase)</label>
                    <input
                      type="text"
                      required
                      placeholder="STUDENT20"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Discount Percent (%)</label>
                    <input
                      type="number"
                      required
                      value={promoForm.discountPercent}
                      onChange={(e) => setPromoForm({ ...promoForm, discountPercent: Number(e.target.value) })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={promoForm.expiryDate}
                      onChange={(e) => setPromoForm({ ...promoForm, expiryDate: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono cursor-pointer scheme-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Graphic Image URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={promoForm.image}
                      onChange={(e) => setPromoForm({ ...promoForm, image: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Badge Label (e.g. Family pack)</label>
                    <input
                      type="text"
                      value={promoForm.badge}
                      onChange={(e) => setPromoForm({ ...promoForm, badge: e.target.value })}
                      className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Offer Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide details about conditions and how to redeem."
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    className="w-full bg-cinema-black border border-cinema-gray rounded-lg p-2.5 text-xs text-white mt-1 focus:outline-none"
                  />
                </div>

                {promoSuccess && <p className="text-xs text-gold-400 font-semibold">{promoSuccess}</p>}

                <button
                  type="submit"
                  className="py-2.5 rounded-lg bg-gold-500 text-cinema-black hover:bg-gold-600 font-bold text-xs self-start px-8 transition-colors mt-2 cursor-pointer"
                >
                  Create Promo Code
                </button>
              </form>

              {/* Promo list */}
              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cinema-gray/80 text-slate-500">
                      <th className="py-2.5">Promo Title</th>
                      <th className="py-2.5 text-center">Code</th>
                      <th className="py-2.5 text-center">Discount</th>
                      <th className="py-2.5 font-mono">Expiry</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-gray/50">
                    {initialDb.promotions.map((p) => (
                      <tr key={p.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-2.5">
                          <p className="font-bold text-white">{p.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{p.badge}</p>
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-gold-500">{p.code}</td>
                        <td className="py-2.5 text-center font-mono font-bold text-white">{p.discountPercent}%</td>
                        <td className="py-2.5 font-mono text-slate-400">{p.expiryDate}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeletePromoClick(p.id)}
                            className="p-1.5 rounded bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CINEMA SETTINGS */}
          {activeTab === "settings" && (
            <div id="tab-settings-panel" className="flex flex-col gap-6">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Cinema Settings</h3>
                <p className="text-xs text-cinema-text-muted">Live-edit the Islamabad branch address, social linkages, about and mission content.</p>
              </div>

              <form onSubmit={handleSettingsSubmit} className="bg-cinema-card border border-cinema-gray rounded-xl p-5 flex flex-col gap-5">
                <h4 className="font-display font-bold text-xs text-gold-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  Update Branch details & Metadata
                </h4>

                {/* Section A: Contact coords */}
                <div>
                  <h5 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-3 border-b border-cinema-gray/40 pb-1">1. Location & Contacts</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cinema Name</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Contact Phone Number</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Contact Email</label>
                      <input
                        type="email"
                        required
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Physical Address (Islamabad, Pakistan)</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Opening Hours */}
                <div className="border-t border-cinema-gray/60 pt-4">
                  <h5 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-3 border-b border-cinema-gray/40 pb-1">2. Opening hours</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Weekdays Timing</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.openingHours.weekdays}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          openingHours: { ...settingsForm.openingHours, weekdays: e.target.value }
                        })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Weekends Timing</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.openingHours.weekends}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          openingHours: { ...settingsForm.openingHours, weekends: e.target.value }
                        })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Brand Biography Texts */}
                <div className="border-t border-cinema-gray/60 pt-4">
                  <h5 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-3 border-b border-cinema-gray/40 pb-1">3. Editorial Brand story</h5>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Our History Narrative</label>
                      <textarea
                        rows={3}
                        required
                        value={settingsForm.aboutHistory}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutHistory: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg p-3 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Our Mission Statement</label>
                      <textarea
                        rows={2}
                        required
                        value={settingsForm.aboutMission}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutMission: e.target.value })}
                        className="w-full bg-cinema-black border border-cinema-gray rounded-lg p-3 text-xs text-white mt-1 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {settingsSuccess && <p className="text-xs text-gold-400 font-semibold">{settingsSuccess}</p>}

                <button
                  type="submit"
                  className="py-2.5 rounded-lg bg-gold-500 text-cinema-black hover:bg-gold-600 font-bold text-xs self-start px-8 transition-colors cursor-pointer"
                >
                  Save CMS Configurations
                </button>
              </form>

              {/* Offline Portability, Backup & Migration */}
              <div className="bg-cinema-card border border-cinema-gray rounded-xl p-5 flex flex-col gap-4 shadow-lg">
                <div className="flex items-center gap-2 text-gold-500 border-b border-cinema-gray/40 pb-2">
                  <Database className="w-4 h-4 text-gold-500" />
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                    Database Backup, Migration & Portability
                  </h4>
                </div>
                
                <p className="text-xs text-cinema-text-muted leading-relaxed">
                  This website operates <strong>100% serverless</strong> with data securely backed by your browser's local sandbox storage. This means there are <strong>no server fees, database subscriptions, or hosting costs</strong>. 
                  To transfer your full database setup (including added films, custom showtimes, and user booking logs) to another device, browser, or server, download a local backup file below.
                </p>

                <div className="flex flex-wrap gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleExportDatabase}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Backup (.json)
                  </button>
                  
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cinema-black hover:bg-cinema-gray border border-cinema-gray text-slate-300 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>Upload & Restore (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDatabase}
                      className="hidden"
                    />
                  </label>
                </div>

                {backupMessage && (
                  <p className={`text-[11px] font-mono font-bold uppercase tracking-wider mt-2 px-3.5 py-3 rounded-lg border ${
                    backupError 
                      ? "text-red-400 bg-red-500/5 border-red-500/10" 
                      : "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                  }`}>
                    {backupMessage}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Custom HTML iframe-friendly Confirmation modal overlay */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0b0c10] border border-red-500/25 max-w-md w-full rounded-lg p-6 shadow-2xl shadow-red-900/10 animate-fade-in">
            <div className="flex items-center gap-3.5 text-red-400 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Confirm Delete Action</h4>
                <p className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-widest mt-0.5">Cascade Danger Zone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-white">"{deleteConfirmation.title}"</strong>?
              {deleteConfirmation.type === "movie" && " This will also cascade delete all scheduled showtimes and bookings associated with this movie."}
              {deleteConfirmation.type === "refund" && " This will cancel the booking, release all seat reservations back to open slots, and update status."}
              {deleteConfirmation.type === "showtime" && " This will cancel the screening schedule and release bookings."}
              &nbsp;This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 font-bold text-[10.5px] uppercase tracking-wider font-mono">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded bg-cinema-gray text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-5 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-all cursor-pointer shadow-lg shadow-red-600/10"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom floaty visual notification banner */}
      {adminNotification && (
        <div className="fixed bottom-6 right-6 z-[101] max-w-sm w-full bg-[#0d0e12] border border-cinema-gray rounded-lg p-4 shadow-2xl flex gap-3 animate-slide-in">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
            adminNotification.isError 
              ? "bg-red-500/10 text-red-400 border-red-500/20" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            {adminNotification.isError ? <Shield className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div className="flex-grow">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CMS System Bulletin</span>
            <p className="text-[11px] text-slate-200 mt-1">{adminNotification.message}</p>
          </div>
          <button 
            onClick={() => setAdminNotification(null)}
            className="text-slate-500 hover:text-white self-start"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Simple internal icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
