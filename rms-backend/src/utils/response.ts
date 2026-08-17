import type { Context } from "hono";

export type ApiMeta = Record<string, unknown>;

export const ok = <T>(c: Context, data: T, meta?: ApiMeta) =>
  c.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });

export const created = <T>(c: Context, data: T, meta?: ApiMeta) =>
  c.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    201
  );

export const noContent = (c: Context) => c.body(null, 204);
