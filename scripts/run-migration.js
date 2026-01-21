const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding missing columns...");
        await client.query(`
      ALTER TABLE request_audit.request_context_log
      ADD COLUMN IF NOT EXISTS user_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);
    `);
        console.log("Migration successful: Columns added.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
