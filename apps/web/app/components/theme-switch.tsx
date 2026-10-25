import { Button } from "@is3a/design-system/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@is3a/design-system/tooltip";
import { Monitor, Moon, Sun } from "lucide-react";
import type { JSX } from "react";

import { setColorScheme, useColorScheme } from "~/lib/color-scheme";
import { cn } from "~/lib/utils";

const options = [
  { scheme: "system", label: "System theme", Icon: Monitor },
  { scheme: "light", label: "Light theme", Icon: Sun },
  { scheme: "dark", label: "Dark theme", Icon: Moon },
] as const;

/** System, light, and dark; the current choice carries the IS3A bracket. */
export function ThemeSwitch({ className }: Readonly<{ className?: string }>): JSX.Element {
  const current = useColorScheme();

  return (
    <fieldset className={cn("flex items-center", className)}>
      <legend className="sr-only">Theme</legend>
      {options.map(({ scheme, label, Icon }) => (
        <Tooltip key={scheme}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={label}
                aria-pressed={current === scheme}
                className="relative text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bracket aria-pressed:text-foreground"
                onClick={() => {
                  setColorScheme(scheme);
                }}
              />
            }
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      ))}
    </fieldset>
  );
}
