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
    label: "Free UK Shipping",
    sub: "On all orders",
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
}

/**
 * Reusable trust / security badge strip.
 * Import in both server and client components — no hooks, pure JSX.
 */
export default function TrustBadges({
  variant = "grid",
  className = "",
}: TrustBadgesProps) {
  if (variant === "row") {
    return (
      <div
        className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}
        aria-label="Trust signals"
      >
        {BADGES.map(({ icon: Icon, label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
            <span className="font-medium">{label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}
      aria-label="Trust signals"
    >
      {BADGES.map(({ icon: Icon, label, sub, color }) => (
        <div key={label} className="flex flex-col items-center text-center gap-1.5">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-xs font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">{sub}</p>
        </div>
      ))}
    </div>
  );
}
