CREATE SCHEMA "portfolio";
--> statement-breakpoint
CREATE SCHEMA "request_audit";
--> statement-breakpoint
CREATE TABLE "portfolio"."ai_chat_usage" (
	"usage_id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"chat_date" date NOT NULL,
	"chat_count" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."ai_email_usage" (
	"usage_id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar,
	"email" varchar,
	"email_date" date,
	"email_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "portfolio"."ai_usage_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(255),
	"user_email" varchar(255),
	"action_type" varchar(50) NOT NULL,
	"prompt_tokens" integer DEFAULT 0,
	"completion_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"provider" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."blogs" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"excerpt" text,
	"date" varchar(50),
	"read_time" varchar(50),
	"tags" jsonb,
	"content" text,
	"slug" text,
	"is_hidden" boolean DEFAULT false,
	"image" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "portfolio"."certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"issuer" varchar(255) NOT NULL,
	"url" varchar(255),
	"date" varchar(50) NOT NULL,
	"icon" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio"."client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"company_logo_url" text,
	"phone" varchar(50),
	"must_reset_password" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"description" text,
	CONSTRAINT "client_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "portfolio"."client_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'Inquiry' NOT NULL,
	"cost" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now(),
	"project_image_url" text,
	"live_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "portfolio"."config" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_email" varchar(255) NOT NULL,
	"admin_pass" varchar(255) NOT NULL,
	"show_welcome_modal" boolean NOT NULL,
	"must_reset_password" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "portfolio"."education" (
	"id" integer PRIMARY KEY NOT NULL,
	"degree" varchar(255),
	"school" varchar(255),
	"start_date" varchar(20),
	"end_date" varchar(20),
	"grade" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "portfolio"."enquiry" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."enquiry_otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "portfolio"."error_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"error_message" text NOT NULL,
	"error_stack" text,
	"context" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."experience" (
	"id" integer PRIMARY KEY NOT NULL,
	"role" varchar(255),
	"company" varchar(255),
	"start_date" varchar(20),
	"end_date" varchar(20),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "portfolio"."job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"job_description" text,
	"contact_name" varchar(255),
	"contact_email" varchar(255) NOT NULL,
	"contact_role" varchar(255),
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"is_referral" boolean DEFAULT false,
	"user_context" text,
	"tracking_token" uuid DEFAULT gen_random_uuid(),
	"email_sent_count" integer DEFAULT 0,
	"email_opens" integer DEFAULT 0,
	"last_opened_at" timestamp,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."outreach_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"content" text,
	"direction" varchar(20) NOT NULL,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."password_reset_otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "portfolio"."profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"roles" jsonb,
	"role" varchar(255),
	"current_company" varchar(255),
	"current_company_url" varchar(255),
	"summary" text,
	"location" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"linkedin" varchar(255),
	"github" varchar(255),
	"twitter" varchar(255),
	"resume_url" varchar(255),
	"photo_light_url" varchar(500),
	"photo_dark_url" varchar(500),
	"currently_learning" jsonb
);
--> statement-breakpoint
CREATE TABLE "portfolio"."project_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sender_role" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio"."project_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."projects" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"category" varchar(100),
	"tech" jsonb,
	"description" text,
	"long_description" text,
	"features" jsonb,
	"challenges" text,
	"link" varchar(255),
	"github_link" varchar(255),
	"color" varchar(100),
	"image" text,
	"slug" text,
	"sort_order" integer DEFAULT 0,
	"is_client" boolean DEFAULT false,
	"priority" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "portfolio"."review" (
	"review_id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"stars" smallint NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "request_audit"."sessions" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"ip_address" varchar(45),
	"user_identity" jsonb,
	"visit_history" jsonb,
	"device_info" jsonb,
	"geo_info" jsonb,
	"last_active_at" timestamp,
	"browser_name" varchar(100),
	"operating_system" varchar(100),
	"device_type" varchar(50),
	"country_name" varchar(100),
	"city_name" varchar(105),
	"user_name" varchar(255),
	"user_email" varchar(255),
	"user_phone" varchar(50),
	"started_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio"."skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"icon" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "portfolio"."ui_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_tagline" varchar(255),
	"status_label" varchar(255),
	"blog_title" varchar(255),
	"blog_subtitle" varchar(255),
	"project_title" varchar(255),
	"project_subtitle" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "portfolio"."view_only_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"must_reset_password" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "view_only_admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "portfolio"."client_project" ADD CONSTRAINT "client_project_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "portfolio"."client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio"."outreach_threads" ADD CONSTRAINT "outreach_threads_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "portfolio"."job_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio"."project_message" ADD CONSTRAINT "project_message_project_id_client_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "portfolio"."client_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio"."project_payment" ADD CONSTRAINT "project_payment_project_id_client_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "portfolio"."client_project"("id") ON DELETE no action ON UPDATE no action;