import { formatCurrency } from "@/lib/format";
import { spendingCategories } from "@/methodology/small-events/questionnaire";

export function ResultsCharts({
  totalByCategory,
  localResponses,
  visitorResponses,
}: {
  totalByCategory: Record<string, number>;
  localResponses: number;
  visitorResponses: number;
}) {
  const categoryData = spendingCategories.map((category) => ({
    name: category.label,
    value: totalByCategory[category.key] ?? 0,
  }));
  const maxCategoryValue = Math.max(...categoryData.map((category) => category.value), 1);
  const totalOrigins = localResponses + visitorResponses;
  const visitorDegrees = totalOrigins > 0 ? Math.round((visitorResponses / totalOrigins) * 360) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold">Gasto por categoria</h2>
        <div className="mt-5 grid gap-4">
          {categoryData.map((category) => (
            <div key={category.name} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{category.name}</span>
                <span className="text-slate-600">{formatCurrency(category.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-700"
                  style={{ width: `${Math.max((category.value / maxCategoryValue) * 100, category.value > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold">Origem dos respondentes</h2>
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
          <div
            aria-label={`Visitantes ${visitorResponses}; moradores locais ${localResponses}`}
            className="h-44 w-44 rounded-full"
            style={{
              background: `conic-gradient(#2563eb 0deg ${visitorDegrees}deg, #047857 ${visitorDegrees}deg 360deg)`,
            }}
          />
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-700" />
              <span>Moradores locais: {localResponses}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600" />
              <span>Visitantes: {visitorResponses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
