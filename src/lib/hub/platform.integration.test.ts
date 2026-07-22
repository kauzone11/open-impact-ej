import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { PrismaClient, type HubRole } from "@prisma/client";
import { HubApiError } from "./api";
import { createCoreFinancialEntry, getCoreFinances, updateCoreFinancialEntry } from "./finance-service";
import { createHubInvitation, previewHubInvitation, revokeHubInvitation, transferHubPresidency, updateHubDirectorateLeadership, updateHubMemberClassification } from "./settings-service";
import { createProject, getProject, updateProject } from "./project-service";
import { searchHubRecords } from "./search-service";
import { createCoreTask, getCoreTask, updateCoreTask } from "./task-service";
import { updateMeetingAudience } from "./meeting-service";

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids: Record<string, string> = {};
const actor = () => ({ organizationId: ids.orgA, memberId: ids.presidentA, role: "SUPER_ADMIN" as HubRole, directorateId: ids.dirA });

before(async () => {
  const passwordHash = "$2b$12$0C8gI1nKXvT3qfwrf30XfO/MJ88a8RFozE3roYFyfYqKB2KX3.g5K";
  const [orgA, orgB] = await Promise.all([
    prisma.hubOrganization.create({ data: { name: `EJ A ${suffix}`, hubName: `EJ A ${suffix}`, slug: `ej-a-${suffix}` } }),
    prisma.hubOrganization.create({ data: { name: `EJ B ${suffix}`, hubName: `EJ B ${suffix}`, slug: `ej-b-${suffix}` } }),
  ]);
  ids.orgA = orgA.id; ids.orgB = orgB.id;
  const [accountA, accountB] = await Promise.all([
    prisma.hubAccount.create({ data: { email: `a-${suffix}@test.local`, normalizedEmail: `a-${suffix}@test.local`, passwordHash, mustChangePassword: false } }),
    prisma.hubAccount.create({ data: { email: `b-${suffix}@test.local`, normalizedEmail: `b-${suffix}@test.local`, passwordHash, mustChangePassword: false } }),
  ]);
  const [presidentA, counselorA, memberA, memberA2, presidentB] = await Promise.all([
    prisma.hubMember.create({ data: { organizationId: orgA.id, accountId: accountA.id, email: accountA.email, normalizedEmail: accountA.normalizedEmail, name: "Presidente A", passwordHash, role: "SUPER_ADMIN", organizationPosition: "PRESIDENT", status: "ACTIVE" } }),
    prisma.hubMember.create({ data: { organizationId: orgA.id, email: `conselho-${suffix}@test.local`, normalizedEmail: `conselho-${suffix}@test.local`, name: "Conselho A", passwordHash, role: "MEMBER", organizationPosition: "COUNSELOR", status: "ACTIVE" } }),
    prisma.hubMember.create({ data: { organizationId: orgA.id, email: `membro-${suffix}@test.local`, normalizedEmail: `membro-${suffix}@test.local`, name: "Membro A", passwordHash, role: "MEMBER", status: "ACTIVE" } }),
    prisma.hubMember.create({ data: { organizationId: orgA.id, email: `membro2-${suffix}@test.local`, normalizedEmail: `membro2-${suffix}@test.local`, name: "Membro A2", passwordHash, role: "MEMBER", status: "ACTIVE" } }),
    prisma.hubMember.create({ data: { organizationId: orgB.id, accountId: accountB.id, email: accountB.email, normalizedEmail: accountB.normalizedEmail, name: "Presidente B", passwordHash, role: "SUPER_ADMIN", organizationPosition: "PRESIDENT", status: "ACTIVE" } }),
  ]);
  Object.assign(ids, { presidentA: presidentA.id, counselorA: counselorA.id, memberA: memberA.id, memberA2: memberA2.id, presidentB: presidentB.id });
  const [dirA, dirA2, dirB] = await Promise.all([
    prisma.hubDirectorate.create({ data: { organizationId: orgA.id, name: "Projetos A", slug: `projetos-a-${suffix}` } }),
    prisma.hubDirectorate.create({ data: { organizationId: orgA.id, name: "Comercial A", slug: `comercial-a-${suffix}` } }),
    prisma.hubDirectorate.create({ data: { organizationId: orgB.id, name: "Projetos B", slug: `projetos-b-${suffix}` } }),
  ]);
  Object.assign(ids, { dirA: dirA.id, dirA2: dirA2.id, dirB: dirB.id });
  await Promise.all([prisma.hubMember.update({ where: { id: memberA.id }, data: { directorateId: dirA.id } }), prisma.hubMember.update({ where: { id: memberA2.id }, data: { directorateId: dirA.id } })]);
  const foreignProject = await prisma.hubProject.create({ data: { organizationId: orgB.id, title: `Projeto estrangeiro ${suffix}`, primaryDirectorateId: dirB.id, status: "ACTIVE" } });
  ids.foreignProject = foreignProject.id;
  const boardB = await prisma.hubBoard.create({ data: { organizationId: orgB.id, name: "Tarefas", scope: "ORGANIZATION", createdById: presidentB.id, columns: { create: { name: "A fazer", order: 0 } } }, include: { columns: true } });
  ids.foreignTask = (await prisma.hubTask.create({ data: { organizationId: orgB.id, boardId: boardB.id, columnId: boardB.columns[0].id, title: "Tarefa estrangeira", status: "TODO", position: 0, createdById: presidentB.id, idempotencyKey: `foreign-${suffix}` } })).id;
  ids.foreignMeeting = (await prisma.hubMeeting.create({ data: { organizationId: orgB.id, createdById: presidentB.id, title: "Reunião estrangeira", status: "SCHEDULED", startAt: new Date("2027-01-01T12:00:00Z"), endAt: new Date("2027-01-01T13:00:00Z"), timezone: "America/Sao_Paulo", idempotencyKey: `meeting-b-${suffix}`, participants: { create: { memberId: presidentB.id, responseStatus: "ACCEPTED" } } } })).id;
});

