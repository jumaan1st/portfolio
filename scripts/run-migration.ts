import pool from '../lib/db';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'enhance-sessions-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

run();
