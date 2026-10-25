import { expect, test } from "vite-plus/test";

import {
  dateTimeFromInput,
  dateTimeToInput,
  numberFromInput,
  timeFromInput,
} from "./value-adapters";

test("numeric fields preserve zero and decimals without submitting NaN for empty input", () => {
  expect(numberFromInput("0")).toBe(0);
  expect(numberFromInput("-2.5")).toBe(-2.5);
  expect(numberFromInput("")).toBeUndefined();
  expect(numberFromInput(" ")).toBeUndefined();
  expect(numberFromInput("invalid")).toBeUndefined();
  expect(numberFromInput("Infinity")).toBeUndefined();
});

test("date-time fields round-trip local input through an ISO timestamp", () => {
  const local = "2026-10-25T14:35:00";
  const saved = dateTimeFromInput(local);
  expect(saved).toBeDefined();
  expect(dateTimeToInput(saved ?? "")).toBe(local);
  expect(dateTimeFromInput("")).toBeUndefined();
  expect(dateTimeFromInput("invalid")).toBeUndefined();
  expect(dateTimeToInput("invalid")).toBe("");
});

test("time fields include seconds for JSON Schema validation", () => {
  expect(timeFromInput("09:15")).toBe("09:15:00");
  expect(timeFromInput("09:15:30")).toBe("09:15:30");
  expect(timeFromInput("")).toBeUndefined();
});
