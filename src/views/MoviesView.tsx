import React, { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Movie } from "../types";
import MovieCard from "../components/MovieCard";

interface MoviesViewProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onBookMovie: (movie: Movie) => void;
}

export default function MoviesView({ movies, onSelectMovie, onBookMovie }: MoviesViewProps) {
  // Now Showing movies
  const activeMovies = movies.filter(m => !m.isComingSoon);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "alphabetical">("popular");

  // Extract all unique Genres
  const allGenres = Array.from(new Set(activeMovies.flatMap(m => m.genre))).sort();
  // Extract all unique Languages
  const allLanguages = Array.from(new Set(activeMovies.flatMap(m => m.language))).sort();
  // Formats
  const formats = ["2D", "3D", "IMAX"];

  // Filter & Sort Logic
  const filteredMovies = activeMovies
    .filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cast.some(actor => actor.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGenre = selectedGenre ? m.genre.includes(selectedGenre) : true;
      const matchLanguage = selectedLanguage ? m.language.includes(selectedLanguage) : true;
      const matchFormat = selectedFormat ? m.formats.includes(selectedFormat) : true;

      return matchSearch && matchGenre && matchLanguage && matchFormat;
    })
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "newest") {
        // Simple release date comparison
        return b.releaseDate.localeCompare(a.releaseDate);
      }
      // "popular" -> IMDb rating sort descending
      return b.imdbRating - a.imdbRating;
    });

  return (
    <div id="movies-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Now Showing Movies
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Browse current blockbusters screening at JFC Cineplex, Islamabad. Apply search or formats.
        </p>
      </div>

      {/* Searching & Filter Panel */}
      <div className="bg-cinema-card/55 border border-white/5 rounded-lg p-5 flex flex-col gap-4">
        
        {/* Row 1: Search & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="SEARCH BY MOVIE TITLE, ACTORS, DIRECTORS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0f] text-white placeholder-slate-600 text-xs px-4 py-3 pl-10 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-3 pl-10 pr-4 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider transition-all cursor-pointer"
            >
              <option value="popular">IMDb Popularity</option>
              <option value="newest">Recently Released</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Filtering Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
          
          {/* Genre Filter */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
              Filter Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-2.5 px-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider cursor-pointer"
            >
              <option value="">All Genres</option>
              {allGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-2.5 px-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider cursor-pointer"
            >
              <option value="">All Languages</option>
              {allLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">
              Projection Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-[#0c0c0f] text-slate-300 text-xs py-2.5 px-3 rounded-sm border border-white/5 focus:outline-none focus:border-gold-500 uppercase tracking-wider cursor-pointer"
            >
              <option value="">All Formats (2D/3D/IMAX)</option>
              {formats.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Filter Results Summary */}
      <div className="flex items-center justify-between text-[10px] text-cinema-text-muted mt-[-10px] uppercase tracking-wider">
        <span>Showing <b>{filteredMovies.length}</b> movies in cinema</span>
        {(searchQuery || selectedGenre || selectedLanguage || selectedFormat) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedGenre("");
              setSelectedLanguage("");
              setSelectedFormat("");
            }}
            className="text-gold-500 hover:underline cursor-pointer font-bold uppercase tracking-widest"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Movies Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onViewDetails={onSelectMovie}
            onBookNow={onBookMovie}
          />
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-lg bg-cinema-card/20">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">No movies matched filters</h4>
          <p className="text-xs text-cinema-text-muted uppercase tracking-wide">
            Try adjusting your query, format parameters, or sorting values.
          </p>
        </div>
      )}

    </div>
  );
}
