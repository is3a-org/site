import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card";

const meta = { title: "Data display/Card" } satisfies Meta;
export default meta;

export function Membership(): ReactElement {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Your membership</CardTitle>
        <CardDescription>Manage your IS3A membership.</CardDescription>
        <CardAction>
          <Badge variant="secondary">Active</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Full membership gives you access to association activities.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Manage membership</Button>
      </CardFooter>
    </Card>
  );
}
export function Empty(): ReactElement {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>No forms yet</CardTitle>
        <CardDescription>Create a form to start collecting registrations.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button>Create form</Button>
      </CardFooter>
    </Card>
  );
}
