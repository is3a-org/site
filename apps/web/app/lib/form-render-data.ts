import { z } from "zod";

/** Editing can leave optional fields undefined before JSON serialization omits them. */
type FormRenderValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly FormRenderValue[]
  | FormRenderData;

export interface FormRenderData {
  readonly [field: string]: FormRenderValue;
}

const renderValueSchema: z.ZodType<FormRenderValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.nan(),
    z.literal(Infinity),
    z.literal(-Infinity),
    z.boolean(),
    z.null(),
    z.undefined(),
    z.array(renderValueSchema),
    renderObjectSchema,
  ]),
);
const renderObjectSchema: z.ZodType<FormRenderData> = z.record(z.string(), renderValueSchema);

// JSON Forms emits whenever its data reference changes. Validate without cloning its input,
// otherwise feeding the clone back into the controlled renderer starts a change/render loop.
export const formRenderDataSchema = z.custom<FormRenderData>(
  (value) => renderObjectSchema.safeParse(value).success,
  "Expected form field data",
);
