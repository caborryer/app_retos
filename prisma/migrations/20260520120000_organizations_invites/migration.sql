-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "OrganizationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable Board (nullable first for backfill)
ALTER TABLE "Board" ADD COLUMN "organizationId" TEXT,
ADD COLUMN "isGeneral" BOOLEAN NOT NULL DEFAULT false;

-- Default organization for existing data
INSERT INTO "Organization" ("id", "name", "slug", "active", "createdAt", "updatedAt")
VALUES ('org_general_default', 'General', 'general', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Board" SET "organizationId" = 'org_general_default' WHERE "organizationId" IS NULL;

ALTER TABLE "Board" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

CREATE UNIQUE INDEX "OrganizationInvite_token_key" ON "OrganizationInvite"("token");

CREATE INDEX "OrganizationInvite_organizationId_idx" ON "OrganizationInvite"("organizationId");

CREATE INDEX "OrganizationInvite_token_idx" ON "OrganizationInvite"("token");

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

CREATE INDEX "Board_organizationId_idx" ON "Board"("organizationId");

CREATE INDEX "Board_isGeneral_active_idx" ON "Board"("isGeneral", "active");

-- AddForeignKey
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "OrganizationInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Board" ADD CONSTRAINT "Board_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Legacy users: membership in General
INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "createdAt")
SELECT
    'om_' || "User"."id",
    'org_general_default',
    "User"."id",
    CURRENT_TIMESTAMP
FROM "User"
WHERE "User"."role" = 'USER'
ON CONFLICT ("organizationId", "userId") DO NOTHING;
