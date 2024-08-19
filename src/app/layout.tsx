import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { getBaseStrikes } from "@/app/server/get-base-strikes";
import dynamic from "next/dynamic";

const Map = dynamic(
  () => import("@/components/Map").then((module) => module.Map),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blitzortung lightning strikes Map",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { baseStrikesData, updatedAt } = await getBaseStrikes();

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Map baseStrikesData={baseStrikesData} updatedAt={updatedAt} />
      </body>
    </html>
  );
}
