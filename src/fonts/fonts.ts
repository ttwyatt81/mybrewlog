import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";

export const grotesk = localFont({
  src: "./OverusedGrotesk-VF.woff2",
  variable: "--font-grotesk",
  display: "swap",
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
