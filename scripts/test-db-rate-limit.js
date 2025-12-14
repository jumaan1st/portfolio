
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testRateLimit() {
    const email = 'test_script@example.com';
    const name = 'Test Script';
    const today = new Date().toISOString().split('T')[0];

    console.log(`Testing Rate Limit Logic for ${email} on ${today}...`);

    try {
        // 1. Cleanup previous test
        await pool.query('DELETE FROM portfolio.ai_email_usage WHERE email = $1', [email]);
        console.log('Cleaned up previous test records.');

        // 2. Insert (Expect Success) - Count 1
        console.log('Attempting INSERT (Count 1)...');
        await pool.query(
            'INSERT INTO portfolio.ai_email_usage (email, name, email_date, email_count) VALUES ($1, $2, $3, 1)',
            [email, name, today]
        );
        console.log('INSERT successful.');

        // 3. Read back
        const res1 = await pool.query(
            'SELECT usage_id, email_count FROM portfolio.ai_email_usage WHERE email = $1 AND name = $2 AND email_date = $3',
            [email, name, today]
        );
        console.log('Read back:', res1.rows[0]);

        if (!res1.rows[0] || res1.rows[0].email_count !== 1) throw new Error('Insert failed to set count to 1');

        // 4. Update (Increment) - Count 2
        console.log('Attempting UPDATE (Count 2)...');
        const usageId = res1.rows[0].usage_id;
        await pool.query('UPDATE portfolio.ai_email_usage SET email_count = email_count + 1 WHERE usage_id = $1', [usageId]);
        console.log('UPDATE successful.');

        const res2 = await pool.query('SELECT email_count FROM portfolio.ai_email_usage WHERE usage_id = $1', [usageId]);
        console.log('Read back after update:', res2.rows[0]);

        if (res2.rows[0].email_count !== 2) throw new Error('Update failed to increment to 2');

        console.log('SUCCESS: DB Logic is valid.');

    } catch (error) {
        console.error('TEST FAILED:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testRateLimit();
