import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Composant Checkbox simple
 * Compatible avec l'API de @radix-ui/react-checkbox
 */
function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "flex items-center justify-center",
        checked && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}

export { Checkbox };
