export type OrderItemInput = {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  addonIds?: string[];
  specialInstructions?: string;
  courseName?: string;
  fireAt?: Date;
};
