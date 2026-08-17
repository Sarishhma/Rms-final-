import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { qzController } from "../../src/modules/qz/controller.js";
import { initializeQzSigning } from "../../src/modules/qz/service.js";
import { AppError } from "../../src/utils/app-error.js";

// beforeAll(() => initializeQzSigning());

const app = new Hono();
app.post("/sign", qzController.sign);
app.onError((error, c) =>
  c.json({ error: error.message }, error instanceof AppError ? error.statusCode as 400 : 500),
);

describe.skip("QZ Controller Validation", () => {
  it("signs a valid JSON request", async () => {
    const response = await app.request("/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: "qz request" }),
    });

    expect(response.status).toBe(200);
    expect((await response.json()).signature).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("rejects an invalid content type, malformed JSON, and unexpected fields", async () => {
    const noContentType = await app.request("/sign", { method: "POST", body: "{}" });
    const malformed = await app.request("/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const unexpected = await app.request("/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: "ok", extra: true }),
    });

    expect(noContentType.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(unexpected.status).toBe(400);
  });
});
