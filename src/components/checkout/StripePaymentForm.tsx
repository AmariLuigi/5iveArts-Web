"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe, StripeCheckout } from "@stripe/stripe-js";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/products";

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripePaymentFormProps {
    clientSecret: string;
    total: number;
}

export default function StripePaymentForm({
    clientSecret,
    total,
}: StripePaymentFormProps) {
    const [checkout, setCheckout] = useState<StripeCheckout | null>(null);
    const [confirmFn, setConfirmFn] = useState<((...args: any[]) => Promise<any>) | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initCheckout = useCallback(async () => {
        const stripe = await stripePromise;
        if (!stripe) return;

        try {
            const checkoutInstance = await (stripe as unknown as Stripe & {
                initCheckout: (opts: {
                    clientSecret: string;
                    elementsOptions?: { appearance: object };
                }) => Promise<StripeCheckout>;
            }).initCheckout({
                clientSecret,
                elementsOptions: {
                    appearance: {
                        theme: "night",
                        variables: {
                            colorPrimary: "#ff9f00",
                            colorBackground: "#0a0a0a",
                            colorText: "#ffffff",
                            colorDanger: "#ef4444",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                            fontSizeBase: "14px",
                            borderRadius: "4px",
                            spacingUnit: "4px",
                            colorTextPlaceholder: "#525252",
                        },
                        rules: {
                            ".Input": {
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                backgroundColor: "#050505",
                                color: "#ffffff",
                                padding: "12px 16px",
                            },
                            ".Input:focus": {
                                border: "1px solid #ff9f00",
                                boxShadow: "0 0 0 1px #ff9f00",
                            },
                            ".Label": {
                                color: "#737373",
                                fontSize: "10px",
                                fontWeight: "900",
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                            },
                            ".Tab": {
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                backgroundColor: "#050505",
                                color: "#ffffff",
                            },
                            ".Tab--selected": {
                                border: "1px solid #ff9f00",
                                backgroundColor: "rgba(255, 159, 0, 0.05)",
                                color: "#ff9f00",
                            },
                            ".Tab:hover": {
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                            },
                        },
                    },
                },
            });

            setCheckout(checkoutInstance);

            // Load actions for confirm
            const loadResult = await checkoutInstance.loadActions();
            if (loadResult.type === "success") {
                setConfirmFn(() => loadResult.actions.confirm);
            }

            // Mount Payment Element
            const paymentElement = checkoutInstance.createPaymentElement();
            paymentElement.mount("#payment-element");

            setLoading(false);
        } catch (err) {
            console.error("Stripe init error:", err);
            setError("Failed to load payment form. Please refresh and try again.");
            setLoading(false);
        }
    }, [clientSecret]);

    useEffect(() => {
        initCheckout();

        return () => {
            if (checkout) {
                (checkout as any).destroy?.();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initCheckout]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmFn) return;

        setPaying(true);
        setError(null);

        try {
            const result = await confirmFn();
            if (result?.error) {
                setError(result.error.message);
                setPaying(false);
            }
            // If no error, Stripe redirects to return_url automatically
        } catch {
            setError("An unexpected error occurred. Please try again.");
            setPaying(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Payment Element Container */}
            <div className="relative min-h-[200px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] rounded z-10">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                                Loading secure payment form…
                            </p>
                        </div>
                    </div>
                )}
                <div id="payment-element" />
            </div>

            {/* Error Display */}
            {error && (
                <div className="text-red-400 text-[11px] font-bold border border-red-500/20 bg-red-500/5 rounded px-5 py-4 flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Pay Button — Stripe best practice: show exact amount */}
            <button
                type="submit"
                disabled={paying || loading || !confirmFn}
                className="hasbro-btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 disabled:opacity-20 shadow-2xl shadow-brand-yellow/10 transition-all"
            >
                {paying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Lock className="w-4 h-4" />
                )}
                {paying ? "Processing payment…" : `Pay ${formatPrice(total)} now`}
            </button>

            {/* Trust Indicators — Stripe best practice */}
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Secured by Stripe — PCI DSS Level 1
                    </span>
                </div>
                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider text-center leading-relaxed max-w-md">
                    Your payment information is encrypted end-to-end. 5iveArts never stores your card details.
                </p>
            </div>
        </form>
    );
}
