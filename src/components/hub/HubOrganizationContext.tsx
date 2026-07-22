"use client";

import { createContext, useContext, useMemo } from "react";
import { formatHubDate, formatHubDateTime, formatHubMaskedMoney, formatHubMoney } from "@/lib/hub/display";

const defaults = { locale: "pt-BR", currency: "BRL", timezone: "America/Sao_Paulo" };
export type HubOrganizationPreferences = { locale: string; currency: string; timezone: string; hubName?: string; logoUrl?: string | null };
type HubOrganizationValue = HubOrganizationPreferences & { updateOrganization: (organization: HubOrganizationPreferences) => void };
const HubOrganizationContext = createContext<HubOrganizationValue>({ ...defaults, updateOrganization: () => undefined });

export function HubOrganizationProvider({ organization, onUpdate, children }: { organization: HubOrganizationPreferences; onUpdate?: (organization: HubOrganizationPreferences) => void; children: React.ReactNode }) {
  const value = useMemo(() => ({ ...organization, updateOrganization: (next: HubOrganizationPreferences) => onUpdate?.(next) }), [organization, onUpdate]);
  return <HubOrganizationContext.Provider value={value}>{children}</HubOrganizationContext.Provider>;
}

export function useHubOrganizationPreferences() {
  return useContext(HubOrganizationContext);
}

export function useHubDisplay() {
  const preferences = useHubOrganizationPreferences();
  return useMemo(() => ({
    money: (cents: number) => formatHubMoney(cents, preferences),
    maskedMoney: () => formatHubMaskedMoney(preferences),
    date: (value: string | number | Date) => formatHubDate(value, preferences),
    dateTime: (value: string | number | Date) => formatHubDateTime(value, preferences),
  }), [preferences]);
}
