import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = {
  title: "Payment Cancelled — 5iveArts",
};

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
        Payment Cancelled
      </h1>
      <p className="text-gray-600 mb-10">
        Your order was not placed. Your cart has been kept intact — you can
        return and try again whenever you&apos;re ready.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/checkout"
          className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </Link>
        <Link
          href="/cart"
          className="border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Back to Cart
        </Link>
      </div>
    </div>
  );
}
