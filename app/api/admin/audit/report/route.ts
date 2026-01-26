import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { filters, type = 'detailed' } = await req.json();

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

        // TITLE AREA
        doc.setFontSize(18);
        const titleSuffix = type === 'ip' ? 'IP Deep Dive' : (type === 'summary' ? 'Activity Summary' : 'Session Streams');
        doc.text(`Audit Report - ${titleSuffix}`, 14, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

        // IP PROFILE MODE
        if (filters?.ip) {
            const ipLogs = logs;
            const totalSessions = ipLogs.length;
            const uniquePaths = new Set<string>();
            let totalDurationMs = 0;

            ipLogs.forEach(l => {
                const diff = new Date(l.last_active_at).getTime() - new Date(l.started_at).getTime();
                totalDurationMs += diff;
                l.visit_history?.forEach((v: any) => uniquePaths.add(v.path));
            });

            const avgDurationSec = Math.round((totalDurationMs / totalSessions) / 1000);

            doc.setDrawColor(200);
            doc.setFillColor(245, 247, 250);
            doc.rect(14, 35, 180, 25, 'F');
            doc.setFontSize(12);
            doc.text(`IP Profile: ${filters.ip}`, 20, 42);
            doc.setFontSize(10);
            doc.text(`Total Sessions: ${totalSessions}`, 20, 50);
            doc.text(`Unique Pages Visited: ${uniquePaths.size}`, 80, 50);
            doc.text(`Avg Session Length: ${avgDurationSec}s`, 140, 50);
        } else if (filters) {
            doc.text(`Filters: ${JSON.stringify(filters)}`, 14, 34);
        }

        const tableData = logs.map(log => {
            const userIdentity = log.user_identity || {};
            const userStr = userIdentity.name ? `${userIdentity.name}\n${userIdentity.email || ''}` : 'Guest';

            const geo = log.geo_info || {};
            const locStr = `${geo.city || '-'}, ${geo.country || '-'}`;

            // Pages Detail Logic
            let pagesContent = '';
            const uniquePathsList = Array.from(new Set((log.visit_history || []).map((v: any) => v.path)));

            if (type === 'summary') {
                pagesContent = `${uniquePathsList.length} Unique Pages`;
            } else {
                pagesContent = uniquePathsList.join(', ') || '/';
            }

            const diffMs = new Date(log.last_active_at).getTime() - new Date(log.started_at).getTime();
            const min = Math.floor(diffMs / 60000);
            const sec = Math.floor((diffMs % 60000) / 1000);
            const duration = min > 0 ? `${min}m ${sec}s` : `${sec}s`;

            return [
                new Date(log.started_at).toLocaleString(),
                userStr,
                log.ip_address,
                locStr,
                pagesContent,
                duration
            ];
        });

        autoTable(doc, {
            startY: filters?.ip ? 70 : 40,
            head: [['Started', 'User', 'IP', 'Loc', 'Visited Pages', 'Time']],
            body: tableData,
            styles: { fontSize: 8, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 20 },
                4: { cellWidth: 'auto' }, // Allow pages to expand/wrap
                5: { cellWidth: 15 }
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
            subject: filters?.ip ? `IP Audit Report: ${filters.ip}` : `Portfolio Audit Report (${logs.length} sessions)`,
            text: `Please find attached the detailed audit report.`,
            attachments: [
                {
                    filename: `audit-${filters?.ip ? 'ip-' + filters.ip : 'report'}-${Date.now()}.pdf`,
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
