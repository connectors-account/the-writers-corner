-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostLike_submissionId_idx" ON "PostLike"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_userId_submissionId_key" ON "PostLike"("userId", "submissionId");

-- CreateIndex
CREATE INDEX "PostComment_submissionId_idx" ON "PostComment"("submissionId");

-- CreateIndex
CREATE INDEX "PostComment_userId_idx" ON "PostComment"("userId");

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExerciseSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ExerciseSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
