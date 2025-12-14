
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass) {
            return NextResponse.json({
                status: 'error',
                message: 'EMAIL_USER or EMAIL_PASS environment variables are missing.',
                env: {
                    user: !!user,
                    pass: !!pass
                }
            }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            },
        });

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    reject(error);
                } else {
                    resolve(success);
                }
            });
        });

        return NextResponse.json({
            status: 'success',
            message: 'SMTP Connection Successful. Ready to send emails.',
            user: user, // Safe to show email address 
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            response: error.response
        }, { status: 500 });
    }
}
