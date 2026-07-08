CREATE TABLE "calendar_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" date NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_status_check" CHECK ("calendar_items"."status" in ('planned', 'filming', 'posted'))
);
--> statement-breakpoint
ALTER TABLE "calendar_items" ADD CONSTRAINT "calendar_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_items" ADD CONSTRAINT "calendar_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;