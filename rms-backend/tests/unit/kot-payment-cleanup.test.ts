import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and websocket events before importing services
vi.mock("../../src/prisma/client.js", () => ({
  prisma: {
    $transaction: async (cb: any) => cb(prismaTxMock),
    kotTicket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    kotItem: {
      deleteMany: vi.fn(),
    },
  },
}));

const prismaTxMock = {
  order: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  kotItem: {
    deleteMany: vi.fn(),
  },
  kotTicket: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

import { kotService } from "../../src/modules/kot/service.js";
import { kotRepository } from "../../src/modules/kot/repository.js";

describe("KOT retrieval and cleanup on payment completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all KOT tickets for an orderId via listByOrder", async () => {
    const fakeTickets = [
      { id: "kot-1", orderId: "ord-1", status: "READY", items: [] },
      { id: "kot-2", orderId: "ord-1", status: "PENDING", items: [] },
    ];
    vi.spyOn(kotRepository, "findByOrderId").mockResolvedValue(fakeTickets as any);

    const result = await kotService.listByOrder("ord-1");
    expect(kotRepository.findByOrderId).toHaveBeenCalledWith("ord-1");
    expect(result).toEqual(fakeTickets);
  });

  it("get(id) falls back to findByOrderId when id is an orderId", async () => {
    const fakeTickets = [
      { id: "kot-1", orderId: "ord-99", status: "READY", items: [] },
    ];
    vi.spyOn(kotRepository, "findById").mockResolvedValue(null as any);
    vi.spyOn(kotRepository, "findByOrderId").mockResolvedValue(fakeTickets as any);

    const result = await kotService.get("ord-99");
    expect(kotRepository.findById).toHaveBeenCalledWith("ord-99");
    expect(kotRepository.findByOrderId).toHaveBeenCalledWith("ord-99");
    expect(result).toEqual(fakeTickets);
  });

  it("deletes all KOT tickets and items for an order when deleteForOrder is called", async () => {
    vi.spyOn(prismaTxMock.kotItem, "deleteMany").mockResolvedValue({ count: 5 });
    vi.spyOn(prismaTxMock.kotTicket, "deleteMany").mockResolvedValue({ count: 2 });

    await kotRepository.deleteForOrder("ord-123", prismaTxMock as any);
    expect(prismaTxMock.kotItem.deleteMany).toHaveBeenCalledWith({
      where: { kotTicket: { orderId: "ord-123" } },
    });
    expect(prismaTxMock.kotTicket.deleteMany).toHaveBeenCalledWith({
      where: { orderId: "ord-123" },
    });
  });
});
