import { NextResponse } from "next/server";
import { createChallenge, pbkdf2 } from "altcha/lib";

/**
 * API route to generate an ALTCHA (Self-Hosted Captcha) challenge.
 */
export async function GET() {
    try {
        const hmackey = process.env.ALTCHA_HMAC_KEY;
        if (!hmackey) {
            console.error("[captcha-challenge] Missing ALTCHA_HMAC_KEY in environmental vault.");
            return NextResponse.json({ error: "Security Infrastructure Offline" }, { status: 500 });
        }

        // 1. Initialize Challenge Configuration
        // We utilize PBKDF2 for its 40x performance boost via native browser implementation.
        const challenge = await createChallenge({
            hmacSignatureSecret: hmackey,
            algorithm: 'PBKDF2/SHA-256',
            cost: 10000, // Balanced for security/performance balance
            deriveKey: pbkdf2.deriveKey,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Extended 15m window for checkout stability
        });

        return NextResponse.json(challenge);

    } catch (err: any) {
        console.error("[captcha-challenge] Critical failure:", err.message);
        return NextResponse.json({ error: "Internal Protocol Error" }, { status: 500 });
    }
}
