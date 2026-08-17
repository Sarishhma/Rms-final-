import { SocketPrinter } from "./socketPrinter";
import { ReceiptPrinter } from "./receiptPrinter";
import { BillBuilder } from "./billBuilder";
import type { KitchenRoute } from "./printer.types";

export class PrintManager {
  /**
   * Print Kitchen Order Tickets
   */
  static async printKOT(routes: KitchenRoute[]): Promise<void> {
    if (!routes.length) {
      console.warn("No kitchen routes found.");
      return;
    }

    try {
      console.log(`Printing ${routes.length} kitchen route(s)...`);

      // Print all kitchens simultaneously
      await SocketPrinter.printMultiple(routes);

      console.log("All kitchen prints completed.");
    } catch (error) {
      console.error("Kitchen printing failed.", error);
      throw error;
    }
  }

  /**
   * Print Customer Bill
   */
  /**
   * Print Customer Bill
   */
  static async printBill(receipt: any, printerName?: string): Promise<void> {
    try {
      const receiptData = BillBuilder.transform(receipt);

      const html = BillBuilder.buildHTML(receiptData);

      await ReceiptPrinter.printHTML(html, printerName);

      console.log("Receipt printed successfully.");
    } catch (error) {
      console.error("Receipt printing failed.", error);

      throw error;
    }
  }


  static async printRawBill(
    payload: string[],
    printerName?: string,
  ): Promise<void> {
    try {
      await ReceiptPrinter.printRaw(payload, printerName);

      console.log("Raw receipt printed.");
    } catch (error) {
      console.error("Raw receipt printing failed.", error);
      throw error;
    }
  }
}
