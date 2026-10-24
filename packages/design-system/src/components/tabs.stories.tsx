import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta = { title: "Navigation/Tabs" } satisfies Meta;
export default meta;

export function Account(): ReactElement {
  return (
    <Tabs defaultValue="membership" className="max-w-md">
      <TabsList aria-label="Account sections">
        <TabsTrigger value="membership">Membership</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="membership" className="rounded-md border p-4">
        Your full membership is active.
      </TabsContent>
      <TabsContent value="profile" className="rounded-md border p-4">
        Update your name and email address.
      </TabsContent>
    </Tabs>
  );
}
