CREATE TABLE "employees" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packets" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"employee_id" varchar(128),
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"description" text,
	"weight" numeric(10, 4),
	"carat" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "packets" ADD CONSTRAINT "packets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packets" ADD CONSTRAINT "packets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_type_idx" ON "employees" USING btree ("type");--> statement-breakpoint
CREATE INDEX "packets_user_id_idx" ON "packets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "packets_employee_id_idx" ON "packets" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "packets_status_idx" ON "packets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");