
import { config } from 'dotenv';
config({ path: '.env.local' });
console.log("DB_HOST:", process.env.DB_HOST);
import { db } from '@/lib/db';
import { projects, blogs, profile, skills, education, experience } from '@/lib/schema';
import { sql } from 'drizzle-orm';

async function verify() {
    console.log("Verifying Drizzle Connections...");
    try {
        // 1. Profile
        console.log("Fetching Profile...");
        const p = await db.select().from(profile).limit(1);
        console.log("Profile:", p.length > 0 ? "Found" : "Not Found");
        if (p.length > 0) console.log("Profile Name:", p[0].name);

        // 2. Projects
        console.log("Fetching Projects...");
        const proj = await db.select().from(projects).limit(1);
        console.log("Projects:", proj.length > 0 ? "Found" : "Not Found");

        // 3. Blogs
        console.log("Fetching Blogs...");
        const b = await db.select().from(blogs).limit(1);
        console.log("Blogs:", b.length > 0 ? "Found" : "Not Found");

        // 4. Skills
        console.log("Fetching Skills...");
        const s = await db.select().from(skills).limit(1);
        console.log("Skills:", s.length > 0 ? "Found" : "Not Found");

        // 5. Experience
        console.log("Fetching Experience...");
        const exp = await db.select().from(experience).limit(1);
        console.log("Experience:", exp.length > 0 ? "Found" : "Not Found");

        // 6. Education
        console.log("Fetching Education...");
        const edu = await db.select().from(education).limit(1);
        console.log("Education:", edu.length > 0 ? "Found" : "Not Found");

        console.log("Verification Passed!");
        process.exit(0);

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
}

verify();
