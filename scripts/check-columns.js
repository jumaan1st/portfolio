
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
            const cleanKey = key.replace('export ', '').trim();
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

async function checkColumns() {
    try {
        const client = await pool.connect();

        // Query to get column names for 'profile' table
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'portfolio' 
            AND table_name = 'profile';
        `);

        console.log("\n--- COLUMNS IN portfolio.profile ---");
        res.rows.forEach(r => console.log(r.column_name));
        console.log("------------------------------------\n");

        // Also dump the first row to see what values correspond to what columns
        const dataRes = await client.query('SELECT * FROM portfolio.profile LIMIT 1');
        console.log("--- FIRST ROW VALUES ---");
        console.log(JSON.stringify(dataRes.rows[0], null, 2));
        console.log("------------------------");

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkColumns();
