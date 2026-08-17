export function transformReceiptToReceipt(receipt: any) {
  // Bill fields live at root — no nested `bill` object
  const subtotal   = Number(receipt?.subtotal   ?? 0);
  const discount   = Number(receipt?.discount   ?? 0);
  const grandTotal = Number(receipt?.grandTotal ?? 0);
  const paid       = Number(receipt?.paid       ?? 0);
  const due        = Number(receipt?.due        ?? 0);

  // Items are nested under receipt.order.items
  const items = (receipt?.order?.items ?? []).map((i: any) => ({
    name:     i.menuItem?.name,
    quantity: Number(i.quantity),
    price:    Number(i.unitPrice),
    total:    Number(i.lineSubtotal),
  }));

  return {
    businessName:          receipt?.businessName,
    businessAddress:       receipt?.businessAddress,
    taxRegistrationNumber: receipt?.taxRegistrationNumber,
    currency:              receipt?.currency ?? "NPR",
    billNumber:            receipt?.billNumber,
    receiptNumber:         receipt?.billNumber ?? "N/A",
    date:                  new Date(receipt?.createdAt).toLocaleString(),
    orderNumber:           receipt?.order?.orderNumber,
    channel:               receipt?.order?.channel,
    table:                 receipt?.order?.table?.name,
    items,
    subtotal,
    discount,
    vat:                   0,
    billTotal:             grandTotal,
    paid,
    due,
    invoiceFooter:         receipt?.invoiceFooter ?? null,
  };
}