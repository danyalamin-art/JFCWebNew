import React from "react";
import { Play, Ticket, Clock, Star, Languages } from "lucide-react";
import { Movie } from "../types";

interface MovieCardProps {
  key?: string | number;
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
  onBookNow: (movie: Movie) => void;
}

export default function MovieCard({ movie, onViewDetails, onBookNow }: MovieCardProps) {
  return (
    <div
      id={`movie-card-${movie.id}`}
      className="group bg-cinema-card/55 rounded-lg overflow-hidden border border-white/5 hover:border-gold-500/30 shadow-lg hover:shadow-gold-500/5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Poster Image Stage */}
      <div className="relative aspect-[2/3] overflow-hidden bg-cinema-black">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700"
          referrerPolicy="no-referrer"
        />

        {/* Hover overlay and play trailer button */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-3">
          <button
            onClick={() => onViewDetails(movie)}
            className="w-12 h-12 rounded-full bg-gold-500 hover:bg-gold-400 text-cinema-black flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <Play className="w-5 h-5 text-cinema-black fill-cinema-black ml-0.5" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-500">
            View Details
          </span>
        </div>

        {/* Top-level Badges (e.g., IMAX, Age Rating, IMDb) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          {movie.formats.map((f) => (
            <span
              key={f}
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs ${
                f === "IMAX"
                  ? "bg-gold-500 text-cinema-black"
                  : f === "3D"
                  ? "bg-blue-600/80 text-white"
                  : "bg-white/10 text-slate-200"
              }`}
            >
              {f}
            </span>
          ))}
          <span className="text-[9px] font-mono font-bold bg-black/75 text-slate-300 px-1.5 py-0.5 rounded-xs backdrop-blur-xs">
            {movie.ageRating}
          </span>
        </div>

        {movie.imdbRating > 0 && (
          <div className="absolute top-3 right-3 bg-black/80 text-gold-500 text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 backdrop-blur-xs">
            <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
            {movie.imdbRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Genre Tags */}
        <p className="text-[10px] font-mono text-gold-500/90 uppercase tracking-widest mb-1.5">
          {movie.genre.join(" • ")}
        </p>

        {/* Title */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 group-hover:text-gold-500 transition-colors line-clamp-1">
          {movie.title}
        </h3>

        {/* Runtime and Languages */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 mt-auto">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{movie.runtime} min</span>
          </div>
          <div className="flex items-center gap-1 line-clamp-1">
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[120px]">{movie.language.join(", ")}</span>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => onViewDetails(movie)}
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-white/5 hover:bg-white/10 text-slate-300 text-center transition-all cursor-pointer"
          >
            Details
          </button>
          <button
            onClick={() => onBookNow(movie)}
            className="flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs bg-gold-600 hover:bg-gold-500 text-black transition-all cursor-pointer"
          >
            <Ticket className="w-3 h-3 text-black" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
