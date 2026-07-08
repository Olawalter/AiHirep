import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-display text-slate-grey">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-panel-black border border-white/10 rounded-lg px-4 py-2.5 text-paper-white text-sm font-mono",
            "placeholder:text-slate-grey/50",
            "focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30",
            "transition-colors",
            error && "border-risk-red/50 focus:border-risk-red/80 focus:ring-risk-red/30",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-risk-red font-mono">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-grey font-mono">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-display text-slate-grey">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-panel-black border border-white/10 rounded-lg px-4 py-2.5 text-paper-white text-sm font-mono resize-y min-h-[100px]",
            "placeholder:text-slate-grey/50",
            "focus:outline-none focus:border-signal-blue/60 focus:ring-1 focus:ring-signal-blue/30",
            "transition-colors",
            error && "border-risk-red/50",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-risk-red font-mono">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-grey font-mono">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
