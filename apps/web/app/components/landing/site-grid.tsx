import type { CSSProperties, ReactNode } from "react";

import { cn } from "~/lib/utils";

// Mirrors the Google Sites layout used on is3a.nl: sections with 24px vertical padding, a
// centered 1280px container and a 12-column grid with 23px gutters.

interface SiteSectionProps {
  className?: string;
  gridClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function SiteSection({ className, gridClassName, style, children }: SiteSectionProps) {
  return (
    <section className={cn("py-6", className)} style={style}>
      <div className="mx-auto w-full max-w-[1280px] px-2 md:px-12">
        <div className={cn("grid grid-cols-12", gridClassName)}>{children}</div>
      </div>
    </section>
  );
}

export function SiteColumn({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("col-span-12 px-[11.5px]", className)}>{children}</div>;
}

export const siteText = "font-merriweather text-[14.6667px] leading-[1.6667] text-[#212121]";
export const siteHeading =
  "font-pt-sans text-[20px] leading-[1.4] font-bold text-red-800 md:text-[25.3333px]";
