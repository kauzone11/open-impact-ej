import type { HubRole, Prisma, PrismaClient } from "@prisma/client";
import { HubApiError } from "@/lib/hub/api";
import { writeHubAudit } from "@/lib/hub/audit";
import { hasHubPermission } from "@/lib/hub/permissions";
import { hubCoreTransaction } from "@/lib/hub/core-transaction";

export type HubCoreActor = {
  organizationId: string;
  memberId: string;
  role: HubRole;
  directorateId?: string | null;
};

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function canManage(actor: HubCoreActor, directorateId?: string) {
  return (
    hasHubPermission(actor.role, "directorates:manage") ||
    (actor.role === "DIRECTOR" && actor.directorateId === directorateId)
  );
}

function assertManage(actor: HubCoreActor, directorateId?: string) {
  if (!canManage(actor, directorateId))
    throw new HubApiError("Ação não permitida.", 403);
}

async function activeMemberIds(
  tx: Prisma.TransactionClient,
  actor: HubCoreActor,
  ids: string[],
) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const members = await tx.hubMember.findMany({
    where: {
      id: { in: unique },
      organizationId: actor.organizationId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (members.length !== unique.length)
    throw new HubApiError("Membro não encontrado.", 404);
  return unique;
}

export async function listDirectorates(
  client: PrismaClient,
  actor: HubCoreActor,
  includeArchived = false,
) {
  const items = await client.hubDirectorate.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    include: {
      director: { select: { id: true, name: true, avatarUrl: true } },
      _count: {
        select: {
          members: { where: { status: "ACTIVE" } },
          primaryProjects: {
            where: {
              archivedAt: null,
              status: {
                in: ["DRAFT", "PLANNED", "ACTIVE", "APPROVED", "ON_HOLD"],
              },
            },
          },
          tasks: { where: { archivedAt: null, completedAt: null } },
        },
      },
    },
    orderBy: [{ archivedAt: "asc" }, { order: "asc" }, { name: "asc" }],
  });
  const nextMeetings = await client.hubMeeting.findMany({
    where: {
      organizationId: actor.organizationId,
      status: "SCHEDULED",
      startAt: { gte: new Date() },
      directorates: {
        some: { directorateId: { in: items.map((item) => item.id) } },
      },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      directorates: { select: { directorateId: true } },
    },
    orderBy: { startAt: "asc" },
  });
  return items.map((item) => ({
    ...item,
    memberCount: item._count.members,
    activeProjects: item._count.primaryProjects,
    pendingTasks: item._count.tasks,
    nextMeeting:
      nextMeetings.find((meeting) =>
        meeting.directorates.some((link) => link.directorateId === item.id),
      ) || null,
    status: item.archivedAt ? "ARCHIVED" : "ACTIVE",
    capabilities: {
      canEdit: canManage(actor, item.id),
      canDelete: hasHubPermission(actor.role, "directorates:manage"),
    },
  }));
}

export async function getDirectorate(
  client: PrismaClient,
  actor: HubCoreActor,
  id: string,
) {
  const item = await client.hubDirectorate.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: {
      director: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        where: { status: { not: "DELETED" } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
        },
        orderBy: { name: "asc" },
      },
      primaryProjects: {
        where: { archivedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          deadline: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      tasks: {
        where: { archivedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueAt: true,
          completedAt: true,
        },
        orderBy: [{ completedAt: "asc" }, { dueAt: "asc" }],
      },
      meetingLinks: {
        where: { meeting: { status: { in: ["SCHEDULED", "DRAFT"] } } },
        select: {
          meeting: {
            select: { id: true, title: true, startAt: true, status: true },
          },
        },
        orderBy: { meeting: { startAt: "asc" } },
      },
    },
  });
  if (!item) throw new HubApiError("Diretoria não encontrada.", 404);
  const meetings = item.meetingLinks.map((link) => link.meeting);
  return {
    ...item,
    memberCount: item.members.filter((member) => member.status === "ACTIVE")
      .length,
    activeProjects: item.primaryProjects.filter((project) =>
      ["DRAFT", "PLANNED", "ACTIVE", "APPROVED", "ON_HOLD"].includes(
        project.status,
      ),
    ).length,
    pendingTasks: item.tasks.filter((task) => !task.completedAt).length,
    nextMeeting: meetings[0] || null,
    status: item.archivedAt ? "ARCHIVED" : "ACTIVE",
    meetings,
    capabilities: {
      canEdit: canManage(actor, id),
      canDelete: hasHubPermission(actor.role, "directorates:manage"),
    },
  };
}

export async function createDirectorate(
  client: PrismaClient,
  actor: HubCoreActor,
  input: {
    name: string;
    description?: string | null;
    icon?: string | null;
    directorId?: string | null;
    memberIds?: string[];
  },
) {
  assertManage(actor);
  const name = input.name.trim();
  const normalizedSlug = slug(name);
  if (name.length < 2 || !normalizedSlug)
    throw new HubApiError("Informe um nome válido.", 400);
  return hubCoreTransaction(client, async (tx) => {
    const ids = await activeMemberIds(tx, actor, [
      ...(input.memberIds || []),
      ...(input.directorId ? [input.directorId] : []),
    ]);
    const created = await tx.hubDirectorate.create({
      data: {
        organizationId: actor.organizationId,
        name,
        slug: normalizedSlug,
        description: input.description?.trim() || null,
        icon: input.icon?.trim() || null,
        directorId: input.directorId || null,
      },
    });
    if (ids.length)
      await tx.hubMember.updateMany({
        where: { id: { in: ids }, organizationId: actor.organizationId },
        data: { directorateId: created.id },
      });
    await writeHubAudit(tx, {
      organizationId: actor.organizationId,
      memberId: actor.memberId,
      action: "DIRECTORATE_CREATED",
      entity: "DIRECTORATE",
      entityId: created.id,
      metadata: { name, initialMembers: ids.length },
    });
    return getDirectorate(tx as unknown as PrismaClient, actor, created.id);
  });
}

