import { NewLocationSchema } from "./locations";

/** Parses location form fields and preserves SQL NULL when optional contact fields are cleared. */
export function parseLocationFormData(
  formData: FormData,
): ReturnType<typeof NewLocationSchema.safeParse> {
  const data = Object.fromEntries(formData.entries());
  return NewLocationSchema.safeParse({
    name: data.name,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Clearing a location email must update its database column to SQL NULL.
    email: data.email === "" ? null : data.email,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Clearing a location address must update its database column to SQL NULL.
    address: data.address === "" ? null : data.address,
    // oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Clearing a location website must update its database column to SQL NULL.
    website: data.website === "" ? null : data.website,
    seasonSummer: data.seasonSummer === "on",
    seasonAutumn: data.seasonAutumn === "on",
    seasonWinter: data.seasonWinter === "on",
    seasonSpring: data.seasonSpring === "on",
  });
}
