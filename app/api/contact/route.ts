
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';
import { callGeminiAPI } from '@/lib/gemini';

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

        // 2. Send Email (Awaited for Serverless Compliance)
        try {
                // Fetch Profile
                const profileResult = await pool.query('SELECT name, current_company, current_role, linkedin, github FROM portfolio.profile LIMIT 1');
                const profile = profileResult.rows[0];

                // Generate AI Content
                let aiPrompt = "";
                if (requestType === "Project Review") {
                    aiPrompt = `Act as ${profile.name}, a ${profile.current_role} at ${profile.current_company}. Write a warm, professional email thanking ${name} for their review of my project. They said: "${message}". Express appreciation for their feedback and mention that I always value constructive input. Keep it concise.`;
                } else {
                    aiPrompt = `Act as ${profile.name}, a ${profile.current_role} at ${profile.current_company}. Write a polite, professional confirmation email to ${name} regarding their inquiry: "${message}". Confirm receipt of their message and promise to reply shortly. Keep it concise and friendly.`;
                }

                const aiEmailBody = await callGeminiAPI(aiPrompt);

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
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { padding: 30px 20px; background-color: #f8fafc; }
                        .message-box { background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; font-style: italic; }
                        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 0.9em; color: #666; }
                        .social-links { margin-top: 10px; }
                        .social-links a { margin-right: 15px; text-decoration: none; color: #2563eb; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>${requestType === "Project Review" ? "Thank You for Your Feedback!" : "Message Received"}</h2>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${name}</strong>,</p>
                            
                            <p>${aiEmailBody.replace(/\n/g, '<br>')}</p>
                            
                            <p><strong>Your Message:</strong></p>
                            <div class="message-box">
                                "${message}"
                            </div>
                            
                            <p>Best regards,</p>
                            
                            <div class="footer">
                                <strong>${profile.name}</strong><br>
                                <strong>${profile.current_role}</strong> @ <strong>${profile.current_company}</strong><br>
                                <div class="social-links">
                                    ${profile.linkedin ? `<a href="${profile.linkedin}">LinkedIn</a>` : ''}
                                    ${profile.github ? `<a href="${profile.github}">GitHub</a>` : ''}
                                </div>
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
                    subject: requestType === "Project Review" ? `Thanks for your review, ${name}!` : `Thank you for contacting ${profile.name}`,
                    html: htmlTemplate,
                };

                await transporter.sendMail(mailOptions);
                console.log(`[Contact API] Email successfully sent to ${email}`);

        } catch (emailError) {
             // Log but don't fail the request (or maybe we should? User said "sometimes i am not recieving")
             // Better to log heavily so Vercel logs show it.
             console.error('[Contact API] Check Email Config! Send failed:', emailError);
        }

        return NextResponse.json({ success: true, message: 'Saved and processing email' });

    } catch (error) {
        console.error('Error in contact/review API:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
