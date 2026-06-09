import { AppShell } from "@/components/AppShell";
import { createStudy } from "@/app/actions";

export default function NewStudyPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">Criar estudo</h1>
        <p className="mt-2 text-slate-600">
          Cadastre um evento. No MVP, a metodologia calculada e apenas para pequeno porte.
        </p>
        <form action={createStudy} className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
          <label className="grid gap-1 text-sm font-medium">
            Nome do evento
            <input name="eventName" required className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Cidade
              <input name="city" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Estado
              <input name="state" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Data de inicio
              <input name="startDate" type="date" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Data de fim
              <input name="endDate" type="date" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium">
              Tipo
              <input name="eventType" required placeholder="Feira, congresso..." className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Porte
              <select name="eventSize" defaultValue="SMALL" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="SMALL">Pequeno</option>
                <option value="MEDIUM">Medio</option>
                <option value="LARGE">Grande</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Publico estimado
              <input name="expectedAudience" type="number" min="1" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Observacoes
            <textarea name="notes" rows={4} className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button className="rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
            Criar e abrir questionario
          </button>
        </form>
      </main>
    </AppShell>
  );
}
