import z from "zod";

export const tableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  capacity: z.coerce
    .number()
    .int()
    .min(1, "capacity must be greater then 0")
    .max(50),
  floor: z.string().min(1, "Floor"),
});

export const menuSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().min(1, "description is required"),
  basePrice: z.coerce
    .number()
    .int("Price must be an integer")
    .min(1, "Price must be greater than 0")
    .max(50000, "Price is too high"),
  sku: z.string().min(1, "sku is required").optional(),
  categoryId: z.string().min(1, "category required"),
  subcategoryId: z.string().optional(),
});

export const stockSchema = z.object({
  businessDate: z.string(),

  menuItemId: z.string().min(1, "Menu item is required"),

  variantId: z.string().optional(),

  openingQty: z.number().int().min(0),
  lowStockAt: z.number().int().min(0).default(0),
});

export const stockUpdate = z.object({
  remainingQty: z.coerce.number().min(0, "Quantity is required").optional(),
  reason: z.string("reason is required").optional(),
  businessDate: z.string(),
});

export const InventoryUnitTypeSchema = z.enum([
  "WEIGHT",
  "VOLUME",
  "COUNT",
  "PACKAGING",
]);

export const inventoryUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  type: InventoryUnitTypeSchema,
  symbol: z.string().min(1, "Symbol is required"),
  isActive: z.boolean().default(true),
  isBaseUnit: z.boolean().default(false),
});

export const inventoryUnitUpdate = z.object({
  name: z.string().min(1, "Unit name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["WEIGHT", "VOLUME", "COUNT", "PACKAGING"]),
  isActive: z.boolean().default(true),
});

export const inventoryUnitConversionSchema = z.object({
  fromUnitId: z.string().uuid("Invalid source unit ID"),
  toUnitId: z.string().uuid("Invalid target unit ID"),

  // Validates standard JS numbers, or strings if handled via high-precision decimal libs
  factor: z.union([
    z.number().positive("Conversion factor must be greater than 0"),
    z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid decimal number"),
  ]),
});

export const inventorySupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  panNumber: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
});

export const inventorySupplierUpdate = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  panNumber: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

const ITEM_TYPES = [
  "RAW_MATERIAL",
  "PACKAGED_ITEM",
  "CONSUMABLE",
  "OTHER",
] as const;

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  type: z.enum(ITEM_TYPES),
  code: z.string().min(1, "Code is required"),
  categoryId: z.string().uuid("Invalid category").optional().or(z.literal("")),
  baseUnitId: z.string().uuid("Invalid unit").min(1, "Base unit is required"),
  reorderLevel: z.number().min(0, "Reorder level must be 0 or more").default(0),
  trackExpiry: z.boolean().default(false),

  defaultPurchasePrice: z.number().min(0, "Price must be 0 or more").default(0),
});

export const inventoryItemUpdate = z.object({
  name: z.string().min(1, "Item name is required").optional(),
  type: z
    .enum(["RAW_MATERIAL", "PACKAGED_ITEM", "CONSUMABLE", "OTHER"])
    .optional(),
  categoryId: z.string().uuid("Invalid category").optional().or(z.literal("")),
  baseUnitId: z.string().uuid("Invalid unit").optional(),
  reorderLevel: z.number().min(0).optional(),
  trackExpiry: z.boolean().optional(),

  defaultPurchasePrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const paymentSchema = z
  .object({
    amount: z
      .number("Amount must be a number")
      .min(1, "Amount must be greater than 0"),

    method: z.enum(["CASH", "CARD", "QR", "MIXED"]),

    reference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method !== "CASH" && !data.reference?.trim()) {
      ctx.addIssue({
        path: ["reference"],
        code: z.ZodIssueCode.custom,
        message: "Reference ID is required",
      });
    }
  });

export const companySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters.")
    .max(80, "Company name must be under 80 characters."),

  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(50, "Slug must be under 50 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may only contain lowercase letters, numbers, and hyphens.",
    ),

  businessName: z
    .string()
    .min(2, "Legal business name is required.")
    .max(120, "Must be under 120 characters."),

  phoneNumber: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),

  businessAddress: z
    .string()
    .max(300, "Address must be under 300 characters.")
    .optional()
    .or(z.literal("")),

  taxRegistrationNumber: z
    .string()
    .regex(
      /^\d{9}(\d{2})?$/,
      "Enter a valid 9-digit PAN or 11-digit VAT number.",
    )
    .optional()
    .or(z.literal("")),

  currency: z.enum(["NPR", "INR", "USD"], {
    message: "Currency is required",
  }),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().regex(/^9[678]\d{8}$/, "Invalid phone format"),
  notes:z.string().optional(),
  email: z.string().trim().optional().refine(
    (val) => !val || z.string().email().safeParse(val).success,
    "Invalid email format"
  ),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;
