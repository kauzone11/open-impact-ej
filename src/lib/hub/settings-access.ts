import { HubAccessError, requireHubMember } from "@/lib/hub/auth";
import { canAccessHubSettings } from "@/lib/hub/settings-policy";

export async function requireHubSettingsAccess() {
  const context = await requireHubMember();
  if (!canAccessHubSettings(context.role, context.member.organizationPosition)) {
    throw new HubAccessError("Acesso negado.", 403);
  }
  return context;
}
