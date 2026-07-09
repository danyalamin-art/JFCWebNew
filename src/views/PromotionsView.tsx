import { useState } from "react";
import { Sparkles, Calendar, Check, Copy, Percent } from "lucide-react";
import { Promotion } from "../types";

interface PromotionsViewProps {
  promotions: Promotion[];
}

export default function PromotionsView({ promotions }: PromotionsViewProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div id="promotions-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
          Active Promotions & Deals
        </h2>
        <p className="text-xs sm:text-sm text-cinema-text-muted mt-1.5 uppercase tracking-wide">
          Maximize your cinematic experience. Save big with exclusive, limited-edition family bundles, student concessions, and weekend ticket deals.
        </p>
      </div>

      {/* Grid of promotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((p) => {
          const isCopied = copiedCode === p.code;

          return (
            <div
              key={p.id}
              className="bg-cinema-card/55 border border-white/5 hover:border-gold-500/25 rounded-lg overflow-hidden flex flex-col justify-between group transition-all shadow-lg"
            >
              {/* Promotion Header Banner */}
              <div className="relative aspect-video overflow-hidden bg-black shrink-0 rounded-t-lg">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-gold-600 text-black font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-xs uppercase tracking-wider shadow">
                  {p.badge}
                </span>
              </div>

              {/* Promo Content details */}
              <div className="p-5 flex-grow flex flex-col justify-between gap-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white group-hover:text-gold-500 transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Coupon copy block */}
                <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wide text-slate-500">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-gold-500" />
                      Value: <b className="text-slate-300">{p.discountPercent}% OFF</b>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      Expires: <b className="text-slate-300">{p.expiryDate}</b>
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-black/45 p-2.5 rounded-xs border border-white/5 mt-1">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 block leading-none mb-1">
                        COUPON CODE
                      </span>
                      <span className="font-mono text-xs font-bold text-gold-500 uppercase tracking-widest">
                        {p.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(p.code)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xs text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-black"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {promotions.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-lg bg-cinema-card/20 col-span-3">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">No Active Deals</h4>
            <p className="text-xs text-cinema-text-muted uppercase tracking-wide">
              Check back soon for upcoming holiday promotions or festival offers.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
