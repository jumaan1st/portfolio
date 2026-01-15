import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS portfolio.ai_email_usage (
                usage_id BIGSERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                name VARCHAR(150) NOT NULL,
                email_count SMALLINT DEFAULT 0 NOT NULL CHECK (email_count >= 0 AND email_count <= 5),
                email_date DATE DEFAULT CURRENT_DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_ai_email_user_day UNIQUE (email, name, email_date)
            );
            
            CREATE TABLE IF NOT EXISTS portfolio.ai_chat_usage (
                usage_id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                chat_date DATE DEFAULT CURRENT_DATE,
                chat_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS portfolio.certifications (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                issuer VARCHAR(255) NOT NULL,
                url VARCHAR(500),
                date VARCHAR(50),
                icon VARCHAR(255)
            );

            ALTER TABLE portfolio.experience ADD COLUMN IF NOT EXISTS start_date DATE;
            ALTER TABLE portfolio.experience ADD COLUMN IF NOT EXISTS end_date DATE;
            
            ALTER TABLE portfolio.education ADD COLUMN IF NOT EXISTS start_date DATE;
            ALTER TABLE portfolio.education ADD COLUMN IF NOT EXISTS end_date DATE;

            ALTER TABLE portfolio.experience DROP COLUMN IF EXISTS period;
            ALTER TABLE portfolio.education DROP COLUMN IF EXISTS year;
        `);
        return NextResponse.json({ success: true, message: 'Tables ai_email_usage, ai_chat_usage, and certifications created or already exist.' });
    } catch (error) {
        console.error('DB Setup Error:', error);
        return NextResponse.json({ error: 'Failed to setup DB' }, { status: 500 });
    }
}
