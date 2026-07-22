-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "HubOrganizationType" AS ENUM ('JUNIOR_ENTERPRISE', 'ASSOCIATION', 'FOUNDATION', 'COMPANY', 'PUBLIC_ORGANIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "HubAccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "HubMemberInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HubInvitationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'NOT_CONFIGURED');

-- CreateEnum
CREATE TYPE "HubRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'DIRECTOR', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "HubOrganizationPosition" AS ENUM ('PRESIDENT', 'COUNSELOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "HubMemberCategory" AS ENUM ('MEMBER', 'TRAINEE', 'ALUMNI');

-- CreateEnum
CREATE TYPE "HubMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "HubAvailabilityExceptionType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "HubMeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HubMeetingParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE', 'ATTENDED', 'ABSENT');

-- CreateEnum
CREATE TYPE "HubMeetingInvitationSourceType" AS ENUM ('CREATOR', 'ORGANIZATION', 'DIRECTORATE', 'DIRECT');

-- CreateEnum
CREATE TYPE "HubAvailabilityPollStatus" AS ENUM ('OPEN', 'CLOSED', 'SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HubBoardScope" AS ENUM ('ORGANIZATION', 'DIRECTORATE');

-- CreateEnum
CREATE TYPE "HubTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HubCalendarEventType" AS ENUM ('MANUAL', 'MEETING', 'TASK_DEADLINE', 'PROJECT_DEADLINE', 'MILESTONE');

-- CreateEnum
CREATE TYPE "HubFinancialCategoryType" AS ENUM ('INCOME', 'EXPENSE', 'BOTH');

-- CreateEnum
CREATE TYPE "HubCounterpartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "HubFinancialEntryDirection" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "HubFinancialEntryStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_SETTLED', 'SETTLED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HubFinancialInstallmentStatus" AS ENUM ('OPEN', 'PARTIALLY_SETTLED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HubSettlementMethod" AS ENUM ('PIX', 'BANK_TRANSFER', 'CASH', 'CARD', 'BOLETO', 'OTHER');

-- CreateEnum
CREATE TYPE "HubFinancialPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "HubBudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HubReimbursementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "HubOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hubName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publicName" TEXT,
    "legalName" TEXT,
    "document" TEXT,
    "institutionalEmail" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "type" "HubOrganizationType" NOT NULL DEFAULT 'JUNIOR_ENTERPRISE',
    "responsibleMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "HubAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMemberInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "HubMemberInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "organizationPosition" "HubOrganizationPosition" NOT NULL,
    "memberCategory" "HubMemberCategory" NOT NULL,
    "directorateId" TEXT,
    "appointAsDirector" BOOLEAN NOT NULL DEFAULT false,
    "invitedById" TEXT NOT NULL,
    "existingInvitedMemberId" TEXT,
    "deliveryStatus" "HubInvitationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryError" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "HubMemberInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubDirectorate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "directorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubDirectorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "organizationPosition" "HubOrganizationPosition" NOT NULL DEFAULT 'MEMBER',
    "memberCategory" "HubMemberCategory" NOT NULL DEFAULT 'MEMBER',
    "accountId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" "HubRole" NOT NULL DEFAULT 'MEMBER',
    "status" "HubMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "directorateId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubProject" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "startDate" DATE,
    "deadline" DATE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "nextDelivery" TEXT,
    "archivedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "primaryDirectorateId" TEXT,
    "managerId" TEXT,
    "createdById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubProjectDirectorate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubProjectDirectorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubProjectTeamMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubProjectTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "memberId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubNotification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientMemberId" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAvailabilityRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAvailabilityException" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "HubAvailabilityExceptionType" NOT NULL,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubAvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeeting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "directorateId" TEXT,
    "organizationWide" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "HubMeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "location" TEXT,
    "meetingUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "minutes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAvailabilityPoll" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dates" DATE[],
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "slotMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "responseDeadline" TIMESTAMP(3),
    "directorateId" TEXT,
    "status" "HubAvailabilityPollStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubAvailabilityPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAvailabilityPollParticipant" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubAvailabilityPollParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubAvailabilitySelection" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubAvailabilitySelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingDirectorate" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "directorateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMeetingDirectorate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingExternalGuest" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMeetingExternalGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingResponseEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "HubMeetingParticipantStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMeetingResponseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "responseStatus" "HubMeetingParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "invitationVersion" INTEGER NOT NULL DEFAULT 1,
    "attendanceStatus" "HubMeetingParticipantStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingParticipantSource" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sourceType" "HubMeetingInvitationSourceType" NOT NULL,
    "directorateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMeetingParticipantSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingAgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER,
    "presenterMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubMeetingAgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubMeetingDecision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMeetingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubBoard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "directorateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "HubBoardScope" NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubBoardColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isDoneColumn" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubBoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "sourceMeetingId" TEXT,
    "directorateId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "HubTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubCalendarEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "HubCalendarEventType" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL,
    "location" TEXT,
    "directorateId" TEXT,
    "projectId" TEXT,
    "meetingId" TEXT,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubTaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubTaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubTaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubTaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubTaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubFinancialCategory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "type" "HubFinancialCategoryType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubFinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubCostCenter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "directorateId" TEXT,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "normalizedCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubCostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubCounterparty" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "HubCounterpartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "document" TEXT,
    "normalizedDocument" TEXT,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubCounterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubFinancialEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "direction" "HubFinancialEntryDirection" NOT NULL,
    "status" "HubFinancialEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "directorateId" TEXT,
    "counterpartyId" TEXT,
    "projectId" TEXT,
    "issueDate" DATE NOT NULL,
    "competenceDate" DATE NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "supportingMetadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubFinancialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubFinancialInstallment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "HubFinancialInstallmentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubFinancialInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubFinancialSettlement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL,
    "method" "HubSettlementMethod" NOT NULL,
    "reference" TEXT,
    "createdById" TEXT NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "reversedById" TEXT,
    "reversalReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubFinancialSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubFinancialPeriod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "HubFinancialPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedById" TEXT,
    "reopenReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubFinancialPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubBudget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "HubBudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubBudgetLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "month" INTEGER NOT NULL,
    "plannedCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubBudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubReimbursementRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterMemberId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "HubReimbursementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "costCenterId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "financialEntryId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubReimbursementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubReimbursementItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "receiptReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubReimbursementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HubOrganization_slug_key" ON "HubOrganization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HubAccount_normalizedEmail_key" ON "HubAccount"("normalizedEmail");

-- CreateIndex
CREATE INDEX "HubAccount_lastOrganizationId_idx" ON "HubAccount"("lastOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "HubMemberInvitation_tokenHash_key" ON "HubMemberInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "HubMemberInvitation_organizationId_status_createdAt_idx" ON "HubMemberInvitation"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HubMemberInvitation_organizationId_normalizedEmail_idx" ON "HubMemberInvitation"("organizationId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "HubMemberInvitation_existingInvitedMemberId_idx" ON "HubMemberInvitation"("existingInvitedMemberId");

-- CreateIndex
CREATE INDEX "HubDirectorate_organizationId_idx" ON "HubDirectorate"("organizationId");

-- CreateIndex
CREATE INDEX "HubDirectorate_organizationId_archivedAt_idx" ON "HubDirectorate"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "HubDirectorate_directorId_idx" ON "HubDirectorate"("directorId");

-- CreateIndex
CREATE UNIQUE INDEX "HubDirectorate_organizationId_slug_key" ON "HubDirectorate"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "HubMember_organizationId_idx" ON "HubMember"("organizationId");

-- CreateIndex
CREATE INDEX "HubMember_organizationId_organizationPosition_idx" ON "HubMember"("organizationId", "organizationPosition");

-- CreateIndex
CREATE INDEX "HubMember_organizationId_memberCategory_idx" ON "HubMember"("organizationId", "memberCategory");

-- CreateIndex
CREATE INDEX "HubMember_directorateId_idx" ON "HubMember"("directorateId");

-- CreateIndex
CREATE INDEX "HubMember_accountId_idx" ON "HubMember"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "HubMember_organizationId_normalizedEmail_key" ON "HubMember"("organizationId", "normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "HubProject_idempotencyKey_key" ON "HubProject"("idempotencyKey");

-- CreateIndex
CREATE INDEX "HubProject_organizationId_idx" ON "HubProject"("organizationId");

-- CreateIndex
CREATE INDEX "HubProject_status_idx" ON "HubProject"("status");

-- CreateIndex
CREATE INDEX "HubProject_organizationId_archivedAt_status_idx" ON "HubProject"("organizationId", "archivedAt", "status");

-- CreateIndex
CREATE INDEX "HubProject_primaryDirectorateId_idx" ON "HubProject"("primaryDirectorateId");

-- CreateIndex
CREATE INDEX "HubProject_managerId_idx" ON "HubProject"("managerId");

-- CreateIndex
CREATE INDEX "HubProjectDirectorate_directorateId_idx" ON "HubProjectDirectorate"("directorateId");

-- CreateIndex
CREATE UNIQUE INDEX "HubProjectDirectorate_projectId_directorateId_key" ON "HubProjectDirectorate"("projectId", "directorateId");

-- CreateIndex
CREATE INDEX "HubProjectTeamMember_memberId_idx" ON "HubProjectTeamMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "HubProjectTeamMember_projectId_memberId_key" ON "HubProjectTeamMember"("projectId", "memberId");

-- CreateIndex
CREATE INDEX "HubProjectMilestone_projectId_dueAt_idx" ON "HubProjectMilestone"("projectId", "dueAt");

-- CreateIndex
CREATE INDEX "HubAuditLog_organizationId_idx" ON "HubAuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "HubAuditLog_action_idx" ON "HubAuditLog"("action");

-- CreateIndex
CREATE INDEX "HubAuditLog_createdAt_idx" ON "HubAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "HubNotification_organizationId_recipientMemberId_readAt_idx" ON "HubNotification"("organizationId", "recipientMemberId", "readAt");

-- CreateIndex
CREATE INDEX "HubNotification_recipientMemberId_createdAt_idx" ON "HubNotification"("recipientMemberId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "HubNotification_organizationId_createdAt_idx" ON "HubNotification"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "HubNotification_organizationId_idempotencyKey_key" ON "HubNotification"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubAvailabilityRule_organizationId_memberId_idx" ON "HubAvailabilityRule"("organizationId", "memberId");

-- CreateIndex
CREATE INDEX "HubAvailabilityRule_memberId_weekday_idx" ON "HubAvailabilityRule"("memberId", "weekday");

-- CreateIndex
CREATE INDEX "HubAvailabilityException_organizationId_memberId_idx" ON "HubAvailabilityException"("organizationId", "memberId");

-- CreateIndex
CREATE INDEX "HubAvailabilityException_memberId_date_idx" ON "HubAvailabilityException"("memberId", "date");

-- CreateIndex
CREATE INDEX "HubMeeting_organizationId_startAt_idx" ON "HubMeeting"("organizationId", "startAt");

-- CreateIndex
CREATE INDEX "HubMeeting_directorateId_startAt_idx" ON "HubMeeting"("directorateId", "startAt");

-- CreateIndex
CREATE INDEX "HubMeeting_createdById_idx" ON "HubMeeting"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeeting_organizationId_idempotencyKey_key" ON "HubMeeting"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubAvailabilityPoll_organizationId_status_idx" ON "HubAvailabilityPoll"("organizationId", "status");

-- CreateIndex
CREATE INDEX "HubAvailabilityPoll_directorateId_idx" ON "HubAvailabilityPoll"("directorateId");

-- CreateIndex
CREATE INDEX "HubAvailabilityPollParticipant_memberId_idx" ON "HubAvailabilityPollParticipant"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "HubAvailabilityPollParticipant_pollId_memberId_key" ON "HubAvailabilityPollParticipant"("pollId", "memberId");

-- CreateIndex
CREATE INDEX "HubAvailabilitySelection_pollId_slotStart_idx" ON "HubAvailabilitySelection"("pollId", "slotStart");

-- CreateIndex
CREATE INDEX "HubAvailabilitySelection_memberId_idx" ON "HubAvailabilitySelection"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "HubAvailabilitySelection_pollId_memberId_slotStart_key" ON "HubAvailabilitySelection"("pollId", "memberId", "slotStart");

-- CreateIndex
CREATE INDEX "HubMeetingDirectorate_directorateId_idx" ON "HubMeetingDirectorate"("directorateId");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeetingDirectorate_meetingId_directorateId_key" ON "HubMeetingDirectorate"("meetingId", "directorateId");

-- CreateIndex
CREATE INDEX "HubMeetingExternalGuest_meetingId_idx" ON "HubMeetingExternalGuest"("meetingId");

-- CreateIndex
CREATE INDEX "HubMeetingResponseEvent_meetingId_memberId_createdAt_idx" ON "HubMeetingResponseEvent"("meetingId", "memberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeetingResponseEvent_organizationId_eventId_key" ON "HubMeetingResponseEvent"("organizationId", "eventId");

-- CreateIndex
CREATE INDEX "HubMeetingParticipant_memberId_responseStatus_idx" ON "HubMeetingParticipant"("memberId", "responseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeetingParticipant_meetingId_memberId_key" ON "HubMeetingParticipant"("meetingId", "memberId");

-- CreateIndex
CREATE INDEX "HubMeetingParticipantSource_meetingId_memberId_idx" ON "HubMeetingParticipantSource"("meetingId", "memberId");

-- CreateIndex
CREATE INDEX "HubMeetingParticipantSource_directorateId_idx" ON "HubMeetingParticipantSource"("directorateId");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeetingParticipantSource_meetingId_memberId_sourceType_d_key" ON "HubMeetingParticipantSource"("meetingId", "memberId", "sourceType", "directorateId");

-- CreateIndex
CREATE INDEX "HubMeetingAgendaItem_presenterMemberId_idx" ON "HubMeetingAgendaItem"("presenterMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "HubMeetingAgendaItem_meetingId_order_key" ON "HubMeetingAgendaItem"("meetingId", "order");

-- CreateIndex
CREATE INDEX "HubMeetingDecision_meetingId_decidedAt_idx" ON "HubMeetingDecision"("meetingId", "decidedAt");

-- CreateIndex
CREATE INDEX "HubBoard_organizationId_isArchived_idx" ON "HubBoard"("organizationId", "isArchived");

-- CreateIndex
CREATE INDEX "HubBoard_directorateId_idx" ON "HubBoard"("directorateId");

-- CreateIndex
CREATE INDEX "HubBoardColumn_boardId_isArchived_idx" ON "HubBoardColumn"("boardId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "HubBoardColumn_boardId_order_key" ON "HubBoardColumn"("boardId", "order");

-- CreateIndex
CREATE INDEX "HubTask_organizationId_dueAt_idx" ON "HubTask"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "HubTask_boardId_columnId_position_idx" ON "HubTask"("boardId", "columnId", "position");

-- CreateIndex
CREATE INDEX "HubTask_sourceMeetingId_idx" ON "HubTask"("sourceMeetingId");

-- CreateIndex
CREATE INDEX "HubTask_directorateId_status_idx" ON "HubTask"("directorateId", "status");

-- CreateIndex
CREATE INDEX "HubTask_projectId_status_idx" ON "HubTask"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HubTask_organizationId_idempotencyKey_key" ON "HubTask"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubCalendarEvent_organizationId_startAt_idx" ON "HubCalendarEvent"("organizationId", "startAt");

-- CreateIndex
CREATE INDEX "HubCalendarEvent_directorateId_startAt_idx" ON "HubCalendarEvent"("directorateId", "startAt");

-- CreateIndex
CREATE INDEX "HubCalendarEvent_projectId_idx" ON "HubCalendarEvent"("projectId");

-- CreateIndex
CREATE INDEX "HubCalendarEvent_meetingId_idx" ON "HubCalendarEvent"("meetingId");

-- CreateIndex
CREATE INDEX "HubTaskAssignee_memberId_idx" ON "HubTaskAssignee"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "HubTaskAssignee_taskId_memberId_key" ON "HubTaskAssignee"("taskId", "memberId");

-- CreateIndex
CREATE INDEX "HubTaskComment_taskId_createdAt_idx" ON "HubTaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "HubTaskComment_authorId_idx" ON "HubTaskComment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "HubTaskChecklistItem_taskId_order_key" ON "HubTaskChecklistItem"("taskId", "order");

-- CreateIndex
CREATE INDEX "HubFinancialCategory_organizationId_type_isActive_idx" ON "HubFinancialCategory"("organizationId", "type", "isActive");

-- CreateIndex
CREATE INDEX "HubFinancialCategory_parentId_idx" ON "HubFinancialCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "HubFinancialCategory_organizationId_normalizedName_key" ON "HubFinancialCategory"("organizationId", "normalizedName");

-- CreateIndex
CREATE INDEX "HubCostCenter_organizationId_isActive_idx" ON "HubCostCenter"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "HubCostCenter_directorateId_idx" ON "HubCostCenter"("directorateId");

-- CreateIndex
CREATE UNIQUE INDEX "HubCostCenter_organizationId_normalizedCode_key" ON "HubCostCenter"("organizationId", "normalizedCode");

-- CreateIndex
CREATE INDEX "HubCounterparty_organizationId_normalizedName_idx" ON "HubCounterparty"("organizationId", "normalizedName");

-- CreateIndex
CREATE INDEX "HubCounterparty_organizationId_normalizedDocument_idx" ON "HubCounterparty"("organizationId", "normalizedDocument");

-- CreateIndex
CREATE INDEX "HubCounterparty_organizationId_normalizedEmail_idx" ON "HubCounterparty"("organizationId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_organizationId_status_competenceDate_idx" ON "HubFinancialEntry"("organizationId", "status", "competenceDate");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_organizationId_direction_issueDate_idx" ON "HubFinancialEntry"("organizationId", "direction", "issueDate");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_categoryId_idx" ON "HubFinancialEntry"("categoryId");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_costCenterId_idx" ON "HubFinancialEntry"("costCenterId");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_directorateId_idx" ON "HubFinancialEntry"("directorateId");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_counterpartyId_idx" ON "HubFinancialEntry"("counterpartyId");

-- CreateIndex
CREATE INDEX "HubFinancialEntry_projectId_idx" ON "HubFinancialEntry"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "HubFinancialEntry_organizationId_idempotencyKey_key" ON "HubFinancialEntry"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubFinancialInstallment_organizationId_dueDate_status_idx" ON "HubFinancialInstallment"("organizationId", "dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HubFinancialInstallment_entryId_number_key" ON "HubFinancialInstallment"("entryId", "number");

-- CreateIndex
CREATE INDEX "HubFinancialSettlement_organizationId_settledAt_idx" ON "HubFinancialSettlement"("organizationId", "settledAt");

-- CreateIndex
CREATE INDEX "HubFinancialSettlement_entryId_reversedAt_idx" ON "HubFinancialSettlement"("entryId", "reversedAt");

-- CreateIndex
CREATE INDEX "HubFinancialSettlement_installmentId_reversedAt_idx" ON "HubFinancialSettlement"("installmentId", "reversedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HubFinancialSettlement_organizationId_idempotencyKey_key" ON "HubFinancialSettlement"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubFinancialPeriod_organizationId_status_idx" ON "HubFinancialPeriod"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HubFinancialPeriod_organizationId_year_month_key" ON "HubFinancialPeriod"("organizationId", "year", "month");

-- CreateIndex
CREATE INDEX "HubBudget_organizationId_year_status_idx" ON "HubBudget"("organizationId", "year", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HubBudget_organizationId_year_name_revision_key" ON "HubBudget"("organizationId", "year", "name", "revision");

-- CreateIndex
CREATE INDEX "HubBudgetLine_organizationId_month_idx" ON "HubBudgetLine"("organizationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "HubBudgetLine_budgetId_categoryId_costCenterId_month_key" ON "HubBudgetLine"("budgetId", "categoryId", "costCenterId", "month");

-- CreateIndex
CREATE INDEX "HubReimbursementRequest_organizationId_status_createdAt_idx" ON "HubReimbursementRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HubReimbursementRequest_requesterMemberId_status_idx" ON "HubReimbursementRequest"("requesterMemberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HubReimbursementRequest_organizationId_idempotencyKey_key" ON "HubReimbursementRequest"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "HubReimbursementItem_organizationId_requestId_idx" ON "HubReimbursementItem"("organizationId", "requestId");

-- AddForeignKey
ALTER TABLE "HubOrganization" ADD CONSTRAINT "HubOrganization_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAccount" ADD CONSTRAINT "HubAccount_lastOrganizationId_fkey" FOREIGN KEY ("lastOrganizationId") REFERENCES "HubOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMemberInvitation" ADD CONSTRAINT "HubMemberInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMemberInvitation" ADD CONSTRAINT "HubMemberInvitation_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMemberInvitation" ADD CONSTRAINT "HubMemberInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMemberInvitation" ADD CONSTRAINT "HubMemberInvitation_existingInvitedMemberId_fkey" FOREIGN KEY ("existingInvitedMemberId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubDirectorate" ADD CONSTRAINT "HubDirectorate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubDirectorate" ADD CONSTRAINT "HubDirectorate_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMember" ADD CONSTRAINT "HubMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMember" ADD CONSTRAINT "HubMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HubAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMember" ADD CONSTRAINT "HubMember_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProject" ADD CONSTRAINT "HubProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProject" ADD CONSTRAINT "HubProject_primaryDirectorateId_fkey" FOREIGN KEY ("primaryDirectorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProject" ADD CONSTRAINT "HubProject_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProject" ADD CONSTRAINT "HubProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProjectDirectorate" ADD CONSTRAINT "HubProjectDirectorate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProjectDirectorate" ADD CONSTRAINT "HubProjectDirectorate_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProjectTeamMember" ADD CONSTRAINT "HubProjectTeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProjectTeamMember" ADD CONSTRAINT "HubProjectTeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubProjectMilestone" ADD CONSTRAINT "HubProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAuditLog" ADD CONSTRAINT "HubAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAuditLog" ADD CONSTRAINT "HubAuditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubNotification" ADD CONSTRAINT "HubNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubNotification" ADD CONSTRAINT "HubNotification_recipientMemberId_fkey" FOREIGN KEY ("recipientMemberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubNotification" ADD CONSTRAINT "HubNotification_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityRule" ADD CONSTRAINT "HubAvailabilityRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityRule" ADD CONSTRAINT "HubAvailabilityRule_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityException" ADD CONSTRAINT "HubAvailabilityException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityException" ADD CONSTRAINT "HubAvailabilityException_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeeting" ADD CONSTRAINT "HubMeeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeeting" ADD CONSTRAINT "HubMeeting_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeeting" ADD CONSTRAINT "HubMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeeting" ADD CONSTRAINT "HubMeeting_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityPoll" ADD CONSTRAINT "HubAvailabilityPoll_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityPoll" ADD CONSTRAINT "HubAvailabilityPoll_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityPoll" ADD CONSTRAINT "HubAvailabilityPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityPollParticipant" ADD CONSTRAINT "HubAvailabilityPollParticipant_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "HubAvailabilityPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilityPollParticipant" ADD CONSTRAINT "HubAvailabilityPollParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilitySelection" ADD CONSTRAINT "HubAvailabilitySelection_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "HubAvailabilityPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubAvailabilitySelection" ADD CONSTRAINT "HubAvailabilitySelection_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingDirectorate" ADD CONSTRAINT "HubMeetingDirectorate_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingDirectorate" ADD CONSTRAINT "HubMeetingDirectorate_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingExternalGuest" ADD CONSTRAINT "HubMeetingExternalGuest_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingResponseEvent" ADD CONSTRAINT "HubMeetingResponseEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingResponseEvent" ADD CONSTRAINT "HubMeetingResponseEvent_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingResponseEvent" ADD CONSTRAINT "HubMeetingResponseEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingParticipant" ADD CONSTRAINT "HubMeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingParticipant" ADD CONSTRAINT "HubMeetingParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingAgendaItem" ADD CONSTRAINT "HubMeetingAgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingAgendaItem" ADD CONSTRAINT "HubMeetingAgendaItem_presenterMemberId_fkey" FOREIGN KEY ("presenterMemberId") REFERENCES "HubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingDecision" ADD CONSTRAINT "HubMeetingDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMeetingDecision" ADD CONSTRAINT "HubMeetingDecision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubBoard" ADD CONSTRAINT "HubBoard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubBoard" ADD CONSTRAINT "HubBoard_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubBoard" ADD CONSTRAINT "HubBoard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubBoardColumn" ADD CONSTRAINT "HubBoardColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "HubBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "HubBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "HubBoardColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_sourceMeetingId_fkey" FOREIGN KEY ("sourceMeetingId") REFERENCES "HubMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTask" ADD CONSTRAINT "HubTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCalendarEvent" ADD CONSTRAINT "HubCalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCalendarEvent" ADD CONSTRAINT "HubCalendarEvent_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCalendarEvent" ADD CONSTRAINT "HubCalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCalendarEvent" ADD CONSTRAINT "HubCalendarEvent_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubCalendarEvent" ADD CONSTRAINT "HubCalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTaskAssignee" ADD CONSTRAINT "HubTaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HubTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTaskAssignee" ADD CONSTRAINT "HubTaskAssignee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "HubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTaskComment" ADD CONSTRAINT "HubTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HubTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTaskComment" ADD CONSTRAINT "HubTaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "HubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubTaskChecklistItem" ADD CONSTRAINT "HubTaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HubTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubFinancialEntry" ADD CONSTRAINT "HubFinancialEntry_directorateId_fkey" FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubFinancialEntry" ADD CONSTRAINT "HubFinancialEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HubProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Governance invariants that Prisma cannot represent as partial unique indexes.
CREATE UNIQUE INDEX "HubMember_one_active_president_key"
ON "HubMember" ("organizationId")
WHERE "organizationPosition" = 'PRESIDENT' AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "HubMemberInvitation_one_pending_email_key"
ON "HubMemberInvitation" ("organizationId", "normalizedEmail")
WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "HubMemberInvitation_one_pending_president_key"
ON "HubMemberInvitation" ("organizationId")
WHERE "status" = 'PENDING' AND "organizationPosition" = 'PRESIDENT';

-- Invitation-source provenance is intentionally independent from the response row.
ALTER TABLE "HubMeetingParticipantSource"
ADD CONSTRAINT "HubMeetingParticipantSource_participant_fkey"
FOREIGN KEY ("meetingId", "memberId")
REFERENCES "HubMeetingParticipant" ("meetingId", "memberId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HubMeetingParticipantSource"
ADD CONSTRAINT "HubMeetingParticipantSource_directorateId_fkey"
FOREIGN KEY ("directorateId") REFERENCES "HubDirectorate" ("id")
ON DELETE SET NULL ON UPDATE CASCADE;
