import type { HubBoardScope, HubRole } from "@prisma/client";
import { hasHubPermission } from "@/lib/hub/permissions";

export type HubActor = {
  memberId: string;
  organizationId: string;
  role: HubRole;
  directorateId?: string | null;
};
type MeetingObject = {
  organizationId: string;
  directorateId: string | null;
  createdById: string;
  participants?: Array<{ memberId: string }>;
};
type BoardObject = {
  organizationId: string;
  directorateId: string | null;
  scope: HubBoardScope;
  createdById: string;
  isArchived?: boolean;
};
type TaskObject = {
  organizationId: string;
  createdById: string;
  archivedAt?: Date | null;
  board: BoardObject;
  assignees?: Array<{ memberId: string }>;
};

export class HubObjectNotFoundError extends Error {
  readonly status = 404 as const;
  constructor() {
    super("Recurso nao encontrado.");
  }
}
export class HubObjectForbiddenError extends Error {
  readonly status = 403 as const;
  constructor() {
    super("Acao nao permitida.");
  }
}

function sameOrganization(actor: HubActor, object: { organizationId: string }) {
  return actor.organizationId === object.organizationId;
}
export function canAdministerDirectorate(
  actor: HubActor,
  directorateId: string | null,
) {
  return (
    canAdministerMeetingsForOrganization(actor) ||
    canManageDirectorateMeeting(actor, directorateId)
  );
}
export function canAdministerMeetingsForOrganization(actor: HubActor) {
  return hasHubPermission(actor.role, "meetings:manage-all");
}
export function canAdministerBoardsForOrganization(actor: HubActor) {
  return hasHubPermission(actor.role, "boards:manage-all");
}
export function canManageDirectorateMeeting(
  actor: HubActor,
  directorateId: string | null,
) {
  return (
    actor.role === "DIRECTOR" &&
    Boolean(directorateId) &&
    actor.directorateId === directorateId
  );
}
export function canManageDirectorateBoard(
  actor: HubActor,
  directorateId: string | null,
) {
  return (
    actor.role === "DIRECTOR" &&
    Boolean(directorateId) &&
    actor.directorateId === directorateId
  );
}
export function canCreateBoardInScope(
  actor: HubActor,
  scope: HubBoardScope,
  directorateId: string | null,
) {
  if (!hasHubPermission(actor.role, "boards:create")) return false;
  if (canAdministerBoardsForOrganization(actor)) return true;
  return (
    actor.role === "DIRECTOR" &&
    scope === "DIRECTORATE" &&
    Boolean(directorateId) &&
    actor.directorateId === directorateId
  );
}
export function canAccessMeeting(actor: HubActor, meeting: MeetingObject) {
  if (
    !sameOrganization(actor, meeting) ||
    !hasHubPermission(actor.role, "collaboration:access")
  )
    return false;
  return (
    !meeting.directorateId ||
    meeting.createdById === actor.memberId ||
    meeting.participants?.some((item) => item.memberId === actor.memberId) ||
    actor.directorateId === meeting.directorateId ||
    canAdministerMeetingsForOrganization(actor) ||
    canManageDirectorateMeeting(actor, meeting.directorateId)
  );
}
export function canManageMeeting(actor: HubActor, meeting: MeetingObject) {
  return (
    sameOrganization(actor, meeting) &&
    actor.role !== "VIEWER" &&
    (meeting.createdById === actor.memberId ||
      canAdministerMeetingsForOrganization(actor) ||
      canManageDirectorateMeeting(actor, meeting.directorateId))
  );
}
export function canAccessBoard(actor: HubActor, board: BoardObject) {
  return (
    sameOrganization(actor, board) &&
    hasHubPermission(actor.role, "collaboration:access") &&
    (board.scope === "ORGANIZATION" ||
      actor.directorateId === board.directorateId ||
      canAdministerBoardsForOrganization(actor) ||
      canManageDirectorateBoard(actor, board.directorateId))
  );
}
export function canManageBoard(actor: HubActor, board: BoardObject) {
  return (
    canAccessBoard(actor, board) &&
    actor.role !== "VIEWER" &&
    !board.isArchived &&
    (board.createdById === actor.memberId ||
      canAdministerBoardsForOrganization(actor) ||
      canManageDirectorateBoard(actor, board.directorateId))
  );
}
export function canViewTask(actor: HubActor, task: TaskObject) {
  return sameOrganization(actor, task) && canAccessBoard(actor, task.board);
}
export function canEditTask(actor: HubActor, task: TaskObject) {
  return (
    actor.role !== "VIEWER" &&
    canViewTask(actor, task) &&
    !task.board.isArchived &&
    !task.archivedAt &&
    (task.createdById === actor.memberId ||
      task.assignees?.some((item) => item.memberId === actor.memberId) ||
      hasHubPermission(actor.role, "tasks:manage-all") ||
      (actor.role === "DIRECTOR" &&
        actor.directorateId === task.board.directorateId))
  );
}
export function canAssignTask(actor: HubActor, task: TaskObject) {
  return (
    canEditTask(actor, task) &&
    (hasHubPermission(actor.role, "tasks:manage-all") ||
      canManageBoard(actor, task.board))
  );
}
export function canArchiveTask(actor: HubActor, task: TaskObject) {
  return (
    canEditTask(actor, task) &&
    (task.createdById === actor.memberId || canManageBoard(actor, task.board))
  );
}
export function canMoveTask(actor: HubActor, task: TaskObject) {
  return canEditTask(actor, task);
}
export function canCommentTask(actor: HubActor, task: TaskObject) {
  return (
    actor.role !== "VIEWER" &&
    canViewTask(actor, task) &&
    !task.board.isArchived &&
    !task.archivedAt
  );
}
export function taskCapabilities(actor: HubActor, task: TaskObject) {
  return {
    canEdit: canEditTask(actor, task),
    canAssign: canAssignTask(actor, task),
    canArchive: canArchiveTask(actor, task),
    canMove: canMoveTask(actor, task),
    canComment: canCommentTask(actor, task),
  };
}
export function boardCapabilities(actor: HubActor, board: BoardObject) {
  const canManageColumns = canManageBoard(actor, board);
  return {
    canEdit: canManageColumns,
    canArchive: canManageColumns,
    canCreateTask: actor.role !== "VIEWER" && canAccessBoard(actor, board) && !board.isArchived,
    canManageColumns,
  };
}
export function meetingCapabilities(
  actor: HubActor,
  meeting: MeetingObject & { status?: string },
) {
  const canManage = canManageMeeting(actor, meeting);
  const terminal = meeting.status === "COMPLETED" || meeting.status === "CANCELLED";
  const participant = meeting.participants?.some(
    (item) => item.memberId === actor.memberId,
  );
  return {
    canEdit: canManage && !terminal,
    canSchedule: canManage && meeting.status === "DRAFT",
    canCancel: canManage && !terminal,
    canComplete: canManage && meeting.status === "SCHEDULED",
    canRespond:
      actor.role !== "VIEWER" && participant && meeting.status === "SCHEDULED",
    canManageAgenda: canManage && meeting.status === "SCHEDULED",
    canRecordAttendance: canManage && meeting.status === "SCHEDULED",
    canRecordDecision: canManage && meeting.status === "SCHEDULED",
    canCorrectMinutes: canManage && meeting.status === "COMPLETED",
  };
}
export function assertMeetingAccess(actor: HubActor, meeting: MeetingObject) {
  if (!canAccessMeeting(actor, meeting)) throw new HubObjectNotFoundError();
}
export function assertMeetingManagement(
  actor: HubActor,
  meeting: MeetingObject,
) {
  if (!sameOrganization(actor, meeting)) throw new HubObjectNotFoundError();
  if (!canManageMeeting(actor, meeting)) throw new HubObjectForbiddenError();
}
export function assertBoardAccess(actor: HubActor, board: BoardObject) {
  if (!canAccessBoard(actor, board)) throw new HubObjectNotFoundError();
}
export function assertBoardManagement(actor: HubActor, board: BoardObject) {
  if (!sameOrganization(actor, board)) throw new HubObjectNotFoundError();
  if (!canManageBoard(actor, board)) throw new HubObjectForbiddenError();
}
export function assertTaskView(actor: HubActor, task: TaskObject) {
  if (!canViewTask(actor, task)) throw new HubObjectNotFoundError();
}
export function assertTaskEdit(actor: HubActor, task: TaskObject) {
  if (!sameOrganization(actor, task)) throw new HubObjectNotFoundError();
  if (!canEditTask(actor, task)) throw new HubObjectForbiddenError();
}
export function assertTaskAssignment(actor: HubActor, task: TaskObject) {
  if (!sameOrganization(actor, task)) throw new HubObjectNotFoundError();
  if (!canAssignTask(actor, task)) throw new HubObjectForbiddenError();
}
export function assertTaskArchival(actor: HubActor, task: TaskObject) {
  if (!sameOrganization(actor, task)) throw new HubObjectNotFoundError();
  if (!canArchiveTask(actor, task)) throw new HubObjectForbiddenError();
}
export function assertTaskCommenting(actor: HubActor, task: TaskObject) {
  if (!sameOrganization(actor, task)) throw new HubObjectNotFoundError();
  if (!canCommentTask(actor, task)) throw new HubObjectForbiddenError();
}
