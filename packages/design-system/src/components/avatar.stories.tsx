import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = { title: "Data display/Avatar" } satisfies Meta;
export default meta;

export function Initials(): ReactElement {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>IS</AvatarFallback>
      </Avatar>
    </div>
  );
}
export function Image(): ReactElement {
  return (
    <Avatar className="size-16">
      <AvatarImage
        alt="IS3A"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23bd1900'/%3E%3Ctext x='32' y='39' text-anchor='middle' fill='white' font-family='sans-serif' font-size='18'%3EIS3A%3C/text%3E%3C/svg%3E"
      />
      <AvatarFallback>IS</AvatarFallback>
    </Avatar>
  );
}
