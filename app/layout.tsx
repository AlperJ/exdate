import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import BarSearch from "./BarSearch";
import Mark from "./Mark";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--sans-font",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--mono-font",
});

export const metadata: Metadata = {
  title: "ExDate — dividends on tokenized US stocks",
  description:
    "xStocks on Solana pay dividends by raising a Token-2022 multiplier. The issuer publishes the events; nobody joins them to a wallet. ExDate does, and states what a holder was paid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <header className="bar">
          <div className="bar__in">
            <a className="wordmark" href="/">
              <Mark />
              ExDate
            </a>
            <span className="bar__rule" aria-hidden="true" />
            <span className="bar__desc">Dividends and splits on tokenized US stocks</span>
            <BarSearch />
            <nav className="nav">
              <a href="/assets">Assets</a>
              <a href="/calendar">Calendar</a>
              <a href="/how-it-works">How it works</a>
              <a href="/method">Method</a>
            </nav>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
