"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Package, Truck, Mail, Loader2, ShieldCheck, Eye, EyeOff, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useCartStore, CartStore } from "@/store/cart";
import axios from "axios";
import "altcha";

export default function SuccessClient({ dict, lang }: { dict: any, lang: string }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mb-6" />
        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-neutral-500 animate-pulse">
          {dict.checkout.verifying}
        </p>
      </div>
    }>
      <SuccessContent dict={dict} lang={lang} />
    </Suspense>
  );
}

function SuccessContent({ dict, lang }: { dict: any, lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "complete" | "error">("loading");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [paymentType, setPaymentType] = useState<"deposit" | "final" | "full">("full");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Signup states
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [altchaPayload, setAltchaPayload] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown protocol
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!sessionId || resending) return;
    setResending(true);
    try {
      await axios.post("/api/checkout/resend", { sessionId });
      setResendSuccess(true);
    } catch (err) {
      console.error("Failed to resend email:", err);
      alert(dict.errors?.genericError || "Could not resend email. Please contact support.");
    } finally {
      setResending(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !customerEmail || signingUp || cooldown > 0) return;
    if (!altchaPayload) {
        setSignupError("Human verification required.");
        return;
    }

    setSigningUp(true);
    setSignupError(null);

    try {
      await axios.post("/api/auth/signup", {
        email: customerEmail,
        password,
        sessionId,
        altcha: altchaPayload
      });
      
      setSignupSuccess(true);
      setSignupError(null);

      try {
        const supabase = createClient();
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: customerEmail,
          password
        });
        
        if (!loginError) {
          router.refresh();
        }
      } catch (loginErr) {
        console.warn("[signup] Auto-login system error:", loginErr);
      }
    } catch (err: any) {
      setSignupError(err.response?.data?.error || dict.errors?.signupFailed || "Signup failed. Please try again.");
      // Trigger security cooldown on failure
      setCooldown(60);
    } finally {
      setSigningUp(false);
    }
  };
  
  const clearCart = useCartStore((state: CartStore) => state.clearCart);

  useEffect(() => {
    clearCart();
    const saved = sessionStorage.getItem("5ivearts-checkout-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        sessionStorage.setItem("5ivearts-checkout-state", JSON.stringify({
          ...parsed,
          activeStep: 1,
          selectedRate: null
        }));
      } catch (e) {
        // Ignore
      }
    }
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/checkout?session_id=${sessionId}`);
        if (res.data.status === "complete") {
          setStatus("complete");
          setCustomerEmail(res.data.customer_email);
          setOrderId(res.data.orderId);
          setIsCustom(res.data.isCustom);
          setPaymentType(res.data.paymentType || (res.data.isCustom ? "deposit" : "full"));
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Error checking session status:", err);
        setStatus("error");
      }
    };

    checkStatus();
  }, [sessionId]);

  useEffect(() => {
    async function getAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    }
    getAuth();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 transition-all duration-700">
        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mb-6" />
        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-neutral-500 animate-pulse">
           {dict.checkout.verifying}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
            {dict.errors?.genericError || "Something went wrong"}
          </h1>
          <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold mb-8">
            {dict.errors?.verifyStatusError || "We couldn't verify your payment status. If you received a confirmation email, your order is processing."}
          </p>
          <Link href={`/${lang}/checkout`} className="hasbro-btn-primary px-8 py-4 text-xs">
            {dict.checkout.backBtn}
          </Link>
        </div>
      </div>
    );
  }

  const isFinalBalance = isCustom && paymentType === "final";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 animate-in fade-in duration-1000">
      <div className="max-w-2xl w-full text-center">
        <div className="flex flex-col items-center mb-12 -space-y-2">
          <span className="font-black text-4xl uppercase tracking-tighter text-white transition-colors hover:text-brand-yellow">
            <Link href={`/${lang}`}>5ive</Link>
          </span>
          <span className="font-black text-xs uppercase tracking-[0.5em] text-brand-yellow">Arts</span>
        </div>

        <div className="w-24 h-24 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-yellow/20">
          <CheckCircle className="w-14 h-14 text-brand-yellow" />
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
          {isFinalBalance ? dict.success.finalProtocol : isCustom ? dict.success.commissionProtocol : dict.success.orderConfirmed}
        </h1>
        <p className="text-lg text-neutral-300 mb-2 font-bold uppercase tracking-widest text-[12px]">
          {isFinalBalance ? dict.success.acquisitionComplete : isCustom ? dict.success.fabricationInitiated : dict.success.thankYou}
        </p>
        <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold mb-14">
          {dict.success.confEmailSent} <span className="text-brand-yellow">{customerEmail}</span>.<br />
          {isFinalBalance ? dict.success.logisticsLocked : isCustom ? dict.success.projectQueued : dict.success.shippingNote}
        </p>

        <div className="bg-[#0a0a0a] rounded border border-white/5 p-8 mb-14 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow/50" />
          <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/5">
            <h2 className="font-black text-white uppercase tracking-[0.3em] text-[11px]">
              {isCustom ? dict.success.fabricationJournal : dict.success.logisticsLog}
            </h2>
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded border transition-all flex items-center gap-2 ${resendSuccess
                ? "border-green-500/50 text-green-500 bg-green-500/5"
                : "border-white/10 text-neutral-500 hover:text-white hover:border-white/20"
                }`}
            >
              {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              {resendSuccess ? dict.success.syncComplete : dict.success.resendEmail}
            </button>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-black text-white text-[11px] uppercase tracking-widest">
                    {isFinalBalance ? dict.success.balanceReconciled : isCustom ? dict.success.depositSecured : (dict.checkout.deliveryStep.split(". ")[1] || "Confirmation")}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                    {isFinalBalance ? dict.success.logisticsVerified : isCustom ? dict.success.depositVerified : dict.success.paymentVerified}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                {isFinalBalance ? <Truck className="w-4 h-4 text-brand-yellow" /> : <Package className="w-4 h-4 text-brand-yellow" />}
              </div>
              <div>
                <p className="font-black text-white text-[11px] uppercase tracking-widest">
                    {isFinalBalance ? dict.success.extractionProtocol : isCustom ? dict.success.artisanForging : (dict.checkout.shippingStep.split(". ")[1] || "Fulfillment")}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                    {isFinalBalance ? dict.success.carrierHandoff : isCustom ? dict.success.productionQueue : dict.success.fulfillmentNote}
                </p>
              </div>
            </div>
          </div>
        </div>

        {(signupSuccess || (user && !checkingAuth)) ? (
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded p-8 mb-14 text-center animate-in zoom-in duration-500">
            <ShieldCheck className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">{dict.success.vaultEntry}</h3>
            <p className="text-brand-yellow text-[10px] font-bold uppercase tracking-[0.2em] mb-6">{dict.success.recordsArchived}</p>
            <Link 
              href={orderId ? `/${lang}/account/orders/${orderId}` : `/${lang}/account`}
              className="inline-block text-[10px] font-black uppercase tracking-widest text-white border-b border-brand-yellow/50 pb-1 hover:text-brand-yellow transition-all flex items-center gap-2 mx-auto w-fit"
            >
              {isCustom ? dict.success.viewProtocol : dict.success.goWarehouse}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ) : !checkingAuth ? (
          <div className="bg-[#0a0a0a] rounded border border-brand-yellow/30 p-8 mb-14 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24 text-brand-yellow" />
            </div>
            <div className="relative z-10">
              <h2 className="font-black text-white uppercase tracking-[0.3em] text-[11px] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                {dict.success.secureCollection}
              </h2>
              <form onSubmit={handleSignup} className="space-y-4 max-w-md">
                {/* ALTCHA Verification Widget */}
                <div className="mb-4">
                  {/* @ts-ignore */}
                  <altcha-widget 
                    challengeurl="/api/auth/captcha/challenge"
                    onstatechange={(e: any) => {
                      if (e.detail.state === 'verified') {
                        setAltchaPayload(e.detail.payload);
                      } else {
                        setAltchaPayload(null);
                      }
                    }}
                    hidefooter
                    hidelogo
                    class="altcha-terminal-widget"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={dict.auth?.passwordLabel || "CHOOSE A SECURITY KEY"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 pr-12 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-yellow/50 transition-all placeholder:text-neutral-700"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {signupError && (
                      <p className="absolute -bottom-6 left-0 text-[9px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        {signupError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={signingUp || cooldown > 0 || !altchaPayload}
                    className={`hasbro-btn-primary px-8 py-4 text-[10px] whitespace-nowrap flex items-center justify-center gap-2 relative overflow-hidden ${
                      cooldown > 0 ? "opacity-50 cursor-not-allowed border-neutral-800" : ""
                    }`}
                  >
                    {signingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                    {signingUp ? dict.success.securing : cooldown > 0 ? `LOCKED (${cooldown}S)` : dict.success.createAccount}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <Link
          href={`/${lang}/products`}
          className="hasbro-btn-primary text-sm px-16 py-6 shadow-[0_25px_50px_rgba(255,159,0,0.2)] hover:scale-105 transition-all inline-block uppercase tracking-widest font-black"
        >
          {dict.success.returnHQ}
        </Link>
      </div>
    </div>
  );
}
