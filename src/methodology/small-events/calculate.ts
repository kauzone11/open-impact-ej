import { spendingCategories } from "./questionnaire";
import { smallEventResponseSchema, type SmallEventResponseInput } from "./schema";

export type SmallEventCalculation = {
  totalResponses: number;
  validResponses: number;
  localResponses: number;
  visitorResponses: number;
  visitorShare: number;
  averageSpendPerPerson: number;
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

export function calculateSmallEventImpact(rawResponses: SmallEventResponseInput[]): SmallEventCalculation {
  const validResponses = rawResponses
    .map((response) => smallEventResponseSchema.safeParse(response))
    .filter((result) => result.success)
    .map((result) => result.data);

  const totals = Object.fromEntries(spendingCategories.map((category) => [category.key, 0])) as Record<string, number>;
  const origins = new Map<string, number>();

  let directImpactEstimate = 0;
  let localResponses = 0;
  let visitorResponses = 0;

  for (const response of validResponses) {
    if (response.isLocalResident) {
      localResponses += 1;
    } else {
      visitorResponses += 1;
    }

    origins.set(response.originCity, (origins.get(response.originCity) ?? 0) + 1);

    for (const category of spendingCategories) {
      const normalized = normalizeSpend(response[category.key], response.groupSize, response.spendingScope);
      totals[category.key] += normalized;
      directImpactEstimate += normalized;
    }
  }

  const validCount = validResponses.length;
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
    visitorShare: validCount > 0 ? roundCurrency(visitorResponses / validCount) : 0,
    averageSpendPerPerson: validCount > 0 ? roundCurrency(directImpactEstimate / validCount) : 0,
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
