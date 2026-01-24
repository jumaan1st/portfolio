
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getBootstrapData = unstable_cache(
    async (mode: string = 'public') => {
        // PUBLIC MODE FETCHES:
        // - Config (single)
        // - UI Config (single)
        // - Profile (single)
        // - Skills (all)
        // - Certifications (all)
        // - Featured Projects (limit 5, summary only)
        // - Latest Blogs (limit 3, summary only)

        // ADMIN/FULL MODE FETCHES:
        // - Everything above (but all projects/blogs) + Experience + Education

        const isFull = mode === 'admin' || mode === 'full';

        const projectsQuery = isFull
            ? `(SELECT json_agg(p) FROM (SELECT * FROM portfolio.projects ORDER BY sort_order DESC, id DESC) p)`
            : `(SELECT json_agg(p) FROM (SELECT id, title, category, tech, description, link, github_link AS "githubLink", color, image FROM portfolio.projects ORDER BY sort_order DESC, id DESC LIMIT 3) p)`;

        const blogsQuery = isFull
            ? `(SELECT json_agg(b) FROM (SELECT * FROM portfolio.blogs ORDER BY sort_order DESC, id DESC) b)`
            : `(SELECT json_agg(b) FROM (SELECT id, title, excerpt, tags, date, read_time, image, is_hidden FROM portfolio.blogs WHERE is_hidden = FALSE ORDER BY sort_order DESC, id DESC LIMIT 3) b)`;

        // Additional tables for full mode
        const experienceQuery = isFull
            ? `(SELECT json_agg(e) FROM (SELECT * FROM portfolio.experience ORDER BY start_date DESC NULLS LAST, id DESC) e)`
            : `'[]'::json`;

        const educationQuery = isFull
            ? `(SELECT json_agg(edu) FROM (SELECT * FROM portfolio.education ORDER BY start_date DESC NULLS LAST, id DESC) edu)`
            : `'[]'::json`;

        const query = `
      SELECT json_build_object(
        'config', (SELECT row_to_json(c) FROM (SELECT admin_email AS "adminEmail", show_welcome_modal AS "showWelcomeModal" FROM portfolio.config LIMIT 1) c),
        'ui', (SELECT row_to_json(u) FROM (SELECT hero_tagline AS "heroTagline", status_label AS "statusLabel", blog_title AS "blogTitle", blog_subtitle AS "blogSubtitle", project_title AS "projectTitle", project_subtitle AS "projectSubtitle" FROM portfolio.ui_config LIMIT 1) u),
        'profile', (SELECT row_to_json(pr) FROM (SELECT name, roles, role AS "currentRole", current_company AS "currentCompany", current_company_url AS "currentCompanyUrl", summary, location, email, phone, linkedin, github, twitter, resume_url AS "resumeUrl", photo_light_url AS "photoLightUrl", photo_dark_url AS "photoDarkUrl", currently_learning AS "currentlyLearning" FROM portfolio.profile LIMIT 1) pr),
        'skills', COALESCE((SELECT json_agg(s) FROM (SELECT * FROM portfolio.skills ORDER BY id ASC) s), '[]'::json),
        'certifications', COALESCE((SELECT json_agg(ce) FROM (SELECT * FROM portfolio.certifications ORDER BY id DESC) ce), '[]'::json),
        'projects', COALESCE(${projectsQuery}, '[]'::json),
        'blogs', COALESCE(${blogsQuery}, '[]'::json),
        'experience', COALESCE(${experienceQuery}, '[]'::json),
        'education', COALESCE(${educationQuery}, '[]'::json)
      ) as bootstrap_data
    `;

        const { rows } = await pool.query(query);
        return rows[0]?.bootstrap_data || {};
    },
    ['bootstrap-data'],
    { tags: ['profile', 'config', 'ui', 'skills', 'projects', 'blogs', 'experience', 'education'], revalidate: 3600 }
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'public';

        const data = await getBootstrapData(mode);

        // Post-processing
        if (data.profile) {
            if (typeof data.profile.currentlyLearning === 'string') {
                try { data.profile.currentlyLearning = JSON.parse(data.profile.currentlyLearning); } catch (e) { data.profile.currentlyLearning = []; }
            }
        }

        if (data.profile.roles && typeof data.profile.roles === 'string') {
            // Just in case it comes back as string from some older logic, but usually Postgres json_agg handles it?
            // Wait, 'roles' is text[] or jsonb? user provided code shows `roles` being selected directly.
            // If it's a TEXT array in postgres, node-postgres might return it as array.
            // If it's stored as JSON string, we need to parse.
            // Looking at Profile route, it seems `roles` is fetched directly.
        }

        // Projects tech/features need parsing?
        // In `api/projects/route.ts`, `tech` is stored as `JSON.stringify(tech)`.
        // Wait, inserting is JSON.stringify, implying the column type is likely TEXT or JSON. 
        // If it's JSON/JSONB column, pg returns object. If TEXT, it returns string.
        // The profile `currently_learning` was manually parsed in `getProfile`.
        // Let's assume we might need to parse JSON fields if they are strings.

        // Helper to safely parse
        const safeParse = (obj: any, keys: string[]) => {
            if (!obj) return;
            keys.forEach(key => {
                if (typeof obj[key] === 'string') {
                    try { obj[key] = JSON.parse(obj[key]); } catch { }
                }
            });
        };

        if (data.projects) {
            data.projects.forEach((p: any) => safeParse(p, ['tech', 'features']));
        }

        if (data.blogs) {
            data.blogs.forEach((b: any) => safeParse(b, ['tags']));
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching bootstrap data:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
