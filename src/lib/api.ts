import {
  DatabaseSchema,
  Movie,
  Showtime,
  SnackItem,
  Promotion,
  FAQ,
  Booking,
  CinemaSettings,
  Testimonial,
} from "../types";

const ADMIN_TOKEN_KEY = "jfc_admin_token";

export function getAdminToken(): string {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token: string | null) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

// ---------- Auth ----------
export async function adminLogin(password: string): Promise<void> {
  const data = await api<{ success: boolean; token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setAdminToken(data.token);
}

export function adminLogout() {
  setAdminToken(null);
}

// ---------- Database ----------
export async function fetchFullDatabase(): Promise<DatabaseSchema> {
  return api<DatabaseSchema>("/api/db");
}

export async function importDatabase(db: DatabaseSchema): Promise<void> {
  await api("/api/db/import", { method: "POST", body: JSON.stringify(db) });
}

export async function exportDatabaseJson(): Promise<DatabaseSchema> {
  return fetchFullDatabase();
}

// ---------- Settings ----------
export async function fetchSettings(): Promise<CinemaSettings> {
  return api<CinemaSettings>("/api/settings");
}

export async function updateSettings(settings: Partial<CinemaSettings>): Promise<CinemaSettings> {
  const data = await api<{ settings: CinemaSettings }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return data.settings;
}

// ---------- Movies ----------
export async function createMovie(movie: Omit<Movie, "id">): Promise<Movie> {
  const data = await api<{ movie: Movie }>("/api/movies", {
    method: "POST",
    body: JSON.stringify(movie),
  });
  return data.movie;
}

export async function updateMovie(id: string, movie: Partial<Movie>): Promise<Movie> {
  const data = await api<{ movie: Movie }>(`/api/movies/${id}`, {
    method: "PUT",
    body: JSON.stringify(movie),
  });
  return data.movie;
}

export async function deleteMovie(id: string): Promise<boolean> {
  await api(`/api/movies/${id}`, { method: "DELETE" });
  return true;
}

export type MovieSuggestion = {
  title: string;
  year: string;
  imdbID: string;
  type: string;
  poster: string;
};

export async function searchMovieSuggestions(query: string): Promise<MovieSuggestion[]> {
  const data = await api<{ suggestions: MovieSuggestion[] }>(
    `/api/movies/search-suggestions?q=${encodeURIComponent(query)}`
  );
  return data.suggestions || [];
}

export async function autoFetchMovieDetails(
  title: string,
  imdbID?: string
): Promise<Omit<Movie, "id">> {
  // OMDb key lives on the server (.env + Firestore) — no need to send from browser
  const data = await api<{ movie: Omit<Movie, "id"> }>("/api/movies/auto-fetch", {
    method: "POST",
    body: JSON.stringify({ title, imdbID: imdbID || undefined }),
  });
  return data.movie;
}

export async function fetchOmdbStatus(): Promise<{ configured: boolean; hint: string | null }> {
  return api("/api/admin/omdb-status");
}

export async function saveOmdbKey(omdbApiKey: string): Promise<{ configured: boolean; hint: string | null }> {
  return api("/api/admin/omdb-key", {
    method: "POST",
    body: JSON.stringify({ omdbApiKey }),
  });
}

// ---------- Showtimes ----------
export async function createShowtime(
  showtime: Omit<Showtime, "id" | "seatsBooked" | "movieTitle">
): Promise<Showtime> {
  const data = await api<{ showtime: Showtime }>("/api/showtimes", {
    method: "POST",
    body: JSON.stringify(showtime),
  });
  return data.showtime;
}

export async function updateShowtime(id: string, showtime: Partial<Showtime>): Promise<Showtime> {
  const data = await api<{ showtime: Showtime }>(`/api/showtimes/${id}`, {
    method: "PUT",
    body: JSON.stringify(showtime),
  });
  return data.showtime;
}

export async function deleteShowtime(id: string): Promise<boolean> {
  await api(`/api/showtimes/${id}`, { method: "DELETE" });
  return true;
}

// ---------- Snacks ----------
export async function createSnack(snack: Omit<SnackItem, "id">): Promise<SnackItem> {
  const data = await api<{ snack: SnackItem }>("/api/snacks", {
    method: "POST",
    body: JSON.stringify(snack),
  });
  return data.snack;
}

export async function updateSnack(id: string, snack: Partial<SnackItem>): Promise<SnackItem> {
  const data = await api<{ snack: SnackItem }>(`/api/snacks/${id}`, {
    method: "PUT",
    body: JSON.stringify(snack),
  });
  return data.snack;
}

export async function deleteSnack(id: string): Promise<boolean> {
  await api(`/api/snacks/${id}`, { method: "DELETE" });
  return true;
}

// ---------- Promotions ----------
export async function createPromotion(promo: Omit<Promotion, "id">): Promise<Promotion> {
  const data = await api<{ promotion: Promotion }>("/api/promotions", {
    method: "POST",
    body: JSON.stringify(promo),
  });
  return data.promotion;
}

export async function updatePromotion(id: string, promo: Partial<Promotion>): Promise<Promotion> {
  const data = await api<{ promotion: Promotion }>(`/api/promotions/${id}`, {
    method: "PUT",
    body: JSON.stringify(promo),
  });
  return data.promotion;
}

export async function deletePromotion(id: string): Promise<boolean> {
  await api(`/api/promotions/${id}`, { method: "DELETE" });
  return true;
}

// ---------- FAQs ----------
export async function createFaq(faq: Omit<FAQ, "id">): Promise<FAQ> {
  const data = await api<{ faq: FAQ }>("/api/faqs", {
    method: "POST",
    body: JSON.stringify(faq),
  });
  return data.faq;
}

export async function updateFaq(id: string, faq: Partial<FAQ>): Promise<FAQ> {
  const data = await api<{ faq: FAQ }>(`/api/faqs/${id}`, {
    method: "PUT",
    body: JSON.stringify(faq),
  });
  return data.faq;
}

export async function deleteFaq(id: string): Promise<boolean> {
  await api(`/api/faqs/${id}`, { method: "DELETE" });
  return true;
}

// ---------- Bookings ----------
export async function createBooking(bookingData: {
  showtimeId: string;
  seats: string[];
  foodItems: { id: string; name: string; quantity: number; price: number }[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  total: number;
}): Promise<Booking> {
  const data = await api<{ booking: Booking }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
  return data.booking;
}

export async function refundBooking(id: string): Promise<Booking> {
  const data = await api<{ booking: Booking }>(`/api/bookings/${id}/refund`, {
    method: "POST",
  });
  return data.booking;
}

export async function deleteBooking(id: string): Promise<boolean> {
  await api(`/api/bookings/${id}`, { method: "DELETE" });
  return true;
}

// ---------- Stats / testimonials ----------
export async function fetchDashboardStats(): Promise<{
  revenue: number;
  bookingsCount: number;
  seatsSold: number;
  visitorsToday: number;
  popularMovies: { title: string; sales: number }[];
}> {
  return api("/api/dashboard-stats");
}

export async function submitTestimonial(testimonial: {
  name: string;
  rating: number;
  comment: string;
}): Promise<Testimonial> {
  const data = await api<{ testimonial: Testimonial }>("/api/testimonials", {
    method: "POST",
    body: JSON.stringify(testimonial),
  });
  return data.testimonial;
}
