import { Button } from "@is3a/design-system/button";
import { Checkbox } from "@is3a/design-system/checkbox";
import { cn } from "@is3a/design-system/cn";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldItem,
} from "@is3a/design-system/field";
import { Input } from "@is3a/design-system/input";
import { RadioGroup, RadioGroupItem } from "@is3a/design-system/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@is3a/design-system/select";
import { Slider } from "@is3a/design-system/slider";
import { Switch } from "@is3a/design-system/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@is3a/design-system/tabs";
import { Textarea } from "@is3a/design-system/textarea";
import { useState } from "react";
import type { JSX } from "react";
import { z } from "zod";

import {
  Generate,
  isVisible,
  isEnabled,
  isBooleanControl,
  isEnumControl,
  isIntegerControl,
  isNumberControl,
  isObjectControl,
  isOneOfEnumControl,
  isStringControl,
  or,
  rankWith,
  uiTypeIs,
  type ControlProps,
  type JsonFormsRendererRegistryEntry,
  type LabelProps,
  type LayoutProps,
  type UISchemaElement,
} from "@jsonforms/core";
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
  withJsonFormsLabelProps,
  withJsonFormsLayoutProps,
} from "@jsonforms/react";

import {
  dateTimeFromInput,
  dateTimeToInput,
  numberFromInput,
  timeFromInput,
} from "./value-adapters";

const optionsSchema = z.object({
  multi: z.boolean().optional(),
  slider: z.boolean().optional(),
  toggle: z.boolean().optional(),
  format: z.string().optional(),
  placeholder: z.string().optional(),
  readonly: z.boolean().optional(),
});
const scalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const enumSchema = z.array(scalarSchema);
const oneOfSchema = z.array(z.object({ const: scalarSchema, title: z.string().optional() }));

