import Link from "next/link";
import { CheckCircle, Package, Truck, Mail } from "lucide-react";
import CartClearer from "@/components/checkout/CartClearer";

export const metadata = {
  title: "Order Confirmed — 5iveArts",
};

/**
 * Shown after a successful Stripe Checkout session.
 * CartClearer (client component) empties the Zustand cart on mount.
 */
export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      {/* Clears cart client-side */}
      <CartClearer />

      {/* Success icon */}
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-14 h-14 text-green-500" />
      </div>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
        Order Confirmed! 🎉
      </h1>
      <p className="text-lg text-gray-600 mb-2">
        Thank you for your purchase from 5iveArts.
      </p>
      <p className="text-gray-500 text-sm mb-10">
        You&apos;ll receive a confirmation email shortly. Your figure will be
        carefully packaged and shipped via Packlink.
      </p>

      {/* What happens next */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10 text-left">
        <h2 className="font-bold text-gray-900 mb-4 text-center">What happens next?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Confirmation email</p>
              <p className="text-xs text-gray-500 mt-0.5">
                A receipt will land in your inbox within a few minutes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Careful packaging</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your figure is wrapped in custom foam padding and boxed securely.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Tracked delivery</p>
              <p className="text-xs text-gray-500 mt-0.5">
                We&apos;ll email you a Packlink tracking number once it&apos;s on its way.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/products"
        className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
