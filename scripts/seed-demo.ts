import { PrismaClient } from "@prisma/client";
import { hashHubPassword } from "../src/lib/hub/auth";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("O seed demonstrativo não pode rodar em produção.");
  const passwordHash = await hashHubPassword("OpenImpactDemo2026!");
  await prisma.$transaction(async (tx) => {
    const account = await tx.hubAccount.upsert({ where: { normalizedEmail: "demo@openimpact.local" }, create: { email: "demo@openimpact.local", normalizedEmail: "demo@openimpact.local", passwordHash, mustChangePassword: false }, update: { passwordHash, mustChangePassword: false, lastOrganizationId: null } });
    const organization = await tx.hubOrganization.upsert({ where: { slug: "ej-demonstracao" }, create: { name: "EJ Demonstração", hubName: "EJ Demonstração", slug: "ej-demonstracao" }, update: {} });
    await tx.hubFinancialCategory.upsert({ where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: "receitas" } }, create: { organizationId: organization.id, name: "Receitas", normalizedName: "receitas", type: "INCOME" }, update: { isActive: true } });
    await tx.hubFinancialCategory.upsert({ where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: "despesas" } }, create: { organizationId: organization.id, name: "Despesas", normalizedName: "despesas", type: "EXPENSE" }, update: { isActive: true } });
    let member = await tx.hubMember.findFirst({ where: { organizationId: organization.id, normalizedEmail: account.normalizedEmail } });
    if (!member) member = await tx.hubMember.create({ data: { organizationId: organization.id, accountId: account.id, name: "Presidência Demo", email: account.email, normalizedEmail: account.normalizedEmail, passwordHash, mustChangePassword: false, role: "SUPER_ADMIN", organizationPosition: "PRESIDENT", status: "ACTIVE", isPrimary: false } });
    const directorate = await tx.hubDirectorate.upsert({ where: { organizationId_slug: { organizationId: organization.id, slug: "projetos" } }, create: { organizationId: organization.id, name: "Projetos", slug: "projetos", directorId: null }, update: {} });
    await tx.hubMember.updateMany({ where: { organizationId: organization.id, id: { not: member.id }, organizationPosition: "PRESIDENT" }, data: { organizationPosition: "MEMBER" } });
    await tx.hubMember.update({ where: { id: member.id }, data: { directorateId: directorate.id, isPrimary: false, organizationPosition: "PRESIDENT" } });
    const marketing = await tx.hubDirectorate.upsert({ where: { organizationId_slug: { organizationId: organization.id, slug: "marketing" } }, create: { organizationId: organization.id, name: "Marketing", slug: "marketing", directorId: null }, update: {} });
    const memberAccount = await tx.hubAccount.upsert({ where: { normalizedEmail: "membro@openimpact.local" }, create: { email: "membro@openimpact.local", normalizedEmail: "membro@openimpact.local", passwordHash, mustChangePassword: false }, update: { passwordHash, mustChangePassword: false } });
    const existingMember = await tx.hubMember.findFirst({ where: { organizationId: organization.id, normalizedEmail: memberAccount.normalizedEmail } });
    if (!existingMember) {
      await tx.hubMember.create({ data: { organizationId: organization.id, accountId: memberAccount.id, directorateId: marketing.id, name: "Membro Demo", email: memberAccount.email, normalizedEmail: memberAccount.normalizedEmail, passwordHash, mustChangePassword: false, role: "MEMBER", organizationPosition: "MEMBER", status: "ACTIVE" } });
    } else {
      await tx.hubMember.update({ where: { id: existingMember.id }, data: { accountId: memberAccount.id, directorateId: marketing.id, role: "MEMBER", status: "ACTIVE", organizationPosition: "MEMBER", passwordHash, mustChangePassword: false } });
    }
    const sandbox = await tx.hubOrganization.upsert({ where: { slug: "ej-sandbox" }, create: { name: "EJ Sandbox", hubName: "EJ Sandbox", slug: "ej-sandbox" }, update: {} });
    const sandboxMembership = await tx.hubMember.findFirst({ where: { organizationId: sandbox.id, normalizedEmail: account.normalizedEmail } });
    if (!sandboxMembership) await tx.hubMember.create({ data: { organizationId: sandbox.id, accountId: account.id, name: "Presidência Demo", email: account.email, normalizedEmail: account.normalizedEmail, passwordHash, mustChangePassword: false, role: "VIEWER", organizationPosition: "MEMBER", status: "ACTIVE" } });
  }, { isolationLevel: "Serializable" });
  console.log("Seed demonstrativo criado. E-mail: demo@openimpact.local");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Falha no seed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
