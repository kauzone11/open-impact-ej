"use client";

/** A tiny, dependency-free modal bridge for legacy Hub actions. */
export function requestHubText(options: {
  title: string;
  label?: string;
  initialValue?: string;
  required?: boolean;
  multiline?: boolean;
  confirmLabel?: string;
  description?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const root = document.createElement("div");
    root.className = "fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4";
    root.setAttribute("role", "presentation");
    const dialog = document.createElement("div");
    dialog.className = "w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    const heading = document.createElement("h2"); heading.className = "text-lg font-semibold"; heading.textContent = options.title;
    const description = document.createElement("p"); description.className = "mt-1 text-sm text-zinc-600"; description.textContent = options.description || "";
    const label = document.createElement("label"); label.className = "mt-4 block text-sm font-medium"; label.textContent = options.label || "Motivo";
    const control = document.createElement(options.multiline === false ? "input" : "textarea");
    control.className = "mt-1 min-h-10 w-full rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-black focus:ring-2 focus:ring-zinc-300";
    control.value = options.initialValue || "";
    if (options.required) control.setAttribute("required", "true");
    const error = document.createElement("p"); error.className = "mt-2 hidden text-sm text-red-700";
    const actions = document.createElement("div"); actions.className = "mt-5 flex justify-end gap-2";
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"; cancel.textContent = "Cancelar";
    const submit = document.createElement("button"); submit.type = "button"; submit.className = "rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"; submit.textContent = options.confirmLabel || "Confirmar";
    const close = (value: string | null) => { root.remove(); resolve(value); };
    cancel.onclick = () => close(null);
    submit.onclick = () => { const value = control.value.trim(); if (options.required && !value) { error.textContent = "Preencha este campo para continuar."; error.classList.remove("hidden"); control.focus(); return; } submit.disabled = true; submit.textContent = "Salvando…"; close(value); };
    root.onmousedown = (event) => { if (event.target === root) close(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(null); };
    root.addEventListener("keydown", onKey);
    actions.append(cancel, submit); label.append(control); dialog.append(heading, description, label, error, actions); root.append(dialog); document.body.append(root); control.focus();
  });
}

export async function requestHubConfirmation(options: { title: string; description: string; confirmLabel?: string }) {
  return (await requestHubText({ ...options, label: "", multiline: false, confirmLabel: options.confirmLabel || "Confirmar" })) !== null;
}
