import { describe, it, expect } from "vitest";
import { validateTimerData } from "../utils/validation";
import { selectBestTimer } from "../utils/targeting";


describe("validateTimerData", () => {
  it("should fail if name is missing", () => {
    const data = { type: "fixed", endAt: new Date() };
    const errors = validateTimerData(data);
    expect(errors.name).toBe("Timer name is required");
  });

  it("should fail if type is missing", () => {
    const data = { name: "Test Timer" };
    const errors = validateTimerData(data);
    expect(errors.type).toBe("Type is required");
  });

  it("should fail if type is fixed but endAt is missing", () => {
    const data = { name: "Test Timer", type: "fixed" };
    const errors = validateTimerData(data);
    expect(errors.endAt).toBe("End date is required for fixed timers");
  });

  it("should pass with valid fixed timer data", () => {
    const data = { name: "Test Timer", type: "fixed", endAt: new Date() };
    const errors = validateTimerData(data);
    expect(Object.keys(errors).length).toBe(0);
  });
});

describe("selectBestTimer", () => {
  const mockTimers: any[] = [
    {
      _id: "1",
      name: "All Timer",
      type: "fixed",
      targeting: { type: "all" },
    },
    {
      _id: "2",
      name: "Product Timer",
      type: "fixed",
      targeting: { type: "product", productIds: ["prod_123"] },
    },
    {
      _id: "3",
      name: "Collection Timer",
      type: "fixed",
      targeting: { type: "collection", collectionIds: ["coll_456"] },
    },
  ];

  it("should prioritize product targeting over all others", () => {
    const result = selectBestTimer(mockTimers, "prod_123", ["coll_456"]);
    expect(result?.name).toBe("Product Timer");
  });

  it("should prioritize collection targeting over global targeting", () => {
    const result = selectBestTimer(mockTimers, "prod_999", ["coll_456"]);
    expect(result?.name).toBe("Collection Timer");
  });

  it("should fallback to global targeting if no specific matches", () => {
    const result = selectBestTimer(mockTimers, "prod_999", ["coll_999"]);
    expect(result?.name).toBe("All Timer");
  });
});
