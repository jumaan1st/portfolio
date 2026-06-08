import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
    profile as profileTable, 
    projects as projectsTable, 
    blogs as blogsTable, 
    skills as skillsTable, 
    certifications as certificationsTable 
} from '@/lib/schema';
import { desc, eq, asc } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// Initialize S3 Client (Cloudflare R2 compatible)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

// --- SVG GENERATORS (REPLACES THIRD PARTY WIDGETS) ---

function generateHeaderSvg(name: string, role: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 220" width="100%">
        <defs>
            <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4f46e5" />
                <stop offset="50%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#db2777" />
            </linearGradient>
            <style>
                .name { font-family: system-ui, -apple-system, sans-serif; font-size: 46px; font-weight: 800; fill: #ffffff; text-anchor: middle; }
                .role { font-family: system-ui, -apple-system, sans-serif; font-size: 18px; font-weight: 600; fill: #e0e7ff; text-anchor: middle; letter-spacing: 2px; }
                .border-line { stroke: rgba(255, 255, 255, 0.15); stroke-width: 1.5; }
            </style>
        </defs>
        <rect width="800" height="220" rx="16" fill="url(#headerGrad)"/>
        
        <!-- Grid overlay -->
        <path d="M0 44 H800 M0 88 H800 M0 132 H800 M0 176 H800" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <path d="M100 0 V220 M200 0 V220 M300 0 V220 M400 0 V220 M500 0 V220 M600 0 V220 M700 0 V220" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        
        <!-- Dynamic content -->
        <text x="50%" y="105" class="name">${name}</text>
        <text x="50%" y="150" class="role">${role.toUpperCase()}</text>
    </svg>`;
}

function getSkillEmoji(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('react')) return '⚛️';
    if (n.includes('next')) return '▲';
    if (n.includes('node')) return '🟢';
    if (n.includes('java') && !n.includes('javascript')) return '☕';
    if (n.includes('javascript') || n.includes('js')) return '🟨';
    if (n.includes('typescript') || n.includes('ts')) return '🟦';
    if (n.includes('python')) return '🐍';
    if (n.includes('postgres') || n.includes('sql') || n.includes('db') || n.includes('mongo') || n.includes('hibernate')) return '🗄️';
    if (n.includes('docker')) return '🐳';
    if (n.includes('git')) return '🐙';
    if (n.includes('linux')) return '🐧';
    if (n.includes('html') || n.includes('css') || n.includes('tailwind')) return '🎨';
    if (n.includes('spring')) return '🌱';
    return '⚡';
}

function generateSkillsSvg(skills: { name: string | null }[]): string {
    const svgWidth = 800;
    const pillHeight = 36;
    const hGap = 12;
    const vGap = 14;
    const paddingLeft = 20;
    const paddingTop = 20;

    let currentX = paddingLeft;
    let currentY = paddingTop;
    const pills: string[] = [];

    // Harmonized palette for modern tech look
    const colors = [
        '#6366f1', // Indigo
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#8b5cf6', // Violet
        '#14b8a6', // Teal
        '#f43f5e', // Rose
        '#06b6d4'  // Cyan
    ];

    skills.forEach((skill, index) => {
        const skillName = skill.name || 'Unknown';
        const emoji = getSkillEmoji(skillName);
        // Approximate width based on character count + padding + extra for emoji
        const textWidth = Math.ceil(skillName.length * 8.5) + 52;
        const pillWidth = textWidth;

        // Wrap row if out of bounds
        if (currentX + pillWidth > svgWidth - paddingLeft) {
            currentX = paddingLeft;
            currentY += pillHeight + vGap;
        }

        const color = colors[index % colors.length];

        pills.push(`
            <g transform="translate(${currentX}, ${currentY})">
                <rect width="${pillWidth}" height="${pillHeight}" rx="18" fill="#1e293b" stroke="${color}" stroke-width="1.5" />
                <text x="18" y="23" font-size="14">${emoji}</text>
                <text x="${(pillWidth + 24) / 2}" y="22" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#f8fafc" text-anchor="middle">${skillName}</text>
            </g>
        `);

        currentX += pillWidth + hGap;
    });

    const totalHeight = skills.length === 0 ? 100 : currentY + pillHeight + paddingTop;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${totalHeight}" width="100%">
        <rect width="${svgWidth}" height="${totalHeight}" rx="16" fill="#0f172a" />
        ${skills.length === 0 ? `
            <text x="50%" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">No skills added yet.</text>
        ` : pills.join('\n')}
    </svg>`;
}

function generateCertificationsSvg(certs: { name: string | null; issuer: string | null; date: string | null }[]): string {
    const svgWidth = 800;
    const cardHeight = 70;
    const gap = 12;
    const padding = 20;

    const cards: string[] = [];
    let currentY = padding;

    // Harmonized palette for certifications
    const colors = [
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#3b82f6', // Blue
        '#10b981'  // Emerald
    ];

    certs.forEach((cert, index) => {
        const color = colors[index % colors.length];
        const certName = cert.name || 'Certification';
        const certIssuer = cert.issuer || 'Unknown';
        const certDate = cert.date || '';

        cards.push(`
            <g transform="translate(${padding}, ${currentY})">
                <rect width="${svgWidth - padding * 2}" height="${cardHeight}" rx="12" fill="#1e293b" stroke="${color}" stroke-width="1.5" />
                
                <!-- Icon representation -->
                <rect x="16" y="15" width="40" height="40" rx="8" fill="#2d3748" />
                <text x="36" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="${color}" text-anchor="middle">🎓</text>
                
                <!-- Cert details -->
                <text x="72" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">${certName}</text>
                <text x="72" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="medium" fill="#94a3b8">${certIssuer} • ${certDate}</text>
            </g>
        `);
        currentY += cardHeight + gap;
    });

    const totalHeight = certs.length === 0 ? 100 : currentY - gap + padding;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${totalHeight}" width="100%">
        <rect width="${svgWidth}" height="${totalHeight}" rx="16" fill="#0f172a" />
        ${certs.length === 0 ? `
            <text x="50%" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">No credentials uploaded yet.</text>
        ` : cards.join('\n')}
    </svg>`;
}

// Helper to generate content
async function buildProfileData() {
    // 1. Fetch Profile
    const profileRes = await db.select().from(profileTable).limit(1);
    const profile = profileRes[0];

    // 2. Fetch Projects
    const projects = await db.select({
        title: projectsTable.title,
        description: projectsTable.description,
        tech: projectsTable.tech,
        link: projectsTable.link
    })
    .from(projectsTable)
    .orderBy(desc(projectsTable.id))
    .limit(4);

    // 3. Fetch Blogs
    const blogs = await db.select({
        id: blogsTable.id,
        title: blogsTable.title,
        excerpt: blogsTable.excerpt
    })
    .from(blogsTable)
    .where(eq(blogsTable.is_hidden, false))
    .orderBy(desc(blogsTable.date))
    .limit(4);

    // 4. Fetch Skills & Certs
    const skills = await db.select({ name: skillsTable.name }).from(skillsTable).orderBy(asc(skillsTable.id));
    const certs = await db.select({ name: certificationsTable.name, issuer: certificationsTable.issuer, date: certificationsTable.date }).from(certificationsTable).orderBy(desc(certificationsTable.id));

    // Construct properties
    const username = process.env.GITHUB_USERNAME || '';
    const name = profile?.name || username || 'Developer';
    const role = profile?.role || 'Full-Stack Developer';
    const summary = profile?.summary || 'Welcome to my profile!';
    const location = profile?.location || 'Earth';

    let learningTopic = 'New Tech';
    try {
        const learningData = typeof (profile as any)?.currently_learning === 'string'
            ? JSON.parse((profile as any).currently_learning)
            : (profile as any)?.currently_learning;

        if (Array.isArray(learningData) && learningData.length > 0) {
            const firstItem = learningData[0];
            learningTopic = typeof firstItem === 'string' ? firstItem : (firstItem?.topic || 'New Tech');
        } else if (learningData && typeof learningData === 'object' && (learningData as any).topic) {
            learningTopic = (learningData as any).topic;
        }
    } catch (e) {
        learningTopic = 'New Tech';
    }

    // SVG Public URLs on R2
    const publicUrl = R2_PUBLIC_URL?.replace(/\/$/, '') || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;
    
    // Use timestamp query parameters to bust GitHub cache
    const ts = Date.now();
    const headerR2Url = `${publicUrl}/github-profile/header.svg?t=${ts}`;
    const skillsR2Url = `${publicUrl}/github-profile/skills.svg?t=${ts}`;
    const certsR2Url = `${publicUrl}/github-profile/certifications.svg?t=${ts}`;

    // Markdown Content
    const markdown = `<!--
  AUTO-GENERATED BY PORTFOLIO APP
  Last Updated: ${new Date().toISOString()}
-->

<div align="center">
  <img src="${headerR2Url}" width="100%"/>
</div>

<div align="center">
  
  [![Portfolio](https://img.shields.io/badge/✨_View_My_Interactive_Portfolio-7025F5?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.jumaan.me)
  
  ${profile?.linkedin ? `<a href="${profile.linkedin}"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>` : ''}
  ${profile?.email ? `<a href="mailto:${profile.email}"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" /></a>` : ''}
  ${profile?.twitter ? `<a href="${profile.twitter}"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>` : ''}

</div>

<br />

### 👨‍💻 About Me

- 🔭 I’m currently working as a **${role}**
- 🌱 I’m currently exploring **${learningTopic}**
- 🏙️ Based in **${location}**
- 📄 ${summary}

<br />

### 🛠️ Tech Stack & Skills

<div align="center">
  <img src="${skillsR2Url}" width="100%"/>
</div>

<br />

### 🚀 Featured Projects

${projects.map((p: any) => {
    let techStack = [];
    try { techStack = typeof p.tech === 'string' ? JSON.parse(p.tech) : p.tech || []; } catch (e) { }
    const techString = techStack.slice(0, 5).join(' • ');
    return `- **[${p.title}](${p.link || '#'})**: ${p.description} <br/> _Stack:_ \`${techString}\``;
}).join('\n')}

<br />

### 📜 Certifications & Credentials

<div align="center">
  <img src="${certsR2Url}" width="100%"/>
</div>

<br />

### ✍️ Latest Articles

${blogs && blogs.length > 0 ? blogs.map((b: any) => {
    const cleanExcerpt = b.excerpt ? b.excerpt.replace(/<[^>]*>?/gm, "") : "";
    const shortExcerpt = cleanExcerpt.length > 100 ? cleanExcerpt.substring(0, 100) + '...' : cleanExcerpt;
    return `- **[${b.title}](https://www.jumaan.me/blogs/${b.id})**: ${shortExcerpt}`;
}).join('\n') : '_No articles yet._'}

<br />

<div align="center">
  <h3>✍️ Read My Blogs</h3>
  <p>I write about technology, coding, and my journey.</p>
  <a href="https://www.jumaan.me/blogs">
    <img src="https://img.shields.io/badge/📖_Read_My_Blogs_on_Jumaan.me-7025F5?style=for-the-badge&logo=hashnode&logoColor=white" alt="Read My Blogs" />
  </a>
</div>

<br />

<div align="center">
  <i>"The only way to do great work is to love what you do."</i>
  <br/>
  — <b>Steve Jobs</b>
</div>
`;

    return {
        markdown,
        name,
        role,
        skills,
        certs,
        headerR2Url,
        skillsR2Url,
        certsR2Url
    };
}

// GET: Returns README preview + SVG URLs + SVG code (does not write to Github)
export async function GET() {
    try {
        const payload = await buildProfileData();
        
        // Render SVGs inline
        const headerSvg = generateHeaderSvg(payload.name, payload.role);
        const skillsSvg = generateSkillsSvg(payload.skills);
        const certsSvg = generateCertificationsSvg(payload.certs);

        return NextResponse.json({
            success: true,
            markdown: payload.markdown,
            svgs: {
                headerUrl: payload.headerR2Url,
                skillsUrl: payload.skillsR2Url,
                certsUrl: payload.certsR2Url,
                headerSvg,
                skillsSvg,
                certsSvg
            }
        });
    } catch (e: any) {
        console.error("GET Previews Error:", e);
        return NextResponse.json({ success: false, error: e.message || "Failed to generate previews" }, { status: 500 });
    }
}

// POST: Uploads SVGs to R2 and syncs README to Github
export async function POST() {
    try {
        const token = process.env.GITHUB_TOKEN;
        const username = process.env.GITHUB_USERNAME;

        if (!token || !username) {
            return NextResponse.json({ error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME in env.' }, { status: 500 });
        }

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
            return NextResponse.json({ error: 'Missing Cloudflare R2 configurations in env.' }, { status: 500 });
        }

        // 1. Fetch data & build README
        const data = await buildProfileData();

        // 2. Render SVGs
        const headerSvg = generateHeaderSvg(data.name, data.role);
        const skillsSvg = generateSkillsSvg(data.skills);
        const certsSvg = generateCertificationsSvg(data.certs);

        // 3. Upload generated SVGs to R2
        console.log("[GitHub Sync] Uploading Header SVG to R2...");
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: 'github-profile/header.svg',
            Body: Buffer.from(headerSvg),
            ContentType: 'image/svg+xml',
            CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
        }));

        console.log("[GitHub Sync] Uploading Skills SVG to R2...");
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: 'github-profile/skills.svg',
            Body: Buffer.from(skillsSvg),
            ContentType: 'image/svg+xml',
            CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
        }));

        console.log("[GitHub Sync] Uploading Certifications SVG to R2...");
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: 'github-profile/certifications.svg',
            Body: Buffer.from(certsSvg),
            ContentType: 'image/svg+xml',
            CacheControl: 'max-age=0, no-cache, no-store, must-revalidate',
        }));

        console.log("[GitHub Sync] SVGs successfully uploaded to R2.");

        // 4. Sync README to GitHub repo
        const repo = username;
        const path = 'README.md';
        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

        // A. Get current SHA if file exists
        let sha;
        const getRes = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Portfolio-App'
            }
        });

        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        // B. Write new file to GitHub repo
        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Portfolio-App'
            },
            body: JSON.stringify({
                message: 'chore: update profile readme via portfolio app with self-hosted SVGs',
                content: Buffer.from(data.markdown).toString('base64'),
                sha
            })
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            return NextResponse.json({ error: `GitHub API Error: ${errText}` }, { status: putRes.status });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'GitHub profile README and self-hosted SVGs updated successfully!' 
        });

    } catch (error: any) {
        console.error('GitHub Sync Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
