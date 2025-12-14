
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            // Remove 'export ' if present
            const cleanKey = key.replace('export ', '').trim();
            // Remove quotes
            const cleanValue = value.trim().replace(/^["']|["']$/g, '');
            process.env[cleanKey] = cleanValue;
        }
    });
}

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    ssl: process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' ? undefined : { rejectUnauthorized: false }
});

async function checkProfile() {
    try {
        console.log("Connecting to:", process.env.DB_HOST);
        const client = await pool.connect();

        // Check if both columns exist by selecting them safely or just try typical ones
        const res = await client.query('SELECT roles, role, current_role FROM portfolio.profile LIMIT 1');
        console.log("\n--- COLUMN VALUES ---");
        console.log("role (from user DDL):", `"${res.rows[0].role}"`);
        console.log("current_role (used by API):", `"${res.rows[0].current_role}"`);
        console.log("---------------------");

        client.release();
    } catch (err) {
        console.error("Error reading profile:", err);
    } finally {
        pool.end();
    }
}

checkProfile();
