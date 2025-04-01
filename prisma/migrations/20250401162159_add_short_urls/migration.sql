/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `PCBuild` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `components` to the `PCBuild` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortId` to the `PCBuild` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pcbuild` DROP FOREIGN KEY `PCBuild_userId_fkey`;

-- DropIndex
DROP INDEX `PCBuild_userId_fkey` ON `pcbuild`;

-- AlterTable
ALTER TABLE `pcbuild` ADD COLUMN `components` JSON NOT NULL,
    ADD COLUMN `shortId` VARCHAR(191) NOT NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `PCBuild_shortId_key` ON `PCBuild`(`shortId`);

-- CreateIndex
CREATE INDEX `PCBuild_shortId_idx` ON `PCBuild`(`shortId`);

-- AddForeignKey
ALTER TABLE `PCBuild` ADD CONSTRAINT `PCBuild_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
