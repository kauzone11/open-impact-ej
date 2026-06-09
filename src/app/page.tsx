import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, FileText, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const studies = await prisma.study.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { _count: { select: { responses: true } } },
  });

  return (
    <AppShell>
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Open-source para EJs</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                Estudos simples e auditaveis de impacto economico de eventos.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                O Open Impact EJ ajuda empresas juniores, universidades e organizacoes locais a cadastrar eventos,
                coletar respostas anonimas e estimar impacto direto com uma metodologia transparente.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/studies/new"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Criar estudo
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a
                  href="/docs/methodology-small-events.md"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  Ver metodologia
                </a>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                ["Questionarios", "Coleta anonima para pequenos eventos."],
                ["Calculos", "Gastos por pessoa e impacto direto estimado."],
                ["Relatorios", "Exportacao Markdown para auditoria e revisao."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-stone-50 p-4">
                  <h2 className="text-base font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-4">
            {([
              [BookOpen, "Metodologia aberta", "Hipoteses e limites documentados."],
              [ShieldCheck, "Privacidade minima", "Sem CPF, telefone ou nome obrigatorio."],
              [Calculator, "Calculo conservador", "Sem multiplicador indireto no MVP."],
              [FileText, "Documentacao", "Roadmap, contribuicao e seguranca desde o inicio."],
            ] satisfies Array<[LucideIcon, string, string]>).map(([Icon, title, body]) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                <Icon className="text-emerald-700" size={20} aria-hidden="true" />
                <h2 className="mt-3 text-base font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Estudos recentes</h2>
              <p className="mt-1 text-sm text-slate-600">Dados locais de desenvolvimento, sem exemplos reais embutidos.</p>
            </div>
            <Link href="/studies/new" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
              Novo estudo
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {studies.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                Nenhum estudo cadastrado ainda.
              </div>
            ) : (
              studies.map((study) => (
                <Link
                  key={study.id}
                  href={`/studies/${study.id}/results`}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-semibold">{study.eventName}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {study.city}/{study.state} - {study.eventType}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{study._count.responses} respostas</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
