
/* eslint-disable */
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    port: 5432,
    database: 'portfolio',
});

async function update() {
    const client = await pool.connect();
    try {
        console.log('Updating project title...');
        await client.query(
            "UPDATE portfolio.projects SET title = 'DB POWERED - Student System' WHERE id = 1"
        );
        console.log('Update successful');
    } catch (e) {
        console.error('Error updating DB:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

update();