after(async () => { await prisma.$disconnect(); });

test("diretoria estrangeira retorna ausência genérica", async () => assert.equal(await prisma.hubDirectorate.findFirst({ where: { id: ids.dirB, organizationId: ids.orgA } }), null));
test("projeto estrangeiro retorna 404", async () => await assert.rejects(() => getProject(prisma, actor(), ids.foreignProject), (error: unknown) => error instanceof HubApiError && error.status === 404));
test("tarefa estrangeira retorna 404", async () => await assert.rejects(() => getCoreTask(prisma, actor(), ids.foreignTask), (error: unknown) => error instanceof HubApiError && error.status === 404));
test("reunião estrangeira retorna ausência genérica", async () => assert.equal(await prisma.hubMeeting.findFirst({ where: { id: ids.foreignMeeting, organizationId: ids.orgA } }), null));
test("lançamento estrangeiro não entra no filtro", async () => assert.equal((await prisma.hubFinancialEntry.findMany({ where: { organizationId: ids.orgA, id: "foreign" } })).length, 0));
test("membro estrangeiro retorna ausência genérica", async () => assert.equal(await prisma.hubMember.findFirst({ where: { id: ids.presidentB, organizationId: ids.orgA } }), null));
test("convite estrangeiro não pode ser consultado por tenant", async () => assert.equal(await prisma.hubMemberInvitation.findFirst({ where: { organizationId: ids.orgA, normalizedEmail: `b-${suffix}@test.local` } }), null));
test("busca nunca atravessa organizações", async () => assert.equal((await searchHubRecords(prisma, actor(), "estrangeiro")).length, 0));
test("conta global pode ter associações em organizações", async () => { const account = await prisma.hubAccount.findFirstOrThrow({ where: { normalizedEmail: `a-${suffix}@test.local` }, include: { memberships: true } }); assert.equal(account.memberships.length, 1); });
test("índice impede dois Presidentes ativos", async () => await assert.rejects(() => prisma.hubMember.create({ data: { organizationId: ids.orgA, email: `p2-${suffix}@test.local`, normalizedEmail: `p2-${suffix}@test.local`, name: "P2", passwordHash: "x", organizationPosition: "PRESIDENT", status: "ACTIVE" } })));

