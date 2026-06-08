import { db } from './db';
import { errorLog } from './schema';
import nodemailer from 'nodemailer';

export async function logError(error: any, context?: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    // 1. Console Log
    console.error('[Error Logged]:', errorMessage, errorStack, 'Context:', context);

    try {
        // 2. Database Log
        await db.insert(errorLog).values({
            error_message: errorMessage,
            error_stack: errorStack,
            context: context ? context : null,
        });
    } catch (dbError) {
        console.error('Failed to write error to database:', dbError);
    }

    // 3. Email Notification
    const errorReportEmail = process.env.ERROR_REPORT_EMAIL;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (errorReportEmail && emailUser && emailPass) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            });

            const subject = `⚠️ System Error Occurred [${process.env.NODE_ENV || 'development'}]`;
            
            let contextStr = '';
            if (context) {
                try {
                    contextStr = JSON.stringify(context, null, 2);
                } catch {
                    contextStr = String(context);
                }
            }

            const html = `
                <h2>System Error Report</h2>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <p><strong>Error Message:</strong></p>
                <pre style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 8px; border: 1px solid #f5c6cb;">${errorMessage}</pre>
                ${errorStack ? `<p><strong>Stack Trace:</strong></p><pre style="background: #f6f8fa; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px;">${errorStack}</pre>` : ''}
                ${context ? `<p><strong>Context Info:</strong></p><pre style="background: #e2e3e5; padding: 12px; border-radius: 8px; font-size: 13px;">${contextStr}</pre>` : ''}
                <hr/>
                <p style="font-size: 12px; color: #6c757d;">This email was sent automatically by the centralized error logging service of your Portfolio App.</p>
            `;

            await transporter.sendMail({
                from: `"Portfolio Error Monitor" <${emailUser}>`,
                to: errorReportEmail,
                subject: subject,
                html: html
            });
            console.log(`Error email report sent successfully to ${errorReportEmail}`);
        } catch (emailError) {
            console.error('Failed to send error email report:', emailError);
        }
    }
}
