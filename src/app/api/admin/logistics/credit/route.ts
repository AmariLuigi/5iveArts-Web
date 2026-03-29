import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAccountCredit } from "@/lib/paccofacile";
import { sendLowCreditAlert } from "@/lib/email";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const credit = await getAccountCredit();
        
        // 🚨 Critical Alert Trigger
        if (credit.value < 20) {
            console.warn(`[admin/logistics] Credit low: ${credit.value} ${credit.currency}. Sending alert.`);
            await sendLowCreditAlert(credit.value, credit.currency);
        }

        return NextResponse.json(credit);
    } catch (err: any) {
        console.error("[api/admin/logistics/credit] Error:", err.message);
        return NextResponse.json({ error: "Failed to fetch credit" }, { status: 502 });
    }
}
