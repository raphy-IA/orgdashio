ALTER TABLE "service_delivery" ADD COLUMN "project_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_delivery" ADD CONSTRAINT "service_delivery_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
