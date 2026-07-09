import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseSchema, Movie, Showtime, SnackItem, Promotion, Testimonial, FAQ, Booking, CinemaSettings } from "./src/types";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Resolve db file path
const DB_FILE = path.join(process.cwd(), "db.json");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jfc-admin";
const adminSessions = new Set<string>();

// Initialize Gemini client only when key is present (optional fallback for movie fetch)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "jfc-cineplex",
        },
      },
    })
  : null;

// Helper to convert remote image URL to Base64 Data URI (uploading to our server local database)
async function urlToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Failed to convert image url to base64:", error);
    return url;
  }
}

// Helper to format dates relative to today
const getRelativeDateString = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Seed initial database
const getInitialDatabase = (): DatabaseSchema => {
  const movies: Movie[] = [
    {
      id: "movie-1",
      title: "Gladiator II",
      poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
      synopsis: "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius is forced to enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist. With rage in his heart and the future of the Empire at stake, Lucius must look to his past to find strength and honor to return the glory of Rome to its people.",
      cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington", "Connie Nielsen"],
      director: "Ridley Scott",
      producer: "Ridley Scott, Michael Pruss",
      genre: ["Action", "Drama", "History"],
      language: ["English"],
      formats: ["2D", "IMAX"],
      releaseDate: getRelativeDateString(-14),
      runtime: 148,
      ageRating: "R",
      imdbRating: 7.2,
      trailerUrl: "GP3U30gp7-c", // YouTube trailer ID
      gallery: [
        "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
      ],
      isComingSoon: false,
      isFeatured: true
    },
    {
      id: "movie-2",
      title: "Dune: Part Two",
      poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1547483238-f400e65ccd56?auto=format&fit=crop&w=1600&q=80",
      synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
      cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler", "Florence Pugh"],
      director: "Denis Villeneuve",
      producer: "Mary Parent, Cale Boyter, Denis Villeneuve",
      genre: ["Action", "Sci-Fi", "Adventure"],
      language: ["English"],
      formats: ["2D", "IMAX"],
      releaseDate: getRelativeDateString(-30),
      runtime: 166,
      ageRating: "PG-13",
      imdbRating: 8.6,
      trailerUrl: "Way9Dexny3w",
      gallery: [
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
      ],
      isComingSoon: false,
      isFeatured: false
    },
    {
      id: "movie-3",
      title: "Oppenheimer",
      poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
      synopsis: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, tracing his triumphs and subsequent security hearings in a paranoid post-war America.",
      cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
      director: "Christopher Nolan",
      producer: "Emma Thomas, Charles Roven, Christopher Nolan",
      genre: ["Biography", "Drama", "History"],
      language: ["English"],
      formats: ["2D", "IMAX"],
      releaseDate: getRelativeDateString(-120),
      runtime: 180,
      ageRating: "R",
      imdbRating: 8.9,
      trailerUrl: "uYPbbksJxIg",
      gallery: [],
      isComingSoon: false,
      isFeatured: false
    },
    {
      id: "movie-4",
      title: "Inside Out 2",
      poster: "https://images.unsplash.com/photo-1608889174639-414d9bfe6d4d?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
      synopsis: "Joy, Sadness, Anger, Fear and Disgust, who’ve been running a successful operation by all accounts, aren’t sure how to feel when Anxiety shows up. And it looks like she’s not alone as teenage life brings new emotions to headquarters.",
      cast: ["Amy Poehler", "Maya Hawke", "Phyllis Smith", "Lewis Black"],
      director: "Kelsey Mann",
      producer: "Mark Nielsen",
      genre: ["Animation", "Adventure", "Comedy", "Family"],
      language: ["English", "Hindi"],
      formats: ["2D", "3D"],
      releaseDate: getRelativeDateString(-5),
      runtime: 96,
      ageRating: "PG",
      imdbRating: 7.7,
      trailerUrl: "LEjhYvZ8zjs",
      gallery: [],
      isComingSoon: false,
      isFeatured: false
    },
    {
      id: "movie-5",
      title: "Avatar: Fire and Ash",
      poster: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
      synopsis: "The third installment of James Cameron's Avatar saga. Following the events of The Way of Water, Jake Sully and Neytiri travel across Pandora to encounter a aggressive and powerful new tribe of Na'vi known as the 'Ash People', who reside in volcanic, dark environments.",
      cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Kate Winslet", "Oona Chaplin"],
      director: "James Cameron",
      producer: "James Cameron, Jon Landau",
      genre: ["Action", "Sci-Fi", "Adventure"],
      language: ["English"],
      formats: ["2D", "3D", "IMAX"],
      releaseDate: "2026-12-18",
      runtime: 160,
      ageRating: "PG-13",
      imdbRating: 0,
      trailerUrl: "K7v3KRE8B5M",
      gallery: [],
      isComingSoon: true,
      isFeatured: false
    },
    {
      id: "movie-6",
      title: "Avengers: Doomsday",
      poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80",
      banner: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=1600&q=80",
      synopsis: "The Avengers assemble once again to face an unprecedented threat: Victor von Doom, returning from another reality with reality-altering cosmic power. Earth's mightiest heroes must join forces with new allies to save the multiverse from total annihilation.",
      cast: ["Robert Downey Jr.", "Pedro Pascal", "Tom Holland", "Florence Pugh", "Benedict Cumberbatch"],
      director: "Anthony Russo, Joe Russo",
      producer: "Kevin Feige",
      genre: ["Action", "Sci-Fi", "Adventure"],
      language: ["English"],
      formats: ["2D", "3D", "IMAX"],
      releaseDate: "2026-05-01",
      runtime: 150,
      ageRating: "PG-13",
      imdbRating: 0,
      trailerUrl: "h7b9b00W_mY",
      gallery: [],
      isComingSoon: true,
      isFeatured: false
    }
  ];

  // Dynamically generate showtimes for movies 1 to 4 for the next 5 days
  const showtimes: Showtime[] = [];
  const screens = [
    { hall: "Screen 1 (Standard)", format: "2D", price: 900 },
    { hall: "Screen 2 (Standard)", format: "3D", price: 1100 },
    { hall: "IMAX Theater", format: "IMAX", price: 1500 },
    { hall: "Gold Class VIP", format: "2D", price: 2000 }
  ];
  const times = ["12:00", "15:15", "18:30", "21:45"];

  const activeMovies = movies.filter(m => !m.isComingSoon);

  for (let i = 0; i < 5; i++) {
    const dateStr = getRelativeDateString(i);
    activeMovies.forEach((movie, mIdx) => {
      // Pick 2 screens and 2 times for each movie each day to keep showtimes reasonable but complete
      const screen1 = screens[mIdx % screens.length];
      const screen2 = screens[(mIdx + 2) % screens.length];

      showtimes.push({
        id: `showtime-${movie.id}-${i}-1`,
        movieId: movie.id,
        movieTitle: movie.title,
        date: dateStr,
        time: times[mIdx % times.length],
        hall: screen1.hall,
        format: screen1.format,
        price: screen1.price,
        seatsBooked: i === 0 ? ["B3", "B4", "C5"] : [], // Pre-book some for today's dynamic stats!
        seatsTotal: 120
      });

      showtimes.push({
        id: `showtime-${movie.id}-${i}-2`,
        movieId: movie.id,
        movieTitle: movie.title,
        date: dateStr,
        time: times[(mIdx + 2) % times.length],
        hall: screen2.hall,
        format: screen2.format,
        price: screen2.price,
        seatsBooked: i === 0 ? ["D4", "D5"] : [],
        seatsTotal: 120
      });
    });
  }

  const snacks: SnackItem[] = [
    {
      id: "snack-1",
      name: "Salted Butter Popcorn",
      category: "popcorn",
      price: 650,
      image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=400&q=80",
      description: "Warm, freshly popped kernels tossed in real premium butter and sea salt."
    },
    {
      id: "snack-2",
      name: "Gourmet Caramel Popcorn",
      category: "popcorn",
      price: 750,
      image: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=400&q=80",
      description: "Crisp and sweet popcorn coated in our signature house-made brown sugar caramel."
    },
    {
      id: "snack-3",
      name: "Mega Nachos Supreme",
      category: "nachos",
      price: 850,
      image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80",
      description: "Crispy corn tortilla chips served with warm melted jalapeno cheese sauce and sour cream."
    },
    {
      id: "snack-4",
      name: "JFC Double Beef Burger",
      category: "burgers",
      price: 950,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      description: "Juicy double beef patties with cheddar cheese, fresh lettuce, and signature house sauce."
    },
    {
      id: "snack-5",
      name: "Classic Cineplex Hotdog",
      category: "hotdogs",
      price: 700,
      image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=400&q=80",
      description: "Premium beef sausage in a warm toasted bun with mustard, ketchup, and relish."
    },
    {
      id: "snack-6",
      name: "Golden Spicy Fries",
      category: "fries",
      price: 450,
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80",
      description: "Skin-on thick cut potatoes fried to golden perfection and tossed in spicy cajun seasoning."
    },
    {
      id: "snack-7",
      name: "Ice Cold Fountain Drink",
      category: "drinks",
      price: 350,
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
      description: "Your choice of refreshing chilled Coke, Sprite, Fanta, or Diet Coke (Large)."
    },
    {
      id: "snack-8",
      name: "Solo Blockbuster Combo",
      category: "combos",
      price: 1100,
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",
      description: "1 Large Popcorn (Salted or Caramel) + 1 Large Drink + 1 packet of chocolates."
    },
    {
      id: "snack-9",
      name: "Couples Feast Combo",
      category: "combos",
      price: 1950,
      image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=400&q=80",
      description: "2 Large Popcorns + 2 Large Drinks + 1 Loaded Nachos Supreme - Perfect for two!"
    }
  ];

  const promotions: Promotion[] = [
    {
      id: "promo-1",
      title: "Student Midweek Discount",
      description: "Show a valid Student ID card at the ticket counter or use code STUDENT20 at checkout to get 20% flat discount on standard tickets every Monday to Wednesday.",
      code: "STUDENT20",
      discountPercent: 20,
      expiryDate: "2026-12-31",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=500&q=80",
      badge: "Student Deal"
    },
    {
      id: "promo-2",
      title: "Family Fun Deal",
      description: "Plan a family movie night! Book 4 or more tickets together and apply coupon FAMILY15 for a flat 15% discount on your entire cart including tickets and pre-order snacks.",
      code: "FAMILY15",
      discountPercent: 15,
      expiryDate: "2026-12-31",
      image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=500&q=80",
      badge: "Family Pack"
    },
    {
      id: "promo-3",
      title: "Weekend Madness Ticket Promo",
      description: "Enjoy movies in maximum format! Use code WEEKEND10 for a flat 10% off on all Friday, Saturday, and Sunday IMAX and Gold Class bookings.",
      code: "WEEKEND10",
      discountPercent: 10,
      expiryDate: "2026-12-31",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80",
      badge: "Weekend Offer"
    }
  ];

  const testimonials: Testimonial[] = [
    {
      id: "t-1",
      name: "Danyal Amin",
      rating: 5,
      comment: "Absolutely top tier cinema. JFC Cineplex has the best audio quality with Dolby Atmos and the IMAX screen makes action movies look breathtaking. Located safely in DHA Phase II Jacaranda Club.",
      date: "2026-06-15"
    },
    {
      id: "t-2",
      name: "Sana Khan",
      rating: 5,
      comment: "Highly recommend the Gold Class. The electronic recliners are super comfortable, they provide cozy blankets, and the snacks pre-order is incredibly efficient. My family love coming here.",
      date: "2026-07-02"
    },
    {
      id: "t-3",
      name: "Brig. (R) Tariq Mahmood",
      rating: 4.8,
      comment: "Very elegant, neat, and highly secure environment inside Jacaranda Family Club. Secure basement parking, friendly ticketing staff, and extremely fresh popcorn. The premium choice in Islamabad.",
      date: "2026-07-05"
    }
  ];

  const faqs: FAQ[] = [
    {
      id: "faq-1",
      question: "How do I book tickets online?",
      answer: "Click the 'Book Tickets' button, select your favorite movie, pick a date and showtime, choose your seats from our interactive seat map, optionally pre-order snacks, apply discount coupons, and checkout. You'll receive a digital ticket voucher instantly with a scannable QR code."
    },
    {
      id: "faq-2",
      question: "Where is JFC Cineplex located and is it open to the public?",
      answer: "We are located inside Jacaranda Family Club (JFC), Club Avenue, Sector E, DHA Phase II, Islamabad. Yes, the JFC Cineplex is fully open to the general public, club members, and families alike."
    },
    {
      id: "faq-3",
      question: "What is your refund and cancellation policy?",
      answer: "You can cancel your booking up to 2 hours before the show starts for a full refund or exchange. Simply contact our support team or cancel through the ticket confirmation portal. Refund is credited instantly back to your original payment mode."
    },
    {
      id: "faq-4",
      question: "Do you offer physical parking?",
      answer: "Yes, JFC Cineplex provides extensive, fully secured, multi-story basement parking spaces with 24/7 security guard presence and CCTV surveillance. Parking is free of charge for cinema attendees."
    },
    {
      id: "faq-5",
      question: "What formats of movies do you screen?",
      answer: "We offer crystal clear 2D, high-immersion 3D (with premium sterilized active glasses), and our state-of-the-art IMAX auditorium with custom theater geometry, laser projectors, and uncompressed 12-channel digital sound."
    }
  ];

  // Let's seed a few sample bookings to populate the admin dashboard right away!
  const bookings: Booking[] = [
    {
      id: "booking-9x1z",
      showtimeId: `showtime-movie-1-0-1`,
      movieTitle: "Gladiator II",
      moviePoster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
      date: getRelativeDateString(0),
      time: "12:00",
      hall: "Screen 1 (Standard)",
      format: "2D",
      seats: ["B3", "B4"],
      foodItems: [
        { id: "snack-1", name: "Salted Butter Popcorn", quantity: 1, price: 650 },
        { id: "snack-7", name: "Ice Cold Fountain Drink", quantity: 2, price: 350 }
      ],
      subtotal: 3150, // 2 tickets ($900*2) + food (650 + 700) = 1800 + 1350 = 3150
      discount: 315, // 10%
      total: 2835,
      customerName: "Danyal Amin",
      customerEmail: "iamdanyalamin@gmail.com",
      customerPhone: "+92 333 1234567",
      paymentStatus: "paid",
      bookingDate: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hrs ago
      qrCodeValue: "JFC-GLAD2-9X1Z"
    },
    {
      id: "booking-8a5b",
      showtimeId: `showtime-movie-1-0-2`,
      movieTitle: "Gladiator II",
      moviePoster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
      date: getRelativeDateString(0),
      time: "18:30",
      hall: "Gold Class VIP",
      format: "2D",
      seats: ["C5"],
      foodItems: [
        { id: "snack-8", name: "Solo Blockbuster Combo", quantity: 1, price: 1100 }
      ],
      subtotal: 3100, // 1 ticket ($2000) + food ($1100)
      discount: 0,
      total: 3100,
      customerName: "Sana Khan",
      customerEmail: "sanakhan@test.com",
      customerPhone: "+92 345 9876543",
      paymentStatus: "paid",
      bookingDate: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
      qrCodeValue: "JFC-GLAD2-8A5B"
    }
  ];

  const settings: CinemaSettings = {
    name: "JFC Cineplex",
    address: "Jacaranda Family Club (JFC), Club Avenue, Sector E, DHA Phase II, Islamabad, Pakistan",
    phone: "+92 51 2111333",
    email: "info@jfccineplex.pk",
    openingHours: {
      weekdays: "12:00 PM - 12:00 AM",
      weekends: "11:00 AM - 01:00 AM"
    },
    socialLinks: {
      facebook: "https://facebook.com/jfccineplex",
      instagram: "https://instagram.com/jfccineplex",
      twitter: "https://twitter.com/jfccineplex",
      youtube: "https://youtube.com/jfccineplex"
    },
    seoTitle: "JFC Cineplex Islamabad | DHA Phase II Premium Movie Experience",
    seoDescription: "Book tickets online for JFC Cineplex, Islamabad. Enjoy state-of-the-art IMAX laser projection, 3D technology, cozy recliners, and fresh delicious popcorn.",
    aboutHistory: "Established within the heart of the magnificent Jacaranda Family Club in Islamabad, JFC Cineplex has been the benchmark of luxury cinema entertainment in the twin cities. We offer premium viewing environments engineered with advanced acoustic materials and top-of-the-line laser projection technology.",
    aboutMission: "Our mission is to transport our audience into extraordinary worlds through immaculate audiovisual presentation, unparalleled luxury seating comfort, and highly professional family-friendly customer service."
  };

  return {
    movies,
    showtimes,
    snacks,
    promotions,
    testimonials,
    faqs,
    bookings,
    settings
  };
};

