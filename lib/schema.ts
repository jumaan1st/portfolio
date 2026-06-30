
import { pgSchema, serial, bigserial, text, varchar, jsonb, integer, boolean, timestamp, smallint, date, uuid } from "drizzle-orm/pg-core";

// Schema: portfolio
export const portfolio = pgSchema("portfolio");

export const config = portfolio.table("config", {
    id: serial("id").primaryKey(),
    admin_email: varchar("admin_email", { length: 255 }).notNull(),
    admin_pass: varchar("admin_pass", { length: 255 }).notNull(),
    show_welcome_modal: boolean("show_welcome_modal").notNull(),
    must_reset_password: boolean("must_reset_password").default(false),
});

export const uiConfig = portfolio.table("ui_config", {
    id: serial("id").primaryKey(),
    hero_tagline: varchar("hero_tagline", { length: 255 }),
    status_label: varchar("status_label", { length: 255 }),
    blog_title: varchar("blog_title", { length: 255 }),
    blog_subtitle: varchar("blog_subtitle", { length: 255 }),
    project_title: varchar("project_title", { length: 255 }),
    project_subtitle: varchar("project_subtitle", { length: 255 }),
});

export const profile = portfolio.table("profile", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    roles: jsonb("roles").$type<string[]>(),
    role: varchar("role", { length: 255 }),
    current_company: varchar("current_company", { length: 255 }),
    current_company_url: varchar("current_company_url", { length: 255 }),
    summary: text("summary"),
    location: varchar("location", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    linkedin: varchar("linkedin", { length: 255 }),
    github: varchar("github", { length: 255 }),
    twitter: varchar("twitter", { length: 255 }),
    resume_url: varchar("resume_url", { length: 255 }),
    photo_light_url: varchar("photo_light_url", { length: 500 }),
    photo_dark_url: varchar("photo_dark_url", { length: 500 }),
    currently_learning: jsonb("currently_learning").$type<string[]>(),
});

export const experience = portfolio.table("experience", {
    id: integer("id").primaryKey(),
    role: varchar("role", { length: 255 }),
    company: varchar("company", { length: 255 }),
    start_date: varchar("start_date", { length: 20 }),
    end_date: varchar("end_date", { length: 20 }),
    description: text("description"),
});

export const projects = portfolio.table("projects", {
    id: integer("id").primaryKey(),
    title: varchar("title", { length: 255 }),
    category: varchar("category", { length: 100 }),
    tech: jsonb("tech").$type<string[]>(),
    description: text("description"),
    long_description: text("long_description"),
    features: jsonb("features").$type<string[]>(),
    challenges: text("challenges"),
    link: varchar("link", { length: 255 }),
    github_link: varchar("github_link", { length: 255 }),
    color: varchar("color", { length: 100 }),
    image: text("image"),
    slug: text("slug"), // Added via migration
    sort_order: integer("sort_order").default(0), // Added via migration context check
    is_client: boolean("is_client").default(false),
    priority: integer("priority").default(0),
});

export const blogs = portfolio.table("blogs", {
    id: integer("id").primaryKey(),
    title: varchar("title", { length: 255 }),
    excerpt: text("excerpt"),
    date: varchar("date", { length: 50 }),
    read_time: varchar("read_time", { length: 50 }),
    tags: jsonb("tags").$type<string[]>(),
    content: text("content"),
    slug: text("slug"), // Added via migration
    is_hidden: boolean("is_hidden").default(false), // Checked generic usage
    image: text("image"),
    sort_order: integer("sort_order").default(0),
});

export const education = portfolio.table("education", {
    id: integer("id").primaryKey(),
    degree: varchar("degree", { length: 255 }),
    school: varchar("school", { length: 255 }),
    start_date: varchar("start_date", { length: 20 }),
    end_date: varchar("end_date", { length: 20 }),
    grade: varchar("grade", { length: 50 }),
});

export const skills = portfolio.table("skills", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }),
    icon: varchar("icon", { length: 100 }),
});

