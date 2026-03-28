import { NextResponse } from 'next/server';
import { getRecentDatabaseEntries } from '@/lib/notion';
import { findDuplicate } from '@/lib/ai';

export async function POST(request) {
    try {
        const aiProvider = request.headers.get('x-ai-provider') || 'gemini';
        const aiKey = request.headers.get('x-ai-key');
        const authHeader = request.headers.get('Authorization');
        const notionKey = authHeader ? authHeader.replace('Bearer ', '') : null;

        if (!aiKey || !notionKey) {
            return NextResponse.json(
                { error: 'AI key and Notion key are required to check duplicates.' },
                { status: 401 }
            );
        }

        const { databaseId, extractedData } = await request.json();

        if (!databaseId || !extractedData) {
            return NextResponse.json(
                { error: 'databaseId and extractedData are required' },
                { status: 400 }
            );
        }

        // Fetch recent entries to compare against
        const recentEntries = await getRecentDatabaseEntries(notionKey, databaseId, 30);
        
        if (recentEntries.length === 0) {
            // No recent entries means no duplicates
            return NextResponse.json({ isDuplicate: false, matchPercentage: 0, matchedSummary: '' });
        }

        // Compare newly extracted data against recent entries via AI
        const result = await findDuplicate(aiProvider, aiKey, extractedData, recentEntries);

        return NextResponse.json(result);
    } catch (err) {
        console.error('Error in check-duplicate route:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
