import * as React from "react";
import { cn } from "../../lib/utils";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onCheckedChange,
  className,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      style={{
        width: "44px",
        height: "24px",
        padding: "2px",
        borderRadius: "9999px",
        border: checked ? "1px solid #fafafa" : "1px solid #3f3f46",
        backgroundColor: checked ? "#fafafa" : "#27272a",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        cursor: "pointer",
        transition: "background-color 180ms ease, border-color 180ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
        className
      )}
    >
      <span
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "9999px",
          backgroundColor: checked ? "#09090b" : "#e4e4e7",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
          transform: checked ? "translateX(20px)" : "translateX(0px)",
          transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </button>
  );
};
