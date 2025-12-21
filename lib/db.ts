import { Pool } from 'pg';

const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';

const poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    ssl: isLocal ? undefined : {
        rejectUnauthorized: false
    }
};

declare global {
    var postgresPool: Pool | undefined;
}

const pool = global.postgresPool || new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
    global.postgresPool = pool;
}

export default pool;
