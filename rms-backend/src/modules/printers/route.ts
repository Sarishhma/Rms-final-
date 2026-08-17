import { Hono } from "hono";
import { AppBindings } from "../../types.js";
import { printerController } from "./controller.js";
import {
  createPrinterSchema,
  printerIdParamSchema,
  listPrintersSchema,
  updatePrinterSchema,
} from "./schema.js";
import { validate } from "../../middleware/validate.js";
import { requirePermission } from "../../middleware/rbac.js";

export const printerRoutes = new Hono<AppBindings>();

printerRoutes.get("/", requirePermission("printer:read"), validate("query", listPrintersSchema), printerController.list);

printerRoutes.get("/:id", requirePermission("printer:read"), validate("param", printerIdParamSchema), printerController.get);

printerRoutes.post("/", requirePermission("printer:write"), validate("json", createPrinterSchema), printerController.create);

printerRoutes.patch("/:id", requirePermission("printer:write"), validate("param", printerIdParamSchema), validate("json", updatePrinterSchema), printerController.update);

printerRoutes.delete("/:id", requirePermission("printer:write"), validate("param", printerIdParamSchema), printerController.remove);
