import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable (typings fix)
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export async function POST(req: Request) {
    try {
        const { filters } = await req.json();
        const { startDate, endDate, ip, type } = filters || {};

        // 1. Fetch Data (Reusing specific logic or simple query)
        let whereClause = 'WHERE 1=1';
        const values: any[] = [];
        let paramIndex = 1;

        if (startDate) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            values.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            whereClause += ` AND created_at <= $${paramIndex}::date + interval '1 day'`;
            values.push(endDate);
            paramIndex++;
        }
        if (ip) {
            whereClause += ` AND session_id LIKE $${paramIndex}`;
            values.push(`%${ip}%`);
            paramIndex++;
        }
        if (type) {
            if (type === 'home') whereClause += ` AND request_uri = '/'`;
            else if (type === 'blog') whereClause += ` AND request_uri LIKE '/blogs/%'`;
            else if (type === 'project') whereClause += ` AND request_uri LIKE '/projects/%'`;
        }

        const query = `
            SELECT 
                created_at,
                session_id as ip_address,
                country_name,
                city_name,
                request_uri,
                device_type,
                user_name,
                user_email
            FROM request_audit.request_context_log
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 1000 -- Limit report size for email safety
        `;

        const res = await pool.query(query, values);
        const logs = res.rows;

        if (logs.length === 0) {
            return NextResponse.json({ success: false, message: 'No logs found for filters' });
        }

        // 2. Generate PDF
        const doc = new jsPDF() as unknown as jsPDFWithAutoTable;

        doc.setFontSize(18);
        doc.text("Audit Log Report", 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        if (startDate || endDate) doc.text(`Range: ${startDate || 'Start'} to ${endDate || 'Now'}`, 14, 36);
        if (ip) doc.text(`Filter IP: ${ip}`, 14, 42);

        const tableBody = logs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.ip_address || '-',
            `${log.city_name || '-'}, ${log.country_name || '-'}`,
            log.device_type || '-',
            log.user_name ? `${log.user_name} (${log.user_email || ''})` : '-',
            log.request_uri
        ]);

        autoTable(doc, {
            head: [['Time', 'IP', 'Location', 'Device', 'User', 'Path']],
            body: tableBody,
            startY: 50,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] },
        });

        // Convert to Buffer
        const pdfOutput = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfOutput);

        // 3. Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to Admin (Self)
            subject: `Audit Log Report - ${new Date().toLocaleDateString()}`,
            html: `
                <h3>Audit Log Report</h3>
                <p>Attached is the requested audit log report.</p>
                <p><strong>Filters:</strong><br>
                Date: ${startDate || 'Any'} - ${endDate || 'Any'}<br>
                Type: ${type || 'All'}<br>
                IP: ${ip || 'All'}
                </p>
                <p><strong>Total Records:</strong> ${logs.length}</p>
            `,
            attachments: [
                {
                    filename: `audit_report_${Date.now()}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, count: logs.length });

    } catch (error) {
        console.error("Report Gen Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
    }
}
