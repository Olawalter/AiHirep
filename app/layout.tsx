import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AI Hiring Panel — Consensus-Backed Candidate Evaluation",
  description:
    "GenLayer-powered candidate ranking for evidence-based hiring. Evaluate role fit through validator consensus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
