declare module '@point-of-sale/receipt-printer-encoder' {
    class ReceiptPrinterEncoder {
      constructor(options?: { language?: string; width?: number; codepage?: string });
      initialize(): this;
      lineSpacing(value?: number): this;
      align(value: 'left' | 'center' | 'right'): this;
      size(value: 'normal' | 'double-width' | 'double-height' | 'double-width-double-height'): this;
      line(text: string): this;
      newline(): this;
      bold(value: boolean): this;
      underline(value: boolean | number): this;
      table(columns: Array<{ width: number; align?: 'left' | 'right' | 'center'; text: string }>): this;
      cut(value?: 'full' | 'partial'): this;
      encode(): Uint8Array;
    }
    export default ReceiptPrinterEncoder;
  }