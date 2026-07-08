import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "blue" | "cyan" | "green" | "gold" | "purple";
}

export function Card({ children, className, glow }: CardProps) {
  const glows = {
    blue: "shadow-[0_0_20px_rgba(37,99,235,0.2)] border-signal-blue/20",
    cyan: "shadow-[0_0_20px_rgba(34,211,238,0.2)] border-consensus-cyan/20",
    green: "shadow-[0_0_20px_rgba(44,232,138,0.2)] border-skill-green/20",
    gold: "shadow-[0_0_20px_rgba(245,184,65,0.2)] border-reference-gold/20",
    purple: "shadow-[0_0_20px_rgba(139,92,246,0.2)] border-culture-purple/20",
  };

  return (
    <div
      className={cn(
        "bg-hiring-navy border border-white/10 rounded-xl p-6",
        glow && glows[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
