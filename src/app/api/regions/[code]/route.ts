import { NextRequest, NextResponse } from "next/server";
import iso3166 from "iso-3166-2";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    if (!code || code.length !== 2) {
        return NextResponse.json({ error: "Invalid country code" }, { status: 400 });
    }

    try {
        const countryData = iso3166.country(code.toUpperCase());

        if (!countryData || !countryData.sub) {
            return NextResponse.json([]);
        }

        let subdivisions = Object.entries(countryData.sub).map(([state_code, data]: [string, any]) => ({
            name: data.name,
            state_code: state_code,
            type: data.type
        }));

        // Logic for Italy: Only show the 20 main Regions, exclude provinces
        if (code.toUpperCase() === "IT") {
            subdivisions = subdivisions.filter(s => s.type === "Region");
        }

        // Sort alphabetically by localized name
        const sorted = subdivisions.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(sorted);
    } catch (error) {
        console.error(`Error fetching regions for ${code}:`, error);
        return NextResponse.json([]);
    }
}
