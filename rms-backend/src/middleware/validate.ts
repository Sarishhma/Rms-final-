import type { MiddlewareHandler } from "hono";
import type { z, ZodSchema } from "zod";
import { badRequest } from "../utils/app-error.js";

type Target = "json" | "query" | "param";

export const validate =
  <T extends ZodSchema>(target: Target, schema: T): MiddlewareHandler =>
  async (c, next) => {
    let payload;

    if (target === "json") {
      try {
        const text = await c.req.text();
        payload = text ? JSON.parse(text) : {};
      } catch (err) {
        throw badRequest("Invalid JSON payload");
      }
    } else if (target === "query") {
      payload = c.req.query();
    } else {
      payload = c.req.param();
    }

    const result = schema.safeParse(payload);

    if (!result.success) {
      throw badRequest("Validation failed", result.error.flatten());
    }

    c.set(`validated_${target}`, result.data as z.infer<T>);
    await next();
  };

export const getValidated = <T>(c: { get: (key: string) => unknown }, target: Target) =>
  c.get(`validated_${target}`) as T;
