-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "birthDate" DATETIME,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    CONSTRAINT "Student_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("birthDate", "candidateNumber", "createdAt", "examId", "firstName", "gender", "id", "lastName", "schoolId") SELECT "birthDate", "candidateNumber", "createdAt", "examId", "firstName", "gender", "id", "lastName", "schoolId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_candidateNumber_key" ON "Student"("candidateNumber");
CREATE INDEX "Student_examId_idx" ON "Student"("examId");
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
