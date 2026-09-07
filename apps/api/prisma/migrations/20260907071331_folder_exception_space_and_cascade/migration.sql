/*
  Warnings:

  - Added the required column `spaceId` to the `FolderException` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FolderException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "folderPath" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "FolderException_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FolderException_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FolderException" ("folderPath", "groupId", "id", "role") SELECT "folderPath", "groupId", "id", "role" FROM "FolderException";
DROP TABLE "FolderException";
ALTER TABLE "new_FolderException" RENAME TO "FolderException";
CREATE INDEX "FolderException_groupId_idx" ON "FolderException"("groupId");
CREATE INDEX "FolderException_spaceId_idx" ON "FolderException"("spaceId");
CREATE UNIQUE INDEX "FolderException_groupId_spaceId_folderPath_key" ON "FolderException"("groupId", "spaceId", "folderPath");
CREATE TABLE "new_Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "ext" TEXT,
    "category" TEXT NOT NULL DEFAULT 'any',
    "path" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "trashedAt" DATETIME,
    "trashedById" TEXT,
    CONSTRAINT "Node_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Node_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Node" ("category", "createdAt", "ext", "id", "isFolder", "name", "ownerId", "parentId", "path", "sizeBytes", "spaceId", "trashedAt", "trashedById", "updatedAt") SELECT "category", "createdAt", "ext", "id", "isFolder", "name", "ownerId", "parentId", "path", "sizeBytes", "spaceId", "trashedAt", "trashedById", "updatedAt" FROM "Node";
DROP TABLE "Node";
ALTER TABLE "new_Node" RENAME TO "Node";
CREATE INDEX "Node_spaceId_parentId_idx" ON "Node"("spaceId", "parentId");
CREATE UNIQUE INDEX "Node_spaceId_path_key" ON "Node"("spaceId", "path");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
