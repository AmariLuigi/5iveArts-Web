import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * API route to generate an ALTCHA (Self-Hosted Captcha) challenge.
 */
export async function GET(req: NextRequest) {
    try {
        const hmackey = process.env.ALTCHA_HMAC_KEY;
        if (!hmackey) {
            console.error("[captcha-challenge] Missing ALTCHA_HMAC_KEY in environmental vault.");
            return NextResponse.json({ error: "Security Infrastructure Offline" }, { status: 500 });
        }

        // 1. Generate Entropy and Expiration
        const salt = crypto.randomBytes(12).toString("hex");
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute window
        const saltWithExpiry = `${salt}?expires=${expiresAt}`;
        
        // 2. Generate Secret Number (The target for PoW)
        // 100k-200k takes ~0.5-2s on a modern machine.
        const maxnumber = 100000; 
        const number = Math.floor(Math.random() * maxnumber);
        
        // 3. Create Signature (HMAC-SHA256 of salt + number)
        const signatureSubject = `${saltWithExpiry}${number}`;
        const signature = crypto
            .createHmac("sha256", hmackey)
            .update(signatureSubject)
            .digest("hex");
            
        // 4. Create Challenge (SHA-256 of Salt + Number)
        const challenge = crypto
            .createHash("sha256")
            .update(signatureSubject)
            .digest("hex");

        return NextResponse.json({
            algorithm: "SHA-256",
            challenge,
            salt: saltWithExpiry,
            signature,
            maxnumber
        });

    } catch (err: any) {
        console.error("[captcha-challenge] Critical failure:", err.message);
        return NextResponse.json({ error: "Internal Protocol Error" }, { status: 500 });
    }
}
