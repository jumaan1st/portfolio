
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

        // 0. Spam Protection (DISABLED per user request)
        // const spamCheck = await pool.query(...)

        // 1. Store in DB (Synchronous - Critical)
        console.log(`[Contact API] Saving ${requestType} from ${cleanEmail}`);

        // Use portfolio.review table with feedback and stars columns
        await pool.query(
            'INSERT INTO portfolio.review (name, email, feedback, stars) VALUES ($1, $2, $3, $4)',
            [cleanName, cleanEmail, messageToStore, 5]
        );
        console.log(`[Contact API] Saved to portfolio.review.`);

        // 2. Background Task: AI Email (Fire-and-Forget) - Enhanced Personalization
        const sendEmailTask = async () => {
            try {
                // Fetch Profile - Use 'role' column (correct one) aliased as current_role for code compatibility
                const profileResult = await pool.query('SELECT name, current_company, role as current_role, linkedin, github FROM portfolio.profile LIMIT 1');
                const profile = profileResult.rows[0];

                // Enhanced AI Prompt for Hyper-Personalization
                let aiPrompt = "";
                const baseContext = `You are ${profile.name}, a ${profile.current_role} at ${profile.current_company}.`;
                const toneInstruction = "Analyze the sender's message tone. If they are casual, be friendly and professional. If formal, be precise and respectful. If excited, match their energy.";

                if (requestType === "Project Review") {
                    aiPrompt = `
                        ${baseContext}
                        User's Review: "${message}"
                        
                        Task: Write a personalized reply to ${name}.
                        1. ${toneInstruction}
                        2. Specifically reference a detail they mentioned in their review (e.g., if they liked the UI, thank them for noticing the design).
                        3. Express genuine gratitude for them taking the time to review my work.
                        4. Keep it concise (under 150 words) but warm.
                        5. Sign off professionally.
                    `;
                } else {
                    aiPrompt = `
                        ${baseContext}
                        User's Inquiry: "${message}"
                        
                        Task: Write a personalized reply to ${name}.
                        1. ${toneInstruction}
                        2. Acknowledge the specific reason they contacted me (e.g., job opportunity, collaboration, question).
                        3. Confirm I have received it and will respond personally soon.
                        4. Keep it concise (under 100 words) and reassuring.
                        5. Sign off professionally.
                    `;
                }

                // Check Rate Limit (5 per day)
                let allowAI = true;
                let aiEmailBody = ""; // Declare here

                try {
                    // Check usage
                    const usageRes = await pool.query('SELECT usage_count, last_updated FROM portfolio.ai_email_usage WHERE email = $1', [cleanEmail]);

                    if (usageRes.rows.length > 0) {
                        const { usage_count, last_updated } = usageRes.rows[0];
                        const lastDate = new Date(last_updated).toISOString().split('T')[0];

                        if (lastDate !== today) {
                            // Reset for new day
                            await pool.query('UPDATE portfolio.ai_email_usage SET usage_count = 1, last_updated = $2 WHERE email = $1', [cleanEmail, today]);
                        } else if (usage_count >= 5) {
                            allowAI = false;
                            console.warn(`[Contact API] Rate limit exceeded for ${cleanEmail}. Sending generic email.`);
                        } else {
                            // Increment
                            await pool.query('UPDATE portfolio.ai_email_usage SET usage_count = usage_count + 1 WHERE email = $1', [cleanEmail]);
                        }
                    } else {
                        // First time
                        await pool.query('INSERT INTO portfolio.ai_email_usage (email, usage_count, last_updated) VALUES ($1, 1, $2)', [cleanEmail, today]);
                    }
                } catch (e) {
                    console.error("Rate Limit Check Failed:", e);
                    // allowAI stays true on error to avoid blocking logic, or false to be safe. 
                    // Let's default to safe (false) if DB fails, or true? 
                    // User wants to limit cost, so maybe default false if check fails? 
                    // But if check fails, maybe saving to main DB also failed. 
                    // Let's assume allowAI = true (fail open) for UX, or fail closed for cost. 
                    // Given the prompt "limit ... usage", let's fail open but log it, preventing strictly 5 if DB error.
                }

                if (!allowAI) {
                    // GENERIC FALLBACK (Limit Exceeded)
                    aiEmailBody = `
                        Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                        (Auto-Reply: Daily AI limit reached, but your message is safe!)
                    `;
                } else {
                    // PROCEED WITH AI
                    try {
                        let aiEmailBodyRaw = await callAI(aiPrompt);

                        // Check for Soft Errors (Rate Limits returned as text)
                        if (aiEmailBodyRaw.includes("Error:") || aiEmailBodyRaw.includes("No response")) {
                            throw new Error(aiEmailBodyRaw);
                        }

                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const { marked } = require('marked');
                        aiEmailBody = marked.parse(aiEmailBodyRaw);
                    } catch (e) {
                        console.error("AI Generation or Parsing Failed:", e);
                        aiEmailBody = `
                            Thank you for reaching out! I have received your message and will get back to you as soon as possible.<br><br>
                            I usually respond within 24-48 hours.
                        `;
                    }
                }

                // Send Email
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
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f9; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                        .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 30px 20px; text-align: center; }
                        .header h2 { margin: 0; font-size: 22px; font-weight: 600; }
                        .content { padding: 40px 30px; background-color: #ffffff; }
                        .greeting { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 20px; }
                        .body-text { color: #475569; font-size: 16px; margin-bottom: 25px; white-space: pre-line; }
                        .original-message { background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; border-radius: 4px; color: #64748b; font-style: italic; font-size: 14px; margin: 30px 0; }
                        .footer { background-color: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
                        .profile-name { font-weight: bold; color: #0f172a; font-size: 16px; margin-bottom: 4px; }
                        .profile-role { color: #2563eb; font-weight: 500; margin-bottom: 15px; }
                        .social-links { margin-top: 15px; }
                        .social-links a { display: inline-block; margin: 0 10px; color: #475569; text-decoration: none; font-weight: 600; transition: color 0.2s; }
                        .social-links a:hover { color: #2563eb; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>${requestType === "Project Review" ? "Feedback Received! 🚀" : "Message Received 📬"}</h2>
                        </div>
                        <div class="content">
                            <div class="greeting">Hi ${name},</div>
                            
                            <div class="body-text">${aiEmailBody}</div>
                            
                            <div class="original-message">
                                " ${message} "
                            </div>
                        </div>
                        <div class="footer">
                            <div class="profile-name">${profile.name}</div>
                            <div class="profile-role">${profile.current_role} @ ${profile.current_company}</div>
                            
                            <div class="social-links">
                                ${profile.linkedin ? `<a href="${profile.linkedin}">LinkedIn</a>` : ''}
                                ${profile.github ? `<a href="${profile.github}">GitHub</a>` : ''}
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}">Portfolio</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email, // Send to the sender
                    cc: process.env.EMAIL_USER, // Keep owner in CC
                    subject: requestType === "Project Review" ? `Re: Your review on my portfolio` : `Re: Your message to ${profile.name}`,
                    html: htmlTemplate,
                };

                await transporter.sendMail(mailOptions);
                console.log(`[Contact API] Background email sent to ${email}`);

            } catch (emailError) {
                console.error('[Contact API] Fire-and-Forget Email Failed:', emailError);
            }
        };

        // Fire and forget (No await) - Improves UX Latency
        sendEmailTask();

        return NextResponse.json({ success: true, message: 'Saved and processing email' });

    } catch (error) {
        console.error('Error in contact/review API:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
