import { useState } from "react";
import { Coffee, GlassWater, Utensils, Sparkles, AlertCircle } from "lucide-react";
import { SnackItem } from "../types";

interface FoodViewProps {
  snacks: SnackItem[];
  onStartBooking: () => void;
}

export default function FoodView({ snacks, onStartBooking }: FoodViewProps) {
  // Concession category filtering
  const [activeCategory, setActiveCategory] = useState<"all" | "popcorn" | "drinks" | "savory" | "combos">("all");

  const categories = [
    { id: "all", label: "All Concessions", icon: Utensils },
    { id: "popcorn", label: "Popcorn", icon: Sparkles },
    { id: "drinks", label: "Cold Drinks", icon: GlassWater },
    { id: "savory", label: "Savory & Fries", icon: Coffee },
    { id: "combos", label: "Blockbuster Combos", icon: Utensils }
  ];

  // Category filter mapping
  const filteredSnacks = snacks.filter((sn) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "popcorn") return sn.category === "popcorn";
    if (activeCategory === "drinks") return sn.category === "drinks";
    if (activeCategory === "combos") return sn.category === "combos";
    // Savory refers to nachos, burgers, hotdogs, fries
    return ["nachos", "burgers", "hotdogs", "fries"].includes(sn.category);
  });

  const formatRs = (num: number) => `Rs. ${num.toLocaleString()}`;

  return (
    <div id="food-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Snack Concessions Menu
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Level up your movie-going routine. Pre-order standard combos, freshly made buttered popcorn, or gourmet hotdogs online.
        </p>
      </div>

      {/* Info notice about pre-ordering */}
      <div className="bg-gold-500/10 border border-gold-500/20 p-4 rounded-sm flex gap-3 items-center">
        <AlertCircle className="w-4 h-4 text-gold-500 shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
          <b>How to Pre-order Concessions?</b> Snacks and blockbuster combos can be added to your cart during ticket checkout. Simply click <b>"Book Tickets"</b>, select seats, and add items in Step 5!
        </p>
      </div>

      {/* Concession category timeline chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                isSelected
                  ? "bg-gold-600 text-black border-gold-600 shadow-md shadow-gold-600/10"
                  : "bg-cinema-card/55 border-white/5 text-slate-300 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Snacks Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSnacks.map((sn) => (
          <div
            key={sn.id}
            className="group bg-cinema-card/55 border border-white/5 hover:border-gold-500/25 rounded-lg overflow-hidden flex flex-col justify-between transition-all shadow-md"
          >
            {/* Cover image */}
            <div className="relative aspect-video overflow-hidden bg-black shrink-0 rounded-t-lg">
              <img
                src={sn.image}
                alt={sn.name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-3 right-3 bg-black/80 font-mono text-[9px] font-bold text-gold-500 px-2.5 py-0.5 rounded-xs border border-white/5">
                {sn.category.toUpperCase()}
              </span>
            </div>

            {/* Item details */}
            <div className="p-4 flex-grow flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white leading-tight">
                  {sn.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                  {sn.description}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex items-center justify-between mt-auto">
                <span className="text-sm font-bold text-gold-500 font-mono">
                  {formatRs(sn.price)}
                </span>
                <button
                  onClick={onStartBooking}
                  className="px-3 py-1.5 rounded-xs bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Pre-order with Ticket
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
