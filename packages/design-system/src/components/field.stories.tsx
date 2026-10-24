import type { ReactElement } from "react";

import type { Meta } from "@storybook/react-vite";

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "./field";
import { Input } from "./input";

const meta = { title: "Forms/Field" } satisfies Meta;
export default meta;

export function MemberDetails(): ReactElement {
  return (
    <FieldSet className="max-w-md">
      <FieldLegend>Member details</FieldLegend>
      <FieldDescription>We use these details to manage your membership.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="member-name">Full name</FieldLabel>
          <Input id="member-name" autoComplete="name" />
        </Field>
        <Field>
          <FieldLabel htmlFor="member-email">Email address</FieldLabel>
          <Input id="member-email" type="email" autoComplete="email" />
          <FieldDescription>Membership updates will be sent here.</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
export function ValidationError(): ReactElement {
  return (
    <Field data-invalid className="max-w-md">
      <FieldLabel htmlFor="field-error-email">Email address</FieldLabel>
      <Input
        id="field-error-email"
        aria-invalid
        aria-describedby="field-error-message"
        defaultValue="member@"
      />
      <FieldError id="field-error-message">Enter a complete email address.</FieldError>
    </Field>
  );
}
