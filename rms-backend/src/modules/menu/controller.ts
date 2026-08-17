import type { Context } from "hono";
import { getValidated } from "../../middleware/validate.js";
import { created, ok } from "../../utils/response.js";
import { menuService } from "./service.js";
import type {
  availabilitySchema,
  createAddonSchema,
  createCategoryRequestSchema,
  createMenuItemRequestSchema,
  createSubcategoryRequestSchema,
  createVariantSchema,
  idParamSchema,
  listMenuItemsSchema,
  listSubcategoriesSchema,
  updateMenuItemSchema
} from "./schema.js";
import type { z } from "zod";

export const menuController = {
  listCategories: async (c: Context) => ok(c, await menuService.listCategories()),
  listSubcategories: async (c: Context) => ok(c, await menuService.listSubcategories(getValidated<z.infer<typeof listSubcategoriesSchema>>(c, "query"))),
  createCategory: async (c: Context) => created(c, await menuService.createCategory(getValidated<z.infer<typeof createCategoryRequestSchema>>(c, "json"), c.get("authUser").companyId)),
  deleteCategory: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParamSchema>>(c, "param");
    return ok(c, await menuService.deleteCategory(id));
  },
  createSubcategory: async (c: Context) => created(c, await menuService.createSubcategory(getValidated<z.infer<typeof createSubcategoryRequestSchema>>(c, "json"), c.get("authUser").companyId)),
  listItems: async (c: Context) => {
    const result = await menuService.listItems(getValidated<z.infer<typeof listMenuItemsSchema>>(c, "query"));
    return ok(c, result.data, result.meta);
  },
  createItem: async (c: Context) => created(c, await menuService.createItem(getValidated<z.infer<typeof createMenuItemRequestSchema>>(c, "json"), c.get("authUser").companyId)),
  updateItem: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParamSchema>>(c, "param");
    return ok(c, await menuService.updateItem(id, getValidated<z.infer<typeof updateMenuItemSchema>>(c, "json")));
  },
  deleteItem: async (c: Context) => {
    const { id } = getValidated<z.infer<typeof idParamSchema>>(c, "param");
    return ok(c, await menuService.deleteItem(id));
  },
  createVariant: async (c: Context) => created(c, await menuService.createVariant(getValidated<z.infer<typeof createVariantSchema>>(c, "json"))),
  createAddon: async (c: Context) => created(c, await menuService.createAddon(getValidated<z.infer<typeof createAddonSchema>>(c, "json"))),
  setAvailability: async (c: Context) =>
    ok(c, await menuService.setAvailability(getValidated<z.infer<typeof availabilitySchema>>(c, "json"), c.get("authUser").id))
};
