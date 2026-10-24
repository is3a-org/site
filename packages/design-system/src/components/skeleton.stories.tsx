import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Skeleton } from "./skeleton";

const meta = { title: "Data display/Skeleton" } satisfies Meta;
export default meta;

export function MemberRow(): ReactElement {
  return (
    <div role="status" aria-label="Loading member details" className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <span className="sr-only">Loading member details</span>
    </div>
  );
}
