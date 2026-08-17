import { Hono } from "hono";
import type { AppBindings } from "../../types.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { menuController } from "./controller.js";
import {
  availabilitySchema,
  createAddonSchema,
  createCategorySchema,
  createMenuItemSchema,
  createSubcategorySchema,
  createVariantSchema,
  idParamSchema,
  listMenuItemsSchema,
  listSubcategoriesSchema,
  updateMenuItemSchema
} from "./schema.js";

export const menuRoutes = new Hono<AppBindings>();

menuRoutes.get("/categories", requirePermission("menu:read"), menuController.listCategories);
menuRoutes.post("/categories", requirePermission("menu:write"), validate("json", createCategorySchema), menuController.createCategory);
menuRoutes.delete("/categories/:id", requirePermission("menu:write"), validate("param", idParamSchema), menuController.deleteCategory);
menuRoutes.get("/subcategories", requirePermission("menu:read"), validate("query", listSubcategoriesSchema), menuController.listSubcategories);
menuRoutes.post("/subcategories", requirePermission("menu:write"), validate("json", createSubcategorySchema), menuController.createSubcategory);
menuRoutes.get("/items", requirePermission("menu:read"), validate("query", listMenuItemsSchema), menuController.listItems);
menuRoutes.post("/items", requirePermission("menu:write"), validate("json", createMenuItemSchema), menuController.createItem);
menuRoutes.patch("/items/:id", requirePermission("menu:write"), validate("param", idParamSchema), validate("json", updateMenuItemSchema), menuController.updateItem);
menuRoutes.delete("/items/:id", requirePermission("menu:write"), validate("param", idParamSchema), menuController.deleteItem);
menuRoutes.post("/variants", requirePermission("menu:write"), validate("json", createVariantSchema), menuController.createVariant);
menuRoutes.post("/addons", requirePermission("menu:write"), validate("json", createAddonSchema), menuController.createAddon);
menuRoutes.patch("/availability", requirePermission("menu:write"), validate("json", availabilitySchema), menuController.setAvailability);
