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
  otherSpend: 0,
  stayedOvernight: false,
  averageStayDays: 1,
  spendingScope: "INDIVIDUAL",
  rating: 5,
};

describe("small event impact calculation", () => {
  it("calculates average spend and direct impact", () => {
    const result = calculateSmallEventImpact(
      [
        { ...baseResponse, isLocalResident: false },
        { ...baseResponse, isLocalResident: false, foodSpend: 100, transportSpend: 0, shoppingSpend: 0 },
      ],
      20,
    );

    expect(result.validResponses).toBe(2);
    expect(result.averageSpendPerPerson).toBe(100);
    expect(result.observedSampleTotal).toBe(200);
    expect(result.directImpactEstimate).toBe(2000);
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
    const result = calculateSmallEventImpact(
      [
        {
          ...baseResponse,
          isLocalResident: false,
          groupSize: 4,
          foodSpend: 200,
          transportSpend: 40,
          shoppingSpend: 0,
          spendingScope: "GROUP",
        },
      ],
      10,
    );

    expect(result.averageByCategory.foodSpend).toBe(50);
    expect(result.averageByCategory.transportSpend).toBe(10);
    expect(result.observedSampleTotal).toBe(60);
    expect(result.directImpactEstimate).toBe(600);
  });

  it("ignores incomplete invalid responses", () => {
    const result = calculateSmallEventImpact([baseResponse, { ...baseResponse, groupSize: 0 }]);

    expect(result.totalResponses).toBe(2);
    expect(result.validResponses).toBe(1);
  });

  it("does not count local lodging unless the respondent stayed overnight", () => {
    const result = calculateSmallEventImpact([
      { ...baseResponse, lodgingSpend: 300, stayedOvernight: false },
      { ...baseResponse, lodgingSpend: 200, stayedOvernight: true },
    ]);

    expect(result.totalByCategory.lodgingSpend).toBe(200);
  });

  it("handles zero expected audience without inflating impact", () => {
    const result = calculateSmallEventImpact([{ ...baseResponse, isLocalResident: false }], 0);

    expect(result.adjustedAudienceEstimate).toBe(0);
    expect(result.directImpactEstimate).toBe(0);
  });
});
