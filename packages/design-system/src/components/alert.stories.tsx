import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = { title: "Data display/Alert" } satisfies Meta;
export default meta;

export function Variants(): ReactElement {
  return (
    <div className="grid max-w-lg gap-3">
      <Alert>
        <Info />
        <AlertTitle>Still studying?</AlertTitle>
        <AlertDescription>Our events are for alumni working in tech or academia.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheck />
        <AlertTitle>Membership active</AlertTitle>
        <AlertDescription>Your next payment is on 1 January.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Draft form</AlertTitle>
        <AlertDescription>Submissions are disabled until the form is opened.</AlertDescription>
      </Alert>
      <Alert variant="destructive" role="alert">
        <CircleAlert />
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Update your card to keep your membership.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertDescription>Without an icon, the message still aligns to the edge.</AlertDescription>
      </Alert>
    </div>
  );
}
