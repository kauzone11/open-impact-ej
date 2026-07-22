export type MoneyCents = number;

export function parseMoneyToCents(value: string): MoneyCents {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Valor financeiro inválido.");
  return Math.round(parsed * 100);
}