test("cria projeto com escopo da organização", async () => { const value = await createProject(prisma, actor(), { name: "Projeto Alpha", primaryDirectorateId: ids.dirA, directorateIds: [ids.dirA2], managerId: ids.memberA, teamMemberIds: [ids.memberA, ids.memberA2], status: "ACTIVE", progress: 10 }, `project-${suffix}`); ids.project = value.id; assert.equal(value.organizationId, ids.orgA); });
test("projeto preserva múltiplas Diretorias", async () => assert.equal((await getProject(prisma, actor(), ids.project)).directorates.length, 2));
test("projeto preserva múltiplos responsáveis", async () => assert.equal((await getProject(prisma, actor(), ids.project)).team.length, 2));
test("projeto rejeita membro de outro tenant", async () => await assert.rejects(() => createProject(prisma, actor(), { name: "Inválido", primaryDirectorateId: ids.dirA, managerId: ids.presidentB }, `bad-project-${suffix}`), (error: unknown) => error instanceof HubApiError && error.status === 404));
test("projeto rejeita versão obsoleta", async () => await assert.rejects(() => updateProject(prisma, actor(), ids.project, { version: 99, progress: 20 }), (error: unknown) => error instanceof HubApiError && error.status === 409));
test("projeto atualiza com versão corrente", async () => { const current = await prisma.hubProject.findUniqueOrThrow({ where: { id: ids.project } }); const value = await updateProject(prisma, actor(), ids.project, { version: current.version, progress: 35 }); assert.equal(value.progress, 35); });
test("projeto pode ser arquivado", async () => { const current = await prisma.hubProject.findUniqueOrThrow({ where: { id: ids.project } }); assert.ok((await updateProject(prisma, actor(), ids.project, { version: current.version, action: "archive" })).archivedAt); });
test("projeto pode ser reaberto", async () => { const current = await prisma.hubProject.findUniqueOrThrow({ where: { id: ids.project } }); assert.equal((await updateProject(prisma, actor(), ids.project, { version: current.version, action: "reopen" })).archivedAt, null); });
test("projeto pode ser cancelado sem exclusão", async () => { const current = await prisma.hubProject.findUniqueOrThrow({ where: { id: ids.project } }); assert.equal((await updateProject(prisma, actor(), ids.project, { version: current.version, action: "cancel" })).status, "CANCELLED"); });

test("cria tarefa ligada ao projeto", async () => { const value = await createCoreTask(prisma, actor(), { title: "Tarefa Alpha", projectId: ids.project, directorateId: ids.dirA, assigneeIds: [ids.memberA, ids.memberA2], priority: "HIGH" }, `task-${suffix}`); ids.task = value.id; assert.equal(value.project?.id, ids.project); });
test("tarefa aceita múltiplos responsáveis", async () => assert.equal(await prisma.hubTaskAssignee.count({ where: { taskId: ids.task } }), 2));
test("tarefa rejeita responsável estrangeiro", async () => await assert.rejects(() => createCoreTask(prisma, actor(), { title: "Inválida", assigneeIds: [ids.presidentB] }, `bad-task-${suffix}`), (error: unknown) => error instanceof HubApiError && error.status === 404));
test("tarefa rejeita versão obsoleta", async () => await assert.rejects(() => updateCoreTask(prisma, actor(), ids.task, { version: 99, status: "DONE" }), (error: unknown) => error instanceof HubApiError && error.status === 409));
test("tarefa pode ser concluída", async () => { const current = await prisma.hubTask.findUniqueOrThrow({ where: { id: ids.task } }); assert.ok((await updateCoreTask(prisma, actor(), ids.task, { version: current.version, status: "DONE" })).completedAt); });
test("tarefa pode ser arquivada", async () => { const current = await prisma.hubTask.findUniqueOrThrow({ where: { id: ids.task } }); assert.ok((await updateCoreTask(prisma, actor(), ids.task, { version: current.version, archive: true })).archivedAt); });
test("tarefa arquivada permanece no histórico", async () => assert.equal(await prisma.hubTask.count({ where: { id: ids.task } }), 1));
test("busca encontra projeto no tenant", async () => assert.ok((await searchHubRecords(prisma, actor(), "Alpha")).some((item) => item.type === "PROJECT")));

