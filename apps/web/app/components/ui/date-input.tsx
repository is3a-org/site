import * as React from "react";
import { Input } from "./input";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

export function DateInput({
  className,
  value: controlledValue,
  onChange,
  defaultValue,
  ...props
}: DateInputProps) {
  const [value, setValue] = React.useState(defaultValue || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayValue = controlledValue ?? value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="date"
        className={cn(
          "pr-10",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-100",
          className,
        )}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker()}
        className="hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
        tabIndex={-1}
      >
        <Calendar className="text-muted-foreground h-4 w-4" />
      </button>
    </div>
  );
}
