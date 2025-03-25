CREATE TABLE `agent_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`operation` text NOT NULL,
	`timestamp` integer NOT NULL,
	`details` text,
	`status` text NOT NULL,
	`error` text,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`instructions` text,
	`model` text,
	`temperature` integer,
	`max_tokens` integer,
	`tools` text,
	`system_agent` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
