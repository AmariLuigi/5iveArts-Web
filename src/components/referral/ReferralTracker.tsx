'use client'

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackReferral } from '@/app/actions/referral';

/**
 * Global Referral Tracker Component.
 * - Ingests '?ref=' (Standard) or '?via=' (Legacy/Alternative) codes.
 * - Sets a 30-day cookie for persistent attribution.
 * - Logs click analytics via a server action.
 */
export function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const refCode = searchParams.get('ref') || searchParams.get('via');
        
        if (!refCode) return;

        async function processReferral() {
            // 1. Validate the code and log the click
            const referrerId = await trackReferral(refCode!);

            if (referrerId) {
                console.log(`[referral-track] Commission assigned to: ${referrerId}`);

                // 2. Persist the Referrer ID in a 30-day cookie
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                
                const cookieValue = [
                    `5ivearts_affiliate_id=${encodeURIComponent(referrerId)}`,
                    `Expires=${expiryDate.toUTCString()}`,
                    `Path=/`,
                    `SameSite=Lax`,
                    `Secure`
                ].join('; ');

                document.cookie = cookieValue;
            }
        }

        processReferral();
    }, [searchParams]);

    return null; // Invisible global tracker
}
