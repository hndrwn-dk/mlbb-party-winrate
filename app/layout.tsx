import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MLBB Party Winrate | Mobile Legends Bang Bang",
  description: "Predict duo win probability from MLBB match screenshots. Track teammates and optimize your party winrate.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
