import type { Metadata } from "next";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const metadata: Metadata = {
    title: "Analytics Dashboard | 5iveArts Admin",
    description: "E-commerce analytics, conversion insights, and user behavior analysis",
};

export default function AnalyticsPage() {
    return <AnalyticsDashboard />;
}
