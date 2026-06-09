import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createSurveyResponse } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export default async function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const study = await prisma.study.findUnique({ where: { id } });

  if (!study) {
    notFound();
  }

  const action = createSurveyResponse.bind(null, study.id);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Questionario anonimo</p>
            <h1 className="mt-2 text-3xl font-semibold">{study.eventName}</h1>
            <p className="mt-2 text-slate-600">Nao colete nome, CPF ou telefone no MVP.</p>
          </div>
          <Link href={`/studies/${study.id}/results`} className="text-sm font-semibold text-emerald-700">
            Ver resultados
          </Link>
        </div>

        {study.eventSize !== "SMALL" ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            A metodologia implementada nesta versao cobre apenas pequeno porte. Este estudo pode ser cadastrado, mas os
            resultados devem ser tratados como preparacao arquitetural, nao como metodologia validada para este porte.
          </div>
        ) : null}

        <form action={action} className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Mora na cidade do evento?
              <select name="isLocalResident" defaultValue="true" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="true">Sim</option>
                <option value="false">Nao</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Cidade de origem
              <input name="originCity" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Veio especificamente para o evento?
              <select name="cameSpecificallyForEvent" defaultValue="true" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="true">Sim</option>
                <option value="false">Nao</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Pessoas no grupo
              <input name="groupSize" type="number" min="1" defaultValue="1" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Alimentacao (R$)
              <input name="foodSpend" type="number" min="0" step="0.01" defaultValue="0" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Transporte (R$)
              <input name="transportSpend" type="number" min="0" step="0.01" defaultValue="0" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Compras no evento (R$)
              <input name="shoppingSpend" type="number" min="0" step="0.01" defaultValue="0" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Hospedagem (R$)
              <input name="lodgingSpend" type="number" min="0" step="0.01" defaultValue="0" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Outros itens (R$)
              <input name="otherSpend" type="number" min="0" step="0.01" defaultValue="0" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium">
              Pernoite por causa do evento?
              <select name="stayedOvernight" defaultValue="false" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Dias de permanencia
              <input name="averageStayDays" type="number" min="0" step="0.5" defaultValue="1" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Escopo do gasto
              <select name="spendingScope" defaultValue="INDIVIDUAL" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="INDIVIDUAL">Individual</option>
                <option value="GROUP">Grupo</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Avaliacao
              <select name="rating" defaultValue="4" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>
          <button className="rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
            Enviar resposta
          </button>
        </form>
      </main>
    </AppShell>
  );
}
