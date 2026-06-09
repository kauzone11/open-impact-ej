import Link from "next/link";
import { BarChart3, Code2, PlusCircle } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white">
              <BarChart3 size={20} aria-hidden="true" />
            </span>
            <span>Open Impact EJ</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/studies/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <PlusCircle size={16} aria-hidden="true" />
              Novo estudo
            </Link>
            <a
              href="https://github.com/kauzone11/open-impact-ej"
              className="hidden items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              <Code2 size={16} aria-hidden="true" />
              GitHub
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
