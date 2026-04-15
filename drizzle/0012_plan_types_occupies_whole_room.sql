ALTER TABLE `planTypes` ADD `occupiesWholeRoom` tinyint(1) NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `planTypes` SET `occupiesWholeRoom` = 1 WHERE `code` = 'individual';
--> statement-breakpoint
ALTER TABLE `appointments` ADD `planTypeId` int;
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_planTypeId_fk` FOREIGN KEY (`planTypeId`) REFERENCES `planTypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
