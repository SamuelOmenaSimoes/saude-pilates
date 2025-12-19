CREATE TABLE `recurringSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unitId` int NOT NULL,
	`roomId` int NOT NULL,
	`professionalId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`time` varchar(5) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `recurringSchedules_id` PRIMARY KEY(`id`)
);
