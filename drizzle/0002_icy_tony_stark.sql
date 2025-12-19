CREATE TABLE `manualPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`amountInCents` int NOT NULL,
	`paymentMethod` enum('cash','pix','transfer') NOT NULL,
	`creditsAdded` int NOT NULL,
	`confirmedBy` int NOT NULL,
	`notes` text,
	`planStartDate` timestamp,
	`planEndDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manualPayments_id` PRIMARY KEY(`id`)
);
