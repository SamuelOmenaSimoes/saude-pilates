CREATE TABLE `planFrequencies` (
	`id` int NOT NULL AUTO_INCREMENT,
	`code` varchar(32) NOT NULL,
	`label` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `planFrequencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `planFrequencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT INTO `planFrequencies` (`code`, `label`, `sortOrder`) VALUES
('1x', '1x por semana', 1),
('2x', '2x por semana', 2),
('3x', '3x por semana', 3);
--> statement-breakpoint
CREATE TABLE `planDurations` (
	`id` int NOT NULL AUTO_INCREMENT,
	`code` varchar(32) NOT NULL,
	`label` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `planDurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `planDurations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT INTO `planDurations` (`code`, `label`, `sortOrder`) VALUES
('monthly', 'Mensal', 1),
('quarterly', 'Trimestral', 2),
('semester', 'Semestral', 3);
--> statement-breakpoint
CREATE TABLE `planTypes` (
	`id` int NOT NULL AUTO_INCREMENT,
	`code` varchar(32) NOT NULL,
	`label` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `planTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `planTypes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT INTO `planTypes` (`code`, `label`, `sortOrder`) VALUES
('individual', 'Individual', 1),
('pair', 'Dupla', 2),
('group', 'Em grupo', 3);
--> statement-breakpoint
CREATE TABLE `planCatalog` (
	`id` int NOT NULL AUTO_INCREMENT,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `planCatalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planOffers` (
	`id` int NOT NULL AUTO_INCREMENT,
	`catalogId` int NOT NULL,
	`frequencyId` int NOT NULL,
	`durationId` int NOT NULL,
	`planTypeId` int NOT NULL,
	`totalClasses` int NOT NULL,
	`priceInCents` int NOT NULL,
	`installments` int NOT NULL DEFAULT 1,
	`installmentPriceInCents` int NOT NULL,
	`credits` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deletedAt` timestamp,
	CONSTRAINT `planOffers_id` PRIMARY KEY(`id`),
	CONSTRAINT `planOffers_catalog_fk` FOREIGN KEY (`catalogId`) REFERENCES `planCatalog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `planOffers_frequency_fk` FOREIGN KEY (`frequencyId`) REFERENCES `planFrequencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT `planOffers_duration_fk` FOREIGN KEY (`durationId`) REFERENCES `planDurations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT `planOffers_planType_fk` FOREIGN KEY (`planTypeId`) REFERENCES `planTypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT `planOffers_catalog_dims_unique` UNIQUE(`catalogId`,`frequencyId`,`durationId`,`planTypeId`)
);
--> statement-breakpoint
INSERT INTO `planCatalog` (`id`, `name`, `description`, `createdAt`, `deletedAt`)
SELECT `id`, `name`, `description`, `createdAt`, `deletedAt` FROM `plans` ORDER BY `id`;
--> statement-breakpoint
INSERT INTO `planOffers` (
	`id`, `catalogId`, `frequencyId`, `durationId`, `planTypeId`,
	`totalClasses`, `priceInCents`, `installments`, `installmentPriceInCents`,
	`credits`, `isActive`, `createdAt`, `deletedAt`
)
SELECT
	p.`id`,
	p.`id`,
	pf.`id`,
	pd.`id`,
	(SELECT `id` FROM `planTypes` WHERE `code` = 'group' LIMIT 1),
	p.`totalClasses`,
	p.`priceInCents`,
	p.`installments`,
	p.`installmentPriceInCents`,
	p.`credits`,
	p.`isActive`,
	p.`createdAt`,
	p.`deletedAt`
FROM `plans` p
INNER JOIN `planFrequencies` pf ON pf.`code` = p.`frequency`
INNER JOIN `planDurations` pd ON pd.`code` = p.`duration`;
--> statement-breakpoint
ALTER TABLE `planUnits` DROP FOREIGN KEY `planUnits_planId_plans_id_fk`;
--> statement-breakpoint
ALTER TABLE `planUnits` CHANGE `planId` `planOfferId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `planUnits` ADD CONSTRAINT `planUnits_planOfferId_planOffers_id_fk` FOREIGN KEY (`planOfferId`) REFERENCES `planOffers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_planId_planOffers_id_fk` FOREIGN KEY (`planId`) REFERENCES `planOffers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE `manualPayments` ADD CONSTRAINT `manualPayments_planId_planOffers_id_fk` FOREIGN KEY (`planId`) REFERENCES `planOffers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
DROP TABLE `plans`;
