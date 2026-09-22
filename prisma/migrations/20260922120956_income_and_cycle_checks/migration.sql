-- CreateTable
CREATE TABLE "IncomeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncomeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseCycleCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseCycleCheck_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseCycleCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IncomeEntry_userId_idx" ON "IncomeEntry"("userId");
CREATE UNIQUE INDEX "ExpenseCycleCheck_expenseId_cycleKey_key" ON "ExpenseCycleCheck"("expenseId", "cycleKey");
CREATE INDEX "ExpenseCycleCheck_userId_cycleKey_idx" ON "ExpenseCycleCheck"("userId", "cycleKey");

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN "purchasedAt" DATETIME;

-- DataMigration 1 : capital de départ -> une entrée de revenu récurrente
INSERT INTO "IncomeEntry" ("id", "userId", "name", "amount", "dayOfMonth", "createdAt", "updatedAt")
SELECT
    lower(hex(randomblob(16))),
    s."userId",
    'Capital de départ',
    s."startingCapital",
    s."cycleStartDay",
    strftime('%Y-%m-%dT%H:%M:%S.000+00:00', 'now'),
    strftime('%Y-%m-%dT%H:%M:%S.000+00:00', 'now')
FROM "Settings" s
WHERE s."startingCapital" IS NOT NULL AND s."startingCapital" <> 0;

-- DataMigration 2 : isChecked global -> coche du cycle courant de chaque utilisateur
INSERT INTO "ExpenseCycleCheck" ("id", "expenseId", "userId", "cycleKey", "checkedAt")
SELECT
    lower(hex(randomblob(16))),
    e."id",
    e."userId",
    CASE
        WHEN CAST(strftime('%d', 'now') AS INTEGER) >= COALESCE(s."cycleStartDay", 1)
            THEN date('now', 'start of month', '+' || (COALESCE(s."cycleStartDay", 1) - 1) || ' days')
        ELSE date('now', 'start of month', '-1 month', '+' || (COALESCE(s."cycleStartDay", 1) - 1) || ' days')
    END,
    strftime('%Y-%m-%dT%H:%M:%S.000+00:00', 'now')
FROM "Expense" e
LEFT JOIN "Settings" s ON s."userId" = e."userId"
WHERE e."isChecked" = 1;

-- DataMigration 3 : souhaits déjà achetés -> datés d'aujourd'hui (restent déduits du cycle courant)
UPDATE "WishlistItem"
SET "purchasedAt" = strftime('%Y-%m-%dT%H:%M:%S.000+00:00', 'now')
WHERE "isPurchased" = 1;

-- RedefineTables : suppression de Expense.isChecked et Settings.startingCapital
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isOneTime" BOOLEAN NOT NULL DEFAULT false,
    "periodicityUnit" TEXT,
    "periodicityValue" INTEGER,
    "dueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("id","userId","name","amount","categoryId","isOneTime","periodicityUnit","periodicityValue","dueDate","createdAt","updatedAt")
SELECT "id","userId","name","amount","categoryId","isOneTime","periodicityUnit","periodicityValue","dueDate","createdAt","updatedAt" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";

CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cycleStartDay" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("id","userId","cycleStartDay","updatedAt")
SELECT "id","userId","cycleStartDay","updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
