
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
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
        await pool.query(
            'INSERT INTO portfolio.review (name, email, feedback, stars) VALUES ($1, $2, $3, $4)',
            [cleanName, cleanEmail, messageToStore, 5]
        );
        console.log(`[Contact API] Saved to portfolio.review.`);

        // 2. Background Task: AI Email (Fire-and-Forget)
        const sendEmailTask = async () => {
            try {
                // Fetch Profile
                const profileResult = await pool.query('SELECT name, current_company, role as current_role, linkedin, github FROM portfolio.profile LIMIT 1');
                const profile = profileResult.rows[0];

                // AI Prompt Construction
                let aiPrompt = "";
                const baseContext = `You are ${profile.name}, a ${profile.current_role} at ${profile.current_company}.`;
                const toneInstruction = "Analyze the sender's message tone. If casual, be friendly. If formal, be professional.";

                if (requestType === "Project Review") {
                    aiPrompt = `
                        ${baseContext}
                        User's Review: "${message}"
                        Task: Write a personalized reply to ${name}.
                        1. ${toneInstruction}
                        2. Thank them for the review.
                        3. Keep it concise (under 150 words).
                        4. Sign off professionally.
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
                        5. Sign off professionally.
                    `;
                }

                // Rate Limiting Logic (New Schema: email_count, name, email_date)
                let allowAI = true;
                let aiEmailBody = "";

                try {
                    // Check usage (Strictly by Email + Date, ignoring Name for counting)
                    const usageRes = await pool.query(
                        'SELECT usage_id, email_count FROM portfolio.ai_email_usage WHERE email = $1 AND email_date = $2 LIMIT 1',
                        [cleanEmail, today]
                    );

                    if (usageRes.rows.length > 0) {
                        const { usage_id, email_count } = usageRes.rows[0];

                        if (email_count >= 5) {
                            allowAI = false;
                            console.warn(`[Contact API] Rate limit exceeded for ${cleanEmail}. Sending generic email.`);
                        } else {
                            // Increment Usage on the existing record found for this email
                            await pool.query('UPDATE portfolio.ai_email_usage SET email_count = email_count + 1 WHERE usage_id = $1', [usage_id]);
                        }
                    } else {
                        // Insert New Record for Day (Name is still required by DB, so we use the provided one)
                        await pool.query(
                            'INSERT INTO portfolio.ai_email_usage (email, name, email_date, email_count) VALUES ($1, $2, $3, 1)',
                            [cleanEmail, cleanName, today]
                        );
                    }
                } catch (dbError) {
                    console.error("Rate Limit DB Error:", dbError);
                    // Continue to allow AI if DB fail? Or safely fallback?
                    // Let's assume we allow AI but log the error to avoid blocking the user experience due to internal db issues.
                }

                if (!allowAI) {
                    // Generic Fallback
                    aiEmailBody = `
                        Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                        (Auto-Reply: Daily AI limit reached, but your message is safe!)
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
                            Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                            I usually respond within 24-48 hours.
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
                        <p>Hi ${name},</p>
                        <div>${aiEmailBody}</div>
                        <br>
                        <div style="background: #f0f0f0; padding: 10px; font-style: italic;">
                            " ${message} "
                        </div>
                        <br>
                        <p>Best regards,<br>${profile.name}</p>
                    </div>
                </body>
                </html>
                `;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    cc: process.env.EMAIL_USER,
                    subject: requestType === "Project Review" ? `Re: Your review on my portfolio` : `Re: Your message to ${profile.name}`,
                    html: htmlTemplate,
                });

                console.log(`[Contact API] Email sent to ${email}`);

            } catch (emailError) {
                console.error('[Contact API] Background task failed:', emailError);
            }
        };

        sendEmailTask();

        return NextResponse.json({ success: true, message: 'Saved and processing email' });

    } catch (error) {
        console.error('Error in contact/review API:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
