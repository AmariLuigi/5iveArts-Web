import { ShieldCheck, Truck, RotateCcw, Award } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    label: "Secure Checkout",
    sub: "Powered by Stripe",
    color: "text-indigo-500",
  },
  {
    icon: Truck,
    label: "Insured Global Shipping",
    sub: "Worldwide delivery",
    color: "text-green-500",
  },
  {
    icon: Award,
    label: "Handcrafted",
    sub: "Every figure unique",
    color: "text-purple-500",
  },
  {
    icon: RotateCcw,
    label: "30-Day Returns",
    sub: "Hassle-free",
    color: "text-blue-500",
  },
];

interface TrustBadgesProps {
  /** "row" renders a compact horizontal strip; "grid" renders a 2×2 or 4-col grid */
  variant?: "row" | "grid";
  className?: string;
  dict?: any;
}

/**
 * Reusable trust / security badge strip.
 * Import in both server and client components — no hooks, pure JSX.
 */
export default function TrustBadges({
  variant = "grid",
  className = "",
  dict,
}: TrustBadgesProps) {
  const trustItems = dict?.trust || BADGES;

  if (variant === "row") {
    return (
      <div
        className={`flex flex-wrap gap-x-8 gap-y-2 ${className}`}
        aria-label="Trust signals"
      >
        {trustItems.map((item: any, i: number) => {
          const Icon = BADGES[i]?.icon || ShieldCheck;
          return (
            <span key={item.label} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-neutral-500">
              <Icon className="w-3.5 h-3.5 flex-shrink-0 text-brand-yellow" />
              <span>{item.label}</span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-8 ${className}`}
      aria-label="Trust signals"
    >
      {trustItems.map((item: any, i: number) => {
        const Icon = BADGES[i]?.icon || ShieldCheck;
        return (
          <div key={item.label} className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-2xl">
              <Icon className="w-5 h-5 text-brand-yellow" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white leading-tight">{item.label}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{item.sub}</p>
          </div>
        )
      })}
    </div>
  );
}

