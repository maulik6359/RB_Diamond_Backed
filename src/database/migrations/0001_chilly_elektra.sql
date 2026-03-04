CREATE TABLE "clients" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "client_id" varchar(128);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "tyare_weight" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "color" varchar(50);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "kasu_weight" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "peroty" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "shape" varchar(50);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "cut" varchar(50);--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "polish_weight" numeric(10, 4);--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
ALTER TABLE "packets" ADD CONSTRAINT "packets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "packets_client_id_idx" ON "packets" USING btree ("client_id");