import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashHubPassword } from "../src/lib/hub/auth";
import { generateHubInvitationToken, hashHubInvitationToken, hubInvitationExpiresAt } from "../src/lib/hub/invitation-token";
import { normalizeHubEmail } from "../src/lib/hub/member-management";
import { normalizeHubOrganizationSlug } from "../src/lib/hub/organization";

const prisma = new PrismaClient();
const args = new Map<string, string | true>();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (!key.startsWith("--")) continue;
  const value = process.argv[index + 1];
  if (value && !value.startsWith("--")) { args.set(key, value); index += 1; } else args.set(key, true);
}

function required(name: string) {
  const value = args.get(name);
  if (typeof value !== "string" || !value.trim()) throw new Error(`Argumento obrigatório: ${name}`);
  return value.trim();
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  const organizationName = required("--organization-name");
  const slug = normalizeHubOrganizationSlug(required("--organization-slug"));
  const adminEmail = normalizeHubEmail(required("--admin-email"));
  const adminName = required("--admin-name");
  const temporaryPassword = crypto.randomBytes(24).toString("base64url");
  const passwordHash = await hashHubPassword(temporaryPassword);
  const rawToken = generateHubInvitationToken();

  const result = await prisma.$transaction(async (tx) => {
    if (await tx.hubOrganization.count({ where: { slug } })) throw new Error("Já existe uma organização com esse slug.");
    const account = await tx.hubAccount.upsert({
      where: { normalizedEmail: adminEmail },
      create: { email: adminEmail, normalizedEmail: adminEmail, passwordHash, mustChangePassword: true },
      update: {},
    });
    const organization = await tx.hubOrganization.create({ data: { name: organizationName, hubName: organizationName, slug } });
    const member = await tx.hubMember.create({ data: { organizationId: organization.id, accountId: account.id, email: adminEmail, normalizedEmail: adminEmail, name: adminName, passwordHash: account.passwordHash, role: "SUPER_ADMIN", organizationPosition: "PRESIDENT", memberCategory: "MEMBER", status: "ACTIVE", mustChangePassword: true, isPrimary: true } });
    await tx.hubOrganization.update({ where: { id: organization.id }, data: { responsibleMemberId: member.id } });
    await tx.hubDirectorate.createMany({ data: ["Presidência", "Projetos", "Comercial", "Marketing", "Pessoas", "Financeiro"].map((name, order) => ({ organizationId: organization.id, name, slug: normalizeHubOrganizationSlug(name), order })) });
    await tx.hubFinancialCategory.createMany({ data: [{ name: "Receitas", normalizedName: "receitas", type: "INCOME" as const }, { name: "Despesas", normalizedName: "despesas", type: "EXPENSE" as const }].map((category) => ({ organizationId: organization.id, ...category })) });
    const invitation = await tx.hubMemberInvitation.create({ data: { organizationId: organization.id, normalizedEmail: adminEmail, tokenHash: hashHubInvitationToken(rawToken), organizationPosition: "PRESIDENT", memberCategory: "MEMBER", invitedById: member.id, existingInvitedMemberId: member.id, expiresAt: hubInvitationExpiresAt(), deliveryStatus: "NOT_CONFIGURED" } });
    await tx.hubAuditLog.create({ data: { organizationId: organization.id, memberId: member.id, action: "ORGANIZATION_BOOTSTRAPPED", entity: "ORGANIZATION", entityId: organization.id, metadata: { invitationId: invitation.id } } });
    return { organization, invitation };
  }, { isolationLevel: "Serializable" });

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  console.log(`Organização criada: ${result.organization.name} (${result.organization.slug})`);
  console.log(`Convite inicial (exibido uma única vez): ${appUrl}/convite/${rawToken}`);
  if (args.has("--show-local-password")) console.log(`Senha temporária local: ${temporaryPassword}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Falha no bootstrap."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
