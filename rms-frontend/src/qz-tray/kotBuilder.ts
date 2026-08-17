import type { KitchenRoute, KotItem } from "./printer.types";

export class KotBuilder {
  private static readonly LINE_WIDTH = 32;

  /**
   * Build complete ESC/POS payload for KOT
   */
  static build(route: KitchenRoute): string[] {
    const payload: string[] = [];

    // -------------------------------
    // Initialize Printer
    // -------------------------------
    payload.push("\x1B\x40");

    // -------------------------------
    // Center + Double Size + Bold
    // -------------------------------
    payload.push("\x1B\x61\x01"); // Center
    payload.push("\x1B\x45\x01"); // Bold ON
    payload.push("\x1D\x21\x11"); // Double Height + Width

    payload.push("KITCHEN ORDER\n");

    // Reset
    payload.push("\x1D\x21\x00");
    payload.push("\x1B\x45\x00");
    payload.push("\x1B\x61\x00");

    payload.push(this.divider());

    payload.push(`Kitchen : ${route.kitchenStationName}\n`);
    payload.push(`Table   : ${route.table}\n`);
    payload.push(`Order   : ${route.orderNumber}\n`);
    payload.push(`customer  : ${route.customer ?? 1}\n`);
    payload.push(`Date    : ${route.createdAt}\n`);

    payload.push(this.divider());

    // -------------------------------
    // Print Menu Items
    // -------------------------------
    route.items.forEach((item) => {
      payload.push(...this.buildItem(item));
    });

    payload.push(this.divider());

    payload.push("\x1B\x45\x01");
    payload.push("KITCHEN COPY\n");
    payload.push("\x1B\x45\x00");

    payload.push("\n\n\n");

    // Feed paper
    payload.push("\x1B\x64\x05");

    // Cut paper
    payload.push("\x1D\x56\x00");

    return payload;
  }

  /**
   * Build single menu item
   */
  private static buildItem(item: KotItem): string[] {
    const payload: string[] = [];

    payload.push("\x1B\x45\x01");

    payload.push(`${item.quantity} x ${item.productName}\n`);

    payload.push("\x1B\x45\x00");

    if (item.specialInstructions?.trim()) {
      payload.push(`   * ${item.specialInstructions}\n`);
    }

    payload.push("\n");

    return payload;
  }

  /**
   * Divider
   */
  private static divider(): string {
    return "-".repeat(this.LINE_WIDTH) + "\n";
  }
}