import { z } from "zod";

export const qzSignSchema = z
  .object({
    // Preserve the supplied string exactly: QZ verifies the signature against
    // this byte sequence, so it must not be trimmed or otherwise normalized.
    request: z.string().refine((value) => value.trim().length > 0, {
      message: "request must not be empty",
    }),
  })
  .strict();
