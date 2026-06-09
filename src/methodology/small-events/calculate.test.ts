import { describe, expect, it } from "vitest";
import { calculateSmallEventImpact } from "./calculate";
import type { SmallEventResponseInput } from "./schema";

const baseResponse: SmallEventResponseInput = {
  isLocalResident: true,
  originCity: "Fortaleza",
  cameSpecificallyForEvent: true,
  groupSize: 1,
  foodSpend: 50,
  transportSpend: 20,
  shoppingSpend: 30,
  lodgingSpend: 0,
  averageStayDays: 1,
  spendingScope: "INDIVIDUAL",
  rating: 5,
};

describe("small event impact calculation", () => {
  it("calculates average spend and direct impact", () => {
    const result = calculateSmallEventImpact([
      baseResponse,
      { ...baseResponse, foodSpend: 100, transportSpend: 0, shoppingSpend: 0 },
    ]);

    expect(result.validResponses).toBe(2);
    expect(result.directImpactEstimate).toBe(200);
    expect(result.averageSpendPerPerson).toBe(100);
  });

  it("separates local residents and visitors", () => {
    const result = calculateSmallEventImpact([
      baseResponse,
      { ...baseResponse, isLocalResident: false, originCity: "Recife" },
    ]);

    expect(result.localResponses).toBe(1);
    expect(result.visitorResponses).toBe(1);
    expect(result.visitorShare).toBe(0.5);
  });

  it("normalizes group spending into per-person spending", () => {
    const result = calculateSmallEventImpact([
      {
        ...baseResponse,
        groupSize: 4,
        foodSpend: 200,
        transportSpend: 40,
        shoppingSpend: 0,
        spendingScope: "GROUP",
      },
    ]);

    expect(result.averageByCategory.foodSpend).toBe(50);
    expect(result.averageByCategory.transportSpend).toBe(10);
    expect(result.directImpactEstimate).toBe(60);
  });

  it("ignores incomplete invalid responses", () => {
    const result = calculateSmallEventImpact([baseResponse, { ...baseResponse, groupSize: 0 }]);

    expect(result.totalResponses).toBe(2);
    expect(result.validResponses).toBe(1);
  });
});
