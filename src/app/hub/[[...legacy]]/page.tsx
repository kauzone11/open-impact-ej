import { redirect } from "next/navigation";

const routes: Record<string, string> = { "": "/inicio", login: "/login", diretorias: "/diretorias", projetos: "/projetos", tarefas: "/tarefas", agenda: "/agenda", financas: "/financas", "minha-conta": "/minha-conta", ajustes: "/ajustes", convite: "/convite" };

export default async function LegacyHubRedirect({ params }: { params: Promise<{ legacy?: string[] }> }) {
  const segments = (await params).legacy ?? [];
  const [first = "", ...rest] = segments;
  const target = routes[first] ?? "/inicio";
  redirect(rest.length ? `${target}/${rest.map(encodeURIComponent).join("/")}` : target);
}
