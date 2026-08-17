import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const apiDocsRoutes = new Hono();

// Serve the Swagger JSON
apiDocsRoutes.get("/swagger.json", (c) => {
  try {
    const swaggerDocPath = join(__dirname, "swagger.json");
    const fallbackSwaggerDocPath = join(process.cwd(), "src", "api-docs", "swagger.json");
    const resolvedPath = existsSync(swaggerDocPath) ? swaggerDocPath : fallbackSwaggerDocPath;
    const swaggerDoc = readFileSync(resolvedPath, "utf-8");
    return c.json(JSON.parse(swaggerDoc));
  } catch (error) {
    try {
      const swaggerDoc = readFileSync(join(process.cwd(), "src", "api-docs", "swagger.json"), "utf-8");
      return c.json(JSON.parse(swaggerDoc));
    } catch {
      return c.json({ error: "Failed to load swagger.json" }, 500);
    }
  }
});

// Serve the Swagger UI
apiDocsRoutes.get(
  "/",
  swaggerUI({
    url: "/api-docs/swagger.json",
  })
);
