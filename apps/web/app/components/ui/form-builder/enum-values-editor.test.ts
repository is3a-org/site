import type { useState } from "react";
import { expectTypeOf, it } from "vite-plus/test";

import type { EnumValuesEditorProps } from "./enum-values-editor";

it("accepts a useState string-array setter and emits mutable arrays", () => {
  expectTypeOf<ReturnType<typeof useState<string[]>>[1]>().toExtend<
    EnumValuesEditorProps["onChange"]
  >();
  expectTypeOf<Parameters<EnumValuesEditorProps["onChange"]>[0]>().toEqualTypeOf<string[]>();
});
