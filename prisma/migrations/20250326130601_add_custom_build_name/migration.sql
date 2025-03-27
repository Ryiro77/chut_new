-- AlterTable
ALTER TABLE `cartitem` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `customBuildName` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- RedefineIndex
CREATE INDEX `CartItem_productId_idx` ON `CartItem`(`productId`);

-- RedefineIndex
CREATE INDEX `CartItem_userId_idx` ON `CartItem`(`userId`);
