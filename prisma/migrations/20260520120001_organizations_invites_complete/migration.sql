-- Complete partial organizations migration (idempotent)

INSERT INTO "Organization" ("id", "name", "slug", "active", "createdAt", "updatedAt")
SELECT 'org_general_default', 'General', 'general', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Organization" WHERE "slug" = 'general');

ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Board" ADD COLUMN IF NOT EXISTS "isGeneral" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Board" SET "organizationId" = 'org_general_default' WHERE "organizationId" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Board' AND column_name = 'organizationId' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Board" ALTER COLUMN "organizationId" SET NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "OrganizationInvite" (
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

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inviteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationInvite_token_key" ON "OrganizationInvite"("token");
CREATE INDEX IF NOT EXISTS "OrganizationInvite_organizationId_idx" ON "OrganizationInvite"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationInvite_token_idx" ON "OrganizationInvite"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE INDEX IF NOT EXISTS "Board_organizationId_idx" ON "Board"("organizationId");
CREATE INDEX IF NOT EXISTS "Board_isGeneral_active_idx" ON "Board"("isGeneral", "active");

DO $$ BEGIN
  ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_inviteId_fkey"
    FOREIGN KEY ("inviteId") REFERENCES "OrganizationInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Board" ADD CONSTRAINT "Board_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "createdAt")
SELECT 'om_' || u."id", 'org_general_default', u."id", CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'USER'
  AND NOT EXISTS (
    SELECT 1 FROM "OrganizationMember" m
    WHERE m."organizationId" = 'org_general_default' AND m."userId" = u."id"
  );
