import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobApplications, profile, skills, projects, outreachThreads } from '@/lib/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { callAI } from '@/lib/ai-manager';

export async function POST(req: Request) {
    try {
        const { applicationId, type = 'initial' } = await req.json();

        if (!applicationId) {
            return NextResponse.json({ success: false, error: 'Application ID required' }, { status: 400 });
        }

        // 1. Fetch Context
        const [myProfile] = await db.select().from(profile).limit(1);
        const mySkills = await db.select().from(skills);
        const myProjects = await db.select().from(projects);

        const [app] = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId));

        if (!app) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        // Fetch Thread History
        // Fetch Thread History (Limit to last 5 to keep context relevant)
        // Fetch Only Last Message
        const historyRaw = await db.select().from(outreachThreads)
            .where(eq(outreachThreads.application_id, applicationId))
            .orderBy(desc(outreachThreads.sent_at))
            .limit(1);

        const historyText = historyRaw.length > 0
            ? `Date: ${historyRaw[0].sent_at?.toDateString()}\n[${historyRaw[0].direction.toUpperCase()}]: ${historyRaw[0].content}`
            : "No previous history.";

        const skillsList = mySkills.map(s => s.name).join(', ');
        const projectsList = myProjects.map(p => `${p.title} (${p.tech?.join(', ')})`).join('; ');

        // 2. Construct Prompt Logic
        const isReferral = app.is_referral;
        const contactName = app.contact_name || 'Hiring Manager';
        const contactRole = app.contact_role || 'Recruiter/Employee';
        const isFollowUp = type !== 'initial';

        let promptTask = '';
        if (isReferral) {
            promptTask = `Task: Write a ${isFollowUp ? 'follow-up' : 'POLITE and PROFESSIONAL'} message asking for a job referral or introduction to the hiring team.
            Audience: ${contactName}, who is a ${contactRole} at ${app.company_name}.
            Goal: Establish a connection, briefly showcase value (projects), and ask if they can refer me for the ${app.role} role.`;
        } else {
            promptTask = `Task: Write a ${isFollowUp ? 'follow-up' : 'cold outreach'} email to apply for the ${app.role} position.
            Audience: ${contactName}, who is a ${contactRole} at ${app.company_name}.
            Goal: Convince them to review my resume and interview me.`;
        }

        const today = new Date().toDateString();
        const lastContacted = app.last_contacted_at ? new Date(app.last_contacted_at).toDateString() : 'Never';

        // 2. Construct Prompt
        const prompt = `
            You are ${myProfile.name}, a ${myProfile.role}.
            
            Current Date: ${today}
            
            ${promptTask}
            
            My Contact Info:
            - Email: ${myProfile.email}
            - Phone: ${myProfile.phone || 'Not provided'}
            - LinkedIn: ${myProfile.linkedin}
            - GitHub: ${myProfile.github}
            - Portfolio: ${process.env.WESITE_LINK || 'https://jumaan.me'}

            Job Context:
            - Company: ${app.company_name}
            - Role: ${app.role}
            - Job Description snippet: "${app.job_description?.slice(0, 800)}..."
            - Last Communicated Date: ${lastContacted}
            
            ${app.user_context ? `
            IMPORTANT - USER NOTES / CONTEXT:
            "${app.user_context}"
            (Make sure to incorporate these specific instructions or context into the email.)
            ` : ''}

            Previous Communication (Last Message):
            ${historyText}
            
            My Skills: ${skillsList}
            My Projects: ${projectsList}
            
            Instructions:
            1. **Subject Line**: Create a catchy but professional subject line.
            2. **Body**: 
               - Professional tone.
               - **Focus on Technical Fit**: Don't just say "I want to connect". Explain specifically *how* my skills/projects solve the problems found in the Job Description.
               - **Resume Attached**: Explicitly mention "I have attached my resume for your review" or similar clear indication that the resume is included.
               - Keep it under 200 words.
               - Use HTML formatting (<p>, <b>, <br>) for the body.
               - **Include a Greeting**: Start with a professional greeting appropriate for the context (e.g., "Hi [Name]" or "Dear Hiring Manager").
            3. **Output Format**: JSON ONLY. { "subject": "...", "body": "..." }
        `;

        // 3. Call AI
        let aiResponse = await callAI(prompt);

        // Clean markdown ```json ... ``` wrapper if present
        aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(aiResponse);

            parsed.body = parsed.body.trim();

        } catch (e) {
            // Fallback if AI fails to output valid JSON
            console.error("AI JSON Parse Failed:", aiResponse);
            parsed = {
                subject: `Application for ${app.role} at ${app.company_name}`,
                body: `<p>Hi ${app.contact_name || 'Hiring Team'},</p><p>I am interested in the ${app.role} position...</p><p>${aiResponse}</p>`
            };
        }

        return NextResponse.json({ success: true, draft: parsed });

    } catch (error) {
        console.error('Draft Gen Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate draft' }, { status: 500 });
    }
}