/** JSON Forms owns validation and rules; IS3A owns the controls and their presentation. */
export function FormControl(props: ControlProps): JSX.Element | undefined {
  const {
    id,
    schema,
    uischema,
    path,
    label,
    description,
    errors,
    required,
    enabled,
    visible,
    readonly,
  } = props;
  if (!visible) {
    return undefined;
  }
  const data = scalarSchema.optional().safeParse(props.data).data;
  const options = optionsSchema.safeParse(uischema.options ?? {}).data ?? {};
  const disabled = !enabled || readonly === true || options.readonly === true;
  const text = z.string().safeParse(data).data ?? "";
  const number = z.number().safeParse(data).data;
  const boolean = z.boolean().safeParse(data).data ?? false;
  const enumeration = enumSchema.safeParse(schema.enum);
  const alternatives = oneOfSchema.safeParse(schema.oneOf);
  let choices = alternatives.success
    ? alternatives.data.map((option) => ({
        value: option.const,
        label: option.title ?? String(option.const),
      }))
    : [];
  if (enumeration.success) {
    choices = enumeration.data.map((value) => ({ value, label: String(value) }));
  }
  const choiceIndex = choices.findIndex((option) => option.value === data);
  // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Base UI uses null for a controlled Select with no selection.
  const value = choiceIndex === -1 ? null : String(choiceIndex);
  const numeric = schema.type === "number" || schema.type === "integer";
  const booleanControl = schema.type === "boolean";
  const describedBy =
    [
      description !== undefined && description !== "" ? `${id}-help` : "",
      errors ? `${id}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const common = {
    id,
    disabled,
    "aria-invalid": Boolean(errors),
    "aria-describedby": describedBy,
    "aria-label": label || (schema.title ?? path),
  };
  let control: JSX.Element;

  if (enumeration.success || alternatives.success) {
    const choose = (selection: string | null): void => {
      if (selection === null) {
        return;
      }
      props.handleChange(path, choices[Number(selection)]?.value);
    };
    control =
      options.format === "radio" ? (
        <RadioGroup
          {...common}
          value={value ?? ""}
          onValueChange={(selection) => {
            choose(z.string().parse(selection));
          }}
        >
          {choices.map((option, index) => (
            <FieldItem key={String(index)}>
              <label className="flex min-h-10 items-center gap-3">
                <RadioGroupItem value={String(index)} />
                {option.label}
              </label>
            </FieldItem>
          ))}
        </RadioGroup>
      ) : (
        <Select<string>
          value={value}
          onValueChange={choose}
          disabled={disabled}
          items={choices.map((option, index) => ({ value: String(index), label: option.label }))}
        >
          <SelectTrigger {...common}>
            <SelectValue placeholder={options.placeholder ?? "Choose an option"} />
          </SelectTrigger>
          <SelectContent>
            {choices.map((option, index) => (
              <SelectItem key={String(index)} value={String(index)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
  } else if (booleanControl) {
    const BooleanInput = options.toggle === true ? Switch : Checkbox;
    control = (
      <BooleanInput
        {...common}
        checked={boolean}
        onCheckedChange={(checked) => {
          props.handleChange(path, checked);
        }}
      />
    );
  } else if (numeric && options.slider === true) {
    control = (
      <div className="flex items-center gap-4">
        <Slider
          {...common}
          min={schema.minimum ?? 0}
          max={schema.maximum ?? 100}
          step={schema.multipleOf ?? 1}
          value={[number ?? z.number().safeParse(schema.default).data ?? schema.minimum ?? 0]}
          onValueChange={(values) => {
            props.handleChange(path, values[0]);
          }}
        />
        <output htmlFor={id} className="min-w-8 text-right text-sm tabular-nums">
          {number ?? z.number().safeParse(schema.default).data ?? schema.minimum ?? 0}
        </output>
      </div>
    );
  } else if (options.multi === true) {
    control = (
      <Textarea
        {...common}
        value={text}
        placeholder={options.placeholder}
        required={required}
        minLength={schema.minLength}
        maxLength={schema.maxLength}
        onChange={(event) => {
          props.handleChange(path, event.target.value || undefined);
        }}
      />
    );
  } else {
    const format = schema.format;
    let type = "text";
    let inputValue: string | number = text;
    let step: number | "any" | undefined;
    if (numeric) {
      type = "number";
      inputValue = number ?? "";
      step = schema.multipleOf ?? (schema.type === "integer" ? 1 : "any");
    } else if (format === "date-time") {
      type = "datetime-local";
      inputValue = dateTimeToInput(text);
      step = 1;
    } else if (format === "time") {
      type = "time";
      inputValue = text.replace(/Z$/u, "");
      step = 1;
    } else if (format === "date" || format === "email") {
      type = format;
    }
    control = (
      <Input
        {...common}
        type={type}
        value={inputValue}
        placeholder={options.placeholder}
        required={required}
        min={schema.minimum}
        max={schema.maximum}
        minLength={schema.minLength}
        maxLength={schema.maxLength}
        step={step}
        onChange={(event) => {
          const next = event.target.value;
          if (numeric) {
            props.handleChange(path, numberFromInput(next));
          } else if (format === "date-time") {
            props.handleChange(path, dateTimeFromInput(next));
          } else if (format === "time") {
            props.handleChange(path, timeFromInput(next));
          } else {
            props.handleChange(path, next || undefined);
          }
        }}
      />
    );
  }
  return (
    <Field invalid={Boolean(errors)} disabled={disabled} className="gap-2">
      <div
        className={cn(
          "flex gap-3",
          booleanControl ? "min-h-10 flex-row-reverse items-center justify-end" : "flex-col",
        )}
      >
        {label && (
          <FieldLabel htmlFor={id}>
            {label}
            {required === true && (
              <span aria-hidden="true" className="text-primary">
                *
              </span>
            )}
          </FieldLabel>
        )}
        {control}
      </div>
      {description !== undefined && description !== "" && (
        <FieldDescription id={`${id}-help`}>{description}</FieldDescription>
      )}
      {errors && <FieldError id={`${id}-error`}>{errors}</FieldError>}
    </Field>
  );
}

function ObjectControl({
  schema,
  path,
  enabled,
  visible,
  label,
  renderers,
  cells,
}: ControlProps): JSX.Element | undefined {
  if (!visible) {
    return undefined;
  }
  return (
    <fieldset className="min-w-0 space-y-5" disabled={!enabled}>
      {label !== "" && <legend className="mb-4 text-base font-semibold">{label}</legend>}
      <JsonFormsDispatch
        schema={schema}
        uischema={Generate.uiSchema(schema)}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </fieldset>
  );
}

// Preserve the original UI elements (including their rules) rather than cloning them through a parser.
function hasElements(
  element: UISchemaElement,
): element is UISchemaElement & { elements: UISchemaElement[] } {
  return "elements" in element && Array.isArray(element.elements);
}
function FormLayout({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
  label,
}: LayoutProps): JSX.Element | undefined {
  if (!visible || !hasElements(uischema)) {
    return undefined;
  }
  const children = uischema.elements.map((element, index) => (
    <JsonFormsDispatch
      key={`${path}-${index}`}
      uischema={element}
      schema={schema}
      path={path}
      enabled={enabled}
      renderers={renderers}
      cells={cells}
    />
  ));
  if (uischema.type === "Group" || uischema.type === "Category") {
    return (
      <fieldset
        className="min-w-0 space-y-5 rounded-lg border border-border p-5"
        disabled={!enabled}
      >
        {label !== undefined && label !== "" && (
          <legend className="px-2 text-sm font-semibold">{label}</legend>
        )}
        {children}
      </fieldset>
    );
  }
  return (
    <div
      className={cn(
        "grid gap-6",
        uischema.type === "HorizontalLayout" && "sm:auto-cols-fr sm:grid-flow-col",
      )}
    >
      {children}
    </div>
  );
}
function CategorizationLayout(props: LayoutProps): JSX.Element | undefined {
  const context = useJsonForms();
  const [selected, setSelected] = useState(0);
  if (!props.visible || !hasElements(props.uischema)) {
    return undefined;
  }
  const categories = props.uischema.elements
    .map((element, index) => ({ element, index }))
    .filter(
      ({ element }) =>
        context.core?.ajv === undefined ||
        isVisible(element, context.core.data, props.path, context.core.ajv, context.config),
    );
  const current = categories.find((category) => category.index === selected) ?? categories.at(0);
  if (current === undefined) {
    return undefined;
  }
  const position = categories.indexOf(current);
  const stepper = z
    .object({ variant: z.literal("stepper") })
    .safeParse(props.uischema.options).success;
  return (
    <Tabs
      value={current.index}
      onValueChange={(value) => {
        setSelected(z.number().parse(value));
      }}
    >
      <TabsList aria-label={props.label ?? "Form sections"} className="w-full overflow-x-auto">
        {categories.map(({ element, index }) => (
          <TabsTrigger
            key={index}
            value={index}
            disabled={
              !props.enabled ||
              (context.core?.ajv !== undefined &&
                !isEnabled(
                  element,
                  context.core.data,
                  props.path,
                  context.core.ajv,
                  context.config,
                ))
            }
          >
            {"label" in element ? z.string().catch("Section").parse(element.label) : "Section"}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map(({ element, index }) => (
        <TabsContent key={index} value={index}>
          <JsonFormsDispatch
            uischema={element}
            schema={props.schema}
            path={props.path}
            enabled={props.enabled}
            renderers={props.renderers}
            cells={props.cells}
          />
        </TabsContent>
      ))}
      {stepper && (
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            disabled={position === 0}
            onClick={() => {
              const previous = categories.at(position - 1);
              if (previous !== undefined) {
                setSelected(previous.index);
              }
            }}
          >
            Previous
          </Button>
          <Button
            disabled={position === categories.length - 1}
            onClick={() => {
              const next = categories.at(position + 1);
              if (next !== undefined) {
                setSelected(next.index);
              }
            }}
          >
            Next
          </Button>
        </div>
      )}
    </Tabs>
  );
}

function FormLabel({ text, visible }: LabelProps): JSX.Element | undefined {
  return visible ? (
    <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
  ) : undefined;
}

export const formRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(
      2,
      or(
        isStringControl,
        isNumberControl,
        isIntegerControl,
        isBooleanControl,
        isEnumControl,
        isOneOfEnumControl,
      ),
    ),
    renderer: withJsonFormsControlProps(FormControl),
  },
  { tester: rankWith(1, isObjectControl), renderer: withJsonFormsControlProps(ObjectControl) },
  {
    tester: rankWith(
      1,
      or(
        uiTypeIs("VerticalLayout"),
        uiTypeIs("HorizontalLayout"),
        uiTypeIs("Group"),
        uiTypeIs("Category"),
      ),
    ),
    renderer: withJsonFormsLayoutProps(FormLayout),
  },
  {
    tester: rankWith(1, uiTypeIs("Categorization")),
    renderer: withJsonFormsLayoutProps(CategorizationLayout),
  },
  { tester: rankWith(1, uiTypeIs("Label")), renderer: withJsonFormsLabelProps(FormLabel) },
];
