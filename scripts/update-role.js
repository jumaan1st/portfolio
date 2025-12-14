
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function updateProfile() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        // Update the role
        // You can change 'Full Stack Developer' to whatever you want
        const newRole = process.argv[2] || "Full Stack Developer";

        await client.query(`
            UPDATE portfolio.profile 
            SET current_role = $1, 
                current_company = 'Freelance' 
            WHERE id = (SELECT id FROM portfolio.profile LIMIT 1)
        `, [newRole]);

        console.log(`✅ Success! Updated Profile Role to: "${newRole}"`);

        // precise verification
        const res = await client.query('SELECT name, current_role FROM portfolio.profile LIMIT 1');
        console.log('Current DB State:', res.rows[0]);

        client.release();
    } catch (err) {
        console.error("Error updating profile:", err);
    } finally {
        pool.end();
    }
}

updateProfile();
