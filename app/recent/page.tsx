import type { Metadata } from "next";
import { RecentListPage } from "@/components/RecentListPage";

export const metadata: Metadata = {
  title: "Recently listened",
  description: "Resume episodes and manage your in-browser listening history.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/recent" },
};

export default function RecentPage() {
  return <RecentListPage />;
}
