/*
  Warnings:

  - You are about to drop the column `price` on the `product` table. All the data in the column will be lost.
  - Added the required column `regularPrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `otpverification` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `price`,
    ADD COLUMN `averageRating` FLOAT NULL,
    ADD COLUMN `discountPercentage` FLOAT NULL,
    ADD COLUMN `discountedPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `isOnSale` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `regularPrice` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `reviewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ProductReview` (
    `id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ProductReview_userId_idx`(`userId`),
    INDEX `ProductReview_productId_idx`(`productId`),
    UNIQUE INDEX `ProductReview_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `OTPVerification_userId_idx` ON `OTPVerification`(`userId`);

-- CreateIndex
CREATE INDEX `User_phone_idx` ON `User`(`phone`);

-- AddForeignKey
ALTER TABLE `OTPVerification` ADD CONSTRAINT `OTPVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReview` ADD CONSTRAINT `ProductReview_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `Product_categoryId_idx` ON `Product`(`categoryId`);
