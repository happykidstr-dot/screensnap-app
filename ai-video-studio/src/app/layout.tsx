import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Video Studio — Project Factory",
  description: "Create AI-powered video presentations with avatars, voice synthesis, and lip sync. Powered by ElevenLabs, HeyGen, and GPT-4.",
  keywords: ["AI video", "text to video", "avatar video", "ElevenLabs", "HeyGen", "AI presenter"],
  openGraph: {
    title: "AI Video Studio — Project Factory",
    description: "Generate professional AI avatar videos from text in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100">{children}</body>
    </html>
  );
}
