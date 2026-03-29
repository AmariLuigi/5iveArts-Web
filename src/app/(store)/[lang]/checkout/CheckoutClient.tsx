"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, CreditCard, Loader2, Check, ShieldCheck, Lock, ChevronLeft, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, CartStore } from "@/store/cart";
import { formatPrice } from "@/lib/products";
import { ShippingAddress, ShippingRate, UserAddress } from "@/types";
import { MapPin, Globe, ChevronDown, CheckCircle2, Plus } from "lucide-react";
import axios from "axios";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import { countries } from "@/lib/countries";
import CustomSelect from "@/components/ui/CustomSelect";
import { AsYouType, isValidPhoneNumber } from "libphonenumber-js";
import { createClient } from "@/lib/supabase-browser";
import { useAnalytics } from "@/hooks/useAnalytics";

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


export default function CheckoutClient({ 
  dict, 
  lang, 
  freeShippingThreshold 
}: { 
  dict: any; 
  lang: string; 
  freeShippingThreshold: number;
}) {
  const items = useCartStore((state: CartStore) => state.items);
  const subtotal = useCartStore((state: CartStore) => state.subtotal)();
  
  const formattedThreshold = formatPrice(freeShippingThreshold);
  const freeShippingMsg = dict.cart.freeShipping.replace("{amount}", formattedThreshold);
  const router = useRouter();
  const { track } = useAnalytics();
  const stepEnteredAt = useRef<number>(Date.now());

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
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [saveToVault, setSaveToVault] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Hydration and Persistence
  useEffect(() => {
    setHasHydrated(true);
    
    // Check for user session
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        // Fetch saved addresses
        axios.get("/api/account/addresses").then(res => {
          setSavedAddresses(res.data);
          // If there's a default address and current address is empty, auto-fill it
          const defaultAddr = res.data.find((a: UserAddress) => a.is_default);
          if (defaultAddr && (!address.street1 || address.street1 === "")) {
            setSelectedSavedId(defaultAddr.id);
            applySavedAddress(defaultAddr);
          }
        }).catch(err => console.error("Failed to fetch saved addresses:", err));

        // Only auto-fill if the user hasn't typed anything yet
        setAddress((prev: ShippingAddress) => ({ 
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
        if (parsed.rates) setRates(parsed.rates);
        
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
     const stateToSave = { address, activeStep, selectedRate, rates };
     sessionStorage.setItem("5ivearts-checkout-state", JSON.stringify(stateToSave));
  }, [address, activeStep, selectedRate, rates, hasHydrated]);

  // ── Funnel Step Telemetry ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;
    const eventMap: Record<number, string> = {
      1: "checkout_step_1",
      2: "checkout_step_2",
      3: "checkout_step_3",
    };
    const eventType = eventMap[activeStep];
    if (!eventType) return;

    const now = Date.now();
    const timeOnPrev = now - stepEnteredAt.current;
    stepEnteredAt.current = now;

    track(
      eventType,
      {
        cart_total: subtotal,
        item_count: items.length,
        country: address.country || undefined,
        // Only meaningful after Step 1 — skip the ~0ms phantom value on load
        ...(activeStep > 1 ? { time_on_previous_step_ms: timeOnPrev } : {}),
        step_entered_at: new Date().toISOString(),
      },
      activeStep // ← pass stepNumber for dedup guard in useAnalytics
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, hasHydrated]);

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
            setAddress((prev: ShippingAddress) => ({ ...prev, state: "" }));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

          setAddress((prev: ShippingAddress) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-4">
          {dict.checkout.emptyArsenalTitle}
        </h2>
        <p className="text-gray-500 mb-10 font-bold uppercase tracking-widest text-xs">
          {dict.checkout.emptyArsenalDesc}
        </p>
        <Link
          href={`/${lang}/products`}
          className="hasbro-btn-primary px-8 py-3 rounded-xl inline-block"
        >
          {dict.checkout.returnShop}
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

    // ── Client-side validation before wasting an API call ──────────────────────
    const missing: string[] = [];
    if (!address.full_name?.trim()) missing.push(dict.checkout.recipientName.replace(" *", ""));
    if (!address.email?.trim()) missing.push(dict.checkout.emailAddress.replace(" *", ""));
    if (!address.street1?.trim()) missing.push(dict.checkout.stAddress?.replace(" *", "") || "Street Address");
    if (!address.city?.trim()) missing.push(dict.checkout.city || "City");
    if (!address.zip_code?.trim()) missing.push(dict.checkout.zipCode || "Zip Code");
    if (!address.country?.trim()) missing.push("Country");
    if (!address.phone?.trim()) missing.push(dict.checkout.phoneLabel?.replace(" *", "") || "Phone");

    if (missing.length > 0) {
      setRateError(`${dict.errors?.genericError || "Please complete all required fields before continuing"}: ${missing.join(", ")}`);
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
      setRateError(err.response?.data?.error || dict.errors?.unexpectedError || "Could not fetch shipping rates. Please try again.");
      track("checkout_address_error", {
        error: err.response?.data?.error || err.message,
        country: address.country,
        zip_code: address.zip_code,
        cart_total: subtotal,
      });
    } finally {
      setFetchingRates(false);
    }
  };

  const applySavedAddress = (saved: UserAddress) => {
    setAddress({
      ...address,
      full_name: saved.full_name,
      street1: saved.street1,
      street2: saved.street2 || "",
      city: saved.city,
      state: saved.state,
      zip_code: saved.zip_code,
      country: saved.country,
      phone: saved.phone || "",
      email: saved.email || address.email || user?.email || ""
    });
    setShowAddressPicker(false);
    // Reset rates since location changed
    setRates([]);
    setSelectedRate(null);
    if (activeStep > 1) setActiveStep(1);
  };

  const handleApplySaved = (sa: UserAddress) => {
    setSelectedSavedId(sa.id);
    applySavedAddress(sa);
    setShowAddressPicker(false);
  };

  const handleCheckout = async () => {
    const log = (m: string) => navigator.sendBeacon("/api/debug/log", JSON.stringify({ message: `[STATE] ${m}`, type: "info" }));
    log("Starting handleCheckout...");
    if (!selectedRate) {
      setRateError(dict.errors?.genericError || "Please select a shipping option before continuing.");
      return;
    }

    // Track courier selection before proceeding to payment
    track("courier_selected", {
      courier_id: selectedRate.service_id,
      courier_name: selectedRate.carrier_name,
      service_name: selectedRate.service_name,
      quoted_price: selectedRate.price,
      free_shipping_applied: selectedRate.price === 0,
      cart_total: subtotal,
      country: address.country,
    });

    setCheckingOut(true);
    setRateError(null);
    try {
      const res = await axios.post<{ clientSecret: string }>("/api/checkout", {
        items,
        shippingRate: selectedRate,
        shippingAddress: address,
        lang,
      });

      // Address Auto-Save Protocol
      if (saveToVault && user) {
        axios.post("/api/account/addresses", {
            full_name: address.full_name,
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            country: address.country,
            phone: address.phone,
            is_default: savedAddresses.length === 0
        }).catch(err => console.error("Failed to auto-save dispatch destination:", err));
      }

      setClientSecret(res.data.clientSecret);
      setActiveStep(3);
    } catch (err: any) {
      console.error("[checkout] Initialization failed:", err.response?.data || err.message);
      setRateError(err.response?.data?.error || dict.errors?.unexpectedError || "Could not initialize secure gateway. Please verify your address.");
      track("payment_gateway_error", {
        error: err.response?.data?.error || err.message,
        country: address.country,
        cart_total: subtotal,
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const total = subtotal + (selectedRate?.price ?? 0);

  const STEPS = [
    { n: 1, label: dict.checkout.deliveryStep.split(". ")[1] || "Delivery" },
    { n: 2, label: dict.checkout.shippingStep.split(". ")[1] || "Shipping" },
    { n: 3, label: dict.checkout.paymentStep.split(". ")[1] || "Payment" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen text-white">
      <div className="mb-12 border-b border-white/5 pb-8">
        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">{dict.checkout.gateway}</span>
        <div className="flex items-end gap-6 mb-2">
          <div className="flex flex-col -space-y-1 mb-1">
            <span className="font-black text-2xl uppercase tracking-tighter text-white">5ive</span>
            <span className="font-black text-[10px] uppercase tracking-[0.4em] text-brand-yellow">Arts</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white border-l border-white/10 pl-6">{dict.checkout.checkout}</h1>
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
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hasbro-card p-10"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 mb-10">
                <Truck className="w-5 h-5 text-brand-yellow" />
                {dict.checkout.deliveryStep}
              </h2>

              {/* Saved Address Integration */}
              {user && savedAddresses.length > 0 && (
                <div className="mb-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">
                      {dict.checkout.chooseSaved}
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedSavedId(null);
                        setAddress(EMPTY_ADDRESS);
                      }}
                      className={`text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${
                        !selectedSavedId ? "text-white" : "text-brand-yellow hover:text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {dict.checkout.newAddress}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedAddresses.map((sa) => (
                      <button
                        key={sa.id}
                        type="button"
                        onClick={() => handleApplySaved(sa)}
                        className={`text-left p-6 rounded-sm border transition-all group relative ${
                          selectedSavedId === sa.id 
                            ? "bg-brand-yellow/5 border-brand-yellow shadow-[0_0_20px_-10px_var(--hasbro-yellow)]" 
                            : "bg-[#050505] border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${
                              selectedSavedId === sa.id ? "text-brand-yellow" : "text-white group-hover:text-brand-yellow"
                            } transition-colors`}>
                              {sa.full_name}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-1">
                              {sa.is_default ? dict.account.settings.default : "Route"}
                            </span>
                          </div>
                          {selectedSavedId === sa.id && (
                            <div className="bg-brand-yellow text-black p-1 rounded-full">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${
                          selectedSavedId === sa.id ? "text-neutral-400" : "text-neutral-500"
                        }`}>
                          {sa.street1}<br />
                          {sa.zip_code} {sa.city}, {sa.state}<br />
                          {sa.country}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Entry Protocol */}
              {(!selectedSavedId || (user && savedAddresses.length === 0)) && (
                <div className="p-8 border border-white/5 bg-white/[0.01] rounded-sm animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      {dict.checkout.newAddress}
                    </h3>
                    {selectedSavedId && (
                       <button 
                        onClick={() => setSelectedSavedId(null)}
                        className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-brand-yellow transition-colors"
                       >
                        {dict.checkout.backBtn}
                       </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="sm:col-span-2">
                      <CustomSelect
                        label={dict.navbar?.country || "Country *"}
                        options={localizedCountries}
                        value={address.country}
                        onChange={(val: string) => setAddress((prev: ShippingAddress) => ({ ...prev, country: val }))}
                        name="country"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                        {dict.checkout.recipientName}
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={address.full_name}
                        onChange={handleAddressChange}
                        className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                        placeholder={dict.checkout.collectorPlaceholder}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500">
                          {dict.checkout.emailAddress}
                        </label>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={address.email}
                        onChange={handleAddressChange}
                        className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                        placeholder="collector@5ivearts.com"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                        {dict.checkout.stAddress}
                      </label>
                      <input
                        type="text"
                        name="street1"
                        value={address.street1}
                        onChange={handleAddressChange}
                        className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors mb-4"
                        placeholder={dict.checkout.streetPlaceholder}
                        required
                      />
                      <input
                        type="text"
                        name="street2"
                        value={address.street2 || ""}
                        onChange={handleAddressChange}
                        className="w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors"
                        placeholder={dict.checkout.aptPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                        {dict.checkout.city}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          className={`w-full bg-[#050505] border rounded px-4 py-3 text-sm text-white focus:outline-none transition-all ${zipFetched ? "border-brand-yellow/30 shadow-[0_0_10px_-5px_var(--hasbro-yellow)]" : "border-white/5 focus:border-brand-yellow"}`}
                          placeholder="Firenze"
                          required
                        />
                        {isZipLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3 h-3 animate-spin text-brand-yellow" />
                          </div>
                        )}
                        {zipFetched && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="w-3 h-3 text-brand-yellow" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <CustomSelect
                        label={dict.checkout.state}
                        options={regions.length > 0 ? regions.map(r => ({ code: r.state_code, name: r.name })) : []}
                        value={address.state}
                        onChange={(val: string) => setAddress((prev: ShippingAddress) => ({ ...prev, state: val }))}
                        name="state"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                        {dict.checkout.zipCode}
                      </label>
                      <input
                        type="text"
                        name="zip_code"
                        value={address.zip_code}
                        onChange={handleAddressChange}
                        className={`w-full bg-[#050505] border rounded px-4 py-3 text-sm text-white focus:outline-none transition-all ${zipLookupFailed ? "border-red-500/50" : zipFetched ? "border-brand-yellow/30" : "border-white/5 focus:border-brand-yellow"}`}
                        placeholder="50123"
                        required
                      />
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
                              {dict.checkout.phoneLabel} {address.phone && !isValid ? dict.checkout.invalidFormat : isValid ? dict.checkout.validNumber : dict.checkout.includeCode}
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-white/10 pr-3 h-5">
                                {detectedCountry ? (
                                  <button
                                    type="button"
                                    title={`Switch to ${detectedCountry}`}
                                    onClick={() => {
                                      if (detectedCountry !== address.country) {
                                          setAddress((prev: ShippingAddress) => ({ ...prev, country: detectedCountry }));
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

                            {/* Save to Vault Protocol */}
                            {user && !selectedSavedId && (
                              <div className="sm:col-span-2 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <div className="relative flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={saveToVault}
                                      onChange={(e) => setSaveToVault(e.target.checked)}
                                      className="peer appearance-none w-5 h-5 border border-white/10 rounded-sm checked:bg-brand-yellow checked:border-brand-yellow transition-all"
                                    />
                                    <Check className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-white transition-colors">
                                    {dict.checkout.saveToVault}
                                  </span>
                                </label>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={fetchShippingRates}
                disabled={fetchingRates}
                className="mt-10 flex items-center justify-center gap-3 w-full border border-white/10 p-5 rounded font-black uppercase tracking-widest text-[10px] text-white hover:bg-white/5 transition-all disabled:opacity-30"
              >
                {fetchingRates && <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />}
                {fetchingRates ? dict.checkout.recalculating : dict.checkout.continueBtn}
              </button>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hasbro-card p-10"
            >
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                {dict.checkout.backBtn}
              </button>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10 flex items-center gap-3">
                <Truck className="w-5 h-5 text-brand-yellow" />
                {dict.checkout.shippingStep}
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
                          {dict.checkout.deliveryEstimate} {rate.estimated_days} {rate.estimated_days === 1 ? dict.checkout.businessDay : dict.checkout.businessDays}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {rate.original_price && (
                        <span className="text-[10px] line-through text-neutral-600 block leading-none mb-1">
                          {formatPrice(rate.original_price)}
                        </span>
                      )}
                      <span className={`font-black uppercase tracking-tighter text-lg ${rate.price === 0 ? "text-brand-yellow" : "text-white"}`}>
                        {formatPrice(rate.price)}
                      </span>
                    </div>
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
                  {checkingOut ? dict.checkout.initGateway : dict.checkout.proceedBtn}
                </button>
              )}
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hasbro-card p-10"
            >
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                {dict.checkout.changeShipping}
              </button>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 mb-10">
                <CreditCard className="w-5 h-5 text-brand-yellow" />
                {dict.checkout.paymentStep}
              </h2>

              {!clientSecret ? (
                <div className="space-y-6">
                  <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                    {dict.checkout.connecting}
                  </p>
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-yellow mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{dict.checkout.syncing}</p>
                  </div>
                </div>
              ) : (
                <StripePaymentForm clientSecret={clientSecret} total={total} dict={dict} />
              )}
            </motion.div>
          )}
          </AnimatePresence>

          {rateError && (
            <p className="text-red-500 text-[10px] uppercase font-black border border-red-500/20 bg-red-500/5 rounded px-6 py-4 mt-8">
              Error: {rateError}
            </p>
          )}
        </div>

        <div className="hasbro-card p-10 h-fit sticky top-24">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-10 pb-4 border-b border-white/5">
            {dict.checkout.orderReview}
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
                      {dict.products.scale}: {item.selectedScale}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 border rounded-sm uppercase tracking-widest ${item.selectedFinish === 'painted'
                        ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                        : 'bg-white/5 text-neutral-400 border-white/5'
                      }`}>
                      {dict.products.finish}: {item.selectedFinish === 'painted' ? dict.products.painted : dict.products.raw}
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
            <div className="flex justify-between items-center">
              <span>{dict.checkout.subtotal}</span>
              <div className="flex flex-col items-end">
                <span className="text-white">
                  {formatPrice(subtotal)}
                </span>
                {subtotal >= freeShippingThreshold ? (
                  <span className="text-[7px] text-brand-yellow font-black tracking-widest bg-brand-yellow/10 px-1.5 py-0.5 mt-1 border border-brand-yellow/20 rounded-sm">
                    {dict.cart.insuredShipping.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[7px] text-neutral-600 font-bold tracking-widest mt-1">
                    {freeShippingMsg.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span>{dict.checkout.logistics}</span>
              <span className="text-white">
                {selectedRate ? formatPrice(selectedRate.price) : dict.checkout.tbd}
              </span>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex justify-between font-black text-white">
            <span className="uppercase tracking-[0.2em] text-[10px] text-neutral-400">{dict.checkout.grandTotal}</span>
            <span className="text-brand-yellow text-3xl tracking-tighter">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
