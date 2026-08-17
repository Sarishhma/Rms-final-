// src/services/printer/billBuilder.ts

import type { ReceiptData } from "./printer.types";

export class BillBuilder {
  /**
   * Transform backend receipt into printable receipt data
   */
  static transform(receipt: any): ReceiptData {
    const subtotal = Number(receipt?.subtotal ?? 0);
    const discount = Number(receipt?.discount ?? 0);
    const grandTotal = Number(receipt?.grandTotal ?? 0);
    const paid = Number(receipt?.paid ?? 0);
    const due = Number(receipt?.due ?? 0);

    const items = (receipt?.order?.items ?? []).map((i: any) => ({
      name: i.menuItem?.name,
      quantity: Number(i.quantity),
      price: Number(i.unitPrice),
      total: Number(i.lineSubtotal),
    }));

    return {
      businessName: receipt?.businessName,
      businessAddress: receipt?.businessAddress,
      taxRegistrationNumber: receipt?.taxRegistrationNumber,
      currency: receipt?.currency ?? "NPR",

      billNumber: receipt?.billNumber,
      receiptNumber: receipt?.billNumber ?? "N/A",

      date: new Date(receipt?.createdAt).toLocaleString(),

      orderNumber: receipt?.order?.orderNumber,
      channel: receipt?.order?.channel,
      table: receipt?.order?.table?.name,

      items,

      subtotal,
      discount,
      vat: 0,
      billTotal: grandTotal,

      paid,
      due,

      invoiceFooter: receipt?.invoiceFooter ?? null,
    };
  }

  /**
   * Build HTML receipt
   */
  static buildHTML(data: ReceiptData): string {
    const itemRows = data.items
      .map(
        (i) => `
        <div style="display:flex;justify-content:space-between;margin-top:3px">
          <span style="flex:2">${i.name}</span>
          <span style="flex:0.5;text-align:center">${i.quantity}</span>
          <span style="flex:1;text-align:right">${i.price}</span>
          <span style="flex:1;text-align:right">${i.total}</span>
        </div>`,
      )
      .join("");

    const hr = `<hr style="border:none;border-top:1px solid #111;margin:6px 0">`;

    return `
<!DOCTYPE html>
<html>

<head>
  <title>Receipt</title>

  <style>

    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
    }

    body{
      font-family:'Courier New', monospace;
      font-size:12px;
      font-weight:700;
      color:#000;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }

  </style>

</head>

<body>

  <div style="text-align:center;margin-bottom:8px">

      <span>${data.orderNumber}</span>

      <div style="font-size:13px;font-weight:700">
          ${data.businessName}
      </div>

      <div style="color:#333">
          ${data.businessAddress}
      </div>

  </div>

  ${hr}

  <div style="display:flex;justify-content:space-between">
      <span>Receipt #:</span>
      <span>${data.billNumber ?? "—"}</span>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:3px">
      <span>Date:</span>
      <span>${data.date}</span>
  </div>

  ${hr}

  <div style="display:flex;justify-content:space-between;font-weight:700">

      <span style="flex:2">Item</span>

      <span style="flex:0.5;text-align:center">
        Qty
      </span>

      <span style="flex:1;text-align:right">
        Price
      </span>

      <span style="flex:1;text-align:right">
        Total
      </span>

  </div>

  ${hr}

  ${itemRows}

  ${hr}

  <div style="margin-top:4px">

      <div style="display:flex;justify-content:space-between;width:60%;margin-left:auto">
          <span>Subtotal:</span>
          <span>${data.subtotal}</span>
      </div>

      <div style="display:flex;justify-content:space-between;width:60%;margin-left:auto;margin-top:3px">
          <span>Discount:</span>
          <span>${data.discount}</span>
      </div>

  </div>

  ${hr}

  <div style="display:flex;justify-content:space-between;width:60%;margin-left:auto;font-weight:700">
      <span>Grand Total:</span>
      <span>${data.billTotal}</span>
  </div>

  ${hr}

  <div style="text-align:center;color:#333;margin-top:4px">

      <div>
        THIS IS NOT A VALID BILL PLEASE COLLECT BILL AFTER PAYMENT DONE
      </div>

      <div style="margin-top:4px">
        Thank You!
      </div>

  </div>

</body>

</html>
`;
  }
}
