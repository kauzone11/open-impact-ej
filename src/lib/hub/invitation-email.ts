export type InvitationEmail = {
  to: string;
  organizationName: string;
  inviterName: string;
  expiresAt: Date;
  invitationUrl: string;
};

export type HubInvitationDeliveryResult =
  | { status: "SENT"; providerMessageId?: string }
  | { status: "NOT_CONFIGURED" }
  | { status: "FAILED"; error: string };

export interface InvitationEmailProvider {
  send(input: InvitationEmail): Promise<HubInvitationDeliveryResult>;
}

export function hubCanonicalApplicationUrl(environment = process.env) {
  const configured = environment.APP_URL || environment.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const parsed = new URL(configured);
  if (environment.NODE_ENV === "production" && parsed.protocol !== "https:") throw new Error("APP_URL deve usar HTTPS em produção.");
  return parsed.toString().replace(/\/$/, "");
}

export function isHubInvitationEmailConfigured(environment = process.env) {
  return Boolean(environment.RESEND_API_KEY && environment.INVITATION_EMAIL_FROM);
}

export function mayExposeHubInvitationLink(environment = process.env) {
  return environment.NODE_ENV !== "production" || !isHubInvitationEmailConfigured(environment);
}

function safeDeliveryError(value: unknown) {
  const message = value instanceof Error ? value.message : "Falha desconhecida no provedor de e-mail.";
  return message.replace(/https?:\/\/\S+/g, "[url removida]").slice(0, 500);
}

export class ResendInvitationEmailProvider implements InvitationEmailProvider {
  constructor(private readonly environment: NodeJS.ProcessEnv = process.env) {}

  async send(input: InvitationEmail): Promise<HubInvitationDeliveryResult> {
    if (!isHubInvitationEmailConfigured(this.environment)) return { status: "NOT_CONFIGURED" };
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.environment.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: this.environment.INVITATION_EMAIL_FROM,
          to: [input.to],
          subject: `Convite para ${input.organizationName} no Open Impact EJ`,
          text: `${input.inviterName} convidou você para ${input.organizationName}. O convite expira em ${input.expiresAt.toLocaleString("pt-BR")}. Aceite em: ${input.invitationUrl}`,
        }),
      });
      if (!response.ok) throw new Error(`Provedor de e-mail respondeu ${response.status}.`);
      const payload = await response.json().catch(() => ({})) as { id?: string };
      return { status: "SENT", providerMessageId: payload.id };
    } catch (error) {
      return { status: "FAILED", error: safeDeliveryError(error) };
    }
  }
}

export async function sendHubInvitationEmail(input: InvitationEmail, environment = process.env, provider: InvitationEmailProvider = new ResendInvitationEmailProvider(environment)) {
  if (environment.NODE_ENV === "test") return { status: "NOT_CONFIGURED" } as const;
  return provider.send(input);
}
