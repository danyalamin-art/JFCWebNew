import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Film, Armchair, ChevronRight, ChevronLeft, ShoppingBag, CreditCard, Ticket, Check, Sparkles, RefreshCw, Smartphone, Mail, User } from "lucide-react";
import { Movie, Showtime, SnackItem, Promotion, Booking, BookingFoodItem } from "../types";
import { createBooking } from "../lib/api";

interface BookingFlowProps {
  movies: Movie[];
  showtimes: Showtime[];
  snacks: SnackItem[];
  promotions: Promotion[];
  preselectedMovieId: string | null;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export default function BookingFlow({
  movies,
  showtimes,
  snacks,
  promotions,
  preselectedMovieId,
  onClose,
  onBookingSuccess
}: BookingFlowProps) {
  // Wizard state
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedCinema, setSelectedCinema] = useState<string>("JFC Cineplex - DHA Phase II, Islamabad");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedSnacks, setSelectedSnacks] = useState<{ [snackId: string]: number }>({});
  
  // Coupon & Checkout
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState<string>("");

  // Customer Contact
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  
  // Demo checkout acknowledgement (no real card processing)
  const [demoAcknowledged, setDemoAcknowledged] = useState(false);

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>("");
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const cinemas = ["JFC Cineplex — DHA Phase II, Islamabad"];

  // Initialize with preselected movie if available
  useEffect(() => {
    if (preselectedMovieId) {
      const movie = movies.find(m => m.id === preselectedMovieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  }, [preselectedMovieId, movies]);

  // Extract dates available for the selected movie
  const getDatesForMovie = () => {
    if (!selectedMovie) return [];
    const movieShowtimes = showtimes.filter(s => s.movieId === selectedMovie.id);
    const uniqueDates = Array.from(new Set(movieShowtimes.map(s => s.date)));
    return uniqueDates.sort();
  };

  // Extract showtimes for the selected movie and date
  const getShowtimesForMovieAndDate = () => {
    if (!selectedMovie || !selectedDate) return [];
    return showtimes.filter(s => s.movieId === selectedMovie.id && s.date === selectedDate);
  };

  // Reset states on backward flow
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setSelectedDate("");
    setSelectedShowtime(null);
    setSelectedSeats([]);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedShowtime(null);
    setSelectedSeats([]);
  };

  const handleSelectShowtime = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
  };

  // Seat map parameters
  // Rows A to G (A-D standard, E-G VIP)
  const rows = ["A", "B", "C", "D", "E", "F", "G"];
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  const getSeatType = (row: string) => {
    return ["E", "F", "G"].includes(row) ? "VIP" : "Standard";
  };

  const getSeatPrice = (row: string) => {
    if (!selectedShowtime) return 0;
    const isVip = getSeatType(row) === "VIP";
    return isVip ? selectedShowtime.price + 500 : selectedShowtime.price;
  };

  const isSeatBooked = (row: string, col: number) => {
    if (!selectedShowtime) return false;
    const seatId = `${row}${col}`;
    return selectedShowtime.seatsBooked.includes(seatId);
  };

  const toggleSeat = (row: string, col: number) => {
    const seatId = `${row}${col}`;
    if (isSeatBooked(row, col)) return; // Can't book already booked seat
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Seat Price Calculation
  const calculateTicketsSubtotal = () => {
    return selectedSeats.reduce((sum, seatId) => {
      const row = seatId.charAt(0);
      return sum + getSeatPrice(row);
    }, 0);
  };

  // Snack calculations
  const handleUpdateSnackQty = (snackId: string, diff: number) => {
    const current = selectedSnacks[snackId] || 0;
    const nextVal = Math.max(0, current + diff);
    setSelectedSnacks({
      ...selectedSnacks,
      [snackId]: nextVal
    });
  };

  const calculateSnacksSubtotal = () => {
    return (Object.entries(selectedSnacks) as [string, number][]).reduce((sum, [id, qty]) => {
      const item = snacks.find(s => s.id === id);
      if (!item) return sum;
      return sum + item.price * qty;
    }, 0);
  };

  // Totals
  const subtotal = calculateTicketsSubtotal() + calculateSnacksSubtotal();
  const discount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const total = subtotal - discount;

  // Apply Coupon
  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    const promo = promotions.find(p => p.code.toUpperCase() === couponCode.toUpperCase().trim());
    
    if (promo) {
      // Check expiry (mock checked as always valid for now since we have a relative year, but let's encourage use)
      setAppliedCoupon(promo);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try STUDENT20 or FAMILY15!");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Final Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError("");

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setSubmissionError("Please fill out all contact information fields.");
      return;
    }

    if (!demoAcknowledged) {
      setSubmissionError("Please confirm you understand this is a demo reservation (no real payment).");
      return;
    }

    // Basic contact validation for testing
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setSubmissionError("Please enter a valid email address.");
      return;
    }
    if (customerPhone.replace(/\D/g, "").length < 10) {
      setSubmissionError("Please enter a valid mobile number (at least 10 digits).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Structure food items
      const foodItemsArray: BookingFoodItem[] = (Object.entries(selectedSnacks) as [string, number][])
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = snacks.find(s => s.id === id)!;
          return {
            id,
            name: item.name,
            quantity: qty,
            price: item.price
          };
        });

      const booking = await createBooking({
        showtimeId: selectedShowtime!.id,
        seats: selectedSeats,
        foodItems: foodItemsArray,
        customerName,
        customerEmail,
        customerPhone,
        subtotal,
        discount,
        total
      });

      setCompletedBooking(booking);
      setStep(5); // Jump to confirmation
      onBookingSuccess();
    } catch (err: any) {
      setSubmissionError(err.message || "An error occurred during booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format currency
  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  const stepperLabels = ["Session Selection", "Seats", "Snacks", "Checkout", "Confirmation"];

  return (
    <div id="booking-flow-container" className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="border-b border-white/5 bg-cinema-card/55 sticky top-0 z-10 py-4 px-4 sm:px-6 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-gold-500" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Online Ticket Booking
              </h2>
              <p className="text-[10px] text-gold-500 font-mono uppercase tracking-wider">
                JFC Cineplex Islamabad
              </p>
            </div>
          </div>
          <button
            id="close-booking-flow"
            onClick={onClose}
            className="p-2.5 rounded-sm bg-white/5 hover:bg-red-600/20 hover:text-red-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Wizard Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Stepper Progress bar */}
        <div id="booking-stepper" className="mb-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-gold-600 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (stepperLabels.length - 1)) * 100}%` }}
            />

            {stepperLabels.map((label, idx) => {
              const currentStepNum = idx + 1;
              const isCompleted = step > currentStepNum;
              const isActive = step === currentStepNum;

              return (
                <div key={label} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                      isCompleted
                        ? "bg-gold-600 border-gold-600 text-black shadow-lg shadow-gold-600/10"
                        : isActive
                        ? "bg-white/5 border-gold-500 text-gold-500"
                        : "bg-black border-white/5 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : currentStepNum}
                  </div>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold mt-1.5 hidden sm:block ${
                      isActive ? "text-gold-500" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Step Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Stage Grid (Left 2 Columns) */}
          <div className="lg:col-span-2 bg-cinema-card/55 border border-white/5 rounded-lg p-6 shadow-xl min-h-[450px] flex flex-col">
            
            {/* STEP 1: CONSOLIDATED SESSION SELECTION */}
            {step === 1 && (
              <div id="step-session-selection" className="flex flex-col h-full animate-fade-in gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                    Book Your Movie Ticket
                  </h3>
                  <p className="text-[10px] text-cinema-text-muted uppercase tracking-wider">
                    Select Cinema, Movie, Date, and Time to begin seat allocation.
                  </p>
                </div>

                {/* 1. Cinema Selection */}
                <div className="border-t border-white/5 pt-4">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5 font-bold">
                    1. Select Cinema Location
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cinemas.map((cinema) => (
                      <button
                        key={cinema}
                        type="button"
                        onClick={() => setSelectedCinema(cinema)}
                        className={`p-3 rounded-sm border text-left transition-all cursor-pointer ${
                          selectedCinema === cinema
                            ? "border-gold-500 bg-white/5 text-gold-500 font-bold"
                            : "border-white/5 bg-black/20 text-slate-300 hover:border-white/10"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider block font-bold">{cinema.split(" - ")[0]}</span>
                        <span className="text-[9px] text-cinema-text-muted mt-0.5 block">{cinema.split(" - ")[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Movie Selection */}
                <div className="border-t border-white/5 pt-4">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5 font-bold">
                    2. Select Movie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {movies.filter(m => !m.isComingSoon).map((movie) => {
                      const isSelected = selectedMovie?.id === movie.id;
                      return (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => handleSelectMovie(movie)}
                          className={`flex flex-col items-center p-2 rounded-sm border transition-all text-center h-full cursor-pointer ${
                            isSelected
                              ? "border-gold-500 bg-white/5 shadow-md scale-98"
                              : "border-white/5 bg-black/20 hover:border-white/10"
                          }`}
                        >
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full aspect-[2/3] rounded-sm object-cover border border-white/5 mb-1.5"
                            referrerPolicy="no-referrer"
                          />
                          <span className={`text-[10px] uppercase tracking-wider font-bold block line-clamp-1 ${isSelected ? 'text-gold-500' : 'text-slate-200'}`}>
                            {movie.title}
                          </span>
                          <span className="text-[8px] text-cinema-text-muted uppercase mt-0.5 block">
                            {movie.ageRating} • {movie.runtime}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Date Selection */}
                <div className="border-t border-white/5 pt-4">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5 font-bold">
                    3. Select Screening Date
                  </label>
                  {selectedMovie ? (
                    <div className="flex flex-wrap gap-2 animate-fade-in">
                      {getDatesForMovie().map((dateStr) => {
                        const [year, month, day] = dateStr.split("-");
                        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                        const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleSelectDate(dateStr)}
                            className={`p-2.5 rounded-sm flex flex-col items-center min-w-[65px] border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-gold-600 text-black border-gold-500 font-bold shadow-lg shadow-gold-600/10"
                                : "bg-black/35 border-white/5 text-slate-300 hover:border-gold-500/25"
                            }`}
                          >
                            <span className="text-[8px] uppercase tracking-wider font-bold">{weekday}</span>
                            <span className="text-sm font-bold my-0.5 font-mono">{day}</span>
                            <span className="text-[8px] uppercase tracking-wider font-bold">{monthName}</span>
                          </button>
                        );
                      })}
                      {getDatesForMovie().length === 0 && (
                        <div className="p-4 text-center text-cinema-text-muted border border-dashed border-white/5 rounded-sm w-full font-mono text-[9px] uppercase tracking-wider">
                          No active schedules found for this movie. Check back soon or select another movie.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 bg-black/10 border border-white/5 border-dashed rounded-sm text-[9px] uppercase font-bold tracking-wider">
                      Please select a movie to view available dates
                    </div>
                  )}
                </div>

                {/* 4. Showtime Selection */}
                <div className="border-t border-white/5 pt-4">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2.5 font-bold">
                    4. Choose Show Time
                  </label>
                  {selectedMovie && selectedDate ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                      {getShowtimesForMovieAndDate().map((sh) => {
                        const availableSeats = sh.seatsTotal - sh.seatsBooked.length;
                        const pct = (availableSeats / sh.seatsTotal) * 100;
                        let seatStatusColor = "text-emerald-400";
                        if (pct < 15) seatStatusColor = "text-red-400";
                        else if (pct < 40) seatStatusColor = "text-amber-400";

                        const isSelected = selectedShowtime?.id === sh.id;
                        return (
                          <button
                            key={sh.id}
                            type="button"
                            onClick={() => handleSelectShowtime(sh)}
                            className={`p-3 rounded-sm border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? "border-gold-500 bg-white/5"
                                : "border-white/5 bg-black/20 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-sm flex flex-col items-center justify-center font-mono font-bold text-[10px] border shrink-0 ${
                                isSelected ? 'bg-gold-500/15 border-gold-500 text-gold-500' : 'bg-white/5 border-white/5 text-slate-300'
                              }`}>
                                <Clock className="w-3.5 h-3.5 mb-0.5" />
                                {sh.time}
                              </div>
                              <div>
                                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-gold-500' : 'text-white'}`}>{sh.hall}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[8px] font-mono font-bold bg-gold-600/10 text-gold-500 px-1 py-0.5 rounded-sm border border-white/5">
                                    {sh.format}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wide">
                                    {formatRs(sh.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${seatStatusColor} block`}>
                                {availableSeats} left
                              </span>
                              <span className="text-[8px] font-mono text-cinema-text-muted mt-0.5 uppercase tracking-wider block">
                                of {sh.seatsTotal} seats
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {getShowtimesForMovieAndDate().length === 0 && (
                        <div className="p-4 col-span-2 text-center text-cinema-text-muted border border-dashed border-white/5 rounded-sm w-full font-mono text-[9px] uppercase tracking-wider">
                          No active times found for this date.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 bg-black/10 border border-white/5 border-dashed rounded-sm text-[9px] uppercase font-bold tracking-wider">
                      Please select a date to view show times
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: INTERACTIVE SEAT SELECTION */}
            {step === 2 && selectedShowtime && (
              <div id="step-select-seats" className="flex flex-col items-center h-full animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white self-start mb-1">
                  Select Your Seats
                </h3>
                <p className="text-[10px] text-cinema-text-muted uppercase tracking-wider self-start mb-6">
                  Click seats on the map. Recliners (Rows E-G) include VIP pricing (+Rs. 500).
                </p>

                {/* Curved Screen Banner */}
                <div className="w-full max-w-[420px] mb-8 relative flex flex-col items-center">
                  <div className="w-full h-3 bg-gradient-to-b from-sky-400/10 to-transparent rounded-full blur-xs" />
                  <div className="w-full h-1 bg-gradient-to-r from-sky-500/40 via-sky-300/60 to-sky-500/40 rounded-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]" />
                  <span className="font-mono text-[9px] text-sky-400/60 font-bold uppercase tracking-widest mt-2">
                    SCREEN THIS WAY
                  </span>
                </div>

                {/* Seat Matrix Grid */}
                <div className="overflow-x-auto w-full max-w-lg mb-8 bg-black/45 p-4 rounded-lg border border-white/5">
                  <div className="min-w-[400px] flex flex-col gap-2.5">
                    {rows.map((row) => {
                      const isVipRow = ["E", "F", "G"].includes(row);
                      return (
                        <div key={row} className="flex items-center gap-3">
                          {/* Row Indicator */}
                          <span className="w-5 font-mono text-xs font-bold text-slate-500 text-center">
                            {row}
                          </span>

                          {/* Seats Row */}
                          <div className="flex justify-between flex-grow">
                            {cols.map((col) => {
                              const seatId = `${row}${col}`;
                              const booked = isSeatBooked(row, col);
                              const selected = selectedSeats.includes(seatId);

                              // Color logic
                              let btnClass = "";
                              if (booked) {
                                btnClass = "bg-white/5 border-white/5 text-slate-600 cursor-not-allowed";
                              } else if (selected) {
                                btnClass = "bg-gold-600 border-gold-600 text-black shadow-lg shadow-gold-600/15";
                              } else if (isVipRow) {
                                btnClass = "bg-gold-500/10 border-gold-500/30 text-gold-400 hover:bg-gold-500/20";
                              } else {
                                btnClass = "bg-slate-900/60 border-white/5 hover:bg-slate-800 text-slate-300";
                              }

                              return (
                                <button
                                  key={col}
                                  id={`seat-cell-${seatId}`}
                                  disabled={booked}
                                  onClick={() => toggleSeat(row, col)}
                                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm border flex items-center justify-center font-mono text-[9px] font-bold transition-all ${btnClass}`}
                                  title={`${seatId} (${isVipRow ? "VIP Class" : "Standard Class"})`}
                                >
                                  {booked ? "✖" : col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-t border-white/5 pt-4 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-900 border border-white/5" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-gold-500/10 border border-gold-500/30" />
                    <span>VIP (Recliner)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-gold-600 border border-gold-600" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm bg-white/5 border border-white/5 text-slate-600 flex items-center justify-center text-[7px] font-bold">✖</div>
                    <span>Booked</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ADD FOOD & DRINKS */}
            {step === 3 && (
              <div id="step-add-food" className="animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                  Pre-order Popcorn & Drinks (Optional)
                </h3>
                <p className="text-[10px] text-cinema-text-muted uppercase tracking-wider mb-6">
                  Avoid long queue standups! Pre-order fresh, delicious snacks at discounted prices.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
                  {snacks.map(sn => {
                    const qty = selectedSnacks[sn.id] || 0;
                    return (
                      <div
                        key={sn.id}
                        className="flex gap-3 p-3 rounded-lg border border-white/5 bg-black/45 items-center hover:border-white/10 transition-colors"
                      >
                        <img
                          src={sn.image}
                          alt={sn.name}
                          className="w-14 h-14 rounded-sm object-cover bg-white/5 shrink-0 border border-white/5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-grow">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white leading-tight">{sn.name}</h4>
                          <p className="text-[10px] text-cinema-text-muted mt-1 line-clamp-1 uppercase tracking-wide">{sn.description}</p>
                          <p className="text-xs text-gold-500 font-bold mt-1.5 font-mono">{formatRs(sn.price)}</p>
                        </div>
                        
                        {/* Counters */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateSnackQty(sn.id, -1)}
                            className="w-6 h-6 rounded-sm bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer border border-white/5"
                          >
                            -
                          </button>
                          <span className="w-4 font-mono text-center text-xs text-white font-bold">{qty}</span>
                          <button
                            onClick={() => handleUpdateSnackQty(sn.id, 1)}
                            className="w-6 h-6 rounded-sm bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer border border-white/5"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: CHECKOUT & PAYMENT */}
            {step === 4 && (
              <div id="step-checkout" className="animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                  Checkout
                </h3>
                <p className="text-[10px] text-cinema-text-muted uppercase tracking-wider mb-6">
                  Confirm your details and reserve seats. Payment gateway can be connected later.
                </p>

                <form onSubmit={handleCheckout} className="flex flex-col gap-5">
                  {/* Contact Credentials */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">
                      1. Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 pl-10 text-xs text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          placeholder="Email Address"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 pl-10 text-xs text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="Mobile Number"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-black/45 border border-white/5 rounded-sm px-4 py-3 pl-10 text-xs text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demo payment notice */}
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">
                      2. Payment
                    </h4>
                    <div className="bg-gold-500/5 border border-gold-500/20 rounded-sm p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white font-semibold">Demo reservation mode</p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            No real card is charged. Seats are reserved in the JFC system for testing.
                            Live JazzCash / card payments can be plugged in later.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={demoAcknowledged}
                          onChange={(e) => setDemoAcknowledged(e.target.checked)}
                          className="mt-0.5 accent-amber-500"
                        />
                        <span className="text-[11px] text-slate-300 leading-snug">
                          I understand this is a <strong className="text-gold-500">demo booking</strong> with no real payment.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Coupon Codes Panel */}
                  <div className="border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">
                      3. Promo Coupon Code
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. STUDENT20, FAMILY15"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className="bg-black/45 border border-white/5 rounded-sm px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500 uppercase font-mono flex-grow"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-4 py-2 rounded-sm bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs uppercase tracking-wider border border-white/5 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {couponError && <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mt-1">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-[10px] text-gold-500 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        Code "{appliedCoupon.code}" applied! Flat {appliedCoupon.discountPercent}% Discount.
                      </p>
                    )}
                  </div>

                  {submissionError && (
                    <div className="p-3 rounded-sm bg-red-600/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider mt-2 text-center">
                      {submissionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-xs text-black bg-gold-600 hover:bg-gold-500 uppercase tracking-widest active:scale-98 transition-all shadow-lg shadow-gold-600/10 mt-4 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Ticket Seat Reservation...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        Confirm & Reserve {formatRs(total)}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 5: CONFIRMATION & DIGITAL TICKET TICKET */}
            {step === 5 && completedBooking && (
              <div id="step-confirmation" className="text-center py-6 animate-fade-in">
                <div className="w-12 h-12 bg-gold-600/10 border border-white/5 rounded-sm flex items-center justify-center text-gold-500 mx-auto mb-5 shadow-inner">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
                  Booking Confirmed!
                </h3>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed uppercase tracking-wide">
                  Your seat reservation at <span className="text-gold-500 font-bold">{selectedCinema}</span> is successfully logged. Present your voucher QR code at our gate check.
                </p>

                {/* Print/Ticket Design card */}
                <div className="bg-cinema-card/55 border border-white/5 rounded-lg max-w-xs mx-auto overflow-hidden shadow-2xl relative text-left">
                  {/* Decorative Ticket side slots */}
                  <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#050505] z-10 border-r border-white/5" />
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#050505] z-10 border-l border-white/5" />

                  {/* Top segment */}
                  <div className="p-5 border-b border-dashed border-white/5 pb-6">
                    <div className="flex gap-4">
                      <img
                        src={completedBooking.moviePoster}
                        alt={completedBooking.movieTitle}
                        className="w-14 h-20 rounded-sm object-cover bg-white/5 shrink-0 shadow-lg border border-white/5"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white leading-tight">
                          {completedBooking.movieTitle}
                        </h4>
                        <div className="flex gap-1.5 items-center mt-1.5">
                          <span className="text-[9px] font-mono font-bold bg-gold-600 text-black px-1.5 py-0.5 rounded-sm">
                            {completedBooking.format}
                          </span>
                          <span className="text-[10px] text-cinema-text-muted uppercase tracking-wide">{completedBooking.hall}</span>
                        </div>
                        <p className="font-mono text-[9px] font-bold text-gold-500 mt-2 uppercase tracking-wide">
                          ID: {completedBooking.id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Date</span>
                        <span className="text-xs font-semibold text-white">
                          {new Date(completedBooking.date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Time</span>
                        <span className="text-xs font-semibold text-white">{completedBooking.time}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Seats</span>
                        <span className="text-xs font-bold text-gold-500 font-mono">
                          {completedBooking.seats.join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Holder</span>
                        <span className="text-xs font-semibold text-white truncate max-w-[120px] block">
                          {completedBooking.customerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Ticket segment with QR code */}
                  <div className="p-5 bg-black/45 flex flex-col items-center">
                    {/* Visual QR Code box */}
                    <div className="w-28 h-28 bg-white rounded-sm p-2 shadow-lg flex flex-col justify-center items-center mb-3">
                      {/* Simple vector representation of QR code */}
                      <div className="grid grid-cols-5 gap-1 w-full h-full opacity-90">
                        {Array.from({ length: 25 }, (_, i) => {
                          const isDark = (i * 7 + 13) % 5 < 3 || i % 6 === 0 || i < 5 || i % 5 === 0;
                          return (
                            <div
                              key={i}
                              className={`rounded-xs ${isDark ? "bg-black" : "bg-transparent"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                      PRESENT AT GATE
                    </span>
                    <span className="text-xs text-gold-500 font-mono font-bold tracking-widest">
                      {completedBooking.qrCodeValue}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center mt-8">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-sm bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-white/5"
                  >
                    Print Voucher
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-sm bg-gold-600 hover:bg-gold-500 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Done & Return
                  </button>
                </div>
              </div>
            )}

            {/* Controls (Stepper bottom footer) */}
            {step < 5 && (
              <div id="booking-wizard-controls" className="border-t border-white/5 pt-5 mt-auto flex items-center justify-between">
                <button
                  id="wizard-back-btn"
                  disabled={step === 1}
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-0 transition-all cursor-pointer border border-white/5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                {/* Conditional Next indicators */}
                {step === 1 && selectedShowtime && (
                  <button
                    id="wizard-next-btn-1"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-gold-600 hover:bg-gold-500 text-black cursor-pointer"
                  >
                    Continue to Seats
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
                {step === 2 && selectedSeats.length > 0 && (
                  <button
                    id="wizard-next-btn-2"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-gold-600 hover:bg-gold-500 text-black cursor-pointer"
                  >
                    Continue to Food
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
                {step === 3 && (
                  <button
                    id="wizard-next-btn-3"
                    onClick={() => setStep(4)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-gold-600 hover:bg-gold-500 text-black cursor-pointer"
                  >
                    Proceed to Checkout
                    <ChevronRight className="w-3.5 h-3.5 text-black" />
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Checkout/Summary Sidebar (Right 1 Column) */}
          <div className="bg-black/35 border border-white/5 rounded-sm p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Booking Summary
            </h3>

            {selectedCinema && (
              <div className="bg-gold-600/10 border border-gold-500/20 rounded-sm p-2 text-center text-gold-500 text-[10px] uppercase font-bold tracking-wider">
                📍 {selectedCinema}
              </div>
            )}

            {selectedMovie ? (
              <div className="flex gap-3">
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="w-12 h-16 rounded-sm object-cover bg-white/5 shrink-0 border border-white/5"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white leading-tight line-clamp-2">
                    {selectedMovie.title}
                  </h4>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    <span className="text-[8px] font-mono font-bold bg-white/5 text-slate-300 px-1 py-0.5 rounded-sm border border-white/5">
                      {selectedMovie.ageRating}
                    </span>
                    <span className="text-[10px] text-cinema-text-muted font-bold uppercase tracking-wide">{selectedMovie.runtime} min</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-cinema-text-muted italic uppercase tracking-wider">No movie selected yet.</p>
            )}

            {/* Schedules selection details */}
            {(selectedDate || selectedShowtime) && (
              <div className="bg-black/20 rounded-sm p-3 border border-white/5 text-[10px] font-mono uppercase tracking-wider text-slate-300 flex flex-col gap-2">
                {selectedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold-500" />
                    <span>
                      {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                {selectedShowtime && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gold-500" />
                      <span>{selectedShowtime.time} ({selectedShowtime.format})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Armchair className="w-3.5 h-3.5 text-gold-500" />
                      <span>{selectedShowtime.hall}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Selected seats section */}
            {selectedSeats.length > 0 && (
              <div className="border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5 font-bold">Seats</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map(st => (
                    <span key={st} className="px-2 py-0.5 rounded-sm bg-gold-500/10 text-gold-500 text-[10px] font-mono font-bold border border-gold-500/20">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pre-ordered Food snacks */}
            {(Object.values(selectedSnacks) as number[]).some(q => q > 0) && (
              <div className="border-t border-white/5 pt-3">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1.5 font-bold">Pre-ordered Snacks</span>
                <div className="flex flex-col gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                  {(Object.entries(selectedSnacks) as [string, number][]).map(([snackId, qty]) => {
                    if (qty <= 0) return null;
                    const sn = snacks.find(s => s.id === snackId)!;
                    return (
                      <div key={snackId} className="flex justify-between items-center">
                        <span>{sn.name} <span className="text-gold-500 font-mono font-bold">x{qty}</span></span>
                        <span className="text-slate-400 font-mono">{formatRs(sn.price * qty)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Pricing Summary Block */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2 mt-auto">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="font-mono">{formatRs(calculateTicketsSubtotal())}</span>
              </div>
              
              {calculateSnacksSubtotal() > 0 && (
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <span>Snacks Subtotal</span>
                  <span className="font-mono">{formatRs(calculateSnacksSubtotal())}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-gold-500">
                  <span>Discount ({appliedCoupon.discountPercent}%)</span>
                  <span className="font-mono">-{formatRs(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] font-bold text-white border-t border-white/5 pt-3 uppercase tracking-wider">
                <span>Total Amount</span>
                <span className="font-mono text-gold-500 text-xs">{formatRs(total)}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
