"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, CreditCard, Loader2, Check, ShieldCheck, Lock, ChevronLeft, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/products";
import { ShippingAddress, ShippingRate } from "@/types";
import axios from "axios";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import { countries } from "@/lib/countries";
import CustomSelect from "@/components/ui/CustomSelect";
import { AsYouType, isValidPhoneNumber } from "libphonenumber-js";
import { createClient } from "@/lib/supabase-browser";

const EMPTY_ADDRESS: ShippingAddress = {
  full_name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip_code: "",
  country: "IT",
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [regions, setRegions] = useState<{ name: string, state_code: string }[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [localizedCountries, setLocalizedCountries] = useState<{ code: string, name: string }[]>(countries);
  const [zipFetched, setZipFetched] = useState(false);
  const [zipLookupFailed, setZipLookupFailed] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Hydration and Persistence
  useEffect(() => {
    setHasHydrated(true);
    
    // Check for user session
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        // Only auto-fill if the user hasn't typed anything yet
        setAddress(prev => ({ 
          ...prev, 
          email: prev.email || user.email || "" 
        }));
      }
    });

    const saved = sessionStorage.getItem("5ivearts-checkout-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address) setAddress(parsed.address);
        
        // Safety: Never restore to Step 3 as it requires a fresh Stripe session/secret which isn't persisted
        if (parsed.activeStep) {
          const restoredStep = parsed.activeStep;
          // Fallback to step 2 if they were at step 3, so they re-trigger the gateway
          setActiveStep(restoredStep === 3 ? 2 : restoredStep);
        }
        
        if (parsed.selectedRate) setSelectedRate(parsed.selectedRate);
      } catch (e) {
        console.warn("Failed to restore checkout state:", e);
      }
    }
  }, []);

  useEffect(() => {
     if (!hasHydrated) return;
     const stateToSave = { address, activeStep, selectedRate };
     sessionStorage.setItem("5ivearts-checkout-state", JSON.stringify(stateToSave));
  }, [address, activeStep, selectedRate, hasHydrated]);

  // Fetch localized countries on mount
  useEffect(() => {
    const fetchLocalizedCountries = async () => {
      try {
        const res = await axios.get("https://restcountries.com/v3.1/all?fields=cca2,translations,name");
        const userLang = navigator.language.split("-")[0]; // e.g. "it"

        const supportedCodes = new Set(countries.map(c => c.code));
        const mapped = res.data
          .filter((c: any) => supportedCodes.has(c.cca2))
          .map((c: any) => {
            // Try to find translation for user language
            const langMap: Record<string, string> = {
              it: "ita",
              fr: "fra",
              es: "spa",
              de: "deu",
              pt: "por",
              nl: "nld",
              hr: "hrv"
            };

            const targetKey = langMap[userLang] || userLang;
            const nativeName = c.translations[targetKey]?.common || c.name.common;

            return {
              code: c.cca2,
              name: nativeName
            };
          }).sort((a: any, b: any) => a.name.localeCompare(b.name));

        setLocalizedCountries(mapped);
      } catch (err) {
        console.error("Failed to fetch localized countries:", err);
      }
    };
    fetchLocalizedCountries();
  }, []);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!address.country) return;
      setLoadingRegions(true);
      setRegions([]);

      try {
        // Fetch from our local secure API proxy to bypass CORS and ensure stability
        const countryCode = address.country.toLowerCase();
        const res = await axios.get(`/api/regions/${countryCode}`);

        if (Array.isArray(res.data)) {
          setRegions(res.data);

          if (!res.data.find((r: any) => r.state_code === address.state || r.name === address.state)) {
            setAddress(prev => ({ ...prev, state: "" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch regions from ISO-DB, falling back to manual input:", err);
        setRegions([]); // Ensure fallback to manual text input
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, [address.country]);

  // Magic Postcode Automation: Auto-fills City and State based on ZIP
  useEffect(() => {
    const timer = setTimeout(async () => {
      const zip = address.zip_code.trim();
      const country = address.country.toUpperCase();

      if (!zip || zip.length < 3 || !country) {
        setZipFetched(false);
        setZipLookupFailed(false);
        return;
      }

      setIsZipLoading(true);
      try {
        const res = await axios.get(`https://api.zippopotam.us/${country.toLowerCase()}/${zip}`);
        if (res.data?.places?.length > 0) {
          const places = res.data.places;
          let bestPlace = places[0];
          if (places.length > 1) {
            const priorityMatch = places.find((p: any) =>
              (p["state abbreviation"] && p["state abbreviation"].length > 0) ||
              ["London", "Paris", "Berlin", "Roma", "Madrid", "Tokyo", "Sydney", "Palermo", "Wien"].some(city =>
                p["place name"].toLowerCase().includes(city.toLowerCase())
              )
            );
            if (priorityMatch) bestPlace = priorityMatch;
            else bestPlace = places[places.length - 1];
          }

          const newCity = bestPlace["place name"];
          const stateName = bestPlace["state"];
          const stateAbbr = bestPlace["state abbreviation"];

          const matchingRegion = regions.find(r => {
            const rName = r.name.toLowerCase();
            const rCode = r.state_code.toLowerCase().replace(/^[a-z]+-/, "");
            const sName = stateName?.toLowerCase() || "";
            const sAbbr = stateAbbr?.toLowerCase() || "";
            const cName = newCity?.toLowerCase() || "";

            return (
              rName === sName ||
              (sName.length > 0 && sName.includes(rName)) ||
              (sAbbr.length > 0 && rCode === sAbbr) ||
              (sName.length === 0 && rName === cName)
            );
          });

          setAddress(prev => ({
            ...prev,
            city: newCity,
            state: matchingRegion?.state_code || stateName || ""
          }));
          setZipFetched(true);
          setZipLookupFailed(false);
        } else {
          setZipFetched(false);
          setZipLookupFailed(true);
        }
      } catch (err) {
        console.warn(`[ZIP] Look-up failed for ${country}/${zip}. This is normal for some regions.`);
        setZipFetched(false);
        setZipLookupFailed(true);
      } finally {
        setIsZipLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      setZipFetched(false);
      setZipLookupFailed(false);
    };
  }, [address.zip_code, address.country, regions]);
  

  // Use manual continue for safety
  const canContinue = hasHydrated && items.length > 0;

  // Auto-refetch rates if missing on step 2 (e.g. on page refresh/restore)
  useEffect(() => {
    // Only auto-trigger if we have an address, are on step 2, have no rates, and aren't fetching
    if (
      hasHydrated && 
      activeStep === 2 && 
      rates.length === 0 && 
      !fetchingRates && 
      address.zip_code && 
      address.country
    ) {
      fetchShippingRates();
    }
  }, [hasHydrated, activeStep, rates.length, fetchingRates, address.zip_code, address.country]);



  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-500 mb-6 font-bold uppercase tracking-widest text-xs">Your collection is empty.</p>
        <Link
          href="/products"
          className="hasbro-btn-primary px-8 py-3 rounded-xl inline-block"
        >
          Explore the Collection
        </Link>
      </div>
    );
  }

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let value = e.target.value;
    const name = e.target.name;

    // Pro-Level Phone Formatting: Auto-Detect from (+)
    if (name === "phone") {
      value = new AsYouType().input(value);
    }

    setAddress({ ...address, [name]: value });

    // Reset rates and step when address changes to ensure fresh calculation
    setRates([]);
    setSelectedRate(null);
    setRateError(null);
    if (activeStep > 1) setActiveStep(1);
  };

  const fetchShippingRates = async () => {
    const log = (m: string) => navigator.sendBeacon("/api/debug/log", JSON.stringify({ message: `[STATE] ${m}`, type: "info" }));
    log("Starting fetchShippingRates...");

    if (!address.zip_code || !address.country) {
      setRateError("Please enter your postcode and country to get shipping rates.");
      return;
    }
    setFetchingRates(true);
    setRateError(null);
    try {
      const res = await axios.post<ShippingRate[]>("/api/shipping/rates", {
        toAddress: address,
        subtotalPence: subtotal,
      });
      log(`Rates received: ${res.data.length} services found.`);
      setRates(res.data);
      if (res.data.length > 0) {
        log("Setting Step 2 and selecting first rate.");
        setSelectedRate(res.data[0]);
        setActiveStep(2);
      }
    } catch (err: any) {
      log(`Rates fetch error: ${err.message}`);
      console.error("[checkout] Could not fetch rates:", err.response?.data || err.message);
      setRateError(err.response?.data?.error || "Could not fetch shipping rates. Please try again.");
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    const log = (m: string) => navigator.sendBeacon("/api/debug/log", JSON.stringify({ message: `[STATE] ${m}`, type: "info" }));
    log("Starting handleCheckout...");
    if (!selectedRate) {
      setRateError("Please select a shipping option before continuing.");
      return;
    }
    setCheckingOut(true);
    setRateError(null);
    try {
      const res = await axios.post<{ clientSecret: string }>("/api/checkout", {
        items,
        shippingRate: selectedRate,
        shippingAddress: address,
      });
      setClientSecret(res.data.clientSecret);
      setActiveStep(3);
    } catch (err: any) {
      console.error("[checkout] Initialization failed:", err.response?.data || err.message);
      setRateError(err.response?.data?.error || "Could not initialize secure gateway. Please verify your address.");
    } finally {
      setCheckingOut(false);
    }
  };

  const total = subtotal + (selectedRate?.price ?? 0);

  const STEPS = [
    { n: 1, label: "Delivery" },
    { n: 2, label: "Shipping" },
    { n: 3, label: "Payment" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen text-white">
      <div className="mb-12 border-b border-white/5 pb-8">
        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">Secure gateway</span>
        <div className="flex items-end gap-6 mb-2">
          <div className="flex flex-col -space-y-1 mb-1">
            <span className="font-black text-2xl uppercase tracking-tighter text-white">5ive</span>
            <span className="font-black text-[10px] uppercase tracking-[0.4em] text-brand-yellow">Arts</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white border-l border-white/10 pl-6">Checkout</h1>
        </div>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-start justify-center mb-16 max-w-md mx-auto">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-16 h-[2px] mb-6 transition-colors ${activeStep > i ? "bg-brand-yellow" : "bg-white/5"
                  }`}
              />
            )}
            <button
              type="button"
              onClick={() => n < activeStep && setActiveStep(n)}
              disabled={n >= activeStep}
              className={`flex flex-col items-center gap-2 group outline-none ${n < activeStep ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border ${activeStep > n
                  ? "bg-brand-yellow text-black border-brand-yellow shadow-lg shadow-brand-yellow/20"
                  : activeStep === n
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-[#0a0a0a] text-neutral-600 border-white/5"
                  } ${n < activeStep ? "group-hover:scale-110" : ""}`}
              >
                {activeStep > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-[10px] uppercase font-black tracking-widest transition-colors ${activeStep === n ? "text-white" : n < activeStep ? "text-neutral-400 group-hover:text-brand-yellow" : "text-neutral-600"
                  }`}
              >
                {label}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left — Wizard Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Delivery Destination */}
          {activeStep === 1 && (
            <div className="hasbro-card p-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 mb-10">
                <Truck className="w-5 h-5 text-brand-yellow" />
                1. Delivery Destination
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="sm:col-span-2">
                  <CustomSelect
                    label="Country *"
                    options={localizedCountries}
                    value={address.country}
                    onChange={(val: string) => setAddress(prev => ({ ...prev, country: val }))}
                    name="country"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={address.full_name}
                    onChange={handleAddressChange}
                    className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                    placeholder="Collector Name"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500">
                      Email Address *
                    </label>
                    {user && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-brand-yellow">
                        Vault: {user.email}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={address.email}
                    onChange={handleAddressChange}
                    className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                    placeholder="email@example.com"
                    required
                  />
                  {user && address.email !== user.email && (
                    <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-neutral-600">
                      Note: Order will be managed by your "{user.email}" vault, but notifications will go to this address.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street1"
                    value={address.street1}
                    onChange={handleAddressChange}
                    className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                    placeholder="Address Line 1"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                    Suite / Unit / Flat
                  </label>
                  <input
                    type="text"
                    name="street2"
                    value={address.street2}
                    onChange={handleAddressChange}
                    className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                    placeholder="Optional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-[10px] uppercase font-black tracking-widest mb-2 ${!address.country ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    Postcode * {!address.country && "(Select country first)"}
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={address.zip_code}
                    onChange={handleAddressChange}
                    disabled={!address.country}
                    className={`w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors ${!address.country ? 'opacity-30 cursor-not-allowed' : ''}`}
                    placeholder="Zip / Postcode"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-[10px] uppercase font-black tracking-widest mb-2 ${!zipFetched && !zipLookupFailed ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    City * {isZipLoading ? "(Detecting...)" : (zipFetched ? "(Auto-filled)" : (zipLookupFailed ? "(Enter Manually)" : "(Detected via Postcode)"))}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    readOnly={zipFetched && !zipLookupFailed}
                    className={`w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors ${!zipFetched && !zipLookupFailed ? 'opacity-30 cursor-not-allowed' : ''}`}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  {regions.length > 0 ? (
                    <CustomSelect
                      label={`State / Province * ${isZipLoading ? '(Detecting...)' : (zipFetched ? '(Auto)' : (zipLookupFailed ? '(Enter Manually)' : '(Auto)'))}`}
                      options={regions.map((r) => ({
                        code: r.state_code || r.name,
                        name: r.name
                      }))}
                      value={address.state}
                      onChange={(val: string) => setAddress(prev => ({ ...prev, state: val }))}
                      placeholder="Select Region"
                      disabled={!zipFetched && !zipLookupFailed}
                    />
                  ) : (
                    <>
                      <label className={`block text-[10px] uppercase font-black tracking-widest mb-2 ${!zipFetched && !zipLookupFailed ? 'text-neutral-700' : 'text-neutral-500'}`}>
                        State / Province {isZipLoading ? "(Detecting...)" : (zipFetched ? "(Auto)" : (zipLookupFailed ? "(Enter Manually)" : "(Auto)"))}
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        readOnly={zipFetched && !zipLookupFailed}
                        className={`w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors ${!zipFetched && !zipLookupFailed ? 'opacity-30 cursor-not-allowed' : ''}`}
                        placeholder={loadingRegions ? "Fetching regions..." : "Region"}
                      />
                    </>
                  )}
                </div>
                <div className="sm:col-span-2">
                  {(() => {
                    const phoneAsYouType = new AsYouType();
                    phoneAsYouType.input(address.phone);
                    const detectedCountry = phoneAsYouType.getCountry();
                    const isValid = isValidPhoneNumber(address.phone);

                    return (
                      <>
                        <label className={`block text-[10px] uppercase font-black tracking-widest mb-2 ${address.phone && !isValid
                          ? "text-red-400"
                          : isValid
                            ? "text-brand-yellow"
                            : "text-neutral-500"
                          }`}>
                          Phone Connection * {address.phone && !isValid ? "(Invalid Format)" : isValid ? "(Valid Number)" : "(Include + code)"}
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-white/10 pr-3 h-5">
                            {detectedCountry ? (
                              <button
                                type="button"
                                title={`Switch to ${detectedCountry}`}
                                onClick={() => {
                                  if (detectedCountry !== address.country) {
                                      setAddress(prev => ({ ...prev, country: detectedCountry }));
                                  }
                                }}
                                className="hover:scale-110 transition-transform cursor-pointer"
                              >
                                <img
                                  src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${detectedCountry.toUpperCase()}.svg`}
                                  alt={detectedCountry}
                                  className="w-5 h-auto rounded-sm shadow-sm"
                                />
                              </button>
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center text-neutral-600 text-[10px] font-bold">
                                +
                              </div>
                            )}
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={address.phone}
                            onChange={handleAddressChange}
                            className={`w-full bg-[#050505] border rounded pl-16 pr-4 py-3 text-sm text-white focus:outline-none transition-all ${address.phone && !isValid
                              ? "border-red-500/50"
                              : isValid
                                ? "border-brand-yellow/50 shadow-[0_0_15px_-5px_var(--hasbro-yellow)]"
                                : "border-white/5 focus:border-brand-yellow"
                              }`}
                            placeholder="+44 7700 900000"
                            required
                          />
                        </div>
                        {detectedCountry && detectedCountry !== address.country && (
                            <button 
                                type="button"
                                onClick={() => setAddress(prev => ({ ...prev, country: detectedCountry }))}
                                className="mt-2 text-[8px] font-black uppercase tracking-widest text-brand-yellow hover:underline"
                            >
                                Switch delivery country to {detectedCountry}?
                            </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <button
                type="button"
                onClick={fetchShippingRates}
                disabled={fetchingRates}
                className="mt-10 flex items-center justify-center gap-3 w-full border border-white/10 p-5 rounded font-black uppercase tracking-widest text-[10px] text-white hover:bg-white/5 transition-all disabled:opacity-30"
              >
                {fetchingRates && <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />}
                {fetchingRates ? "Recalculating Global Logistics…" : "Continue to Shipping Options"}
              </button>
            </div>
          )}

          {/* Step 2: Shipping Method */}
          {activeStep === 2 && (
            <div className="hasbro-card p-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Delivery
              </button>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10 flex items-center gap-3">
                <Truck className="w-5 h-5 text-brand-yellow" />
                2. Shipping Method
              </h2>
              <div className="space-y-4">
                {rates.map((rate) => (
                  <label
                    key={rate.service_id}
                    onClick={() => setSelectedRate(rate)}
                    className={`flex items-center justify-between p-6 rounded border cursor-pointer transition-all ${selectedRate?.service_id === rate.service_id
                      ? "border-brand-yellow bg-brand-yellow/5"
                      : "border-white/5 hover:border-white/20 bg-[#050505]"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedRate?.service_id === rate.service_id ? "border-brand-yellow" : "border-neutral-700"}`}>
                        {selectedRate?.service_id === rate.service_id && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tighter text-white">
                          {rate.carrier_name} — {rate.service_name}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
                          Delivery: {rate.estimated_days} business day{rate.estimated_days !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-brand-yellow text-lg tracking-tighter">
                      {formatPrice(rate.price)}
                    </span>
                  </label>
                ))}
              </div>

              {selectedRate && (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="mt-10 flex items-center justify-center gap-3 w-full hasbro-btn-primary p-5 py-6 rounded font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-30"
                >
                  {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {checkingOut ? "Initializing Gateway…" : "Proceed to Payment"}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Payment */}
          {activeStep === 3 && (
            <div className="hasbro-card p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Change Shipping Option
              </button>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 mb-10">
                <CreditCard className="w-5 h-5 text-brand-yellow" />
                3. Secure Payment
              </h2>

              {!clientSecret ? (
                <div className="space-y-6">
                  <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                    Connecting to secure payment gateway. Handshaking with PCI-DSS protocols...
                  </p>
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-yellow mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Syncing Transaction Layer</p>
                  </div>
                </div>
              ) : (
                <StripePaymentForm clientSecret={clientSecret} total={total} />
              )}
            </div>
          )}

          {rateError && (
            <p className="text-red-500 text-[10px] uppercase font-black border border-red-500/20 bg-red-500/5 rounded px-6 py-4 mt-8">
              Error: {rateError}
            </p>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="hasbro-card p-10 h-fit sticky top-24">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10 pb-4 border-b border-white/5">
            Order Review
          </h2>
          <div className="space-y-6 mb-10">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.selectedScale}-${item.selectedFinish}`} className="flex justify-between items-start gap-4 pb-4 border-b border-white/[0.02] last:border-0">
                <div className="flex flex-col gap-1">
                  <span className="text-white font-black uppercase tracking-tight text-[11px] leading-tight">
                    {item.product.name}
                  </span>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="text-[8px] font-black bg-white/5 text-neutral-400 px-1.5 py-0.5 border border-white/5 rounded-sm uppercase tracking-widest">
                      Scale: {item.selectedScale}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 border rounded-sm uppercase tracking-widest ${item.selectedFinish === 'painted'
                        ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                        : 'bg-white/5 text-neutral-400 border-white/5'
                      }`}>
                      Finish: {item.selectedFinish === 'painted' ? 'Hand-Painted' : 'Raw Kit'}
                    </span>
                    <span className="text-[9px] font-black text-brand-yellow tracking-widest ml-1">
                      × {item.quantity}
                    </span>
                  </div>
                </div>
                <span className="font-black text-white text-xs flex-shrink-0 tracking-tighter">
                  {formatPrice(item.priceAtSelection * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 space-y-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
            <div className="flex justify-between">
              <span>Merchandise subtotal</span>
              <span className="text-white">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Logistics & Handling</span>
              <span className="text-white">
                {selectedRate ? formatPrice(selectedRate.price) : "TBD"}
              </span>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex justify-between font-black text-white">
            <span className="uppercase tracking-[0.2em] text-[10px] text-neutral-400">Grand Total</span>
            <span className="text-brand-yellow text-3xl tracking-tighter">{formatPrice(total)}</span>
          </div>

          {activeStep < 3 && !clientSecret && (
            <button
              type="button"
              onClick={activeStep === 1 ? fetchShippingRates : handleCheckout}
              disabled={checkingOut || fetchingRates || (activeStep === 2 && !selectedRate)}
              className="hasbro-btn-primary mt-12 w-full py-5 text-sm flex items-center justify-center gap-3 disabled:opacity-20 shadow-2xl shadow-brand-yellow/10"
            >
              {checkingOut || fetchingRates ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {activeStep === 1 ? (fetchingRates ? "Recalculating..." : "Continue to Shipping") : (checkingOut ? "Connecting..." : "Proceed to Payment")}
            </button>
          )}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/5 pt-8">
            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest text-center leading-relaxed">
              Verified PCI-DSS Level 1 Security<br />
              SSL Layer Encryption Active
            </p>
            {rates.length === 0 && (
              <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest animate-pulse">
                Enter address to activate payment
              </p>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
