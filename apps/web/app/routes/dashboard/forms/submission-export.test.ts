import { describe, expect, it } from "vite-plus/test";

import {
  flattenSubmission,
  formatSubmissionCell,
  generateSubmissionCsv,
} from "./submission-export";

describe("submission CSV contracts", () => {
  it("flattens objects while retaining arrays, null, and primitive cells", () => {
    const input = {
      profile: { name: "Ada", active: true },
      scores: [1, 2],
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: decoded submission JSON explicitly contains null and must preserve it through flattening.
      missing: null,
    };
    expect(flattenSubmission(input)).toEqual({
      "profile.name": "Ada",
      "profile.active": true,
      scores: [1, 2],
      // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: the expected external JSON value remains explicit null rather than an omitted property.
      missing: null,
    });
  });

  it("preserves existing scalar and nested array display", () => {
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: CSV must retain the historical empty-cell representation of JSON null array elements.
    expect(formatSubmissionCell(["a", null, [2, false], { x: 1 }])).toBe(
      "a,,2,false,[object Object]",
    );
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: explicit JSON null is a valid exported cell.
    expect(formatSubmissionCell(null)).toBe("");
    expect(formatSubmissionCell()).toBe("");
  });

  it("escapes CSV quotes, newlines and commas and preserves column order", () => {
    expect(
      generateSubmissionCsv([{ text: 'a,"b"\nc', other: 0 }], ["other", "text", "missing"]),
    ).toBe('other,text,missing\n0,"a,""b""\nc",');
  });
});
