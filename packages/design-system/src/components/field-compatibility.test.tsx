import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, expectTypeOf, test } from "vite-plus/test";

import { Field } from "./field";

test("Field preserves its named div grouping role and DOM props", () => {
  const markup = renderToStaticMarkup(
    <Field id="contact-field" aria-label="Contact details" data-invalid="true">
      <span>Contact content</span>
    </Field>,
  );

  expect(markup).toMatch(/^<div /u);
  expect(markup).toContain('role="group"');
  expect(markup).toContain('aria-label="Contact details"');
  expect(markup).toContain('id="contact-field"');
  expect(markup).toContain('data-invalid="true"');
  expect(markup).toContain("<span>Contact content</span></div>");
  expect(markup).not.toContain("<fieldset");
  expectTypeOf<ComponentProps<typeof Field>["ref"]>().toEqualTypeOf<ComponentProps<"div">["ref"]>();
  expectTypeOf<ComponentProps<typeof Field>["onClick"]>().toEqualTypeOf<
    ComponentProps<"div">["onClick"]
  >();
});
