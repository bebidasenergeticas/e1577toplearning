import { z } from "zod";

export const idParam = (description: string) => z.string().min(1).describe(description);

export const limitParam = z
  .number()
  .int()
  .min(1)
  .max(250)
  .default(50)
  .describe("Maximum number of results per page (1-250)");

export const cursorParam = z
  .string()
  .optional()
  .describe("Pagination cursor: pass the nextCursor returned by the previous call to get the next page");