export const review = portfolio.table("review", {
    review_id: bigserial("review_id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    stars: smallint("stars").notNull(),
    feedback: text("feedback"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const certifications = portfolio.table("certifications", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    issuer: varchar("issuer", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }),
    date: varchar("date", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 100 }).notNull(),
});

// Note: Usage table identified from code, not just sql dump
export const aiEmailUsage = portfolio.table("ai_email_usage", {
    usage_id: bigserial("usage_id", { mode: "number" }).primaryKey(),
    name: varchar("name"),
    email: varchar("email"),
    email_date: date("email_date"), // checking exact type, code uses YYYY-MM-DD string but DB might be date
    email_count: integer("email_count").default(0),
});

export const aiChatUsage = portfolio.table("ai_chat_usage", {
    usage_id: bigserial("usage_id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    chat_date: date("chat_date").notNull(),
    chat_count: smallint("chat_count").default(0).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

// Schema: request_audit
export const requestAudit = pgSchema("request_audit");

export const sessions = requestAudit.table("sessions", {
    session_id: uuid("session_id").primaryKey(),
    ip_address: varchar("ip_address", { length: 45 }),
    user_identity: jsonb("user_identity"),
    visit_history: jsonb("visit_history"),
    device_info: jsonb("device_info"),
    geo_info: jsonb("geo_info"),
    last_active_at: timestamp("last_active_at"),
    browser_name: varchar("browser_name", { length: 100 }),
    operating_system: varchar("operating_system", { length: 100 }),
    device_type: varchar("device_type", { length: 50 }),
    country_name: varchar("country_name", { length: 100 }),
    city_name: varchar("city_name", { length: 105 }),
    user_name: varchar("user_name", { length: 255 }),
    user_email: varchar("user_email", { length: 255 }),
    user_phone: varchar("user_phone", { length: 50 }),
    started_at: timestamp("started_at").defaultNow(),
});

export const jobApplications = portfolio.table("job_applications", {
    id: uuid("id").primaryKey().defaultRandom(),
    company_name: varchar("company_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }).notNull(),
    job_description: text("job_description"),
    contact_name: varchar("contact_name", { length: 255 }),
    contact_email: varchar("contact_email", { length: 255 }).notNull(),
    contact_role: varchar("contact_role", { length: 255 }), // NEW: Recruiter's Role
    status: varchar("status", { length: 50 }).default('Pending').notNull(), // Pending, Sent, Replied, Rejected
    is_referral: boolean("is_referral").default(false), // NEW: Distinguish between Applications and Referrals
    user_context: text("user_context"), // NEW: Custom user input/notes
    tracking_token: uuid("tracking_token").defaultRandom(),
    email_sent_count: integer("email_sent_count").default(0),
    email_opens: integer("email_opens").default(0),
    last_opened_at: timestamp("last_opened_at"),
    last_contacted_at: timestamp("last_contacted_at"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const outreachThreads = portfolio.table("outreach_threads", {
    id: uuid("id").primaryKey().defaultRandom(),
    application_id: uuid("application_id").references(() => jobApplications.id).notNull(),
    content: text("content"), // The email body or reply
    direction: varchar("direction", { length: 20 }).notNull(), // 'inbound' (reply) or 'outbound' (sent)
    sent_at: timestamp("sent_at").defaultNow(),
});

export const aiUsageLog = portfolio.table("ai_usage_log", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_name: varchar("user_name", { length: 255 }),
    user_email: varchar("user_email", { length: 255 }),
    action_type: varchar("action_type", { length: 50 }).notNull(), // 'chat', 'email_reply', 'outreach_draft', etc.
    prompt_tokens: integer("prompt_tokens").default(0),
    completion_tokens: integer("completion_tokens").default(0),
    total_tokens: integer("total_tokens").default(0),
    provider: varchar("provider", { length: 50 }),
    created_at: timestamp("created_at").defaultNow(),
});

export const errorLog = portfolio.table("error_log", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    error_message: text("error_message").notNull(),
    error_stack: text("error_stack"),
    context: jsonb("context"),
    created_at: timestamp("created_at").defaultNow(),
});

export const enquiry = portfolio.table("enquiry", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 50 }).default("Pending").notNull(),
    created_at: timestamp("created_at").defaultNow(),
});

export const enquiryOtp = portfolio.table("enquiry_otp", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 6 }).notNull(),
    expires_at: timestamp("expires_at").notNull(),
    verified: boolean("verified").default(false),
});

export const client = portfolio.table("client", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    company_name: varchar("company_name", { length: 255 }),
    company_logo_url: text("company_logo_url"),
    phone: varchar("phone", { length: 50 }),
    must_reset_password: boolean("must_reset_password").default(true),
    created_at: timestamp("created_at").defaultNow(),
    description: text("description"),
});

export const clientProject = portfolio.table("client_project", {
    id: uuid("id").primaryKey().defaultRandom(),
    client_id: uuid("client_id").references(() => client.id).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("Inquiry").notNull(), // Inquiry, Quoted, In Progress, Testing, Completed
    cost: integer("cost").default(0).notNull(),
    discount: integer("discount").default(0).notNull(),
    deadline: timestamp("deadline"),
    created_at: timestamp("created_at").defaultNow(),
    project_image_url: text("project_image_url"),
    live_url: varchar("live_url", { length: 500 }),
});

export const projectMessage = portfolio.table("project_message", {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id").references(() => clientProject.id).notNull(),
    sender_role: varchar("sender_role", { length: 20 }).notNull(), // 'admin' or 'client'
    message: text("message").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    is_read: boolean("is_read").default(false).notNull(),
});

export const projectPayment = portfolio.table("project_payment", {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id").references(() => clientProject.id).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    amount: integer("amount").notNull(),
    status: varchar("status", { length: 50 }).default("Pending").notNull(),
    created_at: timestamp("created_at").defaultNow(),
});

export const viewOnlyAdmin = portfolio.table("view_only_admin", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    must_reset_password: boolean("must_reset_password").default(true),
    created_at: timestamp("created_at").defaultNow(),
});

export const passwordResetOtp = portfolio.table("password_reset_otp", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 6 }).notNull(),
    expires_at: timestamp("expires_at").notNull(),
    verified: boolean("verified").default(false),
});

