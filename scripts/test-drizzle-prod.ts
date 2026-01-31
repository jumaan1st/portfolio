
import { config } from 'dotenv';
import path from 'path';

// Load .env.local explicitly
config({ path: path.resolve(process.cwd(), '.env.local') });


// Static imports removed to support dynamic environment loading
// import { db } from '@/lib/db';
// import {
//     projects, blogs, profile, skills, certifications, experience, education, uiConfig, config as configTable
// } from '@/lib/schema';
// import { eq, desc, sql } from 'drizzle-orm';

async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
        const res = await fn();
        const end = performance.now();
        console.log(`[PASS] ${label} (${(end - start).toFixed(2)}ms)`);
        return res;
    } catch (e) {
        const end = performance.now();
        console.error(`[FAIL] ${label} (${(end - start).toFixed(2)}ms) - Error:`, e);
        throw e;
    }
}


async function runTests() {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import('@/lib/db');
    const {
        projects, blogs, profile, skills, certifications,
        experience, education, uiConfig, config: configTable
    } = await import('@/lib/schema');
    const { eq, desc, asc, sql } = await import('drizzle-orm');

    console.log("Starting Production Readiness Verification...");
    console.log(`DB Host: ${process.env.DB_HOST}`);

    try {
        // 1. Connection Check
        await measure("DB Connection", async () => {
            const res: any = await db.execute(sql`SELECT 1 as connected`);
            const rows = res.rows || res;
            if (!rows[0]?.connected) throw new Error("Connection failed");
        });

        // 2. Bootstrap Query (Performance Critical)
        await measure("Bootstrap Query (Single SQL)", async () => {
            // Replicating the logic from app/api/bootstrap/route.ts
            const projectsQuery = sql`(SELECT json_agg(p) FROM (SELECT id, slug, title, category, tech, description, link, github_link AS "githubLink", color, image FROM portfolio.projects ORDER BY sort_order DESC, id DESC LIMIT 3) p)`;
            const blogsQuery = sql`(SELECT json_agg(b) FROM (SELECT id, slug, title, excerpt, tags, date, read_time, image, is_hidden FROM portfolio.blogs WHERE is_hidden = FALSE ORDER BY sort_order DESC, id DESC LIMIT 3) b)`;

            const query = sql`
                SELECT json_build_object(
                    'config', (SELECT row_to_json(c) FROM (SELECT admin_email AS "adminEmail", show_welcome_modal AS "showWelcomeModal" FROM portfolio.config LIMIT 1) c),
                    'ui', (SELECT row_to_json(u) FROM (SELECT hero_tagline AS "heroTagline", status_label AS "statusLabel", blog_title AS "blogTitle", blog_subtitle AS "blogSubtitle", project_title AS "projectTitle", project_subtitle AS "projectSubtitle" FROM portfolio.ui_config LIMIT 1) u),
                    'profile', (SELECT row_to_json(pr) FROM (SELECT name, roles, role AS "currentRole", current_company AS "currentCompany", current_company_url AS "currentCompanyUrl", summary, location, email, phone, linkedin, github, twitter, resume_url AS "resumeUrl", photo_light_url AS "photoLightUrl", photo_dark_url AS "photoDarkUrl", currently_learning AS "currentlyLearning" FROM portfolio.profile LIMIT 1) pr),
                    'projects', COALESCE(${projectsQuery}, '[]'::json),
                    'blogs', COALESCE(${blogsQuery}, '[]'::json)
                ) as bootstrap_data
             `;
            const res: any = await db.execute(query);
            const rows = res.rows || res;
            if (!rows[0]?.bootstrap_data) throw new Error("Bootstrap returned empty");
        });

        // 3. Projects CRUD
        let newProjectId: number = 0;
        await measure("Projects: Create", async () => {
            const idRes = await db.select({ new_id: sql<number>`COALESCE(MAX(${projects.id}), 0) + 1` }).from(projects);
            newProjectId = idRes[0].new_id;

            await db.insert(projects).values({
                id: newProjectId,
                title: "Test Project Integration",
                slug: `test-project-${newProjectId}`,
                category: "Test",
                description: "Temporary test project",
                sort_order: 9999
            }).returning();
        });

        await measure("Projects: Read", async () => {
            const row = await db.select().from(projects).where(eq(projects.id, newProjectId));
            if (row.length === 0) throw new Error("Project not created");
        });

        await measure("Projects: Delete", async () => {
            await db.delete(projects).where(eq(projects.id, newProjectId));
            const row = await db.select().from(projects).where(eq(projects.id, newProjectId));
            if (row.length > 0) throw new Error("Project not deleted");
        });

        // 4. Schema Validation (Profile)
        await measure("Profile: Read & Validate Schema", async () => {
            const p = await db.select().from(profile).limit(1);
            if (p.length === 0) console.warn("Profile table empty, skipping validation");
            else {
                // Check if new column exists
                if (p[0].currently_learning === undefined) throw new Error("Column 'currently_learning' missing from profile");
            }
        });

        // 5. Certifications Check
        await measure("Certifications: Read", async () => {
            await db.select().from(certifications).limit(1);
        });


        console.log("\nVerification Completed Successfully!");
        process.exit(0);

    } catch (e) {
        console.error("\nVerification Failed!", e);
        process.exit(1);
    }
}

runTests();
