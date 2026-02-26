"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, CreditCard, Loader2, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/products";
import { ShippingAddress, ShippingRate } from "@/types";
import axios from "axios";

const EMPTY_ADDRESS: ShippingAddress = {
  full_name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip_code: "",
  country: "GB",
  phone: "",
  email: "",
};

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal)();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-500 mb-6">Your cart is empty.</p>
        <Link
          href="/products"
          className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
    // Reset rates when address changes
    setRates([]);
    setSelectedRate(null);
    setRateError(null);
  };

  const fetchShippingRates = async () => {
    if (!address.zip_code || !address.country) {
      setRateError("Please enter your postcode and country to get shipping rates.");
      return;
    }
    setFetchingRates(true);
    setRateError(null);
    try {
      const totalWeight =
        items.reduce((sum, item) => sum + item.quantity * 0.3, 0);
      const res = await axios.post<ShippingRate[]>("/api/packlink/rates", {
        toAddress: address,
        weightKg: Math.max(0.5, totalWeight),
      });
      setRates(res.data);
      if (res.data.length > 0) setSelectedRate(res.data[0]);
    } catch {
      setRateError("Could not fetch shipping rates. Please try again.");
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedRate) {
      setRateError("Please select a shipping option before continuing.");
      return;
    }
    setCheckingOut(true);
    try {
      const res = await axios.post<{ url: string }>("/api/checkout", {
        items,
        shippingRate: selectedRate,
        shippingAddress: address,
      });
      router.push(res.data.url);
    } catch {
      setRateError("Could not initiate checkout. Please try again.");
      setCheckingOut(false);
    }
  };

  const total = subtotal + (selectedRate?.price ?? 0);

  // Step 1: filling address; Step 2: rates visible; Step 3: ready to pay
  const currentStep = checkingOut ? 3 : rates.length > 0 ? 2 : 1;

  const STEPS = [
    { n: 1, label: "Delivery" },
    { n: 2, label: "Shipping" },
    { n: 3, label: "Payment" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Checkout</h1>

      {/* Step progress indicator */}
      <div className="flex items-start justify-center mb-10 max-w-xs mx-auto">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-10 h-0.5 mb-6 transition-colors ${
                  currentStep > i ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep > n
                    ? "bg-green-500 text-white"
                    : currentStep === n
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStep === n ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Address + Shipping */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-indigo-500" />
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={address.full_name}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={address.email}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="street1"
                  value={address.street1}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="123 High Street"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="street2"
                  value={address.street2}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Flat 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="London"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County / State
                </label>
                <input
                  type="text"
                  name="state"
                  value={address.state}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Greater London"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={address.zip_code}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="SW1A 1AA"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  value={address.country}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="GB">United Kingdom</option>
                  <option value="IE">Ireland</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="PT">Portugal</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleAddressChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="+44 7700 900000"
                  required
                />
              </div>
            </div>

            <button
              onClick={fetchShippingRates}
              disabled={fetchingRates}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
            >
              {fetchingRates && <Loader2 className="w-4 h-4 animate-spin" />}
              {fetchingRates ? "Fetching rates…" : "Get Shipping Rates"}
            </button>
          </div>

          {/* Shipping rates */}
          {rates.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Choose Shipping
              </h2>
              <div className="space-y-3">
                {rates.map((rate) => (
                  <label
                    key={rate.service_id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedRate?.service_id === rate.service_id
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingRate"
                        checked={selectedRate?.service_id === rate.service_id}
                        onChange={() => setSelectedRate(rate)}
                        className="accent-indigo-600"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {rate.carrier_name} — {rate.service_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Est. {rate.estimated_days} day{rate.estimated_days !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-indigo-700 text-sm">
                      {formatPrice(rate.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {rateError && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {rateError}
            </p>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span className="truncate mr-2">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900 flex-shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-gray-900">
                {selectedRate ? formatPrice(selectedRate.price) : "—"}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-indigo-700">{formatPrice(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut || !selectedRate}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:shadow-none text-lg"
          >
            {checkingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
            {checkingOut ? "Redirecting…" : "Pay Securely with Stripe"}
          </button>
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400 text-center flex items-center gap-1">
              🔒 256-bit SSL encryption · Stripe PCI-DSS compliant
            </p>
            {rates.length === 0 && (
              <p className="text-xs text-gray-400">
                Enter your address to get shipping rates
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
