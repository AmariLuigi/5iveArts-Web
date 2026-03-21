import { NextRequest, NextResponse } from "next/server";
import { writeToPersistentLog } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { message, type = "info" } = await req.json();
    
    // Use the central logger utility
    writeToPersistentLog(message, type);

    // Also keep the console log with the specific CLIENT prefix for visibility
    console.log(`[CLIENT-TRACE] [${type.toUpperCase()}] ${message}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
