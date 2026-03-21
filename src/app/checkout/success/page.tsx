"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Package, Truck, Mail, Loader2, ShieldCheck, Eye, EyeOff, AlertTriangle } from "lucide-react";
import CartClearer from "@/components/checkout/CartClearer";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useCartStore } from "@/store/cart";
import axios from "axios";

/**
 * Shown after a successful Stripe Checkout session.
 * CartClearer (client component) empties the Zustand cart on mount.
 */
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mb-6" />
        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-neutral-500 animate-pulse">
          Verifying Secure Transaction…
        </p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "complete" | "error">("loading");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Signup states
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const handleResendEmail = async () => {
    if (!sessionId || resending) return;
    setResending(true);
    try {
      await axios.post("/api/checkout/resend", { sessionId });
      setResendSuccess(true);
    } catch (err) {
      console.error("Failed to resend email:", err);
      alert("Could not resend email. Please contact support.");
    } finally {
      setResending(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !customerEmail || signingUp) return;

    setSigningUp(true);
    setSignupError(null);

    try {
      await axios.post("/api/auth/signup", {
        email: customerEmail,
        password,
        sessionId
      });
      
      // IMPORTANT: Account is now created and order is linked!
      setSignupSuccess(true);
      setSignupError(null);

      try {
        // Attempt auto-login (might fail if dashboard 'Confirm Email' is ON)
        const supabase = createClient();
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: customerEmail,
          password
        });
        
        if (!loginError) {
          router.refresh();
        } else {
          // Dashboard toggle is ON, we just log it and let the orange banner handle it later
          console.warn("[signup] Auto-login paused: confirmation required.");
        }
      } catch (loginErr) {
        console.warn("[signup] Auto-login system error:", loginErr);
      }
    } catch (err: any) {
      setSignupError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setSigningUp(false);
    }
  };
  const clearCart = useCartStore((state) => state.clearCart);

  // Always clear cart immediately upon landing on the success page
  useEffect(() => {
    clearCart();
    
    // Reset checkout progress but KEEP address for a faster second purchase experience
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
        // Ignore parsing errors
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

  // Check auth status
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
          Verifying Secure Transaction…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
            Something went wrong
          </h1>
          <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold mb-8">
            We couldn&apos;t verify your payment status. If you received a confirmation email, your order is processing.
          </p>
          <Link href="/checkout" className="hasbro-btn-primary px-8 py-4 text-xs">
            Back to Checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 animate-in fade-in duration-1000">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12 -space-y-2">
          <span className="font-black text-4xl uppercase tracking-tighter text-white">5ive</span>
          <span className="font-black text-xs uppercase tracking-[0.5em] text-brand-yellow">Arts</span>
        </div>

        {/* Success icon */}
        <div className="w-24 h-24 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-yellow/20">
          <CheckCircle className="w-14 h-14 text-brand-yellow" />
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
          Order Confirmed
        </h1>
        <p className="text-lg text-neutral-300 mb-2 font-bold uppercase tracking-widest text-[12px]">
          Thank you for your purchase from 5iveArts
        </p>
        <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold mb-14">
          A confirmation email has been sent to <span className="text-brand-yellow">{customerEmail}</span>.<br />
          Your figure will be carefully packaged and shipped with tracking.
        </p>

        {/* Status Log & Resend utility */}
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-8 mb-14 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow/50" />

          <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/5">
            <h2 className="font-black text-white uppercase tracking-[0.3em] text-[11px]">
              Security & Logistics Log
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
              {resendSuccess ? "Sync Complete & Email Sent" : "Didn't receive email? Resend"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-black text-white text-[11px] uppercase tracking-widest">
                  Confirmation receipt
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                  Payment verified. {resendSuccess ? "Receipt has been re-transmitted." : "Receipt sent to your provided inbox."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-black text-white text-[11px] uppercase tracking-widest">
                  Secure fulfillment
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                  Your figure is being prepped with custom foam padding now.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-brand-yellow" />
              </div>
              <div>
                <p className="font-black text-white text-[11px] uppercase tracking-widest">
                  Global tracking active
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                  Tracking number will be assigned once logistics handoff is complete.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Creation Prompt or Success State */}
        {(signupSuccess || (user && !checkingAuth)) ? (
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded p-8 mb-14 text-center animate-in zoom-in duration-500">
            <ShieldCheck className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">Vault Established</h3>
            <p className="text-brand-yellow text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              Your order is now permanently linked to your secure account.
            </p>
            
            {!user?.email_confirmed_at && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-sm flex items-center justify-center gap-3 text-orange-500 mb-6">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                  Verification Link Sent To {customerEmail || user?.email}
                </p>
              </div>
            )}

            <Link 
              href="/account"
              className="inline-block text-[10px] font-black uppercase tracking-widest text-white border-b border-brand-yellow/50 pb-1 hover:text-brand-yellow transition-colors"
            >
              Go to My Warehouse
            </Link>
          </div>
        ) : !checkingAuth ? (
          <div className="bg-[#0a0a0a] rounded border border-brand-yellow/30 p-8 mb-14 text-left relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24 text-brand-yellow" />
            </div>

            <div className="relative z-10">
              <h2 className="font-black text-white uppercase tracking-[0.3em] text-[11px] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                Secure Your Collection
              </h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-8 max-w-sm leading-relaxed">
                Establish a secure portal to manage this order and track fulfillment logistics in real-time.
              </p>

              <form onSubmit={handleSignup} className="space-y-4 max-w-md">
                {signupError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-[10px] text-red-400 font-bold uppercase tracking-widest">
                    {signupError}
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="CHOOSE A SECURITY KEY"
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
                  </div>
                  <button
                    type="submit"
                    disabled={signingUp}
                    className="hasbro-btn-primary px-8 py-4 text-[10px] whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {signingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                    {signingUp ? "Securing..." : "CREATE ACCOUNT"}
                  </button>
                </div>
                <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest">
                  Your email: <span className="text-neutral-400">{customerEmail}</span>
                </p>
              </form>
            </div>
          </div>
        ) : null}

        <Link
          href="/products"
          className="hasbro-btn-primary text-sm px-16 py-6 shadow-[0_25px_50px_rgba(255,159,0,0.2)] hover:scale-105 transition-all inline-block uppercase tracking-widest font-black"
        >
          Return to HQ
        </Link>
      </div>
    </div>
  );
}

