CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) DEFAULT 'Nova Conversa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` varchar(255) NOT NULL,
	`indexingStatus` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`chunkCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ragStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalDocuments` int DEFAULT 0,
	`totalChunks` int DEFAULT 0,
	`totalMessages` int DEFAULT 0,
	`totalUsers` int DEFAULT 0,
	`apiStatus` varchar(50) DEFAULT 'operational',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ragStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;