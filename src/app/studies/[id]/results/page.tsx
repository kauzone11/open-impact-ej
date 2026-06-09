import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { ResultsCharts } from "@/components/ResultsCharts";
import { formatCurrency, formatPercent } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { calculateSmallEventImpact } from "@/methodology/small-events/calculate";
import { spendingCategories } from "@/methodology/small-events/questionnaire";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const study = await prisma.study.findUnique({
    where: { id },
    include: { responses: { orderBy: { createdAt: "desc" } } },
  });

  if (!study) {
    notFound();
  }

  const responses = study.responses.map((response) => ({
    ...response,
    foodSpend: Number(response.foodSpend),
    transportSpend: Number(response.transportSpend),
    shoppingSpend: Number(response.shoppingSpend),
    lodgingSpend: Number(response.lodgingSpend),
    averageStayDays: Number(response.averageStayDays),
  }));

  const calculation = calculateSmallEventImpact(responses);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Resultados</p>
            <h1 className="mt-2 text-3xl font-semibold">{study.eventName}</h1>
            <p className="mt-2 text-slate-600">
              {study.city}/{study.state} - impacto direto estimado, sem multiplicadores indiretos.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/studies/${study.id}/questionnaire`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Adicionar resposta
            </Link>
            <a
              href={`/api/studies/${study.id}/report`}
              className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Exportar Markdown
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Respostas" value={String(calculation.totalResponses)} detail={`${calculation.validResponses} validas`} />
          <MetricCard label="Gasto medio" value={formatCurrency(calculation.averageSpendPerPerson)} detail="por pessoa respondente" />
          <MetricCard label="Impacto direto" value={formatCurrency(calculation.directImpactEstimate)} detail="estimativa conservadora" />
          <MetricCard label="Visitantes" value={String(calculation.visitorResponses)} detail={formatPercent(calculation.visitorShare)} />
          <MetricCard label="Moradores locais" value={String(calculation.localResponses)} />
        </div>

        <div className="mt-6">
          <ResultsCharts
            totalByCategory={calculation.totalByCategory}
            localResponses={calculation.localResponses}
            visitorResponses={calculation.visitorResponses}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold">Resumo por categoria</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 font-medium">Categoria</th>
                    <th className="py-2 font-medium">Media</th>
                    <th className="py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {spendingCategories.map((category) => (
                    <tr key={category.key} className="border-b border-slate-100">
                      <td className="py-2">{category.label}</td>
                      <td className="py-2">{formatCurrency(calculation.averageByCategory[category.key] ?? 0)}</td>
                      <td className="py-2">{formatCurrency(calculation.totalByCategory[category.key] ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold">Distribuicao por origem</h2>
            <div className="mt-3 grid gap-2">
              {calculation.originDistribution.length === 0 ? (
                <p className="text-sm text-slate-600">Sem respostas.</p>
              ) : (
                calculation.originDistribution.map((origin) => (
                  <div key={origin.origin} className="flex justify-between rounded-md bg-stone-50 px-3 py-2 text-sm">
                    <span>{origin.origin}</span>
                    <span className="font-semibold">{origin.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
