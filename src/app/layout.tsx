import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Voice2Memory",
    template: "%s · Voice2Memory",
  },
  description:
    "Turn your voice into memories you can actually use. Open-source AI extracts tasks, dates, people and ideas from your voice notes.",
  keywords: ["voice notes", "AI memory", "Whisper", "Ollama", "open-source", "productivity"],
  openGraph: {
    title: "Voice2Memory",
    description: "Turn your voice into memories you can actually use.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
        <Footer />
      </body>
    </html>
  );
}
