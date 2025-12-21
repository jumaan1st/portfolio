import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 Client (Cloudflare R2 compatible)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function POST(req: NextRequest) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        console.error("Missing R2 Environment Variables");
        return NextResponse.json({ error: "Server Configuration Error: Missing R2 Credentials" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Safety Limit: 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum limit is 5MB." }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename to prevent collisions
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${timestamp}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            // ACL: 'public-read', // R2 doesn't always support ACLs, public access usually via bucket policy/domain
        });

        await s3Client.send(command);

        // Construct the public URL
        let publicUrl = '';
        if (R2_PUBLIC_URL) {
            // Remove trailing slash if present
            const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
            publicUrl = `${baseUrl}/${key}`;
        } else {
            // Fallback public R2 URL
            publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            key: key
        });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

        console.log("Attempting to delete image:", url);

        // Extract key from URL
        let key = url;

        // Method 1: If using Custom Domain (R2_PUBLIC_URL)
        if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
            // remove domain + slash
            key = url.replace(R2_PUBLIC_URL.replace(/\/$/, '') + '/', '');
        }
        // Method 2: If using R2 dev/storage URL
        else if (url.includes(R2_BUCKET_NAME)) {
            // Split by bucket name and take the part after
            const parts = url.split(R2_BUCKET_NAME + '/');
            if (parts.length > 1) key = parts[1];
        }
        // Method 3: Fallback - try to match standard folder structure "folder/filename"
        else {
            // Assuming key format is {folder}/{timestamp}-{filename}
            // We can try to grab the last 2 path segments if structure is consistent
            const parts = url.split('/');
            if (parts.length >= 2) {
                // heuristic: grabs "folder/file.ext"
                key = parts.slice(-2).join('/');
            }
        }

        console.log("Derived Key for deletion:", key);

        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        console.log("Delete command sent successfully");

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
