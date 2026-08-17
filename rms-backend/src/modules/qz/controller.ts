import type { Context } from "hono";
import { env } from "../../config/env.js";
import { badRequest, internalServerError } from "../../utils/app-error.js";
import { qzSignSchema } from "./schema.js";
import { qzService } from "./service.js";

const hasJsonContentType = (contentType: string | undefined) =>
  contentType?.toLowerCase().includes("application/json") ?? false;

export const qzController = {
  certificate: (c: Context) =>
    c.body(qzService.certificate(), 200, {
      "Content-Type": "text/plain; charset=utf-8",
      // The certificate is public and only changes when signing material is
      // rotated. Browsers may reuse it while still revalidating it each time.
      "Cache-Control": "public, max-age=86400",
    }),

  sign: async (c: Context) => {
    if (!hasJsonContentType(c.req.header("Content-Type"))) {
      throw badRequest("Content-Type must be application/json");
    }

    const contentLength = c.req.header("Content-Length");
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > env.QZ_MAX_SIGN_REQUEST_BYTES)) {
      throw badRequest("Signing request is too large");
    }

    let rawBody: string;
    try {
      rawBody = await c.req.raw.text();
    } catch {
      throw badRequest("Invalid request body");
    }

    if (Buffer.byteLength(rawBody, "utf8") > env.QZ_MAX_SIGN_REQUEST_BYTES) {
      throw badRequest("Signing request is too large");
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw badRequest("Invalid JSON request body");
    }

    const parsed = qzSignSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Invalid signing request", parsed.error.flatten());
    }

    try {
      return c.json({ signature: qzService.sign(parsed.data.request) });
    } catch {
      // Do not expose crypto details, request text, or signing material.
      console.error("QZ Tray signing failed");
      throw internalServerError("Signing failed");
    }
  },
};
