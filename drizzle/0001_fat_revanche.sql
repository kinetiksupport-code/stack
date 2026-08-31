CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` enum('game','app','website') NOT NULL DEFAULT 'game',
	`prompt` text NOT NULL,
	`code` text NOT NULL,
	`status` enum('draft','ready') NOT NULL DEFAULT 'ready',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
