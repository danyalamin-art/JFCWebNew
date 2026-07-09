export interface Movie {
  id: string;
  title: string;
  poster: string;
  banner: string;
  synopsis: string;
  cast: string[];
  director: string;
  producer: string;
  genre: string[];
  language: string[];
  formats: string[]; // e.g., ["2D", "3D", "IMAX"]
  releaseDate: string;
  runtime: number; // in minutes
  ageRating: string; // e.g., "PG-13", "R", "G"
  imdbRating: number;
  trailerUrl: string; // YouTube video ID or URL
  gallery: string[];
  isComingSoon: boolean;
  isFeatured: boolean;
  /** Lower = earlier in homepage Featured Spotlight carousel (optional). */
  featuredOrder?: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle: string; // cached for easy lookups
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  hall: string; // e.g., "Gold Class (Screen 1)", "IMAX Theater", "Screen 2"
  format: string; // e.g., "2D", "3D", "IMAX"
  price: number;
  seatsBooked: string[]; // e.g., ["A1", "B4"]
  seatsTotal: number;
}

export interface SnackItem {
  id: string;
  name: string;
  category: "popcorn" | "drinks" | "nachos" | "burgers" | "hotdogs" | "fries" | "combos";
  price: number;
  image: string;
  description: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercent: number;
  expiryDate: string;
  image: string;
  badge: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface BookingFoodItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Booking {
  id: string;
  showtimeId: string;
  movieTitle: string;
  moviePoster: string;
  date: string;
  time: string;
  hall: string;
  format: string;
  seats: string[];
  foodItems: BookingFoodItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: "paid" | "pending" | "refunded";
  bookingDate: string; // Date string
  qrCodeValue: string;
}

export interface CinemaSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    weekdays: string;
    weekends: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  seoTitle: string;
  seoDescription: string;
  aboutHistory: string;
  aboutMission: string;
}

export interface DatabaseSchema {
  movies: Movie[];
  showtimes: Showtime[];
  snacks: SnackItem[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  bookings: Booking[];
  settings: CinemaSettings;
}
