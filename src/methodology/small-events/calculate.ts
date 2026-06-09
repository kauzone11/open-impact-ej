import { spendingCategories } from "./questionnaire";
import { smallEventResponseSchema, type SmallEventResponseInput } from "./schema";

export type SmallEventCalculation = {
  totalResponses: number;
  validResponses: number;
  localResponses: number;
  visitorResponses: number;
  eventDrivenVisitorResponses: number;
  visitorShare: number;
  eventDrivenVisitorShare: number;
  averageSpendPerPerson: number;
  averageSpendPerEventDrivenVisitor: number;
  adjustedAudienceEstimate: number;
  observedSampleTotal: number;
  directImpactEstimate: number;
  averageByCategory: Record<string, number>;
  totalByCategory: Record<string, number>;
  originDistribution: Array<{ origin: string; count: number }>;
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeSpend(value: number, groupSize: number, scope: SmallEventResponseInput["spendingScope"]) {
  if (scope === "GROUP") {
    return value / Math.max(groupSize, 1);
  }

  return value;
}

function categorySpend(response: SmallEventResponseInput, categoryKey: string) {
  if (categoryKey === "lodgingSpend" && response.isLocalResident && !response.stayedOvernight) {
    return 0;
  }

  return response[categoryKey as keyof Pick<
    SmallEventResponseInput,
    "foodSpend" | "transportSpend" | "shoppingSpend" | "lodgingSpend" | "otherSpend"
  >] as number;
}

export function calculateSmallEventImpact(
  rawResponses: SmallEventResponseInput[],
  expectedAudience = 0,
): SmallEventCalculation {
  const validResponses = rawResponses
    .map((response) => smallEventResponseSchema.safeParse(response))
    .filter((result) => result.success)
    .map((result) => result.data);

  const totals = Object.fromEntries(spendingCategories.map((category) => [category.key, 0])) as Record<string, number>;
  const origins = new Map<string, number>();

  let directImpactEstimate = 0;
  let observedSampleTotal = 0;
  let eventDrivenVisitorSpend = 0;
  let localResponses = 0;
  let visitorResponses = 0;
  let eventDrivenVisitorResponses = 0;

  for (const response of validResponses) {
    const isEventDrivenVisitor = !response.isLocalResident && response.cameSpecificallyForEvent;

    if (response.isLocalResident) {
      localResponses += 1;
    } else {
      visitorResponses += 1;
    }

    if (isEventDrivenVisitor) {
      eventDrivenVisitorResponses += 1;
    }

    origins.set(response.originCity, (origins.get(response.originCity) ?? 0) + 1);

    for (const category of spendingCategories) {
      const normalized = normalizeSpend(categorySpend(response, category.key), response.groupSize, response.spendingScope);
      totals[category.key] += normalized;
      observedSampleTotal += normalized;

      if (isEventDrivenVisitor) {
        eventDrivenVisitorSpend += normalized;
      }
    }
  }

  const validCount = validResponses.length;
  const eventDrivenVisitorShare = validCount > 0 ? eventDrivenVisitorResponses / validCount : 0;
  const adjustedAudienceEstimate = Math.max(expectedAudience, 0) * eventDrivenVisitorShare;
  const averageSpendPerEventDrivenVisitor =
    eventDrivenVisitorResponses > 0 ? eventDrivenVisitorSpend / eventDrivenVisitorResponses : 0;
  directImpactEstimate = averageSpendPerEventDrivenVisitor * adjustedAudienceEstimate;
  const averageByCategory = Object.fromEntries(
    spendingCategories.map((category) => [
      category.key,
      validCount > 0 ? roundCurrency(totals[category.key] / validCount) : 0,
    ]),
  ) as Record<string, number>;

  return {
    totalResponses: rawResponses.length,
    validResponses: validCount,
    localResponses,
    visitorResponses,
    eventDrivenVisitorResponses,
    visitorShare: validCount > 0 ? roundCurrency(visitorResponses / validCount) : 0,
    eventDrivenVisitorShare: roundCurrency(eventDrivenVisitorShare),
    averageSpendPerPerson: validCount > 0 ? roundCurrency(observedSampleTotal / validCount) : 0,
    averageSpendPerEventDrivenVisitor: roundCurrency(averageSpendPerEventDrivenVisitor),
    adjustedAudienceEstimate: Math.round(adjustedAudienceEstimate),
    observedSampleTotal: roundCurrency(observedSampleTotal),
    directImpactEstimate: roundCurrency(directImpactEstimate),
    averageByCategory,
    totalByCategory: Object.fromEntries(
      spendingCategories.map((category) => [category.key, roundCurrency(totals[category.key])]),
    ) as Record<string, number>,
    originDistribution: Array.from(origins.entries())
      .map(([origin, count]) => ({ origin, count }))
      .sort((a, b) => b.count - a.count || a.origin.localeCompare(b.origin)),
  };
}
