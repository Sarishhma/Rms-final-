import { describe, expect, it } from "vitest";
import { stockStatusFor } from "../../src/modules/stock/repository.js";
import { calculateAdjustedStock } from "../../src/modules/stock/service.js";

describe("Stock Module Unit Tests", () => {
  describe("stockStatusFor", () => {
    it("returns OUT_OF_STOCK when remainingQty is 0", () => {
      expect(stockStatusFor(0, 5)).toBe("OUT_OF_STOCK");
    });

    it("returns OUT_OF_STOCK when remainingQty is negative", () => {
      expect(stockStatusFor(-2, 5)).toBe("OUT_OF_STOCK");
    });

    it("returns LOW_STOCK when remainingQty is exactly lowStockAt", () => {
      expect(stockStatusFor(5, 5)).toBe("LOW_STOCK");
    });

    it("returns LOW_STOCK when remainingQty is below lowStockAt but above 0", () => {
      expect(stockStatusFor(3, 5)).toBe("LOW_STOCK");
    });

    it("returns IN_STOCK when remainingQty is above lowStockAt", () => {
      expect(stockStatusFor(6, 5)).toBe("IN_STOCK");
    });
  });

  describe("calculateAdjustedStock", () => {
    it("adds remaining quantity to opening stock when opening stock is 0", () => {
      expect(calculateAdjustedStock({ openingQty: 0, remainingQty: 0 }, { remainingQty: 100 })).toEqual({
        openingQty: 100,
        remainingQty: 100
      });
    });

    it("adds remaining quantity to existing opening stock", () => {
      expect(calculateAdjustedStock({ openingQty: 100, remainingQty: 100 }, { remainingQty: 200 })).toEqual({
        openingQty: 300,
        remainingQty: 300
      });
    });

    it("preserves deducted quantity when adding more stock", () => {
      expect(calculateAdjustedStock({ openingQty: 100, remainingQty: 40 }, { remainingQty: 200 })).toEqual({
        openingQty: 300,
        remainingQty: 240
      });
    });
  });
});
