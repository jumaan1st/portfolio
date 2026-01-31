import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects as projectsTable, blogs as blogsTable } from '@/lib/schema';
import { sql, count } from 'drizzle-orm';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Re-use S3 config (Duplicate logic to avoid importing route handlers directly which can be tricky in Next.js app dir)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function GET() {
    try {
        // 1. Database Stats
        const dbName = process.env.DB_NAME || 'postgres'; // Default fallback

        // Get DB Size (approximate)
        // specific query depends on permissions. pg_database_size implies superuser or owner.
        // If this fails, we return generic stats.
        let dbSize = 0;
        try {
            const sizeRes: any = await db.execute(sql`SELECT pg_database_size(current_database()) as size`);
            const rows = sizeRes.rows || sizeRes; // handle driver differences
            dbSize = parseInt(rows[0].size as string);
        } catch (e) {
            console.warn("Could not fetch DB size:", e);
        }

        // Get Row Counts
        const [blogsCountRes, projectsCountRes] = await Promise.all([
            db.select({ count: count() }).from(blogsTable),
            db.select({ count: count() }).from(projectsTable)
        ]);

        const dbStats = {
            sizeBytes: dbSize,
            blogsCount: parseInt(String(blogsCountRes[0].count)),
            projectsCount: parseInt(String(projectsCountRes[0].count))
        };


        // 2. Storage Stats (R2)
        // Warning: iterating all objects can be slow if many files. 
        // For a portfolio with < 1000 files, this is fast (one request).
        // If > 1000, we need pagination (params.ContinuationToken).
        // For dashboard purposes, let's limit to first 1000 or implement simple loop.

        let storageSize = 0;
        let fileCount = 0;

        if (R2_ACCOUNT_ID) {
            try {
                let isTruncated = true;
                let continuationToken: string | undefined = undefined;

                while (isTruncated) {
                    const command: ListObjectsV2Command = new ListObjectsV2Command({
                        Bucket: R2_BUCKET_NAME,
                        ContinuationToken: continuationToken,
                        MaxKeys: 1000
                    });
                    const response = await s3Client.send(command);

                    if (response.Contents) {
                        for (const obj of response.Contents) {
                            storageSize += (obj.Size || 0);
                            fileCount++;
                        }
                    }

                    isTruncated = response.IsTruncated || false;
                    continuationToken = response.NextContinuationToken;

                    // Safety break for massive buckets to prevent timeout
                    if (fileCount > 5000) break;
                }
            } catch (e) {
                console.error("R2 List Error", e);
            }
        }

        const storageStats = {
            sizeBytes: storageSize,
            fileCount: fileCount
        };

        return NextResponse.json({
            database: dbStats,
            storage: storageStats,
            limits: {
                dbMaxBytes: 500 * 1024 * 1024, // 500MB (Relatively standard generic free tier)
                storageMaxBytes: 10 * 1024 * 1024 * 1024 // 10GB (Cloudflare R2 free tier)
            }
        });

    } catch (e) {
        console.error("Stats API Error", e);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