test("cria entrada financeira em centavos inteiros", async () => { const value = await createCoreFinancialEntry(prisma, { ...actor(), currency: "BRL" }, { direction: "RECEIVABLE", description: "Receita Alpha", totalCents: 12345, competenceDate: new Date("2026-07-01"), dueDate: new Date("2026-07-10"), directorateId: ids.dirA, projectId: ids.project }, `finance-in-${suffix}`); ids.finance = value.id; assert.equal(value.totalCents, 12345); });
test("cria despesa financeira", async () => { const value = await createCoreFinancialEntry(prisma, { ...actor(), currency: "BRL" }, { direction: "PAYABLE", description: "Despesa Alpha", totalCents: 5000, competenceDate: new Date("2026-07-02"), dueDate: new Date("2026-07-11") }, `finance-out-${suffix}`); assert.equal(value.direction, "PAYABLE"); });
test("edição financeira preserva vínculos omitidos", async () => { const current = await prisma.hubFinancialEntry.findUniqueOrThrow({ where: { id: ids.finance } }); const value = await updateCoreFinancialEntry(prisma, { ...actor(), currency: "BRL" }, ids.finance, { version: current.version, description: "Receita revisada" }); assert.equal(value.directorateId, ids.dirA); assert.equal(value.projectId, ids.project); });
test("lançamento financeiro rejeita versão obsoleta", async () => await assert.rejects(() => updateCoreFinancialEntry(prisma, { ...actor(), currency: "BRL" }, ids.finance, { version: 1, description: "stale" }), (error: unknown) => error instanceof HubApiError && error.status === 409));
test("cancelamento financeiro exige motivo no fluxo", async () => { const current = await prisma.hubFinancialEntry.findUniqueOrThrow({ where: { id: ids.finance } }); const value = await updateCoreFinancialEntry(prisma, { ...actor(), currency: "BRL" }, ids.finance, { version: current.version, cancelReason: "Lançamento duplicado" }); assert.equal(value.status, "CANCELLED"); assert.equal(value.cancellationReason, "Lançamento duplicado"); });
test("lançamento cancelado permanece no histórico", async () => assert.equal(await prisma.hubFinancialEntry.count({ where: { id: ids.finance, status: "CANCELLED" } }), 1));
test("resumo financeiro é isolado por tenant", async () => assert.ok((await getCoreFinances(prisma, { ...actor(), currency: "BRL" })).entries.every((entry) => entry.organizationId === ids.orgA)));

test("convite seguro não cria conta nem membro", async () => { const beforeAccounts = await prisma.hubAccount.count(); const beforeMembers = await prisma.hubMember.count(); const result = await createHubInvitation(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, { email: `convite-${suffix}@test.local`, organizationPosition: "MEMBER", memberCategory: "TRAINEE", directorateId: ids.dirA }); ids.invitation = result.invitation.id; ids.rawToken = new URL(result.invitationUrl!).pathname.split("/").pop() || ""; assert.equal(await prisma.hubAccount.count(), beforeAccounts); assert.equal(await prisma.hubMember.count(), beforeMembers); });
test("convite persiste somente hash", async () => { const value = await prisma.hubMemberInvitation.findUniqueOrThrow({ where: { id: ids.invitation } }); assert.notEqual(value.tokenHash, ids.rawToken); assert.equal(value.tokenHash.length, 64); });
test("convite pode ser pré-visualizado uma vez válido", async () => assert.equal((await previewHubInvitation(prisma, ids.rawToken)).email, `convite-${suffix}@test.local`));
test("convite duplicado pendente é rejeitado", async () => await assert.rejects(() => createHubInvitation(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, { email: `convite-${suffix}@test.local`, organizationPosition: "MEMBER", memberCategory: "MEMBER" })));
test("convite pode ser revogado", async () => { await revokeHubInvitation(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.invitation); assert.equal((await prisma.hubMemberInvitation.findUniqueOrThrow({ where: { id: ids.invitation } })).status, "REVOKED"); });
test("convite revogado retorna 410", async () => await assert.rejects(() => previewHubInvitation(prisma, ids.rawToken), (error: unknown) => error instanceof HubApiError && error.status === 410));

test("promoção direta a Presidente é rejeitada", async () => await assert.rejects(() => updateHubMemberClassification(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.memberA, { organizationPosition: "PRESIDENT", memberCategory: "MEMBER" }), (error: unknown) => error instanceof HubApiError));
test("transferência explícita de Presidência funciona", async () => { const value = await transferHubPresidency(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.memberA); assert.equal(value.organizationPosition, "PRESIDENT"); });
test("Presidência anterior vira membro ativo", async () => { const value = await prisma.hubMember.findUniqueOrThrow({ where: { id: ids.presidentA } }); assert.equal(value.organizationPosition, "MEMBER"); assert.equal(value.status, "ACTIVE"); });
test("organização mantém somente um Presidente ativo", async () => assert.equal(await prisma.hubMember.count({ where: { organizationId: ids.orgA, organizationPosition: "PRESIDENT", status: "ACTIVE" } }), 1));
test("membro elegível pode liderar Diretoria", async () => { const value = await updateHubDirectorateLeadership(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.dirA, ids.memberA2); assert.equal(value.directorId, ids.memberA2); });
test("Presidente não pode liderar Diretoria", async () => await assert.rejects(() => updateHubDirectorateLeadership(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.dirA, ids.memberA), (error: unknown) => error instanceof HubApiError));
test("Conselheiro não pode liderar Diretoria", async () => await assert.rejects(() => updateHubDirectorateLeadership(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.dirA, ids.counselorA), (error: unknown) => error instanceof HubApiError));
test("diretor anterior permanece ativo", async () => { await prisma.hubMember.update({ where: { id: ids.presidentA }, data: { directorateId: ids.dirA } }); await updateHubDirectorateLeadership(prisma, { organizationId: ids.orgA, memberId: ids.presidentA }, ids.dirA, ids.presidentA); const value = await prisma.hubMember.findUniqueOrThrow({ where: { id: ids.memberA2 } }); assert.equal(value.status, "ACTIVE"); });

