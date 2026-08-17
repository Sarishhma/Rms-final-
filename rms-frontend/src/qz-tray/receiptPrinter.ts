import { qzConnection } from "./qzConnection";

export class ReceiptPrinter {
 
  static async findDefaultPrinter(): Promise<string> {
    await qzConnection.ensureConnection();

    const qz = qzConnection.getQZ();

    const defaultPrinter = await qz.printers.getDefault();

    if (defaultPrinter) {
      return defaultPrinter;
    }

    const printers: string[] = await qz.printers.find();

    if (!printers.length) {
      throw new Error("No printers found.");
    }

    return printers[0];
  }

 
  static async printHTML(
    html: string,
    printerName?: string
  ): Promise<void> {
    await qzConnection.ensureConnection();

    const qz = qzConnection.getQZ();

    const printer =
      printerName ?? (await this.findDefaultPrinter());

    const config = qz.configs.create(printer);

    const data = [
      {
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: html,
        options: {
          margin: 0,
          size: {
            width: 3.1,
          },
        },
      },
    ];

    await qz.print(config, data);

    console.log(`✅ Receipt printed on ${printer}`);
  }

  /**
   * Print raw ESC/POS receipt
   */
  static async printRaw(
    payload: string[],
    printerName?: string
  ): Promise<void> {
    await qzConnection.ensureConnection();

    const qz = qzConnection.getQZ();

    const printer =
      printerName ?? (await this.findDefaultPrinter());

    const config = qz.configs.create(printer);

    await qz.print(config, payload);

    console.log(`✅ Raw receipt printed on ${printer}`);
  }
}