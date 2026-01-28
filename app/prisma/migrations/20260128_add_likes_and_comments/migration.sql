-- CreateTable
CREATE TABLE "SubmissionLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionLike_submissionId_idx" ON "SubmissionLike"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionLike_userId_submissionId_key" ON "SubmissionLike"("userId", "submissionId");

-- CreateIndex
CREATE INDEX "SubmissionComment_submissionId_idx" ON "SubmissionComment"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionLike" ADD CONSTRAINT "SubmissionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionLike" ADD CONSTRAINT "SubmissionLike_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExerciseSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionComment" ADD CONSTRAINT "SubmissionComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionComment" ADD CONSTRAINT "SubmissionComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExerciseSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
