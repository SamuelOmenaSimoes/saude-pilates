CREATE TABLE `planUnits` (
	`planId` int NOT NULL,
	`unitId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planUnits_id` PRIMARY KEY(`planId`,`unitId`),
	CONSTRAINT `planUnits_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `planUnits_unitId_units_id_fk` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
--> statement-breakpoint
ALTER TABLE `purchases` ADD `unitId` int;
--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_unitId_units_id_fk` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