// Database state
let db: DatabaseSchema;

// Load db
const loadDatabase = (): DatabaseSchema => {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
      // Double check all tables exist
      if (!db.movies || !db.showtimes || !db.bookings) {
        db = getInitialDatabase();
        saveDatabase(db);
      }
      return db;
    } catch (e) {
      console.error("Error reading db.json, re-seeding...", e);
      db = getInitialDatabase();
      saveDatabase(db);
      return db;
    }
  } else {
    db = getInitialDatabase();
    saveDatabase(db);
    return db;
  }
};

// Save db
const saveDatabase = (data: DatabaseSchema) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
};

// Initialize DB on server start
loadDatabase();

async function fetchMovieFromOmdb(title: string, omdbKey: string): Promise<Omit<Movie, "id"> | null> {
  const omdbUrl = `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbKey)}&t=${encodeURIComponent(title)}&plot=full`;
  const res = await fetch(omdbUrl);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.Response !== "True") {
    throw new Error(data.Error || `Movie not found on OMDb: "${title}"`);
  }

  const genres =
    data.Genre && data.Genre !== "N/A"
      ? data.Genre.split(",").map((g: string) => g.trim())
      : ["Drama"];
  const languages =
    data.Language && data.Language !== "N/A"
      ? data.Language.split(",").map((l: string) => l.trim())
      : ["English"];
  const cast =
    data.Actors && data.Actors !== "N/A"
      ? data.Actors.split(",").map((a: string) => a.trim())
      : [];

  let releaseDate = new Date().toISOString().split("T")[0];
  if (data.Released && data.Released !== "N/A") {
    const d = new Date(data.Released);
    if (!isNaN(d.getTime())) releaseDate = d.toISOString().split("T")[0];
  }

  let runtime = 120;
  if (data.Runtime && data.Runtime !== "N/A") {
    const num = parseInt(data.Runtime, 10);
    if (!isNaN(num)) runtime = num;
  }

  let imdbRating = 7.0;
  if (data.imdbRating && data.imdbRating !== "N/A") {
    const num = parseFloat(data.imdbRating);
    if (!isNaN(num)) imdbRating = num;
  }

  const poster =
    data.Poster && data.Poster !== "N/A"
      ? data.Poster
      : "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80";

  return {
    title: data.Title || title,
    poster,
    banner: poster,
    synopsis:
      data.Plot && data.Plot !== "N/A"
        ? data.Plot
        : `Now showing at JFC Cineplex: ${data.Title || title}.`,
    cast,
    director: data.Director && data.Director !== "N/A" ? data.Director : "Unknown",
    producer: data.Production && data.Production !== "N/A" ? data.Production : (data.Writer && data.Writer !== "N/A" ? data.Writer : "Studio"),
    genre: genres,
    language: languages,
    formats: ["2D", "IMAX"],
    releaseDate,
    runtime,
    ageRating: data.Rated && data.Rated !== "N/A" ? data.Rated : "PG-13",
    imdbRating,
    trailerUrl: "",
    gallery: [],
    isComingSoon: false,
    isFeatured: false,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsers (large base64 images from optional Gemini path)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token || !adminSessions.has(token)) {
      return res.status(401).json({ error: "Admin login required" });
    }
    next();
  };

  // ==================== REST API ENDPOINTS ====================

  app.post("/api/admin/login", (req, res) => {
    const password = String(req.body?.password || "");
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }
    const token = `${generateId()}${generateId()}`;
    adminSessions.add(token);
    res.json({ success: true, token });
  });

  app.post("/api/admin/logout", requireAdmin, (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    adminSessions.delete(token);
    res.json({ success: true });
  });

  // Get entire DB or sections
  app.get("/api/db", (req, res) => {
    const database = loadDatabase();
    res.json(database);
  });

  app.post("/api/db/import", requireAdmin, (req, res) => {
    const body = req.body;
    if (!body?.movies || !body?.showtimes || !body?.settings) {
      return res.status(400).json({ error: "Invalid backup: missing movies, showtimes, or settings" });
    }
    saveDatabase(body as DatabaseSchema);
    db = body as DatabaseSchema;
    res.json({ success: true });
  });

  // Settings Endpoints
  app.get("/api/settings", (req, res) => {
    const database = loadDatabase();
    res.json(database.settings);
  });

  app.put("/api/settings", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.settings = { ...database.settings, ...req.body };
    saveDatabase(database);
    res.json({ success: true, settings: database.settings });
  });

  // Movies Endpoints
  app.get("/api/movies", (req, res) => {
    const database = loadDatabase();
    res.json(database.movies);
  });

  // OMDb (primary) → Gemini (optional fallback). Enter title in admin; details auto-fill.
  app.post("/api/movies/auto-fetch", requireAdmin, async (req, res) => {
    const { title, omdbKey: bodyKey } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Movie title is required" });
    }

    let omdbKey = (bodyKey || process.env.OMDB_API_KEY || "").trim();
    if (/^your_|_here$/i.test(omdbKey) || omdbKey === "MY_OMDB_API_KEY") {
      omdbKey = "";
    }

    try {
      if (omdbKey) {
        console.log(`OMDb lookup: ${title}`);
        const movie = await fetchMovieFromOmdb(String(title).trim(), omdbKey);
        if (movie) {
          return res.json({ success: true, movie, source: "omdb" });
        }
      }

      if (!ai) {
        return res.status(500).json({
          error:
            "Set OMDB_API_KEY in your .env file (get a free key at omdbapi.com), then restart the server. You can also paste a key in Admin → Movies.",
        });
      }

      console.log(`Gemini fallback for movie: ${title}`);
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Search for the movie: "${title}". Return actual details as JSON with keys: title, synopsis, cast (array), director, producer, genre (array), language (array), runtime (int minutes), ageRating, imdbRating (number), trailerUrl (YouTube 11-char id), posterUrl, bannerUrl.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              cast: { type: Type.ARRAY, items: { type: Type.STRING } },
              director: { type: Type.STRING },
              producer: { type: Type.STRING },
              genre: { type: Type.ARRAY, items: { type: Type.STRING } },
              language: { type: Type.ARRAY, items: { type: Type.STRING } },
              runtime: { type: Type.INTEGER },
              ageRating: { type: Type.STRING },
              imdbRating: { type: Type.NUMBER },
              trailerUrl: { type: Type.STRING },
              posterUrl: { type: Type.STRING },
              bannerUrl: { type: Type.STRING },
            },
            required: [
              "title",
              "synopsis",
              "cast",
              "director",
              "producer",
              "genre",
              "language",
              "runtime",
              "ageRating",
              "imdbRating",
              "trailerUrl",
              "posterUrl",
              "bannerUrl",
            ],
          },
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      let poster = data.posterUrl;
      let banner = data.bannerUrl;
      if (poster?.startsWith("http")) poster = await urlToBase64(poster);
      if (banner?.startsWith("http")) banner = await urlToBase64(banner);

      const movieResult: Omit<Movie, "id"> = {
        title: data.title || title,
        poster:
          poster ||
          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
        banner:
          banner ||
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
        synopsis: data.synopsis || "No synopsis available.",
        cast: data.cast || [],
        director: data.director || "Unknown",
        producer: data.producer || "Unknown",
        genre: data.genre || [],
        language: data.language || ["English"],
        formats: ["2D", "IMAX"],
        releaseDate: new Date().toISOString().split("T")[0],
        runtime: Number(data.runtime) || 120,
        ageRating: data.ageRating || "PG-13",
        imdbRating: Number(data.imdbRating) || 7.0,
        trailerUrl: data.trailerUrl || "",
        gallery: [],
        isComingSoon: false,
        isFeatured: false,
      };

      return res.json({ success: true, movie: movieResult, source: "gemini" });
    } catch (error: any) {
      console.error("Failed to auto-fetch movie details:", error);
      res.status(500).json({ error: error.message || "Failed to auto-fetch movie details" });
    }
  });

  app.post("/api/movies", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const newMovie: Movie = {
      id: `movie-${generateId()}`,
      ...req.body,
      runtime: Number(req.body.runtime) || 120,
      imdbRating: Number(req.body.imdbRating) || 0,
      cast: Array.isArray(req.body.cast) ? req.body.cast : (req.body.cast || "").split(",").map((s: string) => s.trim()),
      genre: Array.isArray(req.body.genre) ? req.body.genre : (req.body.genre || "").split(",").map((s: string) => s.trim()),
      language: Array.isArray(req.body.language) ? req.body.language : (req.body.language || "").split(",").map((s: string) => s.trim()),
      formats: Array.isArray(req.body.formats) ? req.body.formats : (req.body.formats || "").split(",").map((s: string) => s.trim()),
      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (req.body.gallery || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      isComingSoon: !!req.body.isComingSoon,
      isFeatured: !!req.body.isFeatured
    };
    database.movies.push(newMovie);
    saveDatabase(database);
    res.json({ success: true, movie: newMovie });
  });

  app.put("/api/movies/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const index = database.movies.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const updatedMovie: Movie = {
      ...database.movies[index],
      ...req.body,
      runtime: Number(req.body.runtime) || database.movies[index].runtime,
      imdbRating: Number(req.body.imdbRating) || database.movies[index].imdbRating,
      cast: Array.isArray(req.body.cast) ? req.body.cast : (req.body.cast || "").split(",").map((s: string) => s.trim()),
      genre: Array.isArray(req.body.genre) ? req.body.genre : (req.body.genre || "").split(",").map((s: string) => s.trim()),
      language: Array.isArray(req.body.language) ? req.body.language : (req.body.language || "").split(",").map((s: string) => s.trim()),
      formats: Array.isArray(req.body.formats) ? req.body.formats : (req.body.formats || "").split(",").map((s: string) => s.trim()),
      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (req.body.gallery || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      isComingSoon: req.body.isComingSoon !== undefined ? !!req.body.isComingSoon : database.movies[index].isComingSoon,
      isFeatured: req.body.isFeatured !== undefined ? !!req.body.isFeatured : database.movies[index].isFeatured
    };

    database.movies[index] = updatedMovie;
    saveDatabase(database);
    res.json({ success: true, movie: updatedMovie });
  });

  app.delete("/api/movies/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.movies = database.movies.filter(m => m.id !== req.params.id);
    // Cascade delete showtimes for this movie
    database.showtimes = database.showtimes.filter(s => s.movieId !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // Showtimes Endpoints
  app.get("/api/showtimes", (req, res) => {
    const database = loadDatabase();
    res.json(database.showtimes);
  });

  app.post("/api/showtimes", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const movie = database.movies.find(m => m.id === req.body.movieId);
    if (!movie) {
      return res.status(404).json({ error: "Associated movie not found" });
    }

    const newShowtime: Showtime = {
      id: `showtime-${generateId()}`,
      movieId: req.body.movieId,
      movieTitle: movie.title,
      date: req.body.date,
      time: req.body.time,
      hall: req.body.hall,
      format: req.body.format,
      price: Number(req.body.price) || 1000,
      seatsBooked: [],
      seatsTotal: Number(req.body.seatsTotal) || 120
    };
    database.showtimes.push(newShowtime);
    saveDatabase(database);
    res.json({ success: true, showtime: newShowtime });
  });

  app.put("/api/showtimes/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const index = database.showtimes.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    database.showtimes[index] = {
      ...database.showtimes[index],
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : database.showtimes[index].price,
      seatsTotal: req.body.seatsTotal !== undefined ? Number(req.body.seatsTotal) : database.showtimes[index].seatsTotal,
    };
    saveDatabase(database);
    res.json({ success: true, showtime: database.showtimes[index] });
  });

  app.delete("/api/showtimes/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.showtimes = database.showtimes.filter(s => s.id !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // Snacks Endpoints
  app.get("/api/snacks", (req, res) => {
    const database = loadDatabase();
    res.json(database.snacks);
  });

  app.post("/api/snacks", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const newSnack: SnackItem = {
      id: `snack-${generateId()}`,
      ...req.body,
      price: Number(req.body.price) || 500
    };
    database.snacks.push(newSnack);
    saveDatabase(database);
    res.json({ success: true, snack: newSnack });
  });

  app.put("/api/snacks/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const index = database.snacks.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(444).json({ error: "Snack not found" });
    }
    database.snacks[index] = {
      ...database.snacks[index],
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : database.snacks[index].price
    };
    saveDatabase(database);
    res.json({ success: true, snack: database.snacks[index] });
  });

  app.delete("/api/snacks/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.snacks = database.snacks.filter(s => s.id !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // Promotions Endpoints
  app.get("/api/promotions", (req, res) => {
    const database = loadDatabase();
    res.json(database.promotions);
  });

  app.post("/api/promotions", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const newPromo: Promotion = {
      id: `promo-${generateId()}`,
      ...req.body,
      discountPercent: Number(req.body.discountPercent) || 10
    };
    database.promotions.push(newPromo);
    saveDatabase(database);
    res.json({ success: true, promotion: newPromo });
  });

  app.put("/api/promotions/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const index = database.promotions.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    database.promotions[index] = {
      ...database.promotions[index],
      ...req.body,
      discountPercent: req.body.discountPercent !== undefined ? Number(req.body.discountPercent) : database.promotions[index].discountPercent
    };
    saveDatabase(database);
    res.json({ success: true, promotion: database.promotions[index] });
  });

  app.delete("/api/promotions/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.promotions = database.promotions.filter(p => p.id !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // FAQs Endpoints
  app.get("/api/faqs", (req, res) => {
    const database = loadDatabase();
    res.json(database.faqs);
  });

  app.post("/api/faqs", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const newFaq: FAQ = {
      id: `faq-${generateId()}`,
      ...req.body
    };
    database.faqs.push(newFaq);
    saveDatabase(database);
    res.json({ success: true, faq: newFaq });
  });

  app.put("/api/faqs/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const index = database.faqs.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    database.faqs[index] = {
      ...database.faqs[index],
      ...req.body
    };
    saveDatabase(database);
    res.json({ success: true, faq: database.faqs[index] });
  });

  app.delete("/api/faqs/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    database.faqs = database.faqs.filter(f => f.id !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // Testimonials Endpoints
  app.get("/api/testimonials", (req, res) => {
    const database = loadDatabase();
    res.json(database.testimonials);
  });

  app.post("/api/testimonials", (req, res) => {
    const database = loadDatabase();
    const newTestimonial: Testimonial = {
      id: `t-${generateId()}`,
      name: req.body.name || "Anonymous",
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment || "",
      date: new Date().toISOString().split("T")[0]
    };
    database.testimonials.push(newTestimonial);
    saveDatabase(database);
    res.json({ success: true, testimonial: newTestimonial });
  });

  // Bookings API (Create, Get, Refund)
  app.get("/api/bookings", (req, res) => {
    const database = loadDatabase();
    res.json(database.bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const database = loadDatabase();
    const { showtimeId, seats, foodItems, customerName, customerEmail, customerPhone, subtotal, discount, total } = req.body;

    const showtimeIndex = database.showtimes.findIndex(s => s.id === showtimeId);
    if (showtimeIndex === -1) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    const showtime = database.showtimes[showtimeIndex];

    // Check if seats are already booked
    const overlap = seats.some((seat: string) => showtime.seatsBooked.includes(seat));
    if (overlap) {
      return res.status(400).json({ error: "One or more selected seats have already been booked. Please choose other seats." });
    }

    // Allocate seats
    showtime.seatsBooked = [...showtime.seatsBooked, ...seats];
    database.showtimes[showtimeIndex] = showtime;

    const movie = database.movies.find(m => m.id === showtime.movieId);

    const bookingId = `booking-${generateId()}`;
    const newBooking: Booking = {
      id: bookingId,
      showtimeId,
      movieTitle: showtime.movieTitle,
      moviePoster: movie?.poster || "",
      date: showtime.date,
      time: showtime.time,
      hall: showtime.hall,
      format: showtime.format,
      seats,
      foodItems: foodItems || [],
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      total: Number(total),
      customerName,
      customerEmail,
      customerPhone,
      paymentStatus: "paid",
      bookingDate: new Date().toISOString(),
      qrCodeValue: `JFC-${showtime.movieTitle.substring(0, 4).toUpperCase()}-${bookingId.toUpperCase()}`
    };

    database.bookings.push(newBooking);
    saveDatabase(database);
    res.json({ success: true, booking: newBooking });
  });

  app.post("/api/bookings/:id/refund", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const bookingIndex = database.bookings.findIndex(b => b.id === req.params.id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = database.bookings[bookingIndex];
    if (booking.paymentStatus === "refunded") {
      return res.status(400).json({ error: "Booking is already refunded" });
    }

    // Release seats in showtime
    const showtimeIndex = database.showtimes.findIndex(s => s.id === booking.showtimeId);
    if (showtimeIndex !== -1) {
      const showtime = database.showtimes[showtimeIndex];
      showtime.seatsBooked = showtime.seatsBooked.filter(seat => !booking.seats.includes(seat));
      database.showtimes[showtimeIndex] = showtime;
    }

    booking.paymentStatus = "refunded";
    database.bookings[bookingIndex] = booking;
    saveDatabase(database);
    res.json({ success: true, booking });
  });

  app.delete("/api/bookings/:id", requireAdmin, (req, res) => {
    const database = loadDatabase();
    const booking = database.bookings.find(b => b.id === req.params.id);
    if (booking) {
      // Release seats
      const showtimeIndex = database.showtimes.findIndex(s => s.id === booking.showtimeId);
      if (showtimeIndex !== -1) {
        const showtime = database.showtimes[showtimeIndex];
        showtime.seatsBooked = showtime.seatsBooked.filter(seat => !booking.seats.includes(seat));
        database.showtimes[showtimeIndex] = showtime;
      }
    }
    database.bookings = database.bookings.filter(b => b.id !== req.params.id);
    saveDatabase(database);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/dashboard-stats", (req, res) => {
    const database = loadDatabase();
    const paidBookings = database.bookings.filter(b => b.paymentStatus === "paid");
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.total, 0);
    const totalBookings = paidBookings.length;
    const totalSeatsSold = paidBookings.reduce((sum, b) => sum + b.seats.length, 0);

    // Calculate movie popularity from seats sold
    const moviePopularity: { [title: string]: number } = {};
    paidBookings.forEach(b => {
      moviePopularity[b.movieTitle] = (moviePopularity[b.movieTitle] || 0) + b.seats.length;
    });

    const popularMovies = Object.entries(moviePopularity)
      .map(([title, sales]) => ({ title, sales }))
      .sort((a, b) => b.sales - a.sales);

    res.json({
      revenue: totalRevenue,
      bookingsCount: totalBookings,
      seatsSold: totalSeatsSold,
      visitorsToday: Math.round(totalBookings * 1.8 + 12), // Dynamic/aesthetic visitor stat
      popularMovies
    });
  });

  // ==================== VITE DEVELOPMENT / PRODUCTION HANDLING ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JFC Cineplex Full Stack Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