export async function updateDirectorate(
  client: PrismaClient,
  actor: HubCoreActor,
  id: string,
  input: {
    version: number;
    name?: string;
    description?: string | null;
    icon?: string | null;
    directorId?: string | null;
    action?: "archive" | "restore";
  },
) {
  assertManage(actor, id);
  return hubCoreTransaction(client, async (tx) => {
    const current = await tx.hubDirectorate.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, version: true },
    });
    if (!current) throw new HubApiError("Diretoria não encontrada.", 404);
    if (input.directorId) await activeMemberIds(tx, actor, [input.directorId]);
    const name = input.name?.trim();
    const updated = await tx.hubDirectorate.updateMany({
      where: {
        id,
        organizationId: actor.organizationId,
        version: input.version,
      },
      data: {
        ...(name ? { name, slug: slug(name) } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.icon !== undefined
          ? { icon: input.icon?.trim() || null }
          : {}),
        ...(input.directorId !== undefined
          ? { directorId: input.directorId || null }
          : {}),
        ...(input.action === "archive"
          ? { isActive: false, archivedAt: new Date() }
          : {}),
        ...(input.action === "restore"
          ? { isActive: true, archivedAt: null }
          : {}),
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new HubApiError(
        "A diretoria foi alterada por outra pessoa. Atualize a página.",
        409,
      );
    if (input.directorId)
      await tx.hubMember.update({
        where: { id: input.directorId },
        data: { directorateId: id },
      });
    await writeHubAudit(tx, {
      organizationId: actor.organizationId,
      memberId: actor.memberId,
      action:
        input.action === "archive"
          ? "DIRECTORATE_ARCHIVED"
          : input.action === "restore"
            ? "DIRECTORATE_RESTORED"
            : "DIRECTORATE_UPDATED",
      entity: "DIRECTORATE",
      entityId: id,
    });
    return getDirectorate(tx as unknown as PrismaClient, actor, id);
  });
}

export async function moveDirectorateMember(
  client: PrismaClient,
  actor: HubCoreActor,
  id: string,
  memberId: string,
  targetDirectorateId: string | null,
) {
  assertManage(actor, id);
  return hubCoreTransaction(client, async (tx) => {
    const member = await tx.hubMember.findFirst({
      where: {
        id: memberId,
        organizationId: actor.organizationId,
        status: { not: "DELETED" },
      },
      select: { id: true, directorateId: true, directedDirectorates: { select: { id: true } } },
    });
    if (!member) throw new HubApiError("Membro não encontrado.", 404);
    if (
      member.directorateId !== id &&
      !hasHubPermission(actor.role, "directorates:manage")
    )
      throw new HubApiError("Ação não permitida.", 403);
    if (
      targetDirectorateId &&
      !(await tx.hubDirectorate.count({
        where: {
          id: targetDirectorateId,
          organizationId: actor.organizationId,
          archivedAt: null,
        },
      }))
    )
      throw new HubApiError("Diretoria de destino não encontrada.", 404);
    if (member.directedDirectorates.some((directorate) => directorate.id !== targetDirectorateId)) {
      throw new HubApiError("Remova explicitamente a liderança antes de mover este membro.", 409);
    }
    await tx.hubMember.update({
      where: { id: memberId },
      data: { directorateId: targetDirectorateId },
    });
    await tx.hubDirectorate.updateMany({
      where: {
        id: { in: [id, ...(targetDirectorateId ? [targetDirectorateId] : [])] },
        organizationId: actor.organizationId,
      },
      data: { version: { increment: 1 } },
    });
    await writeHubAudit(tx, {
      organizationId: actor.organizationId,
      memberId: actor.memberId,
      action: "DIRECTORATE_MEMBER_TRANSFERRED",
      entity: "MEMBER",
      entityId: memberId,
      metadata: { from: id, to: targetDirectorateId || "none" },
    });
  });
}

export async function deleteDirectorate(
  client: PrismaClient,
  actor: HubCoreActor,
  id: string,
  version: number,
) {
  if (!hasHubPermission(actor.role, "directorates:manage"))
    throw new HubApiError("Ação não permitida.", 403);
  return hubCoreTransaction(client, async (tx) => {
    const item = await tx.hubDirectorate.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: {
        version: true,
        _count: {
          select: {
            members: true,
            primaryProjects: true,
            projectLinks: true,
            tasks: true,
            meetings: true,
            meetingLinks: true,
            boards: true,
            financialEntries: true,
          },
        },
      },
    });
    if (!item) throw new HubApiError("Diretoria não encontrada.", 404);
    if (item.version !== version)
      throw new HubApiError(
        "A diretoria foi alterada por outra pessoa. Atualize a página.",
        409,
      );
    if (Object.values(item._count).some(Boolean))
      throw new HubApiError(
        "A diretoria possui histórico relacionado e só pode ser arquivada.",
        409,
      );
    await tx.hubDirectorate.delete({ where: { id } });
    await writeHubAudit(tx, {
      organizationId: actor.organizationId,
      memberId: actor.memberId,
      action: "DIRECTORATE_DELETED",
      entity: "DIRECTORATE",
      entityId: id,
    });
  });
}
