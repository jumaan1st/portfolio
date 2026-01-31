import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { review, profile, aiEmailUsage } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { callAI } from '@/lib/ai-manager';

export async function POST(request: Request) {
    try {
        const { name, email, message, type } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Sanitization
        const cleanName = name.trim();
        const cleanEmail = email.toLowerCase().trim();
        const cleanMessage = message.trim();
        const requestType = type || "Contact";

        const messageToStore = `[${requestType}] ${cleanMessage}`;
        const today = new Date().toISOString().split('T')[0];

        // 1. Store in DB (Synchronous - Critical)
        console.log(`[Contact API] Saving ${requestType} from ${cleanEmail}`);

        // Use portfolio.review table
        await db.insert(review).values({
            name: cleanName,
            email: cleanEmail,
            feedback: messageToStore,
            stars: 5,
        });
        console.log(`[Contact API] Saved to portfolio.review.`);

        // 2. Background Task: AI Email (Fire-and-Forget)
        const sendEmailTask = async () => {
            try {
                // Fetch Profile
                const profileResult = await db.select({
                    name: profile.name,
                    current_company: profile.current_company,
                    current_role: profile.role,
                    linkedin: profile.linkedin,
                    github: profile.github
                }).from(profile).limit(1);

                const profileData = profileResult[0]; // Renamed local var to avoid conflict


                // AI Prompt Construction
                let aiPrompt = "";
                const baseContext = `You are ${profileData.name}, a ${profileData.current_role} at ${profileData.current_company}.`;
                const toneInstruction = "Analyze the sender's message tone. If casual, be friendly. If formal, be professional.";

                // IMPORTANT: We ask AI to handle the full email body including greeting and signature.
                // We provide the name explicitly to avoid placeholders.
                // We use <br> tags in the prompt instruction because 'marked' often squashes newlines.
                const structureInstruction = `Start with "Hi ${name}," and end with the signature exactly like this:\nBest regards,<br>${profileData.name}<br>${profileData.current_role}<br>${profileData.current_company}`;

                if (requestType === "Project Review") {
                    aiPrompt = `
                        ${baseContext}
                        User's Review: "${message}"
                        Task: Write a personalized reply to ${name}.
                        1. ${toneInstruction}
                        2. Thank them for the review.
                        3. Keep it concise (under 150 words).
                        4. ${structureInstruction}
                    `;
                } else {
                    aiPrompt = `
                        ${baseContext}
                        User's Inquiry: "${message}"
                        Task: Write a personalized reply to ${name}.
                        1. ${toneInstruction}
                        2. Acknowledge their specific inquiry.
                        3. Confirm receipt and promise a follow-up.
                        4. Keep it concise (under 100 words).
                        5. ${structureInstruction}
                    `;
                }

                // Rate Limiting Logic (New Schema: email_count, name, email_date)
                let allowAI = true;
                let aiEmailBody = "";

                try {
                    // Check usage (Strictly by Email + Date, ignoring Name for counting)
                    const usageRes = await db.select({
                        usage_id: aiEmailUsage.usage_id,
                        email_count: aiEmailUsage.email_count
                    })
                        .from(aiEmailUsage)
                        .where(and(eq(aiEmailUsage.email, cleanEmail), eq(aiEmailUsage.email_date, today)))
                        .limit(1);

                    if (usageRes.length > 0) {
                        const { usage_id, email_count } = usageRes[0];

                        // Drizzle returns number or possibly string for counts, assuming number from schema definition
                        if ((email_count || 0) >= 5) {
                            allowAI = false;
                            console.warn(`[Contact API] Rate limit exceeded for ${cleanEmail}. Sending generic email.`);
                        } else {
                            // Increment Usage
                            await db.update(aiEmailUsage)
                                .set({ email_count: sql`${aiEmailUsage.email_count} + 1` })
                                .where(eq(aiEmailUsage.usage_id, usage_id));
                        }
                    } else {
                        // Insert New Record
                        await db.insert(aiEmailUsage).values({
                            email: cleanEmail,
                            name: cleanName,
                            email_date: today,
                            email_count: 1
                        });
                    }
                } catch (dbError) {
                    console.error("Rate Limit DB Error:", dbError);
                    // Continue to allow AI if DB fail? Or safely fallback?
                    // Let's assume we allow AI but log the error to avoid blocking the user experience due to internal db issues.
                }

                if (!allowAI) {
                    // Generic Fallback
                    aiEmailBody = `
                        Hi ${name},<br><br>
                        Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                        (Auto-Reply: Daily AI limit reached, but your message is safe!)<br><br>
                        Best regards,<br>
                        ${profileData.name}<br>
                        ${profileData.current_role}<br>
                        ${profileData.current_company}
                    `;
                } else {
                    // Call AI
                    try {
                        let aiEmailBodyRaw = await callAI(aiPrompt);
                        if (aiEmailBodyRaw.includes("Error:") || aiEmailBodyRaw.includes("No response")) {
                            throw new Error(aiEmailBodyRaw);
                        }
                        const { marked } = require('marked');
                        aiEmailBody = marked.parse(aiEmailBodyRaw);
                    } catch (e) {
                        console.error("AI Generation Failed:", e);
                        aiEmailBody = `
                            Hi ${name},<br><br>
                            Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                            I usually respond within 24-48 hours.<br><br>
                            Best regards,<br>
                            ${profileData.name}<br>
                            ${profileData.current_role}<br>
                            ${profileData.current_company}
                        `;
                    }
                }

                // Send Email via Nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                const htmlTemplate = `
                <!DOCTYPE html>
                <html>
                <body>
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h3>${requestType === "Project Review" ? "Feedback Received! 🚀" : "Message Received 📬"}</h3>
                        <div>${aiEmailBody}</div>
                        <br>
                        <div style="background: #f0f0f0; padding: 10px; font-style: italic;">
                            " ${message} "
                        </div>
                    </div>
                </body>
                </html>
                `;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    cc: process.env.EMAIL_USER,
                    subject: requestType === "Project Review" ? `Re: Your review on my portfolio` : `Re: Your message to ${profileData.name}`,
                    html: htmlTemplate,
                });

                console.log(`[Contact API] Email sent to ${email}`);

            } catch (emailError) {
                console.error('[Contact API] Background task failed:', emailError);
            }
        };

        // Await the task to ensure it completes before Vercel freezes/kills the lambda.
        await sendEmailTask();

        return NextResponse.json({ success: true, message: 'Saved and email sent' });

    } catch (error) {
        console.error('Error in contact/review API:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
