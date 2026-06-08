import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

export async function GET() {
    try {
        console.log('[Debug Error] Triggering intentional test error...');
        throw new Error('Intentional Centralized Logging Test Error - Verification Run');
    } catch (error: any) {
        await logError(error, {
            path: '/api/debug-error',
            method: 'GET',
            meta: 'This is a test run to verify that error logging and email alerts function properly.'
        });
        
        return NextResponse.json({
            status: 'success',
            message: 'Centralized error logged and notification dispatched.',
            details: error.message
        });
    }
}
