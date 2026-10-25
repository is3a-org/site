import { Info } from "lucide-react";
import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Button } from "./button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

const meta = { title: "Overlays/Tooltip" } satisfies Meta;
export default meta;

export function MembershipInfo(): ReactElement {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline" size="icon" aria-label="About flex membership" />}
        >
          <Info />
        </TooltipTrigger>
        <TooltipContent>
          <p>Flex membership offers a flexible way to join IS3A.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
