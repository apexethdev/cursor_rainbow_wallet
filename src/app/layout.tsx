import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import { Web3Provider } from "@/components/providers/Web3Provider";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cursor Wallet Demo",
  description:
    "Demo app showing a Cursor-compatible dev wallet with RainbowKit and Wagmi on Base Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
