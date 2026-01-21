import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { filters } = await req.json();

        // Build Query logic for Sessions
        const values: any[] = [];
        const conditions: string[] = [];

        if (filters?.ip) {
            conditions.push(`ip_address ILIKE $${values.length + 1}`);
            values.push(`%${filters.ip}%`);
        }
        if (filters?.startDate) {
            conditions.push(`started_at >= $${values.length + 1}`);
            values.push(filters.startDate);
        }
        if (filters?.endDate) {
            conditions.push(`started_at <= $${values.length + 1}`);
            values.push(filters.endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                session_id,
                ip_address,
                user_identity,
                geo_info,
                started_at,
                last_active_at,
                visit_history
            FROM request_audit.sessions
            ${whereClause}
            ORDER BY started_at DESC
            LIMIT 500
        `;

        const res = await pool.query(query, values);
        const logs = res.rows;

        if (logs.length === 0) {
            return NextResponse.json({ success: false, message: 'No logs match criteria' });
        }

        // Generate PDF
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Audit Report - Session Streams", 14, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        if (filters) {
            doc.text(`Filters: ${JSON.stringify(filters)}`, 14, 34);
        }

        const tableData = logs.map(log => {
            const userIdentity = log.user_identity || {};
            const userStr = userIdentity.name ? `${userIdentity.name}\n${userIdentity.email || ''}` : 'Guest';

            const geo = log.geo_info || {};
            const locStr = `${geo.city || '-'}, ${geo.country || '-'}`;

            const pages = (log.visit_history || []).length;
            const duration = Math.round((new Date(log.last_active_at).getTime() - new Date(log.started_at).getTime()) / 60000) + ' min';

            return [
                new Date(log.started_at).toLocaleString(),
                userStr,
                log.ip_address,
                locStr,
                `${pages} Pages`,
                duration
            ];
        });

        autoTable(doc, {
            startY: 40,
            head: [['Started', 'User', 'IP', 'Location', 'Activity', 'Duration']],
            body: tableData,
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 40 },
                2: { cellWidth: 25 },
            }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        // Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self/admin
            subject: `Portfolio Audit Report (${logs.length} sessions)`,
            text: `Please find attached the audit report for ${logs.length} sessions matching your filters.`,
            attachments: [
                {
                    filename: `audit-report-${Date.now()}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Report Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
    }
}
