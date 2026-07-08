import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
  variant?: "solid" | "outline" | "subtle";
}

export function Badge({ children, color, className, variant = "subtle" }: BadgeProps) {
  const style = color
    ? variant === "solid"
      ? { backgroundColor: color, color: "#070A12" }
      : variant === "outline"
      ? { borderColor: color, color }
      : { backgroundColor: `${color}20`, color }
    : {};

  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border border-transparent",
        !color && "bg-white/10 text-slate-grey",
        className
      )}
    >
      {children}
    </span>
  );
}
