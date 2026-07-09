/**
 * Firestore-backed cinema database (replaces db.json).
 * Uses Firebase Admin + service account file.
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  getFirestore,
  Firestore,
  CollectionReference,
} from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import type {
  DatabaseSchema,
  Movie,
  Showtime,
  SnackItem,
  Promotion,
  Testimonial,
  FAQ,
  Booking,
  CinemaSettings,
} from "./src/types";

const COLLECTIONS = [
  "movies",
  "showtimes",
  "snacks",
  "promotions",
  "testimonials",
  "faqs",
  "bookings",
] as const;

type CollName = (typeof COLLECTIONS)[number];

let firestore: Firestore;
let cache: DatabaseSchema | null = null;

/** Remove undefined (Firestore rejects it). */
function strip<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function initFirebase(): void {
  if (getApps().length) {
    firestore = getFirestore();
    return;
  }

  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(process.cwd(), "firebase-service-account.json");

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Firebase service account not found at:\n  ${keyPath}\n` +
        `Place firebase-service-account.json in the project root or set FIREBASE_SERVICE_ACCOUNT_PATH.`
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  firestore = getFirestore();
  console.log(`✓ Firebase connected (project: ${serviceAccount.project_id})`);
}

async function readCollection<T extends { id: string }>(name: CollName): Promise<T[]> {
  const snap = await firestore.collection(name).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return { ...data, id: (data.id as string) || doc.id } as T;
  });
}

async function writeCollection(name: CollName, items: { id: string }[]): Promise<void> {
  const col: CollectionReference = firestore.collection(name);
  const existing = await col.listDocuments();
  const keep = new Set(items.map((i) => i.id));

  let batch = firestore.batch();
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = firestore.batch();
    ops = 0;
  };

  for (const ref of existing) {
    if (!keep.has(ref.id)) {
      batch.delete(ref);
      ops++;
      if (ops >= 400) await flush();
    }
  }

  for (const item of items) {
    batch.set(col.doc(item.id), strip(item));
    ops++;
    if (ops >= 400) await flush();
  }

  await flush();
}

async function readAll(): Promise<DatabaseSchema> {
  const [movies, showtimes, snacks, promotions, testimonials, faqs, bookings, settingsSnap] =
    await Promise.all([
      readCollection<Movie>("movies"),
      readCollection<Showtime>("showtimes"),
      readCollection<SnackItem>("snacks"),
      readCollection<Promotion>("promotions"),
      readCollection<Testimonial>("testimonials"),
      readCollection<FAQ>("faqs"),
      readCollection<Booking>("bookings"),
      firestore.collection("meta").doc("settings").get(),
    ]);

  if (!settingsSnap.exists) {
    throw new Error("Firestore meta/settings document missing");
  }

  return {
    movies,
    showtimes,
    snacks,
    promotions,
    testimonials,
    faqs,
    bookings,
    settings: settingsSnap.data() as CinemaSettings,
  };
}

async function persistAll(data: DatabaseSchema): Promise<void> {
  await Promise.all([
    writeCollection("movies", data.movies),
    writeCollection("showtimes", data.showtimes),
    writeCollection("snacks", data.snacks),
    writeCollection("promotions", data.promotions),
    writeCollection("testimonials", data.testimonials),
    writeCollection("faqs", data.faqs),
    writeCollection("bookings", data.bookings),
    firestore.collection("meta").doc("settings").set(strip(data.settings)),
  ]);
}

/** Server-only config (never sent to public /api/db). */
export async function getServerConfig(): Promise<{ omdbApiKey?: string }> {
  const snap = await firestore.collection("meta").doc("serverConfig").get();
  if (!snap.exists) return {};
  return snap.data() as { omdbApiKey?: string };
}

export async function setServerConfig(partial: { omdbApiKey?: string }): Promise<void> {
  await firestore
    .collection("meta")
    .doc("serverConfig")
    .set(strip(partial), { merge: true });
}

/** OMDb key: request override → env → Firestore (persists across logins). */
export async function resolveOmdbKey(bodyKey?: string): Promise<string> {
  const fromBody = (bodyKey || "").trim();
  if (fromBody && !/^your_|_here$/i.test(fromBody) && fromBody !== "MY_OMDB_API_KEY") {
    return fromBody;
  }
  const fromEnv = (process.env.OMDB_API_KEY || "").trim();
  if (fromEnv && !/^your_|_here$/i.test(fromEnv)) {
    return fromEnv;
  }
  const cfg = await getServerConfig();
  return (cfg.omdbApiKey || "").trim();
}

/** Load from Firestore (seed if empty). Call once at server start. */
export async function initDatabase(seed: () => DatabaseSchema): Promise<DatabaseSchema> {
  initFirebase();

  const probe = await firestore.collection("movies").limit(1).get();
  const settingsProbe = await firestore.collection("meta").doc("settings").get();

  if (probe.empty || !settingsProbe.exists) {
    console.log("Firestore empty — seeding default JFC cinema data…");
    const initial = seed();
    await persistAll(initial);
    cache = initial;
    console.log(
      `✓ Seeded: ${initial.movies.length} movies, ${initial.showtimes.length} showtimes`
    );
  } else {
    cache = await readAll();
    console.log(
      `✓ Firestore loaded: ${cache.movies.length} movies, ${cache.showtimes.length} showtimes, ${cache.bookings.length} bookings`
    );
  }

  // Persist OMDb key from .env into Firestore so admin never needs to re-paste
  const envOmdb = (process.env.OMDB_API_KEY || "").trim();
  if (envOmdb && !/^your_|_here$/i.test(envOmdb)) {
    const cfg = await getServerConfig();
    if (cfg.omdbApiKey !== envOmdb) {
      await setServerConfig({ omdbApiKey: envOmdb });
      console.log("✓ OMDb API key saved to Firestore (meta/serverConfig)");
    }
  }

  return cache;
}

/** Sync read from in-memory cache (kept in sync with Firestore writes). */
export function loadDatabase(): DatabaseSchema {
  if (!cache) {
    throw new Error("Database not initialized — call initDatabase() first");
  }
  return cache;
}

/** Write full schema to Firestore + update cache. */
export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  cache = data;
  await persistAll(data);
}

/** Refresh cache from Firestore (optional; useful after external edits). */
export async function reloadDatabase(): Promise<DatabaseSchema> {
  cache = await readAll();
  return cache;
}

/**
 * Atomic seat booking: transaction on showtime + create booking doc.
 * Prevents two users taking the same seat.
 */
export async function createBookingAtomic(input: {
  showtimeId: string;
  seats: string[];
  foodItems: Booking["foodItems"];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  total: number;
  generateId: () => string;
}): Promise<Booking> {
  if (!cache) throw new Error("Database not initialized");

  const bookingId = `booking-${input.generateId()}`;
  const showtimeRef = firestore.collection("showtimes").doc(input.showtimeId);
  const bookingRef = firestore.collection("bookings").doc(bookingId);

  const showtimeMeta = cache.showtimes.find((s) => s.id === input.showtimeId);
  const movie = showtimeMeta
    ? cache.movies.find((m) => m.id === showtimeMeta.movieId)
    : undefined;

  const newBooking = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(showtimeRef);
    if (!snap.exists) {
      throw new Error("SHOWTIME_NOT_FOUND");
    }
    const data = snap.data() || {};
    const showtime = { id: snap.id, ...data } as Showtime;
    const seatsBooked = showtime.seatsBooked || [];
    const overlap = input.seats.filter((s) => seatsBooked.includes(s));
    if (overlap.length > 0) {
      throw new Error(`SEATS_TAKEN:${overlap.join(",")}`);
    }

    const updatedSeats = [...seatsBooked, ...input.seats];
    tx.update(showtimeRef, { seatsBooked: updatedSeats });

    const booking: Booking = {
      id: bookingId,
      showtimeId: input.showtimeId,
      movieTitle: showtime.movieTitle,
      moviePoster: movie?.poster || "",
      date: showtime.date,
      time: showtime.time,
      hall: showtime.hall,
      format: showtime.format,
      seats: input.seats,
      foodItems: input.foodItems || [],
      subtotal: Number(input.subtotal),
      discount: Number(input.discount) || 0,
      total: Number(input.total),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      paymentStatus: "paid",
      bookingDate: new Date().toISOString(),
      qrCodeValue: `JFC-${String(showtime.movieTitle || "MOVIE")
        .substring(0, 4)
        .toUpperCase()}-${bookingId.toUpperCase()}`,
    };

    tx.set(bookingRef, strip(booking));
    return booking;
  });

  // Keep cache in sync
  const stIdx = cache.showtimes.findIndex((s) => s.id === input.showtimeId);
  if (stIdx !== -1) {
    cache.showtimes[stIdx] = {
      ...cache.showtimes[stIdx],
      seatsBooked: [...cache.showtimes[stIdx].seatsBooked, ...input.seats],
    };
  }
  cache.bookings = [newBooking, ...cache.bookings];

  return newBooking;
}
