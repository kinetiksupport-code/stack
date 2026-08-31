CREATE TABLE `deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`provider` varchar(40) NOT NULL,
	`status` enum('ready','error') NOT NULL DEFAULT 'ready',
	`repository` varchar(220),
	`repositoryUrl` text,
	`deploymentUrl` text,
	`providerId` varchar(180),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`)
);
