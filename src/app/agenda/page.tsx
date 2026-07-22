import { HubAgendaTabs } from "@/components/hub/HubAgendaTabs";
import { Suspense } from "react";
export default function Page() {
  return <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-white" aria-label="Carregando agenda" />}><HubAgendaTabs /></Suspense>;
}