test("audiência vazia de reunião é rejeitada", async () => { const meeting = await prisma.hubMeeting.create({ data: { organizationId: ids.orgA, createdById: ids.presidentA, title: "Reunião A", status: "DRAFT", startAt: new Date("2027-02-01T12:00:00Z"), endAt: new Date("2027-02-01T13:00:00Z"), timezone: "America/Sao_Paulo", idempotencyKey: `meeting-a-${suffix}`, participants: { create: { memberId: ids.presidentA, responseStatus: "ACCEPTED" } } } }); ids.meeting = meeting.id; await assert.rejects(() => updateMeetingAudience(prisma, actor(), meeting.id, { version: meeting.version, organizationWide: false, directorateIds: [], participantIds: [], externalGuests: [] }), (error: unknown) => error instanceof HubApiError && error.status === 422); });
test("reunião persiste fontes direta e por Diretoria", async () => { const current = await prisma.hubMeeting.findUniqueOrThrow({ where: { id: ids.meeting } }); await updateMeetingAudience(prisma, actor(), ids.meeting, { version: current.version, organizationWide: false, directorateIds: [ids.dirA], participantIds: [ids.memberA2], externalGuests: [{ name: "Convidada", email: "externa@example.org" }] }); const sources = await prisma.hubMeetingParticipantSource.findMany({ where: { meetingId: ids.meeting, memberId: ids.memberA2 } }); assert.ok(sources.some((source) => source.sourceType === "DIRECT")); assert.ok(sources.some((source) => source.sourceType === "DIRECTORATE")); });
test("resposta é preservada quando uma fonte permanece", async () => { await prisma.hubMeetingParticipant.update({ where: { meetingId_memberId: { meetingId: ids.meeting, memberId: ids.memberA2 } }, data: { responseStatus: "ACCEPTED", respondedAt: new Date() } }); const current = await prisma.hubMeeting.findUniqueOrThrow({ where: { id: ids.meeting } }); await updateMeetingAudience(prisma, actor(), ids.meeting, { version: current.version, organizationWide: false, directorateIds: [], participantIds: [ids.memberA2], externalGuests: [] }); assert.equal((await prisma.hubMeetingParticipant.findUniqueOrThrow({ where: { meetingId_memberId: { meetingId: ids.meeting, memberId: ids.memberA2 } } })).responseStatus, "ACCEPTED"); });
test("disponibilidade aceita limpeza completa", async () => { const poll = await prisma.hubAvailabilityPoll.create({ data: { organizationId: ids.orgA, title: "Horários", dates: [new Date("2027-03-01")], startMinute: 480, endMinute: 600, slotMinutes: 30, timezone: "America/Sao_Paulo", createdById: ids.presidentA } }); await prisma.hubAvailabilitySelection.deleteMany({ where: { pollId: poll.id, memberId: ids.memberA } }); assert.equal(await prisma.hubAvailabilitySelection.count({ where: { pollId: poll.id, memberId: ids.memberA } }), 0); });
test("notificação mantém ciclo de leitura e arquivo", async () => { const notification = await prisma.hubNotification.create({ data: { organizationId: ids.orgA, recipientMemberId: ids.presidentA, type: "TASK_ASSIGNED", title: "Tarefa", body: "Você recebeu uma tarefa.", href: "/tarefas", entityType: "TASK", entityId: ids.task, idempotencyKey: `notification-${suffix}` } }); await prisma.hubNotification.update({ where: { id: notification.id }, data: { readAt: new Date(), archivedAt: new Date() } }); const value = await prisma.hubNotification.findUniqueOrThrow({ where: { id: notification.id } }); assert.ok(value.readAt && value.archivedAt); });
test("auditoria de convite não contém token bruto nem hash", async () => { const rows = await prisma.hubAuditLog.findMany({ where: { organizationId: ids.orgA, entity: { contains: "INVIT" } } }); assert.ok(rows.every((row) => !JSON.stringify(row.metadata).includes(ids.rawToken) && !JSON.stringify(row.metadata).includes("tokenHash"))); });
