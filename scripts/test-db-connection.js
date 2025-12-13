
/* eslint-disable */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const cleanKey = key.trim();
                const cleanValue = value.trim().replace(/^["']|["']$/g, '');
                process.env[cleanKey] = cleanValue;
            }
        });
        console.log('Loaded .env.local');
    } else {
        console.warn('.env.local not found');
    }
} catch (e) {
    console.warn('Could not read .env.local', e.message);
}

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'portfolio',
});

async function testConnection() {
    try {
        console.log('Testing DB Connection...');
        const client = await pool.connect();
        console.log('Connected successfully.');

        // 1. Test Review Insert
        console.log('\nTesting Insert into portfolio.review...');
        // DDL: name, email, phone, stars, feedback
        // Note: stars is smallint, feedback is text.
        const reviewRes = await client.query(
            `INSERT INTO portfolio.review (name, email, feedback, stars) 
       VALUES ($1, $2, $3, $4) RETURNING review_id`,
            ['Test User', 'test@example.com', 'This is a test feedback via script', 5]
        );
        console.log('Review Inserted. ID:', reviewRes.rows[0].review_id);

        // 2. Test AI Usage Insert
        console.log('\nTesting Insert into portfolio.ai_chat_usage...');
        // DDL: name, email, chat_date, chat_count
        // Constraint: uq_ai_chat_user_day (email, name, chat_date)
        const today = new Date().toISOString().split('T')[0];
        const uniqueEmail = `test_${Date.now()}@example.com`.toLowerCase();

        const usageRes = await client.query(
            `INSERT INTO portfolio.ai_chat_usage (name, email, chat_date, chat_count) 
       VALUES ($1, $2, $3, 1) RETURNING usage_id`,
            ['Test User', uniqueEmail, today]
        );
        console.log('AI Usage Inserted. ID:', usageRes.rows[0].usage_id);

        // 3. Test AI Usage Upsert/Increment (Simulate handling unique constraint)
        console.log('\nTesting Usage Increment (Upsert Logic)...');
        try {
            // Try inserting same again (should fail with unique constraint)
            await client.query(
                `INSERT INTO portfolio.ai_chat_usage (name, email, chat_date, chat_count) 
             VALUES ($1, $2, $3, 1)`,
                ['Test User', uniqueEmail, today]
            );
        } catch (e) {
            if (e.code === '23505') {
                console.log('Caught Expected Unique Constraint Violation.');
                // Simulate Update
                await client.query(
                    `UPDATE portfolio.ai_chat_usage SET chat_count = chat_count + 1 WHERE email = $1 AND chat_date = $2`,
                    [uniqueEmail, today]
                );
                console.log('Updated existing record instead.');
            } else {
                throw e;
            }
        }

        client.release();
        console.log('\nAll tests passed.');
        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

testConnection();
