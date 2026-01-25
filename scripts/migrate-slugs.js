const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } // Assuming cloud DB for migration
});

const toSlug = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

async function migrate() {
    try {
        console.log('Starting Migration...');

        // 1. Add Columns if they don't exist
        await pool.query('ALTER TABLE portfolio.blogs ADD COLUMN IF NOT EXISTS slug TEXT;');
        await pool.query('ALTER TABLE portfolio.projects ADD COLUMN IF NOT EXISTS slug TEXT;');

        console.log('Columns added.');

        // Helper to ensure unique slug
        const getUniqueSlug = async (table, baseSlug, id) => {
            let slug = baseSlug;
            let counter = 1;
            while (true) {
                const res = await pool.query(`SELECT id FROM portfolio.${table} WHERE slug = $1 AND id != $2`, [slug, id]);
                if (res.rows.length === 0) return slug;
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
        };

        // 2. Backfill Blogs
        console.log('--- Migrating Blogs ---');
        const blogs = await pool.query('SELECT id, title, slug FROM portfolio.blogs ORDER BY id');
        for (const blog of blogs.rows) {
            if (blog.slug) continue; // Skip if already has slug

            let baseSlug = toSlug(blog.title);
            if (!baseSlug) baseSlug = `post-${blog.id}`;

            const finalSlug = await getUniqueSlug('blogs', baseSlug, blog.id);

            await pool.query('UPDATE portfolio.blogs SET slug = $1 WHERE id = $2', [finalSlug, blog.id]);
            console.log(`Updated Blog [${blog.id}]: "${blog.title}" -> "${finalSlug}"`);
        }

        // 3. Backfill Projects
        console.log('--- Migrating Projects ---');
        const projects = await pool.query('SELECT id, title, slug FROM portfolio.projects ORDER BY id');
        for (const project of projects.rows) {
            if (project.slug) continue;

            let baseSlug = toSlug(project.title);
            if (!baseSlug) baseSlug = `project-${project.id}`;

            const finalSlug = await getUniqueSlug('projects', baseSlug, project.id);

            await pool.query('UPDATE portfolio.projects SET slug = $1 WHERE id = $2', [finalSlug, project.id]);
            console.log(`Updated Project [${project.id}]: "${project.title}" -> "${finalSlug}"`);
        }

        // 4. Add Constraints
        console.log('--- Adding Constraints ---');
        try {
            await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS blogs_slug_idx ON portfolio.blogs (slug)');
            await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_idx ON portfolio.projects (slug)');
            console.log('Unique indexes created successfully.');
        } catch (e) {
            console.warn('Warning creating indexes:', e.message);
        }

        console.log('Migration Complete!');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
