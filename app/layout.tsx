import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExDate — the statement tokenized stocks never send you",
  description:
    "xStocks pay dividends by quietly raising a multiplier. No wallet shows it. ExDate reads the hidden record and tells you what you were actually paid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header className="masthead">
            <a href="/" className="logo">
              ex<span>date</span>
            </a>
            <span className="tag">tokenized stock dividends, made visible</span>
          </header>
          {children}
          <footer>
            Read-only. No wallet connection, no transactions, no custody. Data from the
            xStocks public API, Solana mainnet RPC and Jupiter. Not investment advice,
            and not affiliated with Backed Finance or Ondo.
          </footer>
        </div>
      </body>
    </html>
  );
}
