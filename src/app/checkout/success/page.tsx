import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Order Confirmed — 5iveArts",
};

/**
 * Shown after a successful Stripe Checkout session.
 * The cart is cleared client-side by the CheckoutSuccessClient component.
 */
export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
        Order Confirmed!
      </h1>
      <p className="text-gray-600 mb-2">
        Thank you for your purchase. You&apos;ll receive a confirmation email
        shortly.
      </p>
      <p className="text-gray-500 text-sm mb-10">
        Your figure will be carefully packaged and shipped via Packlink. We&apos;ll
        email you a tracking number once it&apos;s on its way.
      </p>
      <Link
        href="/products"
        className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
