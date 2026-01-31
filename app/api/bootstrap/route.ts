
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    config, uiConfig, profile, skills, certifications,
    projects, blogs, experience, education
} from '@/lib/schema';
import { desc, asc, eq, and, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

const getBootstrapData = unstable_cache(
    async (mode: string = 'public') => {
        const includeDetails = mode === 'admin' || mode === 'full';
        const includeHeavy = mode === 'full';

        // Define queries
        const configQuery = db.select({
            adminEmail: config.admin_email,
            showWelcomeModal: config.show_welcome_modal
        }).from(config).limit(1);

        const uiQuery = db.select({
            heroTagline: uiConfig.hero_tagline,
            statusLabel: uiConfig.status_label,
            blogTitle: uiConfig.blog_title,
            blogSubtitle: uiConfig.blog_subtitle,
            projectTitle: uiConfig.project_title,
            projectSubtitle: uiConfig.project_subtitle
        }).from(uiConfig).limit(1);

        const profileQuery = db.select({
            name: profile.name,
            roles: profile.roles,
            currentRole: profile.role,
            currentCompany: profile.current_company,
            currentCompanyUrl: profile.current_company_url,
            summary: profile.summary,
            location: profile.location,
            email: profile.email,
            phone: profile.phone,
            linkedin: profile.linkedin,
            github: profile.github,
            twitter: profile.twitter,
            resumeUrl: profile.resume_url,
            photoLightUrl: profile.photo_light_url,
            photoDarkUrl: profile.photo_dark_url,
            currentlyLearning: profile.currently_learning
        }).from(profile).limit(1);

        const skillsQuery = db.select().from(skills).orderBy(asc(skills.id));

        const certificationsQuery = db.select().from(certifications).orderBy(desc(certifications.id));

        // Projects
        let projectsQuery;
        if (includeHeavy) {
            projectsQuery = db.select().from(projects).orderBy(desc(projects.sort_order), desc(projects.id));
        } else {
            projectsQuery = db.select({
                id: projects.id,
                slug: projects.slug,
                title: projects.title,
                category: projects.category,
                tech: projects.tech,
                description: projects.description,
                link: projects.link,
                githubLink: projects.github_link,
                color: projects.color,
                image: projects.image
            }).from(projects).orderBy(desc(projects.sort_order), desc(projects.id)).limit(3);
        }

        // Blogs
        let blogsQuery;
        if (includeHeavy) {
            blogsQuery = db.select().from(blogs).orderBy(desc(blogs.sort_order), desc(blogs.id));
        } else {
            blogsQuery = db.select({
                id: blogs.id,
                slug: blogs.slug,
                title: blogs.title,
                excerpt: blogs.excerpt,
                tags: blogs.tags,
                date: blogs.date,
                read_time: blogs.read_time,
                image: blogs.image,
                is_hidden: blogs.is_hidden
            }).from(blogs)
                .where(eq(blogs.is_hidden, false))
                .orderBy(desc(blogs.sort_order), desc(blogs.id))
                .limit(3);
        }

        // Experience & Education (Fetch in admin or full mode)
        const experienceQuery = includeDetails
            ? db.select().from(experience).orderBy(sql`${experience.start_date} DESC NULLS LAST`, desc(experience.id))
            : Promise.resolve([]);

        const educationQuery = includeDetails
            ? db.select().from(education).orderBy(sql`${education.start_date} DESC NULLS LAST`, desc(education.id))
            : Promise.resolve([]);

        // Execute in parallel
        const [
            configRes, uiRes, profileRes,
            skillsRes, certificationsRes,
            projectsRes, blogsRes,
            experienceRes, educationRes
        ] = await Promise.all([
            configQuery, uiQuery, profileQuery,
            skillsQuery, certificationsQuery,
            projectsQuery, blogsQuery,
            experienceQuery, educationQuery
        ]);

        return {
            config: configRes[0] || {},
            ui: uiRes[0] || {},
            profile: profileRes[0] || {},
            skills: skillsRes,
            certifications: certificationsRes,
            projects: projectsRes,
            blogs: blogsRes,
            experience: experienceRes,
            education: educationRes
        };
    },
    ['bootstrap-data'],
    { tags: ['profile', 'config', 'ui', 'skills', 'projects', 'blogs', 'experience', 'education', 'certifications'], revalidate: 3600 }
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'public';

        const data = await getBootstrapData(mode);

        // Ensure JSON parsing if necessary (Drizzle usually handles jsonb automatically, 
        // but explicit checks prevent runtime errors if data was stored as string previously)
        // Profile roles/learning
        const p = data.profile as any;
        if (typeof p.roles === 'string') try { p.roles = JSON.parse(p.roles) } catch { }
        if (typeof p.currentlyLearning === 'string') try { p.currentlyLearning = JSON.parse(p.currentlyLearning) } catch { }

        // Projects tech/features
        if (data.projects) {
            data.projects.forEach((proj: any) => {
                if (typeof proj.tech === 'string') try { proj.tech = JSON.parse(proj.tech) } catch { }
                if (typeof proj.features === 'string') try { proj.features = JSON.parse(proj.features) } catch { }
            });
        }

        // Blogs tags
        if (data.blogs) {
            data.blogs.forEach((b: any) => {
                if (typeof b.tags === 'string') try { b.tags = JSON.parse(b.tags) } catch { }
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching bootstrap data:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
