import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  position?: "absolute" | "fixed";
}

const ITEM_HEIGHT_SM = 28;
const ITEM_HEIGHT_MD = 36;
const DROPDOWN_PADDING = 12;
const GAP = 4;

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
  size = "md",
  position = "absolute",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>(() =>
    position === "fixed" ? { opacity: 0 } : {}
  );
  const [flipUp, setFlipUp] = useState(false);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    const reposition = () => {
      if (position === "fixed" && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const itemH = size === "sm" ? ITEM_HEIGHT_SM : ITEM_HEIGHT_MD;
        const estimatedHeight = Math.min(options.length, 6) * itemH + DROPDOWN_PADDING;
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldFlip = spaceBelow < estimatedHeight + GAP;
        setFlipUp(shouldFlip);
        setMenuStyle({
          position: "fixed",
          ...(shouldFlip
            ? { bottom: window.innerHeight - rect.top + GAP }
            : { top: rect.bottom + GAP }),
          left: rect.left,
          width: rect.width,
          zIndex: 50,
          opacity: 1,
        });
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [open, position, options.length, size]);

  const toggle = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const itemH = size === "sm" ? ITEM_HEIGHT_SM : ITEM_HEIGHT_MD;
      const estimatedHeight = Math.min(options.length, 6) * itemH + DROPDOWN_PADDING;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < estimatedHeight + GAP;
      setFlipUp(shouldFlip);

      if (position === "fixed") {
        setMenuStyle({
          position: "fixed",
          ...(shouldFlip
            ? { bottom: window.innerHeight - rect.top + GAP }
            : { top: rect.bottom + GAP }),
          left: rect.left,
          width: rect.width,
          zIndex: 50,
          opacity: 1,
        });
      }
    }
    setOpen((o) => !o);
  }, [position, options.length, size]);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
  };

  const absoluteStyle: React.CSSProperties | undefined =
    position === "absolute" && flipUp ? { bottom: "100%", top: "auto", marginBottom: GAP } : undefined;

  return (
    <div className={cn("relative", className)} ref={dropRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 bg-white border border-neutral-300 rounded-lg transition-colors",
          "hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200 focus:outline-none",
          selected ? "text-neutral-900" : "text-gray-400",
          sizeClasses[size]
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180", size === "sm" ? "size-3" : "size-4")} />
      </button>

      {open && (
        <div
          className={cn(
            "bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden",
            position === "fixed" ? "" : "absolute z-50 w-full",
            position === "absolute" && !flipUp && "mt-1",
          )}
          style={position === "fixed" ? menuStyle : absoluteStyle}
        >
          <ul className="max-h-48 p-1.5 text-sm text-gray-700 overflow-y-auto">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    size === "sm" ? "text-xs" : "text-sm",
                    opt.value === value
                      ? "bg-neutral-900 text-white font-medium"
                      : "hover:bg-neutral-100"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
